from flask import Blueprint, request, jsonify
from server.models import (
    db, Analysis, Transaction, CreditPackage, Payment, EmailTemplate,
    PaymentMethod, DiscountCode, Role, AuditLog, ActivityFeed, 
    Notification, ReportShare, ChatConversation, Referral, User, SystemSettings
)
from server.routes.auth import get_current_user
from datetime import datetime
import uuid
import os
import requests

entities_bp = Blueprint('entities', __name__)

def require_auth(f):
    def wrapper(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Not authenticated'}), 401
        return f(user, *args, **kwargs)
    wrapper.__name__ = f.__name__
    return wrapper

def require_admin(f):
    def wrapper(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Not authenticated'}), 401
        role_name = user.role.name if user.role else 'user'
        if role_name not in ['admin', 'super_admin']:
            return jsonify({'error': 'Admin access required'}), 403
        return f(user, *args, **kwargs)
    wrapper.__name__ = f.__name__
    return wrapper

def get_user_role_name(user):
    return user.role.name if user.role else 'user'

def is_admin(user):
    role_name = get_user_role_name(user)
    return role_name in ['admin', 'super_admin']

# Analysis endpoints
@entities_bp.route('/analyses', methods=['GET'])
@require_auth
def get_analyses(user):
    """
    Get all analyses for current user
    ---
    tags:
      - Analyses
    security:
      - Bearer: []
    responses:
      200:
        description: List of analyses
        schema:
          type: array
          items:
            type: object
      401:
        description: Not authenticated
    """
    analyses = Analysis.query.filter_by(user_email=user.email).order_by(Analysis.created_at.desc()).all()
    return jsonify([a.to_dict() for a in analyses])

@entities_bp.route('/analyses/<id>', methods=['GET'])
@require_auth
def get_analysis(user, id):
    analysis = Analysis.query.get(id)
    if not analysis:
        return jsonify({'error': 'Analysis not found'}), 404
    if analysis.user_email != user.email and not is_admin(user):
        return jsonify({'error': 'Access denied'}), 403
    return jsonify(analysis.to_dict())

@entities_bp.route('/analyses/generate', methods=['POST'])
@require_auth
def generate_analysis_entry(user):
    """
    Create a new analysis entry for report generation
    ---
    tags:
      - Analyses
    security:
      - Bearer: []
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            business_idea:
              type: string
            industry:
              type: string
            report_language:
              type: string
            country:
              type: string
            target_market:
              type: string
    responses:
      201:
        description: Analysis created successfully
      400:
        description: Missing required fields
      402:
        description: Insufficient credits
    """
    if user.credits < 1:
        return jsonify({'error': 'Insufficient credits'}), 402
    
    data = request.get_json() or {}
    business_idea = data.get('business_idea', '').strip()
    
    if not business_idea:
        return jsonify({'error': 'Business idea is required'}), 400
    
    analysis = Analysis(
        user_email=user.email,
        business_idea=business_idea,
        industry=data.get('industry', 'Other'),
        target_market=data.get('target_market', ''),
        location=data.get('country', ''),
        status='analyzing'
    )
    db.session.add(analysis)
    db.session.commit()
    
    return jsonify(analysis.to_dict()), 201


@entities_bp.route('/analyses/chain', methods=['POST'])
@require_auth
def chain_analysis(user):
    """
    Start chained AI analysis generation (processes in background)
    ---
    tags:
      - Analyses
    security:
      - Bearer: []
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            analysisId:
              type: string
            business_idea:
              type: string
            industry:
              type: string
            target_hint:
              type: string
            report_language:
              type: string
            country:
              type: string
    responses:
      202:
        description: Analysis generation started
      404:
        description: Analysis not found
      500:
        description: AI service error
    """
    import threading
    import anthropic
    import json
    
    data = request.get_json() or {}
    analysis_id = data.get('analysisId')
    
    if not analysis_id:
        return jsonify({'error': 'analysisId is required'}), 400
    
    analysis = Analysis.query.get(analysis_id)
    if not analysis:
        return jsonify({'error': 'Analysis not found'}), 404
    if analysis.user_email != user.email:
        return jsonify({'error': 'Access denied'}), 403
    
    # Reserve credit upfront
    user_record = User.query.filter_by(email=user.email).first()
    if not user_record or user_record.credits <= 0:
        return jsonify({'error': 'Insufficient credits'}), 402
    
    # Deduct credit and create pending transaction
    user_record.credits -= 1
    pending_tx = Transaction(
        user_email=user.email,
        type='usage',
        credits=-1,
        description=f'Analysis: {analysis.business_idea[:50] if analysis.business_idea else "New analysis"}...',
        reference_id=analysis_id,
        status='pending'
    )
    db.session.add(pending_tx)
    db.session.commit()
    pending_tx_id = pending_tx.id
    
    def run_analysis():
        from server.app import create_app
        app = create_app()
        with app.app_context():
            try:
                analysis_record = Analysis.query.get(analysis_id)
                if not analysis_record:
                    return
                
                analysis_record.status = 'processing'
                analysis_record.progress_percent = 20
                db.session.commit()
                
                api_key = os.environ.get('AI_INTEGRATIONS_ANTHROPIC_API_KEY') or os.environ.get('ANTHROPIC_API_KEY')
                base_url = os.environ.get('AI_INTEGRATIONS_ANTHROPIC_BASE_URL')
                if not api_key:
                    analysis_record.status = 'failed'
                    analysis_record.last_error = 'AI service not configured'
                    db.session.commit()
                    return
                
                if base_url:
                    client = anthropic.Anthropic(api_key=api_key, base_url=base_url)
                else:
                    client = anthropic.Anthropic(api_key=api_key)
                
                business_idea = data.get('business_idea') or analysis_record.business_idea
                industry = data.get('industry') or analysis_record.industry or 'Not specified'
                target_hint = data.get('target_hint') or analysis_record.target_market or 'Not specified'
                country = data.get('country') or analysis_record.location or 'Not specified'
                language = data.get('report_language', 'english')
                
                language_instruction = ""
                if language.lower() == 'arabic':
                    language_instruction = "IMPORTANT: Write the entire response in Arabic language."
                
                prompt = f"""You are an expert business and technology strategist. Analyze this business idea and provide a comprehensive strategic report.

Business Idea: {business_idea}
Industry: {industry}
Target Market: {target_hint}
Location: {country}
{language_instruction}

Provide a detailed analysis in JSON format with the following structure:
{{
    "executive_summary": "A compelling overview of the business idea, its market potential, and key success factors",
    "score": 75,
    "market_analysis": {{
        "market_size": "Detailed market size with numbers and growth rate",
        "growth_potential": "5-year growth trajectory assessment",
        "competition": "Key competitors and their market positions",
        "trends": ["Emerging trend 1", "Emerging trend 2", "Emerging trend 3"],
        "target_segments": ["Primary segment", "Secondary segment"],
        "market_gap": "The specific gap this idea fills in the market"
    }},
    "business_strategy": {{
        "value_proposition": "Clear and unique value proposition",
        "business_model": "Recommended business model",
        "revenue_streams": ["Primary revenue stream", "Secondary revenue stream"],
        "pricing_strategy": "Recommended pricing approach",
        "customer_acquisition": ["Channel 1", "Channel 2", "Channel 3"],
        "retention_strategy": "How to keep customers engaged",
        "competitive_advantage": "Key differentiators",
        "partnerships": ["Strategic partnership 1", "Strategic partnership 2"]
    }},
    "technical_strategy": {{
        "recommended_stack": {{
            "frontend": "Recommended frontend technology",
            "backend": "Recommended backend technology",
            "database": "Recommended database",
            "cloud": "Recommended cloud provider"
        }},
        "mvp_features": ["Core feature 1", "Core feature 2", "Core feature 3"],
        "architecture": "High-level architecture recommendation",
        "scalability": "Scaling strategy",
        "security": "Security considerations"
    }},
    "development_roadmap": {{
        "phase_1_mvp": {{
            "duration": "2-3 months",
            "deliverables": ["MVP deliverable 1", "MVP deliverable 2"],
            "milestones": ["Milestone 1", "Milestone 2"]
        }},
        "phase_2_growth": {{
            "duration": "3-6 months",
            "deliverables": ["Growth deliverable 1", "Growth deliverable 2"],
            "milestones": ["Milestone 1", "Milestone 2"]
        }},
        "phase_3_scale": {{
            "duration": "6-12 months",
            "deliverables": ["Scale deliverable 1", "Scale deliverable 2"],
            "milestones": ["Milestone 1", "Milestone 2"]
        }}
    }},
    "financial_projections": {{
        "startup_costs": "Detailed breakdown of initial investment",
        "monthly_expenses": "Projected monthly burn rate",
        "revenue_potential": "Year 1, Year 2, Year 3 revenue projections",
        "break_even": "Estimated time to break even",
        "funding_recommendations": "Funding approach recommendation",
        "key_metrics": ["Metric 1", "Metric 2", "Metric 3"]
    }},
    "risk_assessment": {{
        "high_risks": ["Critical risk 1", "Critical risk 2"],
        "medium_risks": ["Moderate risk 1", "Moderate risk 2"],
        "low_risks": ["Minor risk 1", "Minor risk 2"],
        "mitigation_strategies": ["Strategy 1", "Strategy 2"],
        "contingency_plans": ["Plan A", "Plan B"]
    }},
    "recommendations": {{
        "immediate_actions": ["Action 1", "Action 2"],
        "short_term": ["30-day priority 1", "30-day priority 2"],
        "long_term": ["6-month goal 1", "6-month goal 2"],
        "success_metrics": ["KPI 1", "KPI 2", "KPI 3"]
    }},
    "swot": {{
        "strengths": ["Strength 1", "Strength 2"],
        "weaknesses": ["Weakness 1", "Weakness 2"],
        "opportunities": ["Opportunity 1", "Opportunity 2"],
        "threats": ["Threat 1", "Threat 2"]
    }},
    "go_to_market": {{
        "launch_strategy": "Market entry approach",
        "marketing_channels": ["Channel 1", "Channel 2"],
        "content_strategy": "Content marketing recommendations",
        "launch_timeline": "Launch timeline",
        "early_adopter_strategy": "How to acquire first 100 customers"
    }}
}}

Be specific, actionable, and realistic. Return ONLY the JSON object, no additional text."""

                analysis_record.progress_percent = 40
                db.session.commit()
                
                response = client.messages.create(
                    model="claude-sonnet-4-20250514",
                    max_tokens=8192,
                    messages=[{"role": "user", "content": prompt}]
                )
                
                analysis_record.progress_percent = 80
                db.session.commit()
                
                response_text = response.content[0].text
                
                try:
                    if "```json" in response_text:
                        response_text = response_text.split("```json")[1].split("```")[0]
                    elif "```" in response_text:
                        response_text = response_text.split("```")[1].split("```")[0]
                    
                    report = json.loads(response_text.strip())
                except json.JSONDecodeError:
                    report = {"raw_response": response_text}
                
                analysis_record.status = 'completed'
                analysis_record.report = report
                analysis_record.executive_summary = report.get('executive_summary', '')
                analysis_record.market_analysis = report.get('market_analysis')
                analysis_record.financial_projections = report.get('financial_projections')
                analysis_record.risk_assessment = report.get('risk_assessment')
                analysis_record.recommendations = report.get('recommendations')
                analysis_record.score = report.get('score', 0)
                analysis_record.progress_percent = 100
                
                # Mark pending transaction as completed
                pending_tx_record = Transaction.query.get(pending_tx_id)
                if pending_tx_record:
                    pending_tx_record.status = 'completed'
                    pending_tx_record.description = f'Analysis: {business_idea[:50]}...'
                
                db.session.commit()
                
            except Exception as e:
                try:
                    analysis_record = Analysis.query.get(analysis_id)
                    if analysis_record:
                        analysis_record.status = 'failed'
                        analysis_record.last_error = str(e)
                    
                    # Restore credit and mark transaction as refunded
                    user_record = User.query.filter_by(email=analysis_record.user_email).first()
                    if user_record:
                        user_record.credits += 1
                    
                    pending_tx_record = Transaction.query.get(pending_tx_id)
                    if pending_tx_record:
                        pending_tx_record.status = 'completed'
                        pending_tx_record.type = 'refunded'
                        pending_tx_record.description = f'Refunded: Analysis failed - {str(e)[:80]}'
                    
                    db.session.commit()
                except Exception:
                    pass
    
    thread = threading.Thread(target=run_analysis)
    thread.daemon = True
    thread.start()
    
    return jsonify({'message': 'Analysis generation started', 'analysis_id': analysis_id}), 202


# Public contact endpoint for landing page contact form
@entities_bp.route('/contact', methods=['POST'])
def contact_public():
    try:
        data = request.get_json() or {}
        name = data.get('name')
        email = data.get('email')
        message = data.get('message')

        if not name or not email or not message:
            return jsonify({'error': 'Missing required fields'}), 400

        zepto_api_key = os.environ.get('ZEPTOMAIL_API_KEY')
        if not zepto_api_key:
            return jsonify({'error': 'Email provider not configured'}), 500

        payload = {
            'from': {
                'address': os.environ.get('SMTP_FROM_EMAIL', 'info@planlyze.com'),
                'name': os.environ.get('SMTP_FROM_NAME', 'Planlyze Contact Form')
            },
            'to': [
                {
                    'email_address': {
                        'address': os.environ.get('CONTACT_RECEIVER_EMAIL', 'info@planlyze.com'),
                        'name': os.environ.get('CONTACT_RECEIVER_NAME', 'Planlyze Team')
                    }
                }
            ],
            'subject': f'Contact from {name}',
            'htmlbody': f"<p><strong>Name:</strong> {name}</p><p><strong>Email:</strong> {email}</p><p><strong>Message:</strong></p><p>{message.replace(chr(10),'<br/>')}</p>",
            'textbody': f"Name: {name}\nEmail: {email}\n\nMessage:\n{message}"
        }

        headers = {
            'Authorization': zepto_api_key,
            'Content-Type': 'application/json'
        }

        resp = requests.post('https://api.zeptomail.com/v1.1/email', json=payload, headers=headers, timeout=10)
        if not resp.ok:
            try:
                err_text = resp.text
            except Exception:
                err_text = 'unknown error'
            return jsonify({'error': 'Failed to send email', 'details': err_text}), 500

        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@entities_bp.route('/analyses', methods=['POST'])
@require_auth
def create_analysis(user):
    """
    Create a new analysis
    ---
    tags:
      - Analyses
    security:
      - Bearer: []
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            business_idea:
              type: string
            industry:
              type: string
            target_market:
              type: string
            location:
              type: string
            budget:
              type: string
          required:
            - business_idea
    responses:
      201:
        description: Analysis created successfully
      401:
        description: Not authenticated
    """
    data = request.get_json()
    analysis = Analysis(
        user_email=user.email,
        business_idea=data.get('business_idea'),
        industry=data.get('industry'),
        target_market=data.get('target_market'),
        location=data.get('location'),
        budget=data.get('budget'),
        status='pending'
    )
    db.session.add(analysis)
    db.session.commit()
    return jsonify(analysis.to_dict()), 201

@entities_bp.route('/analyses/<id>', methods=['PUT'])
@require_auth
def update_analysis(user, id):
    analysis = Analysis.query.get(id)
    if not analysis:
        return jsonify({'error': 'Analysis not found'}), 404
    if analysis.user_email != user.email and not is_admin(user):
        return jsonify({'error': 'Access denied'}), 403
    
    data = request.get_json()
    for key, value in data.items():
        if hasattr(analysis, key) and key not in ['id', 'user_email', 'created_at']:
            setattr(analysis, key, value)
    
    db.session.commit()
    return jsonify(analysis.to_dict())

@entities_bp.route('/analyses/<id>', methods=['DELETE'])
@require_auth
def delete_analysis(user, id):
    analysis = Analysis.query.get(id)
    if not analysis:
        return jsonify({'error': 'Analysis not found'}), 404
    if analysis.user_email != user.email and not is_admin(user):
        return jsonify({'error': 'Access denied'}), 403
    
    db.session.delete(analysis)
    db.session.commit()
    return jsonify({'message': 'Analysis deleted'})

@entities_bp.route('/analyses/<id>/upgrade-premium', methods=['POST'])
@require_auth
def upgrade_analysis_premium(user, id):
    """Upgrade an analysis to premium (deducts 1 credit)"""
    analysis = Analysis.query.get(id)
    if not analysis:
        return jsonify({'error': 'Analysis not found'}), 404
    if analysis.user_email != user.email:
        return jsonify({'error': 'Access denied'}), 403
    
    if analysis.is_premium:
        return jsonify({'error': 'Analysis is already premium'}), 400
    
    user_record = User.query.filter_by(email=user.email).first()
    if not user_record or user_record.credits <= 0:
        return jsonify({'error': 'Insufficient credits'}), 402
    
    # Deduct credit
    user_record.credits -= 1
    
    # Update analysis to premium
    analysis.is_premium = True
    
    # Create transaction record
    tx = Transaction(
        user_email=user.email,
        type='usage',
        credits=-1,
        description=f'Upgraded analysis to premium: {analysis.business_idea[:50]}...' if analysis.business_idea else 'Premium upgrade',
        reference_id=id,
        status='completed'
    )
    db.session.add(tx)
    db.session.commit()
    
    return jsonify({'message': 'Analysis upgraded to premium', 'analysis': analysis.to_dict()})

# Transaction endpoints
@entities_bp.route('/transactions', methods=['GET'])
@require_auth
def get_transactions(user):
    if is_admin(user):
        transactions = Transaction.query.order_by(Transaction.created_at.desc()).all()
    else:
        transactions = Transaction.query.filter_by(user_email=user.email).order_by(Transaction.created_at.desc()).all()
    return jsonify([t.to_dict() for t in transactions])

@entities_bp.route('/transactions', methods=['POST'])
@require_auth
def create_transaction(user):
    data = request.get_json()
    transaction = Transaction(
        user_email=data.get('user_email', user.email),
        type=data.get('type'),
        credits=data.get('credits'),
        amount_usd=data.get('amount_usd'),
        description=data.get('description'),
        reference_id=data.get('reference_id'),
        status=data.get('status', 'completed')
    )
    db.session.add(transaction)
    db.session.commit()
    return jsonify(transaction.to_dict()), 201

# Credit Package endpoints
@entities_bp.route('/credit-packages', methods=['GET'])
def get_credit_packages():
    """
    Get all available credit packages
    ---
    tags:
      - Credit Packages
    responses:
      200:
        description: List of available credit packages
        schema:
          type: array
          items:
            type: object
            properties:
              id:
                type: string
              name:
                type: string
              credits:
                type: integer
              price_usd:
                type: number
    """
    packages = CreditPackage.query.filter_by(is_active=True).all()
    return jsonify([p.to_dict() for p in packages])

@entities_bp.route('/credit-packages', methods=['POST'])
@require_admin
def create_credit_package(user):
    data = request.get_json()
    package = CreditPackage(
        name=data.get('name'),
        credits=data.get('credits'),
        price_usd=data.get('price_usd'),
        description=data.get('description'),
        is_popular=data.get('is_popular', False)
    )
    db.session.add(package)
    db.session.commit()
    return jsonify(package.to_dict()), 201

@entities_bp.route('/credit-packages/<id>', methods=['PUT'])
@require_admin
def update_credit_package(user, id):
    package = CreditPackage.query.get(id)
    if not package:
        return jsonify({'error': 'Package not found'}), 404
    
    data = request.get_json()
    for key, value in data.items():
        if hasattr(package, key) and key not in ['id', 'created_at']:
            setattr(package, key, value)
    
    db.session.commit()
    return jsonify(package.to_dict())

@entities_bp.route('/credit-packages/<id>', methods=['DELETE'])
@require_admin
def delete_credit_package(user, id):
    package = CreditPackage.query.get(id)
    if not package:
        return jsonify({'error': 'Package not found'}), 404
    
    db.session.delete(package)
    db.session.commit()
    return jsonify({'message': 'Package deleted'})

# Payment endpoints
@entities_bp.route('/payments', methods=['GET'])
@require_auth
def get_payments(user):
    """
    Get all payments for current user (or all if admin)
    ---
    tags:
      - Payments
    security:
      - Bearer: []
    responses:
      200:
        description: List of payments
        schema:
          type: array
          items:
            type: object
      401:
        description: Not authenticated
    """
    if is_admin(user):
        payments = Payment.query.order_by(Payment.created_at.desc()).all()
    else:
        payments = Payment.query.filter_by(user_email=user.email).order_by(Payment.created_at.desc()).all()
    return jsonify([p.to_dict() for p in payments])

@entities_bp.route('/payments', methods=['POST'])
@require_auth
def create_payment(user):
    data = request.get_json()
    payment = Payment(
        user_email=user.email,
        amount_usd=data.get('amount_usd'),
        credits=data.get('credits'),
        payment_method=data.get('payment_method'),
        payment_proof=data.get('payment_proof'),
        notes=data.get('notes')
    )
    db.session.add(payment)
    db.session.commit()
    return jsonify(payment.to_dict()), 201

@entities_bp.route('/payments/<id>/approve', methods=['POST'])
@require_admin
def approve_payment(user, id):
    payment = Payment.query.get(id)
    if not payment:
        return jsonify({'error': 'Payment not found'}), 404
    
    payment.status = 'approved'
    payment.approved_by = user.email
    payment.approved_at = datetime.utcnow()
    
    target_user = User.query.filter_by(email=payment.user_email).first()
    if target_user:
        target_user.credits = (target_user.credits or 0) + payment.credits
    
    transaction = Transaction(
        user_email=payment.user_email,
        type='purchase',
        credits=payment.credits,
        amount_usd=payment.amount_usd,
        description=f'Payment approved - {payment.credits} credits',
        reference_id=payment.id
    )
    db.session.add(transaction)
    db.session.commit()
    
    return jsonify(payment.to_dict())

@entities_bp.route('/payments/<id>/reject', methods=['POST'])
@require_admin
def reject_payment(user, id):
    payment = Payment.query.get(id)
    if not payment:
        return jsonify({'error': 'Payment not found'}), 404
    
    data = request.get_json()
    payment.status = 'rejected'
    payment.notes = data.get('reason', 'Payment rejected')
    
    db.session.commit()
    return jsonify(payment.to_dict())

# Email Template endpoints
@entities_bp.route('/email-templates', methods=['GET'])
@require_admin
def get_email_templates(user):
    templates = EmailTemplate.query.all()
    return jsonify([t.to_dict() for t in templates])

@entities_bp.route('/email-templates', methods=['POST'])
@require_admin
def create_email_template(user):
    data = request.get_json()
    template = EmailTemplate(
        template_key=data.get('template_key'),
        name=data.get('name'),
        subject_en=data.get('subject_en'),
        subject_ar=data.get('subject_ar'),
        body_en=data.get('body_en'),
        body_ar=data.get('body_ar')
    )
    db.session.add(template)
    db.session.commit()
    return jsonify(template.to_dict()), 201

@entities_bp.route('/email-templates/<id>', methods=['PUT'])
@require_admin
def update_email_template(user, id):
    template = EmailTemplate.query.get(id)
    if not template:
        return jsonify({'error': 'Template not found'}), 404
    
    data = request.get_json()
    for key, value in data.items():
        if hasattr(template, key) and key not in ['id', 'created_at']:
            setattr(template, key, value)
    
    db.session.commit()
    return jsonify(template.to_dict())

@entities_bp.route('/send-templated-email', methods=['POST'])
@require_admin
def send_templated_email(user):
    """Send an email using a template - uses centralized email service"""
    from server.services.email_service import send_email
    
    data = request.get_json()
    user_email = data.get('userEmail')
    template_key = data.get('templateKey')
    variables = data.get('variables', {})
    language = data.get('language', 'english')
    
    if not user_email or not template_key:
        return jsonify({'error': 'Missing userEmail or templateKey'}), 400
    
    template = EmailTemplate.query.filter_by(template_key=template_key).first()
    if not template:
        return jsonify({'error': 'Template not found'}), 404
    
    is_arabic = language.lower() in ['arabic', 'ar']
    subject = template.subject_ar if is_arabic else template.subject_en
    body = template.body_ar if is_arabic else template.body_en
    
    for key, value in variables.items():
        subject = subject.replace('{{' + key + '}}', str(value))
        body = body.replace('{{' + key + '}}', str(value))
    
    success, error = send_email(user_email, user_email, subject, body)
    
    if success:
        return jsonify({'success': True})
    else:
        return jsonify({'error': 'Failed to send email', 'details': error}), 500

# Payment Method endpoints
@entities_bp.route('/payment-methods', methods=['GET'])
def get_payment_methods():
    methods = PaymentMethod.query.filter_by(is_active=True).all()
    return jsonify([m.to_dict() for m in methods])

@entities_bp.route('/payment-methods', methods=['POST'])
@require_admin
def create_payment_method(user):
    data = request.get_json()
    
    name = data.get('name') or data.get('name_en') or 'Unnamed Method'
    
    details = data.get('details') or {}
    if data.get('name_en'):
        details['name_en'] = data.get('name_en')
    if data.get('name_ar'):
        details['name_ar'] = data.get('name_ar')
    if data.get('logo_url'):
        details['logo_url'] = data.get('logo_url')
    if data.get('description'):
        details['description'] = data.get('description')
    if data.get('sort_order') is not None:
        details['sort_order'] = data.get('sort_order')
    
    method = PaymentMethod(
        name=name,
        type=data.get('type'),
        details=details if details else None,
        instructions=data.get('instructions'),
        is_active=data.get('is_active', True)
    )
    db.session.add(method)
    db.session.commit()
    return jsonify(method.to_dict()), 201

@entities_bp.route('/payment-methods/<id>', methods=['PUT'])
@require_admin
def update_payment_method(user, id):
    method = PaymentMethod.query.get(id)
    if not method:
        return jsonify({'error': 'Method not found'}), 404
    
    data = request.get_json()
    
    if data.get('name'):
        method.name = data.get('name')
    elif data.get('name_en'):
        method.name = data.get('name_en')
    
    if data.get('type'):
        method.type = data.get('type')
    if data.get('instructions'):
        method.instructions = data.get('instructions')
    if 'is_active' in data:
        method.is_active = data.get('is_active')
    
    details = method.details or {}
    if data.get('name_en'):
        details['name_en'] = data.get('name_en')
    if data.get('name_ar'):
        details['name_ar'] = data.get('name_ar')
    if data.get('logo_url'):
        details['logo_url'] = data.get('logo_url')
    if data.get('description'):
        details['description'] = data.get('description')
    if data.get('sort_order') is not None:
        details['sort_order'] = data.get('sort_order')
    if details:
        method.details = details
    
    db.session.commit()
    return jsonify(method.to_dict())

# Discount Code endpoints
@entities_bp.route('/discount-codes', methods=['GET'])
@require_admin
def get_discount_codes(user):
    codes = DiscountCode.query.all()
    return jsonify([c.to_dict() for c in codes])

@entities_bp.route('/discount-codes', methods=['POST'])
@require_admin
def create_discount_code(user):
    data = request.get_json()
    code = DiscountCode(
        code=data.get('code'),
        discount_percent=data.get('discount_percent'),
        discount_amount=data.get('discount_amount'),
        description_en=data.get('description_en'),
        description_ar=data.get('description_ar'),
        min_purchase_amount=data.get('min_purchase_amount', 0),
        max_uses=data.get('max_uses'),
        valid_from=datetime.fromisoformat(data['valid_from']) if data.get('valid_from') else None,
        valid_until=datetime.fromisoformat(data['valid_until']) if data.get('valid_until') else None
    )
    db.session.add(code)
    db.session.commit()
    return jsonify(code.to_dict()), 201

@entities_bp.route('/discount-codes/<id>', methods=['PUT'])
@require_admin
def update_discount_code(user, id):
    code = DiscountCode.query.get(id)
    if not code:
        return jsonify({'error': 'Discount code not found'}), 404
    
    data = request.get_json()
    if 'code' in data:
        code.code = data['code']
    if 'discount_percent' in data:
        code.discount_percent = data['discount_percent']
    if 'discount_amount' in data:
        code.discount_amount = data['discount_amount']
    if 'description_en' in data:
        code.description_en = data['description_en']
    if 'description_ar' in data:
        code.description_ar = data['description_ar']
    if 'min_purchase_amount' in data:
        code.min_purchase_amount = data['min_purchase_amount']
    if 'max_uses' in data:
        code.max_uses = data['max_uses']
    if 'is_active' in data:
        code.is_active = data['is_active']
    if 'valid_from' in data:
        code.valid_from = datetime.fromisoformat(data['valid_from']) if data['valid_from'] else None
    if 'valid_until' in data:
        code.valid_until = datetime.fromisoformat(data['valid_until']) if data['valid_until'] else None
    
    db.session.commit()
    return jsonify(code.to_dict())

@entities_bp.route('/discount-codes/<id>', methods=['DELETE'])
@require_admin
def delete_discount_code(user, id):
    code = DiscountCode.query.get(id)
    if not code:
        return jsonify({'error': 'Discount code not found'}), 404
    
    db.session.delete(code)
    db.session.commit()
    return jsonify({'message': 'Discount code deleted'})

@entities_bp.route('/discount-codes/validate', methods=['POST'])
@require_auth
def validate_discount_code(user):
    data = request.get_json()
    code_str = data.get('code')
    
    code = DiscountCode.query.filter_by(code=code_str, is_active=True).first()
    if not code:
        return jsonify({'error': 'Invalid discount code'}), 404
    
    now = datetime.utcnow()
    if code.valid_from and now < code.valid_from:
        return jsonify({'error': 'Discount code not yet valid'}), 400
    if code.valid_until and now > code.valid_until:
        return jsonify({'error': 'Discount code has expired'}), 400
    if code.max_uses and code.used_count >= code.max_uses:
        return jsonify({'error': 'Discount code has reached maximum uses'}), 400
    
    return jsonify(code.to_dict())

# Role endpoints
@entities_bp.route('/roles', methods=['GET'])
@require_admin
def get_roles(user):
    roles = Role.query.all()
    return jsonify([r.to_dict() for r in roles])

@entities_bp.route('/roles', methods=['POST'])
@require_admin
def create_role(user):
    data = request.get_json()
    role = Role(
        name=data.get('name'),
        permissions=data.get('permissions'),
        description=data.get('description')
    )
    db.session.add(role)
    db.session.commit()
    return jsonify(role.to_dict()), 201

@entities_bp.route('/roles/<role_id>', methods=['GET'])
@require_admin
def get_role(user, role_id):
    role = Role.query.get(role_id)
    if not role:
        return jsonify({'error': 'Role not found'}), 404
    return jsonify(role.to_dict())

@entities_bp.route('/roles/<role_id>', methods=['PUT'])
@require_admin
def update_role(user, role_id):
    role = Role.query.get(role_id)
    if not role:
        return jsonify({'error': 'Role not found'}), 404
    
    data = request.get_json()
    if 'name' in data:
        role.name = data['name']
    if 'permissions' in data:
        role.permissions = data['permissions']
    if 'description' in data:
        role.description = data['description']
    if 'is_active' in data:
        role.is_active = data['is_active']
    
    db.session.commit()
    return jsonify(role.to_dict())

@entities_bp.route('/roles/<role_id>', methods=['DELETE'])
@require_admin
def delete_role(user, role_id):
    role = Role.query.get(role_id)
    if not role:
        return jsonify({'error': 'Role not found'}), 404
    
    db.session.delete(role)
    db.session.commit()
    return jsonify({'message': 'Role deleted successfully'})

# Audit Log endpoints
@entities_bp.route('/audit-logs', methods=['GET'])
@require_admin
def get_audit_logs(user):
    logs = AuditLog.query.order_by(AuditLog.created_at.desc()).limit(100).all()
    return jsonify([l.to_dict() for l in logs])

@entities_bp.route('/audit-logs', methods=['POST'])
@require_auth
def create_audit_log(user):
    data = request.get_json()
    log = AuditLog(
        action_type=data.get('action_type'),
        user_email=data.get('user_email', user.email),
        performed_by=data.get('performed_by', user.email),
        description=data.get('description'),
        metadata=data.get('metadata'),
        entity_id=data.get('entity_id'),
        entity_type=data.get('entity_type')
    )
    db.session.add(log)
    db.session.commit()
    return jsonify(log.to_dict()), 201

# API Request Logs endpoints
@entities_bp.route('/api-request-logs', methods=['GET'])
@require_admin
def get_api_request_logs(user):
    """
    Get API request logs (admin only)
    ---
    tags:
      - Audit
    security:
      - Bearer: []
    parameters:
      - name: page
        in: query
        type: integer
        default: 1
      - name: per_page
        in: query
        type: integer
        default: 50
      - name: method
        in: query
        type: string
      - name: path
        in: query
        type: string
      - name: status
        in: query
        type: integer
      - name: user_email
        in: query
        type: string
    responses:
      200:
        description: Paginated list of API request logs
    """
    from server.models import ApiRequestLog
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    per_page = min(per_page, 100)
    
    query = ApiRequestLog.query
    
    if request.args.get('method'):
        query = query.filter(ApiRequestLog.method == request.args.get('method'))
    if request.args.get('path'):
        query = query.filter(ApiRequestLog.path.contains(request.args.get('path')))
    if request.args.get('status'):
        query = query.filter(ApiRequestLog.response_status == request.args.get('status', type=int))
    if request.args.get('user_email'):
        query = query.filter(ApiRequestLog.user_email == request.args.get('user_email'))
    
    total = query.count()
    logs = query.order_by(ApiRequestLog.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    
    return jsonify({
        'data': [l.to_dict() for l in logs],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': total,
            'total_pages': (total + per_page - 1) // per_page
        }
    })

@entities_bp.route('/api-request-logs/<log_id>', methods=['GET'])
@require_admin
def get_api_request_log(user, log_id):
    """
    Get a specific API request log (admin only)
    ---
    tags:
      - Audit
    security:
      - Bearer: []
    responses:
      200:
        description: API request log details
      404:
        description: Log not found
    """
    from server.models import ApiRequestLog
    
    log = ApiRequestLog.query.get(log_id)
    if not log:
        return jsonify({'error': 'Log not found'}), 404
    return jsonify(log.to_dict())

# Activity Feed endpoints
@entities_bp.route('/activity-feed', methods=['GET'])
@require_auth
def get_activity_feed(user):
    activities = ActivityFeed.query.filter_by(user_email=user.email).order_by(ActivityFeed.created_at.desc()).limit(50).all()
    return jsonify([a.to_dict() for a in activities])

@entities_bp.route('/activity-feed', methods=['POST'])
@require_auth
def create_activity(user):
    data = request.get_json()
    activity = ActivityFeed(
        user_email=data.get('user_email', user.email),
        action_type=data.get('action_type'),
        title=data.get('title'),
        description=data.get('description'),
        metadata=data.get('metadata'),
        is_public=data.get('is_public', False)
    )
    db.session.add(activity)
    db.session.commit()
    return jsonify(activity.to_dict()), 201

# Notification endpoints
@entities_bp.route('/notifications', methods=['GET'])
@require_auth
def get_notifications(user):
    """
    Get all notifications for current user
    ---
    tags:
      - Notifications
    security:
      - Bearer: []
    responses:
      200:
        description: List of notifications
        schema:
          type: array
          items:
            type: object
      401:
        description: Not authenticated
    """
    notifications = Notification.query.filter_by(user_email=user.email).order_by(Notification.created_at.desc()).all()
    return jsonify([n.to_dict() for n in notifications])

@entities_bp.route('/notifications', methods=['POST'])
@require_auth
def create_notification(user):
    data = request.get_json()
    notification = Notification(
        user_email=data.get('user_email', user.email),
        type=data.get('type'),
        title=data.get('title'),
        message=data.get('message'),
        metadata=data.get('metadata')
    )
    db.session.add(notification)
    db.session.commit()
    return jsonify(notification.to_dict()), 201

@entities_bp.route('/notifications/<id>/read', methods=['POST'])
@require_auth
def mark_notification_read(user, id):
    notification = Notification.query.get(id)
    if not notification:
        return jsonify({'error': 'Notification not found'}), 404
    if notification.user_email != user.email:
        return jsonify({'error': 'Access denied'}), 403
    
    notification.is_read = True
    db.session.commit()
    return jsonify(notification.to_dict())

@entities_bp.route('/notifications/mark-all-read', methods=['POST'])
@require_auth
def mark_all_notifications_read(user):
    """
    Mark all notifications as read
    ---
    tags:
      - Notifications
    security:
      - Bearer: []
    responses:
      200:
        description: All notifications marked as read
      401:
        description: Not authenticated
    """
    Notification.query.filter_by(user_email=user.email, is_read=False).update({'is_read': True})
    db.session.commit()
    return jsonify({'message': 'All notifications marked as read'})

@entities_bp.route('/notifications/<id>', methods=['DELETE'])
@require_auth
def delete_notification(user, id):
    notification = Notification.query.get(id)
    if not notification:
        return jsonify({'error': 'Notification not found'}), 404
    if notification.user_email != user.email:
        return jsonify({'error': 'Access denied'}), 403
    
    db.session.delete(notification)
    db.session.commit()
    return jsonify({'message': 'Notification deleted'})

# Report Share endpoints
@entities_bp.route('/report-shares', methods=['GET'])
@require_auth
def get_report_shares(user):
    shares = ReportShare.query.filter_by(created_by=user.email).order_by(ReportShare.created_at.desc()).all()
    return jsonify([s.to_dict() for s in shares])

@entities_bp.route('/report-shares', methods=['POST'])
@require_auth
def create_report_share(user):
    data = request.get_json()
    share = ReportShare(
        analysis_id=data.get('analysis_id'),
        share_token=uuid.uuid4().hex,
        created_by=user.email,
        expires_at=datetime.fromisoformat(data['expires_at']) if data.get('expires_at') else None
    )
    db.session.add(share)
    db.session.commit()
    return jsonify(share.to_dict()), 201

@entities_bp.route('/report-shares/public/<token>', methods=['GET'])
def get_shared_report(token):
    share = ReportShare.query.filter_by(share_token=token, is_active=True).first()
    if not share:
        return jsonify({'error': 'Share not found'}), 404
    
    if share.expires_at and datetime.utcnow() > share.expires_at:
        return jsonify({'error': 'Share link has expired'}), 403
    
    analysis = Analysis.query.get(share.analysis_id)
    if not analysis:
        return jsonify({'error': 'Analysis not found'}), 404
    
    share.access_count = (share.access_count or 0) + 1
    db.session.commit()
    
    return jsonify({
        'share': share.to_dict(),
        'analysis': analysis.to_dict()
    })

# Chat Conversation endpoints
@entities_bp.route('/chat-conversations', methods=['GET'])
@require_auth
def get_chat_conversations(user):
    conversations = ChatConversation.query.filter_by(user_email=user.email).order_by(ChatConversation.updated_at.desc()).all()
    return jsonify([c.to_dict() for c in conversations])

@entities_bp.route('/chat-conversations/<id>', methods=['GET'])
@require_auth
def get_chat_conversation(user, id):
    conversation = ChatConversation.query.get(id)
    if not conversation:
        return jsonify({'error': 'Conversation not found'}), 404
    if conversation.user_email != user.email:
        return jsonify({'error': 'Access denied'}), 403
    return jsonify(conversation.to_dict())

@entities_bp.route('/chat-conversations', methods=['POST'])
@require_auth
def create_chat_conversation(user):
    data = request.get_json()
    conversation = ChatConversation(
        user_email=user.email,
        analysis_id=data.get('analysis_id'),
        title=data.get('title', 'New Conversation'),
        messages=data.get('messages', [])
    )
    db.session.add(conversation)
    db.session.commit()
    return jsonify(conversation.to_dict()), 201

@entities_bp.route('/chat-conversations/<id>', methods=['PUT'])
@require_auth
def update_chat_conversation(user, id):
    conversation = ChatConversation.query.get(id)
    if not conversation:
        return jsonify({'error': 'Conversation not found'}), 404
    if conversation.user_email != user.email:
        return jsonify({'error': 'Access denied'}), 403
    
    data = request.get_json()
    if 'title' in data:
        conversation.title = data['title']
    if 'messages' in data:
        conversation.messages = data['messages']
    
    db.session.commit()
    return jsonify(conversation.to_dict())

# Referral endpoints
@entities_bp.route('/referrals', methods=['GET'])
@require_auth
def get_referrals(user):
    if is_admin(user):
        referrals = Referral.query.order_by(Referral.created_at.desc()).all()
    else:
        referrals = Referral.query.filter_by(referrer_email=user.email).order_by(Referral.created_at.desc()).all()
    return jsonify([r.to_dict() for r in referrals])

@entities_bp.route('/referrals/apply', methods=['POST'])
@require_auth
def apply_referral(user):
    data = request.get_json()
    referral_code = data.get('referral_code')
    
    if user.referred_by:
        return jsonify({'error': 'Referral already applied'}), 400
    
    referrer = User.query.filter_by(referral_code=referral_code).first()
    if not referrer:
        return jsonify({'error': 'Invalid referral code'}), 400
    
    if referrer.email == user.email:
        return jsonify({'error': 'Cannot use your own referral code'}), 400
    
    referral = Referral(
        referrer_email=referrer.email,
        referred_email=user.email,
        referral_code=referral_code,
        status='pending'
    )
    
    user.referred_by = referral_code
    
    db.session.add(referral)
    db.session.commit()
    
    return jsonify({'message': 'Referral applied successfully', 'referral': referral.to_dict()})

# Admin user management
@entities_bp.route('/users', methods=['GET'])
@require_admin
def get_users(user):
    """
    Get all users (admin only)
    ---
    tags:
      - Admin
    security:
      - Bearer: []
    responses:
      200:
        description: List of all users
      401:
        description: Not authenticated
      403:
        description: Admin access required
    """
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify([u.to_dict() for u in users])

@entities_bp.route('/users/<id>', methods=['PUT'])
@require_admin
def update_user(user, id):
    target_user = User.query.get(id)
    if not target_user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    if 'role' in data:
        role = Role.query.filter_by(name=data['role']).first()
        if role:
            target_user.role_id = role.id
    if 'role_id' in data:
        target_user.role_id = data['role_id']
    if 'credits' in data:
        target_user.credits = data['credits']
    if 'is_active' in data:
        target_user.is_active = data['is_active']
    
    db.session.commit()
    return jsonify(target_user.to_dict())

@entities_bp.route('/users/<id>/adjust-credits', methods=['POST'])
@require_admin
def adjust_user_credits(user, id):
    target_user = User.query.get(id)
    if not target_user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    credits = data.get('credits', 0)
    reason = data.get('reason', '')
    
    target_user.credits = (target_user.credits or 0) + credits
    
    transaction = Transaction(
        user_email=target_user.email,
        type='adjustment',
        credits=credits,
        description=f'Admin adjustment: {reason}',
        reference_id=f'admin-{user.email}'
    )
    db.session.add(transaction)
    
    log = AuditLog(
        action_type='credit_adjustment',
        user_email=target_user.email,
        performed_by=user.email,
        description=f'{"Added" if credits > 0 else "Deducted"} {abs(credits)} credits. {reason}',
        metadata={'credits': credits, 'reason': reason}
    )
    db.session.add(log)
    
    db.session.commit()
    return jsonify(target_user.to_dict())

# System Settings endpoints
@entities_bp.route('/settings', methods=['GET'])
def get_settings():
    settings = SystemSettings.query.all()
    result = {'price_per_credit': '1.99'}
    for s in settings:
        result[s.key] = s.value
    return jsonify(result)

@entities_bp.route('/settings/<key>', methods=['GET'])
def get_setting(key):
    setting = SystemSettings.query.filter_by(key=key).first()
    if not setting:
        defaults = {'price_per_credit': '1.99'}
        return jsonify({'key': key, 'value': defaults.get(key, None)})
    return jsonify(setting.to_dict())

@entities_bp.route('/settings', methods=['POST'])
@require_admin
def update_settings(user):
    data = request.get_json()
    for key, value in data.items():
        setting = SystemSettings.query.filter_by(key=key).first()
        if setting:
            setting.value = str(value)
        else:
            setting = SystemSettings(key=key, value=str(value))
            db.session.add(setting)
    db.session.commit()
    settings = SystemSettings.query.all()
    result = {'price_per_credit': '1.99'}
    for s in settings:
        result[s.key] = s.value
    return jsonify(result)
