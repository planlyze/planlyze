from flask import Blueprint, request, jsonify
from server.models import db, Analysis, Transaction, User, ChatConversation
from server.routes.auth import get_current_user
import anthropic
import os
import json

ai_bp = Blueprint('ai', __name__)

def get_anthropic_client():
    api_key = os.environ.get('AI_INTEGRATIONS_ANTHROPIC_API_KEY') or os.environ.get('ANTHROPIC_API_KEY')
    base_url = os.environ.get('AI_INTEGRATIONS_ANTHROPIC_BASE_URL')
    if not api_key:
        return None
    if base_url:
        return anthropic.Anthropic(api_key=api_key, base_url=base_url)
    return anthropic.Anthropic(api_key=api_key)

def require_auth(f):
    def wrapper(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Not authenticated'}), 401
        return f(user, *args, **kwargs)
    wrapper.__name__ = f.__name__
    return wrapper

# claude-sonnet-4-20250514 is the latest model
DEFAULT_MODEL = "claude-sonnet-4-20250514"

@ai_bp.route('/generate-analysis', methods=['POST'])
@require_auth
def generate_analysis(user):
    """
    Generate AI analysis for a business idea
    ---
    tags:
      - AI Analysis
    security:
      - Bearer: []
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            analysis_id:
              type: string
              description: ID of the analysis to generate report for
          required:
            - analysis_id
    responses:
      200:
        description: Analysis generated successfully
      402:
        description: Insufficient credits
      403:
        description: Access denied
      404:
        description: Analysis not found
      500:
        description: AI service not configured
    """
    if user.credits < 1:
        return jsonify({'error': 'Insufficient credits'}), 402
    
    client = get_anthropic_client()
    if not client:
        return jsonify({'error': 'AI service not configured'}), 500
    
    data = request.get_json()
    analysis_id = data.get('analysis_id')
    
    analysis = Analysis.query.get(analysis_id)
    if not analysis:
        return jsonify({'error': 'Analysis not found'}), 404
    if analysis.user_email != user.email:
        return jsonify({'error': 'Access denied'}), 403
    
    analysis.status = 'processing'
    
    pending_transaction = Transaction(
        user_email=user.email,
        type='usage',
        credits=-1,
        description=f'Analysis: {analysis.business_idea[:50]}...',
        reference_id=analysis.id,
        status='pending'
    )
    db.session.add(pending_transaction)
    db.session.commit()
    
    try:
        prompt = f"""You are a business analyst. Analyze this business idea and provide a comprehensive report.

Business Idea: {analysis.business_idea}
Industry: {analysis.industry or 'Not specified'}
Target Market: {analysis.target_market or 'Not specified'}
Location: {analysis.location or 'Not specified'}
Budget: {analysis.budget or 'Not specified'}

Provide a detailed analysis in JSON format with the following structure:
{{
    "executive_summary": "A brief overview of the business idea and its potential",
    "score": 75,  // Overall viability score from 0-100
    "market_analysis": {{
        "market_size": "Description of market size",
        "growth_potential": "Growth potential assessment",
        "competition": "Competitive landscape",
        "trends": ["trend1", "trend2"]
    }},
    "financial_projections": {{
        "startup_costs": "Estimated startup costs",
        "monthly_expenses": "Estimated monthly expenses",
        "revenue_potential": "Revenue potential",
        "break_even": "Break-even timeline"
    }},
    "risk_assessment": {{
        "high_risks": ["risk1", "risk2"],
        "medium_risks": ["risk1", "risk2"],
        "low_risks": ["risk1", "risk2"],
        "mitigation_strategies": ["strategy1", "strategy2"]
    }},
    "recommendations": {{
        "immediate_actions": ["action1", "action2"],
        "short_term": ["action1", "action2"],
        "long_term": ["action1", "action2"]
    }},
    "swot": {{
        "strengths": ["strength1", "strength2"],
        "weaknesses": ["weakness1", "weakness2"],
        "opportunities": ["opportunity1", "opportunity2"],
        "threats": ["threat1", "threat2"]
    }}
}}

Return ONLY the JSON object, no additional text."""

        response = client.messages.create(
            model=DEFAULT_MODEL,
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}]
        )
        
        response_text = response.content[0].text
        
        try:
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0]
            
            report = json.loads(response_text.strip())
        except json.JSONDecodeError:
            report = {"raw_response": response_text}
        
        analysis.status = 'completed'
        analysis.report = report
        analysis.executive_summary = report.get('executive_summary', '')
        analysis.market_analysis = report.get('market_analysis')
        analysis.financial_projections = report.get('financial_projections')
        analysis.risk_assessment = report.get('risk_assessment')
        analysis.recommendations = report.get('recommendations')
        analysis.score = report.get('score', 0)
        
        user.credits -= 1
        pending_transaction.status = 'completed'
        db.session.commit()
        
        return jsonify(analysis.to_dict())
        
    except Exception as e:
        analysis.status = 'failed'
        analysis.last_error = str(e)
        db.session.delete(pending_transaction)
        db.session.commit()
        return jsonify({'error': str(e)}), 500

@ai_bp.route('/fail-analysis', methods=['POST'])
@require_auth
def fail_analysis(user):
    """
    Mark analysis as failed and cleanup pending transactions
    ---
    tags:
      - AI Analysis
    security:
      - Bearer: []
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            analysis_id:
              type: string
              description: ID of the failed analysis
            error:
              type: string
              description: Error message to store
            transaction_id:
              type: string
              description: ID of the pending transaction to remove
    responses:
      200:
        description: Cleanup completed
      404:
        description: Analysis not found
      403:
        description: Access denied
    """
    data = request.get_json()
    analysis_id = data.get('analysis_id')
    error_msg = data.get('error', 'Analysis failed')
    transaction_id = data.get('transaction_id')
    
    if analysis_id:
        analysis = Analysis.query.get(analysis_id)
        if analysis:
            if analysis.user_email != user.email:
                return jsonify({'error': 'Access denied'}), 403
            analysis.status = 'failed'
            analysis.last_error = error_msg
    
    if transaction_id:
        transaction = Transaction.query.get(transaction_id)
        if transaction and transaction.user_email == user.email and transaction.status == 'pending':
            db.session.delete(transaction)
    
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Cleanup completed'})

@ai_bp.route('/chat', methods=['POST'])
@require_auth
def chat(user):
    """
    Chat with AI assistant about business analysis
    ---
    tags:
      - AI Chat
    security:
      - Bearer: []
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            message:
              type: string
              description: User message
            conversation_id:
              type: string
              description: Existing conversation ID (optional)
            analysis_id:
              type: string
              description: Analysis ID for context (optional)
          required:
            - message
    responses:
      200:
        description: Chat response received
        schema:
          type: object
          properties:
            message:
              type: string
            conversation_id:
              type: string
      403:
        description: Access denied
      500:
        description: AI service not configured
    """
    client = get_anthropic_client()
    if not client:
        return jsonify({'error': 'AI service not configured'}), 500
    
    data = request.get_json()
    message = data.get('message')
    conversation_id = data.get('conversation_id')
    analysis_id = data.get('analysis_id')
    
    conversation = None
    context = ""
    
    if conversation_id:
        conversation = ChatConversation.query.get(conversation_id)
        if conversation and conversation.user_email != user.email:
            return jsonify({'error': 'Access denied'}), 403
    
    if analysis_id:
        analysis = Analysis.query.get(analysis_id)
        if analysis and analysis.user_email == user.email:
            context = f"""Context: The user is asking about their business analysis.
Business Idea: {analysis.business_idea}
Analysis Report: {json.dumps(analysis.report) if analysis.report else 'Not available yet'}
"""
    
    messages = []
    if conversation and conversation.messages:
        for msg in conversation.messages[-10:]:
            messages.append({
                "role": msg.get('role', 'user'),
                "content": msg.get('content', '')
            })
    
    messages.append({"role": "user", "content": message})
    
    try:
        system_prompt = f"""You are a helpful business advisor AI assistant. You help users understand their business analysis reports, answer questions about business strategies, and provide guidance.

{context}

Be concise but helpful. If the user asks about their specific analysis, reference the data provided."""

        response = client.messages.create(
            model=DEFAULT_MODEL,
            max_tokens=2048,
            system=system_prompt,
            messages=messages
        )
        
        assistant_message = response.content[0].text
        
        if not conversation:
            conversation = ChatConversation(
                user_email=user.email,
                analysis_id=analysis_id,
                title=message[:50] + ('...' if len(message) > 50 else ''),
                messages=[]
            )
            db.session.add(conversation)
        
        conversation.messages = conversation.messages or []
        conversation.messages.append({'role': 'user', 'content': message})
        conversation.messages.append({'role': 'assistant', 'content': assistant_message})
        
        db.session.commit()
        
        return jsonify({
            'message': assistant_message,
            'conversation_id': conversation.id
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ai_bp.route('/invoke-llm', methods=['POST'])
@require_auth
def invoke_llm(user):
    """
    Invoke Claude AI model directly with custom prompt
    ---
    tags:
      - AI Chat
    security:
      - Bearer: []
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            prompt:
              type: string
              description: The prompt to send to Claude
            system:
              type: string
              description: Optional system message
            max_tokens:
              type: integer
              default: 2048
              description: Maximum tokens in response
          required:
            - prompt
    responses:
      200:
        description: LLM response
        schema:
          type: object
          properties:
            response:
              type: string
      400:
        description: Prompt is required
      500:
        description: AI service not configured
    """
    client = get_anthropic_client()
    if not client:
        return jsonify({'error': 'AI service not configured'}), 500
    
    data = request.get_json()
    prompt = data.get('prompt')
    system = data.get('system', '')
    max_tokens = data.get('max_tokens', 2048)
    
    if not prompt:
        return jsonify({'error': 'Prompt is required'}), 400
    
    try:
        response = client.messages.create(
            model=DEFAULT_MODEL,
            max_tokens=max_tokens,
            system=system if system else None,
            messages=[{"role": "user", "content": prompt}]
        )
        
        return jsonify({
            'response': response.content[0].text
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
