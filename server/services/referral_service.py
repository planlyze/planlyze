from datetime import datetime
from flask import current_app
from server.models import db, User, Referral, Transaction, Notification, Analysis
from server.services.settings_service import get_referral_bonus_credits
from server.services.email_service import send_referral_bonus_email_to_referrer
import os

APP_DOMAIN = os.environ.get('APP_DOMAIN', 'https://planlyze.com')

def check_and_award_referral_bonus(user_email: str, analysis_id: str = None, is_premium_completed: bool = False) -> dict:
    """
    Check if user was referred and award bonus to referrer on first premium report.
    This should be called after a user successfully generates their first premium report.
    
    Args:
        user_email: The email of the referred user
        analysis_id: Optional - the analysis ID that just completed (for logging)
        is_premium_completed: If True, skip the DB check - caller confirms this is a premium report completion
    
    Returns: {
        'awarded': bool,
        'referrer_email': str or None,
        'credits': int,
        'error': str or None
    }
    """
    try:
        referral = Referral.query.filter_by(
            referred_email=user_email,
            status='pending'
        ).first()
        
        if not referral:
            return {
                'awarded': False,
                'referrer_email': None,
                'credits': 0,
                'error': None
            }
        
        if not is_premium_completed:
            has_premium_report = Analysis.query.filter_by(
                user_email=user_email,
                report_type='premium',
                status='completed'
            ).first() is not None
            
            if not has_premium_report:
                return {
                    'awarded': False,
                    'referrer_email': referral.referrer_email,
                    'credits': 0,
                    'error': None
                }
        
        referrer = User.query.filter_by(email=referral.referrer_email).first()
        if not referrer:
            current_app.logger.warning(f"[Referral Bonus] Referrer not found: {referral.referrer_email}")
            return {
                'awarded': False,
                'referrer_email': referral.referrer_email,
                'credits': 0,
                'error': 'Referrer not found'
            }
        
        bonus_credits = get_referral_bonus_credits()
        
        referrer.credits = (referrer.credits or 0) + bonus_credits
        
        referral.status = 'rewarded'
        referral.rewarded_at = datetime.utcnow()
        
        referred_user = User.query.filter_by(email=user_email).first()
        referred_name = referred_user.full_name if referred_user else user_email
        referrer_lang = referrer.language or 'en'
        
        if referrer_lang == 'ar':
            notification_title = 'لقد حصلت على مكافأة إحالة!'
            notification_message = f'{referred_name} أنشأ أول تقرير متميز له. لقد حصلت على {bonus_credits} رصيد!'
            tx_description = f'مكافأة الإحالة: {user_email} أنشأ أول تقرير متميز'
        else:
            notification_title = 'You Earned a Referral Bonus!'
            notification_message = f'{referred_name} generated their first premium report. You earned {bonus_credits} credit(s)!'
            tx_description = f'Referral bonus: {user_email} generated first premium report'
        
        notification = Notification(
            user_email=referrer.email,
            type='referral_bonus',
            title=notification_title,
            message=notification_message,
            meta_data={
                'referred_email': user_email,
                'credits_earned': bonus_credits
            }
        )
        db.session.add(notification)
        
        transaction = Transaction(
            user_email=referrer.email,
            type='referral_bonus',
            credits=bonus_credits,
            amount_usd=0,
            description=tx_description,
            reference_id=referral.id,
            status='completed'
        )
        db.session.add(transaction)
        
        db.session.commit()
        
        try:            
            send_referral_bonus_email_to_referrer(
                referrer_email=referrer.email,
                referrer_name=referrer.full_name,
                referred_email=user_email,
                referral_code=referrer.referral_code,
                app_url=APP_DOMAIN,
                lang=referrer_lang
            )
        except Exception as email_error:
            current_app.logger.warning(f"[Referral Bonus] Email failed: {email_error}")
        
        current_app.logger.info(
            f"[Referral Bonus] Awarded {bonus_credits} credits to {referrer.email} "
            f"for referral of {user_email}"
        )
        
        return {
            'awarded': True,
            'referrer_email': referrer.email,
            'credits': bonus_credits,
            'error': None
        }
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"[Referral Bonus] Error: {e}")
        return {
            'awarded': False,
            'referrer_email': None,
            'credits': 0,
            'error': str(e)
        }
