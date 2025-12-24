from flask import Blueprint, request, jsonify
from server.models import (
    db, Analysis, Transaction, CreditPackage, Payment, EmailTemplate,
    PaymentMethod, DiscountCode, Role, AuditLog, ActivityFeed, 
    Notification, ReportShare, ChatConversation, Referral, User, SystemSettings, Partner
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
        if role_name not in ['admin', 'super_admin', 'owner']:
            return jsonify({'error': 'Admin access required'}), 403
        return f(user, *args, **kwargs)
    wrapper.__name__ = f.__name__
    return wrapper

def get_user_role_name(user):
    return user.role.name if user.role else 'user'

def is_admin(user):
    role_name = get_user_role_name(user)
    return role_name in ['admin', 'super_admin', 'owner']

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

@entities_bp.route('/analyses/all', methods=['GET'])
@require_admin
def get_all_analyses(user):
    """
    Get all analyses (admin only)
    ---
    tags:
      - Admin
    security:
      - Bearer: []
    responses:
      200:
        description: List of all analyses
      401:
        description: Not authenticated
      403:
        description: Admin access required
    """
    analyses = Analysis.query.filter(Analysis.is_deleted != True).order_by(Analysis.created_at.desc()).all()
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
    Create a new analysis entry - tabs load lazily on demand
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
    """
    from server.services.analysis_service import get_report_type_for_user
    
    data = request.get_json() or {}
    business_idea = data.get('business_idea', '').strip()
    report_language = data.get('report_language', 'english').lower()
    
    if not business_idea:
        return jsonify({'error': 'Business idea is required'}), 400
    
    expected_report_type = get_report_type_for_user(user.email)
    
    analysis = Analysis(
        user_email=user.email,
        business_idea=business_idea,
        industry=data.get('industry', 'Other'),
        target_market=data.get('target_market', ''),
        location=data.get('country', ''),
        report_language=report_language,
        status='completed',  # Set to completed since tab content is lazy-loaded on demand
        report_type=expected_report_type
    )
    db.session.add(analysis)
    db.session.commit()
    
    response_data = analysis.to_dict()
    response_data['expected_report_type'] = expected_report_type
    
    return jsonify(response_data), 201


@entities_bp.route('/analyses/validate-idea', methods=['POST'])
@require_auth
def validate_idea_inline(user):
    """
    Validate a business idea without creating an analysis
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
            report_language:
              type: string
    responses:
      200:
        description: Validation result
        schema:
          type: object
          properties:
            valid:
              type: boolean
            reason:
              type: string
            confidence:
              type: number
    """
    from server.services.analysis_service import validate_business_idea
    
    data = request.get_json() or {}
    business_idea = data.get('business_idea', '').strip()
    report_language = data.get('report_language', 'english').lower()
    
    if not business_idea:
        return jsonify({
            'valid': False,
            'reason': 'Please provide a business idea' if report_language != 'arabic' else 'يرجى تقديم فكرة عمل',
            'confidence': 1.0
        }), 200
    
    lang = 'ar' if report_language == 'arabic' else 'en'
    validation = validate_business_idea(business_idea, lang)
    
    return jsonify(validation), 200


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
    from server.services.analysis_service import reserve_premium_credit, finalize_transaction
    
    data = request.get_json() or {}
    analysis_id = data.get('analysisId')
    
    if not analysis_id:
        return jsonify({'error': 'analysisId is required'}), 400
    
    analysis = Analysis.query.get(analysis_id)
    if not analysis:
        return jsonify({'error': 'Analysis not found'}), 404
    if analysis.user_email != user.email:
        return jsonify({'error': 'Access denied'}), 403
    
    reserve_result = reserve_premium_credit(user.email, analysis_id)
    
    if not reserve_result['success']:
        return jsonify({'error': reserve_result.get('error', 'Failed to reserve credit')}), 500
    
    report_type = reserve_result['report_type']
    pending_tx_id = reserve_result.get('transaction_id')
    
    def run_analysis():
        import logging
        import traceback
        logger = logging.getLogger('claude_llm')
        
        from server.app import create_app
        app = create_app()
        with app.app_context():
            try:
                logger.info(f"[Claude LLM] Starting analysis for ID: {analysis_id}")
                print(f"[Claude LLM] Starting analysis for ID: {analysis_id}")
                
                analysis_record = Analysis.query.get(analysis_id)
                if not analysis_record:
                    logger.error(f"[Claude LLM] Analysis record not found: {analysis_id}")
                    print(f"[Claude LLM] ERROR: Analysis record not found: {analysis_id}")
                    return
                
                analysis_record.status = 'processing'
                analysis_record.progress_percent = 20
                db.session.commit()
                
                api_key = os.environ.get('AI_INTEGRATIONS_ANTHROPIC_API_KEY') or os.environ.get('ANTHROPIC_API_KEY')
                base_url = os.environ.get('AI_INTEGRATIONS_ANTHROPIC_BASE_URL')
                
                logger.info(f"[Claude LLM] API Key present: {bool(api_key)}, Base URL: {base_url or 'default'}")
                print(f"[Claude LLM] API Key present: {bool(api_key)}, Base URL: {base_url or 'default'}")
                
                if not api_key:
                    error_msg = 'AI service not configured - no API key found'
                    logger.error(f"[Claude LLM] {error_msg}")
                    print(f"[Claude LLM] ERROR: {error_msg}")
                    analysis_record.status = 'failed'
                    analysis_record.last_error = error_msg
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
                
                logger.info(f"[Claude LLM] Calling Claude API with model: claude-sonnet-4-5")
                print(f"[Claude LLM] Calling Claude API with model: claude-sonnet-4-5")
                print(f"[Claude LLM] Business idea: {business_idea[:100]}...")
                
                response = client.messages.create(
                    model="claude-sonnet-4-5",
                    max_tokens=8192,
                    messages=[{"role": "user", "content": prompt}]
                )
                
                logger.info(f"[Claude LLM] Response received - Stop reason: {response.stop_reason}, Usage: input={response.usage.input_tokens}, output={response.usage.output_tokens}")
                print(f"[Claude LLM] Response received - Stop reason: {response.stop_reason}")
                print(f"[Claude LLM] Token usage - Input: {response.usage.input_tokens}, Output: {response.usage.output_tokens}")
                
                analysis_record.progress_percent = 80
                db.session.commit()
                
                response_text = response.content[0].text
                logger.info(f"[Claude LLM] Response text length: {len(response_text)} characters")
                print(f"[Claude LLM] Response text length: {len(response_text)} characters")
                
                try:
                    if "```json" in response_text:
                        response_text = response_text.split("```json")[1].split("```")[0]
                    elif "```" in response_text:
                        response_text = response_text.split("```")[1].split("```")[0]
                    
                    report = json.loads(response_text.strip())
                    logger.info(f"[Claude LLM] Successfully parsed JSON response")
                    print(f"[Claude LLM] Successfully parsed JSON response")
                except json.JSONDecodeError as json_err:
                    logger.warning(f"[Claude LLM] JSON parse error: {json_err}. Using raw response.")
                    print(f"[Claude LLM] WARNING: JSON parse error: {json_err}")
                    print(f"[Claude LLM] Raw response preview: {response_text[:500]}...")
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
                db.session.commit()
                
                from server.services.analysis_service import finalize_transaction
                finalize_result = finalize_transaction(analysis_id, success=True)
                
                logger.info(f"[Claude LLM] Analysis completed successfully - ID: {analysis_id}, Score: {report.get('score', 0)}")
                logger.info(f"[Claude LLM] Transaction finalized: {finalize_result}")
                print(f"[Claude LLM] Analysis completed successfully!")
                print(f"[Claude LLM] Analysis ID: {analysis_id}")
                print(f"[Claude LLM] Score: {report.get('score', 0)}")
                
            except Exception as e:
                error_details = str(e)
                error_type = type(e).__name__
                full_traceback = traceback.format_exc()
                
                logger.error(f"[Claude LLM] Analysis failed - Type: {error_type}, Error: {error_details}")
                logger.error(f"[Claude LLM] Full traceback:\n{full_traceback}")
                print(f"[Claude LLM] ERROR - Analysis failed!")
                print(f"[Claude LLM] Error type: {error_type}")
                print(f"[Claude LLM] Error message: {error_details}")
                print(f"[Claude LLM] Full traceback:\n{full_traceback}")
                
                try:
                    analysis_record = Analysis.query.get(analysis_id)
                    if analysis_record:
                        analysis_record.status = 'failed'
                        analysis_record.last_error = f"{error_type}: {error_details}"
                        db.session.commit()
                    
                    from server.services.analysis_service import finalize_transaction
                    refund_result = finalize_transaction(analysis_id, success=False, error_message=f"{error_type}: {error_details}")
                    
                    if refund_result.get('refunded'):
                        logger.info(f"[Claude LLM] Credit refunded for analysis: {analysis_id}")
                        print(f"[Claude LLM] Credit refunded for analysis: {analysis_id}")
                    
                    logger.info(f"[Claude LLM] Cleanup completed for failed analysis: {analysis_id}")
                    print(f"[Claude LLM] Cleanup completed for failed analysis: {analysis_id}")
                except Exception as cleanup_error:
                    logger.error(f"[Claude LLM] Cleanup failed: {cleanup_error}")
                    print(f"[Claude LLM] ERROR during cleanup: {cleanup_error}")
    
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

        from server.models import ContactMessage
        contact_msg = ContactMessage(
            name=name,
            email=email,
            message=message,
            is_read=False,
            email_sent=False
        )
        db.session.add(contact_msg)
        db.session.commit()

        email_sent = False
        zepto_api_key = os.environ.get('ZEPTOMAIL_API_KEY')
        if zepto_api_key:
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

            try:
                resp = requests.post('https://api.zeptomail.com/v1.1/email', json=payload, headers=headers, timeout=10)
                if resp.ok:
                    email_sent = True
                    contact_msg.email_sent = True
                    db.session.commit()
            except Exception as email_error:
                print(f"Email send error: {email_error}")

        return jsonify({'success': True, 'email_sent': email_sent})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Admin endpoints for contact messages
@entities_bp.route('/contact-messages', methods=['GET'])
@require_auth
def get_contact_messages(user):
    if not user.role or user.role.name not in ['admin', 'super_admin']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    from server.models import ContactMessage
    messages = ContactMessage.query.order_by(ContactMessage.created_at.desc()).all()
    return jsonify([m.to_dict() for m in messages])

@entities_bp.route('/contact-messages/<id>/read', methods=['PUT'])
@require_auth
def mark_contact_message_read(user, id):
    if not user.role or user.role.name not in ['admin', 'super_admin']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    from server.models import ContactMessage
    message = ContactMessage.query.get(id)
    if not message:
        return jsonify({'error': 'Message not found'}), 404
    
    message.is_read = True
    db.session.commit()
    return jsonify(message.to_dict())

@entities_bp.route('/contact-messages/<id>', methods=['DELETE'])
@require_auth
def delete_contact_message(user, id):
    if not user.role or user.role.name not in ['admin', 'super_admin']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    from server.models import ContactMessage
    message = ContactMessage.query.get(id)
    if not message:
        return jsonify({'error': 'Message not found'}), 404
    
    db.session.delete(message)
    db.session.commit()
    return jsonify({'success': True})

# Social Media endpoints
@entities_bp.route('/social-media', methods=['GET'])
def get_social_media():
    from server.models import SocialMedia
    links = SocialMedia.query.filter_by(is_active=True).order_by(SocialMedia.display_order).all()
    return jsonify([link.to_dict() for link in links])

@entities_bp.route('/social-media/all', methods=['GET'])
@require_auth
def get_all_social_media(user):
    if not user.role or user.role.name not in ['admin', 'super_admin']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    from server.models import SocialMedia
    links = SocialMedia.query.order_by(SocialMedia.display_order).all()
    return jsonify([link.to_dict() for link in links])

@entities_bp.route('/social-media', methods=['POST'])
@require_auth
def create_social_media(user):
    if not user.role or user.role.name not in ['admin', 'super_admin']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    from server.models import SocialMedia
    data = request.get_json() or {}
    
    link = SocialMedia(
        platform=data.get('platform'),
        url=data.get('url'),
        icon=data.get('icon'),
        hover_color=data.get('hover_color', 'hover:bg-orange-500 hover:border-orange-500'),
        display_order=data.get('display_order', 0),
        is_active=data.get('is_active', True)
    )
    db.session.add(link)
    db.session.commit()
    return jsonify(link.to_dict()), 201

@entities_bp.route('/social-media/<id>', methods=['PUT'])
@require_auth
def update_social_media(user, id):
    if not user.role or user.role.name not in ['admin', 'super_admin']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    from server.models import SocialMedia
    link = SocialMedia.query.get(id)
    if not link:
        return jsonify({'error': 'Social media link not found'}), 404
    
    data = request.get_json() or {}
    if 'platform' in data:
        link.platform = data['platform']
    if 'url' in data:
        link.url = data['url']
    if 'icon' in data:
        link.icon = data['icon']
    if 'hover_color' in data:
        link.hover_color = data['hover_color']
    if 'display_order' in data:
        link.display_order = data['display_order']
    if 'is_active' in data:
        link.is_active = data['is_active']
    
    db.session.commit()
    return jsonify(link.to_dict())

@entities_bp.route('/social-media/<id>', methods=['DELETE'])
@require_auth
def delete_social_media(user, id):
    if not user.role or user.role.name not in ['admin', 'super_admin']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    from server.models import SocialMedia
    link = SocialMedia.query.get(id)
    if not link:
        return jsonify({'error': 'Social media link not found'}), 404
    
    db.session.delete(link)
    db.session.commit()
    return jsonify({'success': True})

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
    
    if analysis.report_type == 'premium':
        return jsonify({'error': 'Analysis is already premium'}), 400
    
    user_record = User.query.filter_by(email=user.email).first()
    if not user_record or user_record.credits <= 0:
        return jsonify({'error': 'Insufficient credits'}), 402
    
    # Deduct credit
    user_record.credits -= 1
    
    # Update analysis to premium
    analysis.report_type = 'premium'
    
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

# Landing Page Stats endpoint (public)
@entities_bp.route('/landing-stats', methods=['GET'])
def get_landing_stats():
    """
    Get public landing page statistics
    ---
    tags:
      - Public
    responses:
      200:
        description: Landing page statistics
        schema:
          type: object
          properties:
            users_count:
              type: integer
            reports_count:
              type: integer
            syrian_apps_count:
              type: integer
    """
    try:
        # Get user count from database
        users_count = User.query.filter_by(is_active=True).count()
        
        # Get completed reports count from database
        reports_count = Analysis.query.filter(Analysis.status == 'completed').count()
        
        # Get Syrian apps count from system settings
        syrian_apps_setting = SystemSettings.query.filter_by(key='syrian_apps_count').first()
        syrian_apps_count = int(syrian_apps_setting.value) if syrian_apps_setting and syrian_apps_setting.value else 150
        
        return jsonify({
            'users_count': users_count,
            'reports_count': reports_count,
            'syrian_apps_count': syrian_apps_count
        })
    except Exception as e:
        # Return default values on error
        return jsonify({
            'users_count': 500,
            'reports_count': 2000,
            'syrian_apps_count': 150
        })

# Partners endpoint (public)
@entities_bp.route('/partners', methods=['GET'])
def get_partners():
    """
    Get all active partners for landing page
    ---
    tags:
      - Public
    responses:
      200:
        description: List of partners
        schema:
          type: array
          items:
            type: object
            properties:
              id:
                type: string
              name:
                type: string
              name_ar:
                type: string
              logo_url:
                type: string
              website_url:
                type: string
              color:
                type: string
    """
    try:
        partners = Partner.query.filter_by(is_active=True).order_by(Partner.display_order).all()
        return jsonify([p.to_dict() for p in partners])
    except Exception as e:
        return jsonify([])

@entities_bp.route('/partners', methods=['POST'])
@require_admin
def create_partner(user):
    data = request.get_json()
    partner = Partner(
        name=data.get('name'),
        name_ar=data.get('name_ar'),
        logo_url=data.get('logo_url'),
        website_url=data.get('website_url'),
        color=data.get('color', '6B46C1'),
        display_order=data.get('display_order', 0),
        is_active=data.get('is_active', True)
    )
    db.session.add(partner)
    db.session.commit()
    return jsonify(partner.to_dict()), 201

@entities_bp.route('/partners/<id>', methods=['PUT'])
@require_admin
def update_partner(user, id):
    partner = Partner.query.get(id)
    if not partner:
        return jsonify({'error': 'Partner not found'}), 404
    
    data = request.get_json()
    for key, value in data.items():
        if hasattr(partner, key) and key not in ['id', 'created_at']:
            setattr(partner, key, value)
    
    db.session.commit()
    return jsonify(partner.to_dict())

@entities_bp.route('/partners/<id>', methods=['DELETE'])
@require_admin
def delete_partner(user, id):
    partner = Partner.query.get(id)
    if not partner:
        return jsonify({'error': 'Partner not found'}), 404
    
    db.session.delete(partner)
    db.session.commit()
    return jsonify({'message': 'Partner deleted'})

# System Settings endpoints
@entities_bp.route('/system-settings', methods=['GET'])
@require_admin
def get_system_settings(user):
    settings = SystemSettings.query.all()
    return jsonify([s.to_dict() for s in settings])

@entities_bp.route('/system-settings/<key>', methods=['GET'])
@require_admin
def get_system_setting(user, key):
    setting = SystemSettings.query.filter_by(key=key).first()
    if not setting:
        return jsonify({'error': 'Setting not found'}), 404
    return jsonify(setting.to_dict())

@entities_bp.route('/system-settings/<key>', methods=['PUT'])
@require_admin
def update_system_setting(user, key):
    data = request.get_json()
    setting = SystemSettings.query.filter_by(key=key).first()
    
    if not setting:
        setting = SystemSettings(key=key, value=data.get('value'))
        db.session.add(setting)
    else:
        setting.value = data.get('value')
    
    db.session.commit()
    return jsonify(setting.to_dict())

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
    discount_code_str = data.get('discount_code')
    
    payment = Payment(
        user_email=user.email,
        amount_usd=data.get('amount_usd'),
        original_amount=data.get('original_amount'),
        credits=data.get('credits'),
        payment_method=data.get('payment_method'),
        payment_proof=data.get('payment_proof'),
        discount_code=discount_code_str,
        discount_amount=data.get('discount_amount'),
        notes=data.get('notes')
    )
    db.session.add(payment)
    
    # Increment discount code used_count if a discount code was used
    if discount_code_str:
        discount = DiscountCode.query.filter_by(code=discount_code_str).first()
        if discount:
            discount.used_count = (discount.used_count or 0) + 1
    
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
    method = PaymentMethod(
        name=name,        
        name_ar=data.get('name_ar'),
        type=data.get('type'),
        logo_url=data.get('logo_url'),
        sort_order=data.get('sort_order', 0),
        details=details if details else None,
        instructions=data.get('instructions'),
        instructions_ar=data.get('instructions_ar'),
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
        
    if data.get('name_ar'):
        method.name_ar = data.get('name_ar')
        
    if data.get('logo_url'):
        method.logo_url = data.get('logo_url')
        
    if data.get('sort_order'):
        method.sort_order = data.get('sort_order')
    
    if data.get('type'):
        method.type = data.get('type')
        
    if data.get('instructions'):
        method.instructions = data.get('instructions')
    if data.get('instructions_ar'):
        method.instructions_ar = data.get('instructions_ar')
        
    if 'is_active' in data:
        method.is_active = data.get('is_active')
    
    details = data.get('details') or {}
    
    if details:
        method.details = details
    
    db.session.commit()
    return jsonify(method.to_dict())

@entities_bp.route('/payment-methods/<id>', methods=['DELETE'])
@require_admin
def delete_payment_method(user, id):
    method = PaymentMethod.query.get(id)
    if not method:
        return jsonify({'error': 'Method not found'}), 404
    
    # Payment records store the method name as a string, not a foreign key
    # Deleting the payment method won't affect existing payments or transactions
    # The payment record will still show which method was used historically
    
    db.session.delete(method)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Payment method deleted successfully.'})

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
    purchase_amount = data.get('purchase_amount', 0)
    
    code = DiscountCode.query.filter_by(code=code_str, is_active=True).first()
    if not code:
        return jsonify({'error': 'Invalid discount code', 'error_ar': 'رمز الخصم غير صالح'}), 404
    
    now = datetime.utcnow()
    if code.valid_from and now < code.valid_from:
        return jsonify({'error': 'Discount code not yet valid', 'error_ar': 'رمز الخصم غير صالح بعد'}), 400
    if code.valid_until and now > code.valid_until:
        return jsonify({'error': 'Discount code has expired', 'error_ar': 'انتهت صلاحية رمز الخصم'}), 400
    if code.max_uses and code.used_count >= code.max_uses:
        return jsonify({'error': 'Discount code has reached maximum uses', 'error_ar': 'وصل رمز الخصم إلى الحد الأقصى للاستخدام'}), 400
    if code.min_purchase_amount and purchase_amount < code.min_purchase_amount:
        return jsonify({
            'error': f'Minimum purchase amount is ${code.min_purchase_amount}',
            'error_ar': f'الحد الأدنى للشراء هو ${code.min_purchase_amount}'
        }), 400
    
    return jsonify(code.to_dict())

@entities_bp.route('/discount-codes/<id>/users', methods=['GET'])
@require_admin
def get_discount_code_users(user, id):
    code = DiscountCode.query.get(id)
    if not code:
        return jsonify({'error': 'Discount code not found'}), 404
    
    payments = Payment.query.filter_by(discount_code=code.code).order_by(Payment.created_at.desc()).all()
    
    users_data = []
    for payment in payments:
        payment_user = User.query.filter_by(email=payment.user_email).first()
        users_data.append({
            'payment_id': payment.id,
            'user_email': payment.user_email,
            'user_name': payment_user.full_name if payment_user else None,
            'amount': payment.amount_usd,
            'discount_amount': payment.discount_amount,
            'credits': payment.credits,
            'status': payment.status,
            'created_at': payment.created_at.isoformat() if payment.created_at else None
        })
    
    return jsonify(users_data)

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
    
    target_role_name = target_user.role.name if target_user.role else 'user'
    if target_role_name == 'super_admin':
        return jsonify({'error': 'Cannot modify super_admin users'}), 403
    
    data = request.get_json()
    
    new_role = None
    if 'role' in data:
        new_role = Role.query.filter_by(name=data['role']).first()
    if 'role_id' in data:
        new_role = Role.query.get(data['role_id'])
    
    if new_role:
        if new_role.name == 'super_admin':
            return jsonify({'error': 'Cannot assign super_admin role'}), 403
        target_user.role_id = new_role.id
    
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
