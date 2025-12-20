import json
import re
import traceback
from datetime import datetime
from anthropic import Anthropic
from server.models import db, User, Analysis, Transaction
from flask import current_app


def get_anthropic_client():
    """Get the Anthropic client using Replit AI Integrations."""
    return Anthropic()


def validate_business_idea(business_idea: str, language: str = 'en') -> dict:
    """
    Validate if the submitted text is a legitimate business idea.
    Returns: {'valid': bool, 'reason': str, 'confidence': float}
    """
    if not business_idea or not isinstance(business_idea, str):
        return {
            'valid': False,
            'reason': 'No business idea provided' if language == 'en' else 'لم يتم تقديم فكرة عمل',
            'confidence': 1.0
        }
    
    cleaned = business_idea.strip()
    
    if len(cleaned) < 10:
        return {
            'valid': False,
            'reason': 'Business idea is too short. Please provide more details.' if language == 'en' 
                      else 'فكرة العمل قصيرة جداً. يرجى تقديم المزيد من التفاصيل.',
            'confidence': 1.0
        }
    
    if len(cleaned) > 10000:
        return {
            'valid': False,
            'reason': 'Business idea is too long. Please keep it under 10,000 characters.' if language == 'en'
                      else 'فكرة العمل طويلة جداً. يرجى الاحتفاظ بها أقل من 10,000 حرف.',
            'confidence': 1.0
        }
    
    words = cleaned.split()
    if len(words) < 3:
        return {
            'valid': False,
            'reason': 'Please provide a more detailed business idea with at least a few words.' if language == 'en'
                      else 'يرجى تقديم فكرة عمل أكثر تفصيلاً.',
            'confidence': 1.0
        }
    
    if len(set(words)) < len(words) * 0.3 and len(words) > 5:
        return {
            'valid': False,
            'reason': 'The text appears to be repetitive. Please provide a real business idea.' if language == 'en'
                      else 'يبدو أن النص متكرر. يرجى تقديم فكرة عمل حقيقية.',
            'confidence': 0.9
        }
    
    gibberish_pattern = r'^[^a-zA-Z\u0600-\u06FF]+$'
    if re.match(gibberish_pattern, cleaned):
        return {
            'valid': False,
            'reason': 'Please provide a valid business idea in text format.' if language == 'en'
                      else 'يرجى تقديم فكرة عمل صالحة بصيغة نصية.',
            'confidence': 0.95
        }
    
    try:
        client = get_anthropic_client()
        
        validation_prompt = f"""Analyze the following text and determine if it represents a legitimate business idea or concept that can be analyzed for a business report.

Text to analyze:
"{cleaned}"

Respond with a JSON object containing:
- "valid": true if this is a legitimate business idea/concept, false if it's gibberish, random text, or not a business idea
- "reason": a brief explanation (in {'Arabic' if language == 'ar' else 'English'})
- "confidence": a number between 0 and 1 indicating your confidence

IMPORTANT:
- Be lenient - if someone mentions a product, service, or business concept, consider it valid
- Accept ideas in any language (English, Arabic, etc.)
- Reject: random characters, nonsensical text, spam, test messages, greetings without business content
- Accept: even brief ideas like "coffee shop" or "delivery app" are valid

Respond ONLY with the JSON object, no other text."""

        current_app.logger.info(f"[Idea Validation] Validating business idea: {cleaned[:100]}...")
        
        response = client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=200,
            messages=[{"role": "user", "content": validation_prompt}]
        )
        
        response_text = response.content[0].text.strip()
        
        if response_text.startswith('```'):
            response_text = re.sub(r'^```json?\n?', '', response_text)
            response_text = re.sub(r'\n?```$', '', response_text)
        
        result = json.loads(response_text)
        
        current_app.logger.info(f"[Idea Validation] Result: valid={result.get('valid')}, confidence={result.get('confidence')}")
        
        return {
            'valid': result.get('valid', True),
            'reason': result.get('reason', ''),
            'confidence': result.get('confidence', 0.5)
        }
        
    except json.JSONDecodeError as e:
        current_app.logger.warning(f"[Idea Validation] Failed to parse AI response: {e}")
        return {'valid': True, 'reason': '', 'confidence': 0.5}
        
    except Exception as e:
        current_app.logger.error(f"[Idea Validation] Error during validation: {e}")
        current_app.logger.error(traceback.format_exc())
        return {'valid': True, 'reason': '', 'confidence': 0.5}


def reserve_premium_credit(user_email: str, analysis_id: str) -> dict:
    """
    Reserve a credit for premium report generation.
    Deducts credit upfront and creates a pending transaction.
    
    Returns: {
        'success': bool,
        'report_type': 'premium' or 'free',
        'transaction_id': str or None,
        'error': str or None
    }
    """
    try:
        user = User.query.filter_by(email=user_email).with_for_update().first()
        
        if not user:
            return {
                'success': False,
                'report_type': 'free',
                'transaction_id': None,
                'error': 'User not found'
            }
        
        if user.credits >= 1:
            user.credits -= 1
            
            transaction = Transaction(
                user_email=user_email,
                type='analysis',
                credits=-1,
                description=f'Premium analysis report (pending)',
                reference_id=analysis_id,
                status='pending'
            )
            db.session.add(transaction)
            db.session.flush()
            
            analysis = Analysis.query.get(analysis_id)
            if analysis:
                analysis.report_type = 'premium'
                analysis.pending_transaction_id = transaction.id
            
            db.session.commit()
            
            current_app.logger.info(f"[Credit Reserve] Reserved 1 credit for user {user_email}, transaction {transaction.id}")
            
            return {
                'success': True,
                'report_type': 'premium',
                'transaction_id': transaction.id,
                'error': None
            }
        else:
            analysis = Analysis.query.get(analysis_id)
            if analysis:
                analysis.report_type = 'free'
            db.session.commit()
            
            current_app.logger.info(f"[Credit Reserve] No credits available for user {user_email}, using free report")
            
            return {
                'success': True,
                'report_type': 'free',
                'transaction_id': None,
                'error': None
            }
            
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"[Credit Reserve] Error: {e}")
        current_app.logger.error(traceback.format_exc())
        return {
            'success': False,
            'report_type': 'free',
            'transaction_id': None,
            'error': str(e)
        }


def finalize_transaction(analysis_id: str, success: bool, error_message: str = None) -> dict:
    """
    Finalize a transaction after analysis completion.
    On success: mark transaction as completed
    On failure: refund credit and mark transaction as refunded
    
    Returns: {'success': bool, 'refunded': bool, 'error': str or None}
    """
    try:
        analysis = Analysis.query.get(analysis_id)
        
        if not analysis:
            return {'success': False, 'refunded': False, 'error': 'Analysis not found'}
        
        if not analysis.pending_transaction_id:
            if analysis.report_type == 'free':
                return {'success': True, 'refunded': False, 'error': None}
            return {'success': True, 'refunded': False, 'error': None}
        
        transaction = Transaction.query.get(analysis.pending_transaction_id)
        
        if not transaction:
            current_app.logger.warning(f"[Transaction Finalize] Transaction {analysis.pending_transaction_id} not found")
            return {'success': False, 'refunded': False, 'error': 'Transaction not found'}
        
        if transaction.status != 'pending':
            current_app.logger.info(f"[Transaction Finalize] Transaction {transaction.id} already finalized: {transaction.status}")
            return {'success': True, 'refunded': transaction.status == 'refunded', 'error': None}
        
        if success:
            transaction.status = 'completed'
            transaction.description = f'Premium analysis report (completed)'
            
            analysis.pending_transaction_id = None
            
            db.session.commit()
            
            current_app.logger.info(f"[Transaction Finalize] Transaction {transaction.id} completed for analysis {analysis_id}")
            
            return {'success': True, 'refunded': False, 'error': None}
        else:
            user = User.query.filter_by(email=analysis.user_email).with_for_update().first()
            
            if user:
                user.credits += 1
                current_app.logger.info(f"[Transaction Finalize] Refunded 1 credit to user {user.email}")
            
            transaction.status = 'refunded'
            transaction.description = f'Premium analysis report (refunded - failed: {error_message or "Unknown error"})'
            
            analysis.pending_transaction_id = None
            analysis.last_error = error_message
            
            db.session.commit()
            
            current_app.logger.info(f"[Transaction Finalize] Transaction {transaction.id} refunded for analysis {analysis_id}")
            
            return {'success': True, 'refunded': True, 'error': None}
            
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"[Transaction Finalize] Error: {e}")
        current_app.logger.error(traceback.format_exc())
        return {'success': False, 'refunded': False, 'error': str(e)}


def get_report_type_for_user(user_email: str) -> str:
    """
    Determine which report type a user should receive based on their credits.
    Returns: 'premium' if user has credits, 'free' otherwise
    """
    user = User.query.filter_by(email=user_email).first()
    if user and user.credits >= 1:
        return 'premium'
    return 'free'
