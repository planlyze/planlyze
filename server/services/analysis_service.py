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


def validate_business_idea(business_idea: str, language: str = 'en', industry: str = None) -> dict:
    """
    Validate if the submitted text is a legitimate business idea and matches the selected industry.
    Returns: {'valid': bool, 'reason': str, 'confidence': float, 'industry_match': bool}
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
    
    def is_gibberish_text(text):
        """Detect gibberish using multiple heuristics."""
        text_lower = text.lower()
        
        letters_only = re.sub(r'[^a-zA-Z]', '', text_lower)
        if len(letters_only) >= 5:
            vowels = sum(1 for c in letters_only if c in 'aeiou')
            vowel_ratio = vowels / len(letters_only)
            if vowel_ratio < 0.1 or vowel_ratio > 0.8:
                return True
        
        keyboard_patterns = [
            r'([a-z])\1{3,}',
            r'qwerty|asdf|zxcv|qazwsx|poiuy|lkjh|mnbv',
            r'^[bcdfghjklmnpqrstvwxyz]{6,}$',
            r'^[aeiou]{5,}$',
        ]
        for pattern in keyboard_patterns:
            if re.search(pattern, letters_only):
                return True
        
        words_to_check = text_lower.split()
        common_words = {
            'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
            'should', 'may', 'might', 'must', 'can', 'and', 'or', 'but', 'if',
            'then', 'else', 'when', 'where', 'why', 'how', 'what', 'which', 'who',
            'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we',
            'they', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'for', 'to',
            'of', 'in', 'on', 'at', 'by', 'with', 'about', 'from', 'as', 'into',
            'app', 'application', 'service', 'platform', 'business', 'company',
            'product', 'online', 'mobile', 'web', 'software', 'shop', 'store',
            'delivery', 'food', 'restaurant', 'market', 'marketplace', 'ecommerce',
            'startup', 'tech', 'technology', 'ai', 'machine', 'learning', 'data',
            'cloud', 'saas', 'rental', 'booking', 'hotel', 'travel', 'health',
            'fitness', 'education', 'finance', 'payment', 'social', 'media',
            'coffee', 'cafe', 'consulting', 'agency', 'freelance', 'tutoring'
        }
        
        if len(words_to_check) >= 1:
            recognized_words = sum(1 for w in words_to_check if w in common_words or len(w) <= 2)
            if recognized_words == 0 and len(words_to_check) <= 3:
                long_words = [w for w in words_to_check if len(w) > 4]
                if long_words:
                    for word in long_words:
                        word_letters = re.sub(r'[^a-z]', '', word)
                        if len(word_letters) >= 5:
                            word_vowels = sum(1 for c in word_letters if c in 'aeiou')
                            word_vowel_ratio = word_vowels / len(word_letters)
                            if word_vowel_ratio < 0.15 or word_vowel_ratio > 0.75:
                                return True
        
        return False
    
    if is_gibberish_text(cleaned):
        return {
            'valid': False,
            'reason': 'This doesn\'t appear to be a valid business idea. Please describe a product or service.' if language == 'en'
                      else 'هذا لا يبدو أنه فكرة عمل صالحة. يرجى وصف منتج أو خدمة.',
            'confidence': 0.9
        }
    
    try:
        client = get_anthropic_client()
        
        industry_context = ""
        if industry:
            industry_context = f"""
Selected Industry: {industry}

INDUSTRY MATCHING VALIDATION:
Also determine if the business idea could reasonably fit within the "{industry}" industry category.
- "industry_match": true if the business idea is relevant to or could operate in this industry
- "industry_match": false if the business idea clearly belongs to a completely different industry
- If industry_match is false, provide a brief explanation in the reason field

Industry Categories Reference:
- Delivery: Courier services, package delivery, logistics
- BeautyEcommerce: Cosmetics, skincare, beauty products online sales
- ClothesEcommerce: Fashion, apparel, clothing online sales
- ElectronicsEcommerce: Gadgets, electronics, tech products online sales
- FoodEcommerce: Groceries, specialty foods, online food retail
- MedicineEcommerce: Pharmaceuticals, health products online
- StuffEcommerce: General merchandise, variety products
- SupermarketEcommerce: Online supermarket, grocery delivery
- GeneralHealth: Healthcare services, wellness, medical
- SellRentCars: Automotive sales, car rentals
- SellRentRealestate: Property sales, real estate rentals
- ServicesTaxi: Ride-hailing, taxi services, transportation
- JobOppurtunity: Job boards, recruitment, HR services
"""
        
        validation_prompt = f"""Analyze the following text and determine if it represents a legitimate business idea or concept that can be analyzed for a business report.

Text to analyze:
"{cleaned}"
{industry_context}

Respond with a JSON object containing:
- "valid": true if this is a legitimate business idea/concept, false if it's gibberish, random text, or not a business idea
- "reason": a brief explanation (in {'Arabic' if language == 'ar' else 'English'})
- "confidence": a number between 0 and 1 indicating your confidence
- "industry_match": true if the idea fits the selected industry, false otherwise (only include if an industry was provided)

IMPORTANT VALIDATION RULES:

REJECT (valid=false) these types of input:
- Random keyboard mashing: "asdfghjk", "qwerty", "zxcvbnm", "12345", etc.
- Nonsensical text: "aaa bbb ccc", "test test", "hello hello", etc.
- Random Arabic letters: "ااااا", "بببب", "ثثثث", "سيبسيب", etc.
- Gibberish words: made-up words that don't exist in any language
- Single letters or very short meaningless text
- Test messages: "test", "testing", "hello", "hi", just greetings
- Spam or promotional text without a business concept
- Random sentences that don't describe any product, service, or business
- Meaningless phrases: "I don't know", "nothing", "whatever", etc.

ACCEPT (valid=true) these types of input:
- Any product idea: "coffee shop", "mobile app", "restaurant"
- Service ideas: "delivery service", "consulting", "tutoring"
- Business concepts in any language (English, Arabic, French, etc.)
- Even brief ideas are valid if they describe a real product/service
- Technical startups, e-commerce, social platforms, etc.

The key test: Can this text be meaningfully analyzed as a business? If someone typed random letters or nonsense, reject it.

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
        
        industry_match = result.get('industry_match', True)
        current_app.logger.info(f"[Idea Validation] Result: valid={result.get('valid')}, confidence={result.get('confidence')}, industry_match={industry_match}")
        
        response = {
            'valid': result.get('valid', False),
            'reason': result.get('reason', ''),
            'confidence': result.get('confidence', 0.5),
            'industry_match': industry_match
        }
        
        if industry and not industry_match and result.get('valid', False):
            response['valid'] = False
            if language == 'ar':
                response['reason'] = f"فكرة العمل لا تتناسب مع المجال المحدد ({industry}). {result.get('reason', '')}"
            else:
                response['reason'] = f"The business idea doesn't match the selected industry ({industry}). {result.get('reason', '')}"
        
        return response
        
    except json.JSONDecodeError as e:
        current_app.logger.warning(f"[Idea Validation] Failed to parse AI response: {e}")
        return {
            'valid': True, 
            'reason': '',
            'confidence': 0.5,
            'industry_match': True
        }
        
    except Exception as e:
        current_app.logger.error(f"[Idea Validation] Error during validation: {e}")
        current_app.logger.error(traceback.format_exc())
        return {
            'valid': True, 
            'reason': '',
            'confidence': 0.5,
            'industry_match': True
        }


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
