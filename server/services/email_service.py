import os
import requests
import json

ZEPTOMAIL_API_URL = "https://api.zeptomail.com/v1.1/email"
ZEPTOMAIL_API_KEY = os.environ.get('ZEPTOMAIL_API_KEY')
SENDER_EMAIL = os.environ.get('ZEPTOMAIL_SENDER_EMAIL', 'no.reply@planlyze.com')
SENDER_NAME = "Planlyze"

def send_email(to_email, to_name, subject, html_body):
    """
    Centralized email sending function used across the platform.
    All email sending should go through this function.
    
    Args:
        to_email: Recipient email address
        to_name: Recipient name (optional)
        subject: Email subject
        html_body: HTML content of the email
        
    Returns:
        tuple: (success: bool, error_message: str or None)
    """
    if not ZEPTOMAIL_API_KEY:
        print("Warning: ZEPTOMAIL_API_KEY not configured, skipping email send")
        return False, "Email provider not configured"
    
    payload = {
        "from": {
            "address": SENDER_EMAIL,
            "name": SENDER_NAME
        },
        "to": [
            {
                "email_address": {
                    "address": to_email,
                    "name": to_name or ""
                }
            }
        ],
        "subject": subject,
        "htmlbody": html_body
    }
    
    headers = {
        'Accept': "application/json",
        'Content-Type': "application/json",
        'Authorization': ZEPTOMAIL_API_KEY
    }
    
    try:
        response = requests.post(
            ZEPTOMAIL_API_URL, 
            json=payload, 
            headers=headers,
            timeout=30
        )
        
        if response.status_code in [200, 201]:
            print(f"Email sent successfully to {to_email}")
            return True, None
        else:
            error_msg = f"ZeptoMail error {response.status_code}: {response.text}"
            print(error_msg)
            return False, error_msg
    except requests.exceptions.Timeout:
        error_msg = "Email sending timed out"
        print(error_msg)
        return False, error_msg
    except Exception as e:
        error_msg = f"Email send error: {str(e)}"
        print(error_msg)
        return False, error_msg


def send_verification_email(to_email, to_name, otp_code, lang='en'):
    """Send OTP verification email"""
    if lang == 'ar':
        subject = "رمز التحقق الخاص بك - Planlyze"
        html_body = f"""
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #581c87; margin: 0;">Planlyze</h1>
            </div>
            <h2 style="color: #333;">مرحباً {to_name or 'بك'}!</h2>
            <p style="color: #666; font-size: 16px;">شكراً لتسجيلك في Planlyze. رمز التحقق الخاص بك هو:</p>
            <div style="text-align: center; margin: 30px 0;">
                <div style="background: linear-gradient(135deg, #581c87 0%, #ea580c 100%); padding: 25px 40px; border-radius: 12px; display: inline-block;">
                    <span style="font-size: 36px; font-weight: bold; letter-spacing: 10px; color: white;">{otp_code}</span>
                </div>
            </div>
            <p style="color: #666; font-size: 14px;">أدخل هذا الرمز في صفحة التحقق لتأكيد حسابك.</p>
            <p style="color: #999; font-size: 14px;">إذا لم تقم بإنشاء حساب، يمكنك تجاهل هذا البريد.</p>
            <p style="color: #ea580c; font-size: 14px; font-weight: bold;">هذا الرمز صالح لمدة 15 دقيقة.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">فريق Planlyze</p>
        </div>
        """
    else:
        subject = "Your Verification Code - Planlyze"
        html_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #581c87; margin: 0;">Planlyze</h1>
            </div>
            <h2 style="color: #333;">Hello {to_name or 'there'}!</h2>
            <p style="color: #666; font-size: 16px;">Thank you for registering with Planlyze. Your verification code is:</p>
            <div style="text-align: center; margin: 30px 0;">
                <div style="background: linear-gradient(135deg, #581c87 0%, #ea580c 100%); padding: 25px 40px; border-radius: 12px; display: inline-block;">
                    <span style="font-size: 36px; font-weight: bold; letter-spacing: 10px; color: white;">{otp_code}</span>
                </div>
            </div>
            <p style="color: #666; font-size: 14px;">Enter this code on the verification page to confirm your account.</p>
            <p style="color: #999; font-size: 14px;">If you didn't create an account, you can ignore this email.</p>
            <p style="color: #ea580c; font-size: 14px; font-weight: bold;">This code is valid for 15 minutes.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">The Planlyze Team</p>
        </div>
        """
    
    success, error = send_email(to_email, to_name, subject, html_body)
    return success


def send_password_reset_email(to_email, to_name, reset_link, lang='en'):
    """Send password reset email"""
    if lang == 'ar':
        subject = "إعادة تعيين كلمة المرور - Planlyze"
        html_body = f"""
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #581c87; margin: 0;">Planlyze</h1>
            </div>
            <h2 style="color: #333;">إعادة تعيين كلمة المرور</h2>
            <p style="color: #666; font-size: 16px;">تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك. اضغط على الزر أدناه:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{reset_link}" style="background: linear-gradient(135deg, #581c87 0%, #ea580c 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-size: 16px; display: inline-block;">إعادة تعيين كلمة المرور</a>
            </div>
            <p style="color: #999; font-size: 14px;">إذا لم تطلب إعادة التعيين، يمكنك تجاهل هذا البريد.</p>
            <p style="color: #ea580c; font-size: 14px; font-weight: bold;">هذا الرابط صالح لمدة ساعة واحدة.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">فريق Planlyze</p>
        </div>
        """
    else:
        subject = "Reset Your Password - Planlyze"
        html_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #581c87; margin: 0;">Planlyze</h1>
            </div>
            <h2 style="color: #333;">Password Reset Request</h2>
            <p style="color: #666; font-size: 16px;">We received a request to reset your password. Click the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{reset_link}" style="background: linear-gradient(135deg, #581c87 0%, #ea580c 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-size: 16px; display: inline-block;">Reset Password</a>
            </div>
            <p style="color: #999; font-size: 14px;">If you didn't request a password reset, you can ignore this email.</p>
            <p style="color: #ea580c; font-size: 14px; font-weight: bold;">This link is valid for 1 hour.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">The Planlyze Team</p>
        </div>
        """
    
    success, error = send_email(to_email, to_name, subject, html_body)
    return success


def send_payment_notification_email(to_email, to_name, payment_status, credits, amount_usd, lang='en'):
    """Send payment status notification email"""
    if payment_status == 'approved':
        if lang == 'ar':
            subject = "تمت الموافقة على الدفع - Planlyze"
            status_text = "تمت الموافقة"
            status_color = "#22c55e"
            message = f"تمت الموافقة على طلب الدفع الخاص بك. تمت إضافة {credits} رصيد إلى حسابك."
        else:
            subject = "Payment Approved - Planlyze"
            status_text = "Approved"
            status_color = "#22c55e"
            message = f"Your payment request has been approved. {credits} credits have been added to your account."
    else:
        if lang == 'ar':
            subject = "تم رفض الدفع - Planlyze"
            status_text = "مرفوض"
            status_color = "#ef4444"
            message = "للأسف، تم رفض طلب الدفع الخاص بك. يرجى التواصل مع الدعم للمزيد من المعلومات."
        else:
            subject = "Payment Rejected - Planlyze"
            status_text = "Rejected"
            status_color = "#ef4444"
            message = "Unfortunately, your payment request has been rejected. Please contact support for more information."
    
    is_rtl = lang == 'ar'
    html_body = f"""
    <div {"dir='rtl'" if is_rtl else ""} style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #581c87; margin: 0;">Planlyze</h1>
        </div>
        <h2 style="color: #333;">{"مرحباً" if is_rtl else "Hello"} {to_name or ''}!</h2>
        <div style="background-color: {status_color}; color: white; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-size: 20px; font-weight: bold;">{status_text}</span>
        </div>
        <p style="color: #666; font-size: 16px;">{message}</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0; color: #333;"><strong>{"المبلغ" if is_rtl else "Amount"}:</strong> ${amount_usd}</p>
            <p style="margin: 5px 0; color: #333;"><strong>{"الأرصدة" if is_rtl else "Credits"}:</strong> {credits}</p>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">{"فريق Planlyze" if is_rtl else "The Planlyze Team"}</p>
    </div>
    """
    
    success, error = send_email(to_email, to_name, subject, html_body)
    return success


def send_welcome_email(to_email, to_name, lang='en'):
    """Send welcome email after verification"""
    if lang == 'ar':
        subject = "مرحباً بك في Planlyze!"
        html_body = f"""
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #581c87; margin: 0;">Planlyze</h1>
            </div>
            <h2 style="color: #333;">مرحباً بك {to_name or ''}!</h2>
            <p style="color: #666; font-size: 16px;">تم تأكيد حسابك بنجاح. أنت الآن جاهز لبدء تحليل أفكارك التجارية باستخدام الذكاء الاصطناعي.</p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #581c87; margin-top: 0;">ما يمكنك فعله:</h3>
                <ul style="color: #666; line-height: 1.8;">
                    <li>إنشاء تحليلات أعمال شاملة</li>
                    <li>الحصول على رؤى السوق والتوصيات</li>
                    <li>تصدير التقارير بصيغة PDF</li>
                </ul>
            </div>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">فريق Planlyze</p>
        </div>
        """
    else:
        subject = "Welcome to Planlyze!"
        html_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #581c87; margin: 0;">Planlyze</h1>
            </div>
            <h2 style="color: #333;">Welcome {to_name or ''}!</h2>
            <p style="color: #666; font-size: 16px;">Your account has been verified successfully. You're now ready to start analyzing your business ideas with AI.</p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #581c87; margin-top: 0;">What you can do:</h3>
                <ul style="color: #666; line-height: 1.8;">
                    <li>Create comprehensive business analyses</li>
                    <li>Get market insights and recommendations</li>
                    <li>Export reports in PDF format</li>
                </ul>
            </div>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">The Planlyze Team</p>
        </div>
        """
    
    success, error = send_email(to_email, to_name, subject, html_body)
    return success


def send_custom_email(to_email, to_name, subject, body_html, lang='en'):
    """Send a custom email with provided content"""
    is_rtl = lang == 'ar'
    html_body = f"""
    <div {"dir='rtl'" if is_rtl else ""} style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #581c87; margin: 0;">Planlyze</h1>
        </div>
        {body_html}
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">{"فريق Planlyze" if is_rtl else "The Planlyze Team"}</p>
    </div>
    """
    
    success, error = send_email(to_email, to_name, subject, html_body)
    return success, error
