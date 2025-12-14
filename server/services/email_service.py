import os
import requests
import json

ZEPTOMAIL_API_URL = "https://api.zeptomail.com/v1.1/email"
ZEPTOMAIL_API_KEY = os.environ.get('ZEPTOMAIL_API_KEY')
SENDER_EMAIL = os.environ.get('ZEPTOMAIL_SENDER_EMAIL', 'noreply@planlyze.com')
SENDER_NAME = os.environ.get('ZEPTOMAIL_SENDER_NAME', 'Planlyze')

def send_verification_email(to_email, to_name, otp_code, lang='en'):
    if not ZEPTOMAIL_API_KEY:
        print("Warning: ZEPTOMAIL_API_KEY not configured, skipping email send")
        return False
    
    if lang == 'ar':
        subject = "رمز التحقق الخاص بك - Planlyze"
        html_body = f"""
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">مرحباً {to_name or 'بك'}!</h2>
            <p style="color: #666; font-size: 16px;">شكراً لتسجيلك في Planlyze. رمز التحقق الخاص بك هو:</p>
            <div style="text-align: center; margin: 30px 0;">
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; display: inline-block;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #3b82f6;">{otp_code}</span>
                </div>
            </div>
            <p style="color: #666; font-size: 14px;">أدخل هذا الرمز في صفحة التحقق لتأكيد حسابك.</p>
            <p style="color: #999; font-size: 14px;">إذا لم تقم بإنشاء حساب، يمكنك تجاهل هذا البريد.</p>
            <p style="color: #999; font-size: 14px;">هذا الرمز صالح لمدة 15 دقيقة.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">فريق Planlyze</p>
        </div>
        """
    else:
        subject = "Your Verification Code - Planlyze"
        html_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Hello {to_name or 'there'}!</h2>
            <p style="color: #666; font-size: 16px;">Thank you for registering with Planlyze. Your verification code is:</p>
            <div style="text-align: center; margin: 30px 0;">
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; display: inline-block;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #3b82f6;">{otp_code}</span>
                </div>
            </div>
            <p style="color: #666; font-size: 14px;">Enter this code on the verification page to confirm your account.</p>
            <p style="color: #999; font-size: 14px;">If you didn't create an account, you can ignore this email.</p>
            <p style="color: #999; font-size: 14px;">This code is valid for 15 minutes.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">The Planlyze Team</p>
        </div>
        """
    
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
        'accept': "application/json",
        'content-type': "application/json",
        'authorization': f"Zoho-enczapikey {ZEPTOMAIL_API_KEY}"
    }
    
    try:
        print(f"ZeptoMail sending to: {to_email} from: {SENDER_EMAIL}")
        print(f"ZeptoMail payload: {json.dumps(payload)}")
        response = requests.post(ZEPTOMAIL_API_URL, data=json.dumps(payload), headers=headers)
        print(f"ZeptoMail response status: {response.status_code}")
        print(f"ZeptoMail response body: {response.text}")
        if response.status_code == 200:
            return True
        else:
            return False
    except Exception as e:
        print(f"Email send error: {str(e)}")
        return False

def send_password_reset_email(to_email, to_name, reset_link, lang='en'):
    if not ZEPTOMAIL_API_KEY:
        print("Warning: ZEPTOMAIL_API_KEY not configured, skipping email send")
        return False
    
    if lang == 'ar':
        subject = "إعادة تعيين كلمة المرور - Planlyze"
        html_body = f"""
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">إعادة تعيين كلمة المرور</h2>
            <p style="color: #666; font-size: 16px;">تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك. اضغط على الزر أدناه:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{reset_link}" style="background-color: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-size: 16px;">إعادة تعيين كلمة المرور</a>
            </div>
            <p style="color: #999; font-size: 14px;">إذا لم تطلب إعادة التعيين، يمكنك تجاهل هذا البريد.</p>
            <p style="color: #999; font-size: 14px;">هذا الرابط صالح لمدة ساعة واحدة.</p>
        </div>
        """
    else:
        subject = "Reset Your Password - Planlyze"
        html_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p style="color: #666; font-size: 16px;">We received a request to reset your password. Click the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{reset_link}" style="background-color: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-size: 16px;">Reset Password</a>
            </div>
            <p style="color: #999; font-size: 14px;">If you didn't request a password reset, you can ignore this email.</p>
            <p style="color: #999; font-size: 14px;">This link is valid for 1 hour.</p>
        </div>
        """
    
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
        'accept': "application/json",
        'content-type': "application/json",
        'authorization': f"Zoho-enczapikey {ZEPTOMAIL_API_KEY}"
    }
    
    try:
        response = requests.post(ZEPTOMAIL_API_URL, data=json.dumps(payload), headers=headers)
        if response.status_code == 200:
            return True
        else:
            print(f"ZeptoMail error: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"Email send error: {str(e)}")
        return False
