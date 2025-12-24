import os
from datetime import datetime
from server.models import db, Notification, User
from server.services.email_service import send_email

ADMIN_EMAIL = "info@planlyze.com"
ADMIN_NAME = "Planlyze Admin"

NOTIFICATION_TYPES = {
    'contact_message': {
        'title_en': 'New Contact Message',
        'title_ar': 'رسالة تواصل جديدة',
        'icon': '📧'
    },
    'failed_analysis': {
        'title_en': 'Analysis Failed',
        'title_ar': 'فشل التحليل',
        'icon': '❌'
    },
    'new_payment': {
        'title_en': 'New Payment Request',
        'title_ar': 'طلب دفع جديد',
        'icon': '💳'
    },
    'server_error': {
        'title_en': 'Server Error (500)',
        'title_ar': 'خطأ في الخادم (500)',
        'icon': '🚨'
    },
    'new_rating': {
        'title_en': 'New Report Rating',
        'title_ar': 'تقييم تقرير جديد',
        'icon': '⭐'
    }
}


def get_admin_emails():
    """Get all admin and super_admin user emails"""
    admins = User.query.filter(
        User.role.in_(['admin', 'super_admin']),
        User.is_verified == True
    ).all()
    return [admin.email for admin in admins]


def create_admin_notification(notification_type, message, meta_data=None):
    """
    Create notifications for all admin users in the database
    
    Args:
        notification_type: One of the NOTIFICATION_TYPES keys
        message: The notification message
        meta_data: Optional metadata dict
    """
    try:
        type_config = NOTIFICATION_TYPES.get(notification_type, {})
        title = type_config.get('title_en', notification_type)
        
        admin_emails = get_admin_emails()
        
        for admin_email in admin_emails:
            notification = Notification(
                user_email=admin_email,
                type=notification_type,
                title=title,
                message=message,
                is_read=False,
                meta_data=meta_data or {}
            )
            db.session.add(notification)
        
        db.session.commit()
        return True
    except Exception as e:
        print(f"Error creating admin notification: {e}")
        db.session.rollback()
        return False


def send_admin_email(notification_type, subject, details, meta_data=None):
    """
    Send email notification to the admin email address
    
    Args:
        notification_type: One of the NOTIFICATION_TYPES keys
        subject: Email subject
        details: Dict with details to display in the email
        meta_data: Optional metadata
    """
    type_config = NOTIFICATION_TYPES.get(notification_type, {})
    icon = type_config.get('icon', '📬')
    
    details_html = ""
    if details:
        for key, value in details.items():
            if value is not None:
                details_html += f"""
                <tr>
                    <td style="padding: 8px 12px; border-bottom: 1px solid #eee; font-weight: 600; color: #666;">{key}</td>
                    <td style="padding: 8px 12px; border-bottom: 1px solid #eee; color: #333;">{value}</td>
                </tr>
                """
    
    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background: linear-gradient(135deg, #581c87 0%, #ea580c 100%); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">
                {icon} Planlyze Admin Alert
            </h1>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #1e293b; margin-top: 0; margin-bottom: 20px;">{subject}</h2>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                {details_html}
            </table>
            
            <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin-top: 20px;">
                <p style="margin: 0; color: #64748b; font-size: 14px;">
                    <strong>Timestamp:</strong> {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}
                </p>
            </div>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
            <p>This is an automated notification from Planlyze.</p>
            <p>Visit your admin dashboard to take action.</p>
        </div>
    </div>
    """
    
    full_subject = f"[Planlyze Admin] {subject}"
    success, error = send_email(ADMIN_EMAIL, ADMIN_NAME, full_subject, html_body)
    
    if not success:
        print(f"Failed to send admin email: {error}")
    
    return success


def notify_admin(notification_type, message, details=None, meta_data=None):
    """
    Main function to notify admins via both email and in-app notification
    
    Args:
        notification_type: One of the NOTIFICATION_TYPES keys
        message: Short notification message
        details: Dict with details for the email (key: value pairs)
        meta_data: Optional metadata to store with the notification
    """
    type_config = NOTIFICATION_TYPES.get(notification_type, {})
    title = type_config.get('title_en', notification_type)
    
    create_admin_notification(notification_type, message, meta_data)
    
    send_admin_email(notification_type, title, details or {'Message': message}, meta_data)


def notify_contact_message(name, email, subject, message):
    """Notify admin about a new contact us message"""
    notify_admin(
        'contact_message',
        f"New contact message from {name} ({email})",
        {
            'Name': name,
            'Email': email,
            'Subject': subject,
            'Message': message
        },
        {'sender_name': name, 'sender_email': email, 'subject': subject}
    )


def notify_failed_analysis(user_email, analysis_id, business_idea, error_message):
    """Notify admin about a failed analysis"""
    notify_admin(
        'failed_analysis',
        f"Analysis failed for user {user_email}",
        {
            'User Email': user_email,
            'Analysis ID': analysis_id,
            'Business Idea': business_idea[:100] + '...' if len(business_idea) > 100 else business_idea,
            'Error': error_message
        },
        {'user_email': user_email, 'analysis_id': analysis_id, 'error': error_message}
    )


def notify_new_payment(user_email, amount_usd, package_name, payment_method):
    """Notify admin about a new payment request"""
    notify_admin(
        'new_payment',
        f"New payment request from {user_email}",
        {
            'User Email': user_email,
            'Amount': f"${amount_usd}",
            'Package': package_name,
            'Payment Method': payment_method
        },
        {'user_email': user_email, 'amount_usd': amount_usd, 'package': package_name}
    )


def notify_server_error(endpoint, method, error_message, user_email=None):
    """Notify admin about a server error (500)"""
    notify_admin(
        'server_error',
        f"Server error on {method} {endpoint}",
        {
            'Endpoint': endpoint,
            'Method': method,
            'User': user_email or 'Unknown',
            'Error': error_message[:500] if error_message else 'Unknown error'
        },
        {'endpoint': endpoint, 'method': method, 'user_email': user_email}
    )


def notify_new_rating(user_email, analysis_id, business_idea, rating, feedback=None):
    """Notify admin about a new report rating"""
    notify_admin(
        'new_rating',
        f"New {rating}/5 rating from {user_email}",
        {
            'User Email': user_email,
            'Analysis ID': analysis_id,
            'Business Idea': business_idea[:100] + '...' if len(business_idea) > 100 else business_idea,
            'Rating': f"{'⭐' * rating} ({rating}/5)",
            'Feedback': feedback or 'No feedback provided'
        },
        {'user_email': user_email, 'analysis_id': analysis_id, 'rating': rating}
    )
