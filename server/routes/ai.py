from flask import Blueprint, request, jsonify
from server.models import db, Analysis, Transaction, User, ChatConversation
from server.routes.auth import get_current_user
from server.services.settings_service import get_premium_report_cost
import anthropic
import os
import json
from datetime import datetime

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

# Use the latest supported Claude model
DEFAULT_MODEL = "claude-sonnet-4-5"

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
    premium_cost = get_premium_report_cost()
    
    if user.credits < premium_cost:
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
    
    user.credits -= premium_cost
    transaction = Transaction(
        user_email=user.email,
        type='usage',
        credits=-premium_cost,
        description=f'Premium Analysis: {analysis.business_idea[:50]}...',
        reference_id=analysis.id,
        status='completed'
    )
    db.session.add(transaction)
    db.session.commit()
    
    try:
        prompt = f"""You are an expert business and technology strategist specializing in helping tech entrepreneurs turn their ideas into successful startups. Analyze this business idea and provide a comprehensive strategic report.

Business Idea: {analysis.business_idea}
Industry: {analysis.industry or 'Not specified'}
Target Market: {analysis.target_market or 'Not specified'}
Location: {analysis.location or 'Not specified'}
Budget: {analysis.budget or 'Not specified'}

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
        "business_model": "Recommended business model (SaaS, marketplace, freemium, etc.)",
        "revenue_streams": ["Primary revenue stream", "Secondary revenue stream"],
        "pricing_strategy": "Recommended pricing approach with price points",
        "customer_acquisition": ["Channel 1", "Channel 2", "Channel 3"],
        "retention_strategy": "How to keep customers engaged and paying",
        "competitive_advantage": "Key differentiators from competitors",
        "partnerships": ["Strategic partnership opportunity 1", "Strategic partnership opportunity 2"]
    }},
    "technical_strategy": {{
        "recommended_tech_stack": {{
            "frontend": "Recommended frontend technologies",
            "backend": "Recommended backend technologies",
            "database": "Recommended database solutions",
            "cloud_infrastructure": "Recommended cloud platform and services",
            "third_party_integrations": ["Integration 1", "Integration 2"]
        }},
        "mvp_features": ["Core feature 1", "Core feature 2", "Core feature 3", "Core feature 4", "Core feature 5"],
        "architecture_recommendations": "High-level system architecture approach",
        "scalability_considerations": "How to build for scale from day one",
        "security_requirements": ["Security requirement 1", "Security requirement 2"],
        "development_approach": "Agile, lean startup, or other methodology recommendation"
    }},
    "development_roadmap": {{
        "phase_1_mvp": {{
            "duration": "Timeline (e.g., 2-3 months)",
            "goals": ["Goal 1", "Goal 2"],
            "deliverables": ["Deliverable 1", "Deliverable 2"]
        }},
        "phase_2_growth": {{
            "duration": "Timeline (e.g., 3-6 months)",
            "goals": ["Goal 1", "Goal 2"],
            "deliverables": ["Deliverable 1", "Deliverable 2"]
        }},
        "phase_3_scale": {{
            "duration": "Timeline (e.g., 6-12 months)",
            "goals": ["Goal 1", "Goal 2"],
            "deliverables": ["Deliverable 1", "Deliverable 2"]
        }}
    }},
    "financial_projections": {{
        "startup_costs": "Detailed breakdown of initial investment needed",
        "monthly_expenses": "Projected monthly burn rate",
        "revenue_potential": "Year 1, Year 2, Year 3 revenue projections",
        "break_even": "Estimated time to break even",
        "funding_recommendations": "Bootstrap, angel, VC, or other funding approach",
        "key_metrics": ["Metric 1 to track", "Metric 2 to track", "Metric 3 to track"]
    }},
    "risk_assessment": {{
        "high_risks": ["Critical risk 1", "Critical risk 2"],
        "medium_risks": ["Moderate risk 1", "Moderate risk 2"],
        "low_risks": ["Minor risk 1", "Minor risk 2"],
        "mitigation_strategies": ["Strategy 1", "Strategy 2", "Strategy 3"],
        "contingency_plans": ["Plan A", "Plan B"]
    }},
    "recommendations": {{
        "immediate_actions": ["Action to take this week 1", "Action to take this week 2"],
        "short_term": ["30-day priority 1", "30-day priority 2"],
        "long_term": ["6-month goal 1", "6-month goal 2"],
        "success_metrics": ["KPI 1", "KPI 2", "KPI 3"]
    }},
    "swot": {{
        "strengths": ["Strength 1", "Strength 2", "Strength 3"],
        "weaknesses": ["Weakness 1", "Weakness 2"],
        "opportunities": ["Opportunity 1", "Opportunity 2", "Opportunity 3"],
        "threats": ["Threat 1", "Threat 2"]
    }},
    "go_to_market": {{
        "launch_strategy": "Recommended approach for market entry",
        "marketing_channels": ["Channel 1", "Channel 2", "Channel 3"],
        "content_strategy": "Content marketing recommendations",
        "launch_timeline": "Recommended launch timeline",
        "early_adopter_strategy": "How to acquire first 100 customers"
    }}
}}

Be specific, actionable, and realistic. Tailor all recommendations to a tech entrepreneur building a technology product. Return ONLY the JSON object, no additional text."""

        response = client.messages.create(
            model=DEFAULT_MODEL,
            max_tokens=8192,
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
        
        db.session.commit()
        
        return jsonify(analysis.to_dict())
        
    except Exception as e:
        analysis.status = 'failed'
        analysis.last_error = str(e)
        db.session.commit()
        
        from server.services.admin_notification_service import notify_failed_analysis
        try:
            notify_failed_analysis(
                analysis.user_email,
                analysis.id,
                analysis.business_idea or 'Unknown',
                str(e)
            )
        except Exception as notify_error:
            print(f"Admin notification error: {notify_error}")
        
        return jsonify({'error': str(e)}), 500

@ai_bp.route('/fail-analysis', methods=['POST'])
@require_auth
def fail_analysis(user):
    """
    Mark analysis as failed
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
    
    if analysis_id:
        analysis = Analysis.query.get(analysis_id)
        if analysis:
            if analysis.user_email != user.email:
                return jsonify({'error': 'Access denied'}), 403
            analysis.status = 'failed'
            analysis.last_error = error_msg
            
            from server.services.admin_notification_service import notify_failed_analysis
            try:
                notify_failed_analysis(
                    analysis.user_email,
                    analysis.id,
                    analysis.business_idea or 'Unknown',
                    error_msg
                )
            except Exception as notify_error:
                print(f"Admin notification error: {notify_error}")
    
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
            content = msg.get('content', '')
            if isinstance(content, list):
                content = content[0].get('text', '') if content and isinstance(content[0], dict) else str(content)
            elif not isinstance(content, str):
                content = str(content) if content else ''
            messages.append({
                "role": msg.get('role', 'user'),
                "content": content
            })
    
    user_message = message if isinstance(message, str) else str(message) if message else ''
    messages.append({"role": "user", "content": user_message})
    
    try:
        system_prompt = f"""You are a helpful business advisor AI assistant. You help users understand their business analysis reports, answer questions about business strategies, and provide guidance.

{context}

Be concise but helpful. If the user asks about their specific analysis, reference the data provided."""

        response = client.messages.create(
            model=DEFAULT_MODEL,
            max_tokens=2048,
            system=[{"type": "text", "text": system_prompt}],
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
            system=[{"type": "text", "text": system}] if system else None,
            messages=[{"role": "user", "content": prompt}]
        )
        
        return jsonify({
            'response': response.content[0].text
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


TAB_PROMPTS = {
    'overview': """Generate a brief Overview analysis for this business idea. Focus only on:
1. Market fit score (0-100%)
2. Time to build (in months)
3. Number of competitors in the market
4. Starting cost estimate (USD)
5. Value proposition (2-3 lines of concise text describing the core value)

Respond in JSON format:
{{
    "market_fit_score": 75,
    "time_to_build_months": 6,
    "competitors_count": 5,
    "starting_cost_usd": 10000,
    "value_proposition": "A concise 2-3 line description of the core value this business provides to customers and what makes it unique in the market."
}}""",

    'market': """Generate a comprehensive Market & Competition analysis for this business idea. Focus on:

1. Target Audiences (identify 4 distinct customer segments)
2. Key Problems (2-4 main problems, each with 4 detailed sub-points)
3. Solution Overview
4. Syrian Market Opportunity (market size, growth potential, unique factors)
5. Syrian Competitors Analysis (local competitors with name, website, pros, cons)
6. SWOT Analysis for this idea

Respond in JSON format:
{{
    "target_audiences": [
        {{"segment": "Audience 1 name", "description": "...", "size_estimate": "...", "needs": ["..."], "behavior": "..."}},
        {{"segment": "Audience 2 name", "description": "...", "size_estimate": "...", "needs": ["..."], "behavior": "..."}},
        {{"segment": "Audience 3 name", "description": "...", "size_estimate": "...", "needs": ["..."], "behavior": "..."}},
        {{"segment": "Audience 4 name", "description": "...", "size_estimate": "...", "needs": ["..."], "behavior": "..."}}
    ],
    "problems": [
        {{
            "title": "Problem 1 title",
            "description": "...",
            "details": ["detail 1", "detail 2", "detail 3", "detail 4"]
        }},
        {{
            "title": "Problem 2 title", 
            "description": "...",
            "details": ["detail 1", "detail 2", "detail 3", "detail 4"]
        }}
    ],
    "solution": {{
        "overview": "...",
        "key_features": ["..."],
        "unique_value": "...",
        "how_it_solves": "..."
    }},
    "syrian_market": {{
        "opportunity": "...",
        "market_size_usd": 1000000,
        "growth_rate_percent": 15,
        "unique_factors": ["..."],
        "challenges": ["..."],
        "regulations": "..."
    }},
    "syrian_competitors": [
        {{"name": "Competitor 1", "website": "https://...", "pros": ["..."], "cons": ["..."]}},
        {{"name": "Competitor 2", "website": "https://...", "pros": ["..."], "cons": ["..."]}},
        {{"name": "Competitor 3", "website": "https://...", "pros": ["..."], "cons": ["..."]}}
    ],
    "swot": {{
        "strengths": ["strength 1", "strength 2", "strength 3"],
        "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
        "opportunities": ["opportunity 1", "opportunity 2", "opportunity 3"],
        "threats": ["threat 1", "threat 2", "threat 3"]
    }}
}}""",

    'business': """Generate a Go-to-Market Strategy analysis for this business idea. Focus on:

1. Go-to-Market Strategy:
   - Validation steps (how to validate the idea before full launch)
   - Marketing strategy (overall approach to reaching customers)

2. Distribution Channels:
   - List key distribution channels with name and details

3. Marketing Ideas and Partnerships:
   - Creative marketing ideas
   - Potential partnership opportunities

4. KPIs:
   - Key Performance Indicators to track success

Respond in JSON format:
{{
    "go_to_market_strategy": {{
        "validation_steps": [
            {{"step": "...", "description": "...", "timeline": "..."}}
        ],
        "marketing_strategy": {{
            "overview": "...",
            "key_messages": ["..."],
            "target_approach": "..."
        }}
    }},
    "distribution_channels": [
        {{"channel_name": "...", "details": "...", "priority": "high|medium|low"}}
    ],
    "marketing_ideas_and_partnerships": {{
        "marketing_ideas": [
            {{"idea": "...", "description": "...", "estimated_cost": "..."}}
        ],
        "partnerships": [
            {{"partner_type": "...", "potential_partners": ["..."], "value_proposition": "..."}}
        ]
    }},
    "kpis": [
        {{"metric": "...", "target": "...", "measurement_frequency": "..."}}
    ]
}}""",

    'technical': """Generate a Technical Implementation analysis for this business idea. Focus on:

1. Technical Stack:
   - Recommended technologies with pros and cons
   - Estimated time to implement
   - Programming languages needed
   - Technical implementation details
   - Team requirements and estimated costs

2. Development Plan:
   - Version/phase name
   - List of features for each version
   - How to build each feature
   - Prototype approach

3. MVP:
   - Core MVP features
   - MVP scope and timeline

4. AI Tools:
   - AI tools that can accelerate development
   - How each tool helps

Respond in JSON format:
{{
    "technical_stack": {{
        "recommended_stack": [
            {{
                "category": "Frontend|Backend|Database|Infrastructure",
                "technology": "...",
                "pros": ["..."],
                "cons": ["..."]
            }}
        ],
        "estimated_time": "...",
        "languages": ["..."],
        "implementation_details": "...",
        "team_requirements": [
            {{"role": "...", "count": 1, "monthly_cost_usd": 3000}}
        ],
        "total_team_cost_monthly": 10000
    }},
    "development_plan": [
        {{
            "version": "v1.0 - Prototype",
            "features": [
                {{"feature": "...", "how_to_build": "..."}}
            ],
            "prototype_approach": "..."
        }},
        {{
            "version": "v2.0 - MVP",
            "features": [
                {{"feature": "...", "how_to_build": "..."}}
            ],
            "prototype_approach": "..."
        }}
    ],
    "mvp": {{
        "core_features": ["..."],
        "scope": "...",
        "timeline": "..."
    }},
    "ai_tools": [
        {{"name": "...", "purpose": "...", "how_it_helps": "..."}}
    ]
}}""",

    'financial': """Generate a Financial & Revenue analysis for this business idea. Focus on:

1. Revenue Streams:
   - Different ways to generate revenue
   - Description and potential of each stream

2. Pricing Strategy:
   - Pricing model and approach
   - Price points and tiers
   - Justification for pricing

3. Funding Opportunities:
   - Types of funding available
   - Potential investors or funding sources
   - Amount and terms

Respond in JSON format:
{{
    "revenue_streams": [
        {{
            "name": "...",
            "type": "subscription|transaction|advertising|licensing|freemium|etc",
            "description": "...",
            "potential": "high|medium|low",
            "estimated_monthly_revenue": "..."
        }}
    ],
    "pricing_strategy": {{
        "model": "...",
        "approach": "...",
        "tiers": [
            {{"name": "...", "price": "...", "features": ["..."]}}
        ],
        "justification": "..."
    }},
    "funding_opportunities": [
        {{
            "type": "...",
            "source": "...",
            "amount_range": "...",
            "terms": "...",
            "suitability": "..."
        }}
    ]
}}""",

    'strategy': """Generate a Strategy & Action Plan for this business idea. Focus on:

1. Risk Assessment & Mitigation:
   - Identify key risks
   - Severity level for each risk
   - Mitigation strategies

2. Action Plan:
   - Numbered steps to launch and grow the business
   - Clear, actionable items with descriptions

Respond in JSON format:
{{
    "risk_assessment": [
        {{
            "risk": "...",
            "severity": "high|medium|low",
            "impact": "...",
            "mitigation": "..."
        }}
    ],
    "action_plan": [
        {{
            "step_number": 1,
            "title": "...",
            "description": "...",
            "timeline": "...",
            "priority": "high|medium|low"
        }},
        {{
            "step_number": 2,
            "title": "...",
            "description": "...",
            "timeline": "...",
            "priority": "high|medium|low"
        }}
    ]
}}"""
}


PROCESSING_TIMEOUT_SECONDS = 300  # 5 minutes

@ai_bp.route('/generate-tab-content', methods=['POST'])
@require_auth
def generate_tab_content(user):
    """
    Generate AI content for a specific analysis tab
    """
    client = get_anthropic_client()
    if not client:
        return jsonify({'error': 'AI service not configured'}), 500
    
    data = request.get_json()
    analysis_id = data.get('analysis_id')
    tab_name = data.get('tab_name')
    language = data.get('language', 'en')
    force_regenerate = data.get('force', False)
    
    if not analysis_id or not tab_name:
        return jsonify({'error': 'analysis_id and tab_name are required'}), 400
    
    if tab_name not in TAB_PROMPTS:
        return jsonify({'error': f'Invalid tab_name: {tab_name}'}), 400
    
    analysis = Analysis.query.get(analysis_id)
    if not analysis:
        return jsonify({'error': 'Analysis not found'}), 404
    if analysis.user_email != user.email:
        return jsonify({'error': 'Access denied'}), 403
    
    tab_field = f'tab_{tab_name}'
    existing_data = getattr(analysis, tab_field, None)
    
    # Check if tab has cached data (unless force regenerate)
    if existing_data and not force_regenerate:
        return jsonify({'data': existing_data, 'cached': True})
    
    # Check if tab is currently being processed
    processing_started = analysis.tab_processing_started or {}
    if tab_name in processing_started and not force_regenerate:
        started_at = processing_started.get(tab_name)
        if started_at:
            try:
                started_time = datetime.fromisoformat(started_at)
                elapsed_seconds = (datetime.utcnow() - started_time).total_seconds()
                
                if elapsed_seconds < PROCESSING_TIMEOUT_SECONDS:
                    # Still processing within timeout
                    return jsonify({
                        'status': 'processing',
                        'started_at': started_at,
                        'elapsed_seconds': int(elapsed_seconds),
                        'timeout_seconds': PROCESSING_TIMEOUT_SECONDS
                    })
                else:
                    # Processing timed out - allow retry
                    pass
            except (ValueError, TypeError):
                pass
    
    try:
        # Mark tab as processing
        if not analysis.tab_processing_started:
            analysis.tab_processing_started = {}
        processing_data = dict(analysis.tab_processing_started or {})
        processing_data[tab_name] = datetime.utcnow().isoformat()
        analysis.tab_processing_started = processing_data
        db.session.commit()
        
        language_instruction = "Respond in Arabic language." if language == 'ar' else "Respond in English."
        
        prompt = f"""You are an expert business and technology strategist specializing in helping tech entrepreneurs turn their ideas into successful startups.

Business Idea: {analysis.business_idea}
Industry: {analysis.industry or 'Not specified'}
Target Market: {analysis.target_market or 'Not specified'}
Location: {analysis.location or 'Not specified'}
Budget: {analysis.budget or 'Not specified'}

{language_instruction}

{TAB_PROMPTS[tab_name]}"""

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
            
            tab_data = json.loads(response_text.strip())
        except json.JSONDecodeError:
            tab_data = {"raw_response": response_text}
        
        # Save tab data and clear processing flag
        setattr(analysis, tab_field, tab_data)
        processing_data = dict(analysis.tab_processing_started or {})
        if tab_name in processing_data:
            del processing_data[tab_name]
        analysis.tab_processing_started = processing_data
        db.session.commit()
        
        return jsonify({'data': tab_data, 'cached': False})
        
    except Exception as e:
        # Clear processing flag on error
        try:
            processing_data = dict(analysis.tab_processing_started or {})
            if tab_name in processing_data:
                del processing_data[tab_name]
            analysis.tab_processing_started = processing_data
            db.session.commit()
        except:
            pass
        return jsonify({'error': str(e)}), 500


@ai_bp.route('/check-tab-status', methods=['POST'])
@require_auth
def check_tab_status(user):
    """
    Check the processing status of a specific tab
    """
    data = request.get_json()
    analysis_id = data.get('analysis_id')
    tab_name = data.get('tab_name')
    
    if not analysis_id or not tab_name:
        return jsonify({'error': 'analysis_id and tab_name are required'}), 400
    
    analysis = Analysis.query.get(analysis_id)
    if not analysis:
        return jsonify({'error': 'Analysis not found'}), 404
    if analysis.user_email != user.email:
        return jsonify({'error': 'Access denied'}), 403
    
    tab_field = f'tab_{tab_name}'
    existing_data = getattr(analysis, tab_field, None)
    
    if existing_data:
        return jsonify({
            'status': 'completed',
            'data': existing_data,
            'cached': True
        })
    
    processing_started = analysis.tab_processing_started or {}
    if tab_name in processing_started:
        started_at = processing_started.get(tab_name)
        if started_at:
            try:
                started_time = datetime.fromisoformat(started_at)
                elapsed_seconds = (datetime.utcnow() - started_time).total_seconds()
                
                if elapsed_seconds >= PROCESSING_TIMEOUT_SECONDS:
                    return jsonify({
                        'status': 'stuck',
                        'started_at': started_at,
                        'elapsed_seconds': int(elapsed_seconds),
                        'timeout_seconds': PROCESSING_TIMEOUT_SECONDS,
                        'can_retry': True
                    })
                else:
                    return jsonify({
                        'status': 'processing',
                        'started_at': started_at,
                        'elapsed_seconds': int(elapsed_seconds),
                        'timeout_seconds': PROCESSING_TIMEOUT_SECONDS
                    })
            except (ValueError, TypeError):
                pass
    
    return jsonify({
        'status': 'pending',
        'can_generate': True
    })
