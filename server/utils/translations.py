"""
Backend translations for API responses and messages
Default language is Arabic (ar)
"""

DEFAULT_LANGUAGE = 'ar'

translations = {
    'en': {
        'auth': {
            'login_success': 'Login successful',
            'register_success': 'Registration successful. Please check your email to verify your account.',
            'invalid_credentials': 'Invalid email or password',
            'email_required': 'Email is required',
            'password_required': 'Password is required',
            'user_exists': 'Email already registered',
            'password_changed': 'Password changed successfully',
            'not_authenticated': 'Not authenticated',
            'invalid_token': 'Invalid or expired token',
            'email_verified': 'Email verified successfully!',
            'verification_sent': 'Verification link has been sent to your email.',
            'email_not_found': 'Email not found',
            'email_already_verified': 'Email is already verified',
            'invalid_code': 'Invalid verification code',
            'code_expired': 'Verification code has expired. Please request a new code.',
            'email_code_required': 'Email and verification code are required',
            'verify_email_first': 'Please verify your email before logging in.',
            'password_not_set': 'Your account requires a password. Please use the forgot password option to set one.',
            'account_deactivated': 'Account is deactivated',
            'current_new_password_required': 'Current and new password are required',
            'current_password_incorrect': 'Current password is incorrect',
            'logout_success': 'Logged out successfully',
            'referral_bonus_title': 'You earned a referral bonus!',
            'referral_bonus_message': '{email} signed up using your referral code. You earned 1 credit!',
            'referral_welcome_title': 'Welcome! You got a bonus credit!',
            'referral_welcome_message': 'You signed up with a referral from {email} and received 1 bonus credit!',
            'reset_code_sent': 'If an account exists with this email, a password reset code has been sent.',
            'invalid_reset_code': 'Invalid or expired reset code',
            'no_reset_requested': 'No password reset was requested for this account',
            'too_many_attempts': 'Too many failed attempts. Please request a new reset code.',
            'code_verified': 'Code verified successfully',
            'all_fields_required': 'All fields are required',
            'password_too_short': 'Password must be at least 6 characters',
            'password_reset_success': 'Password has been reset successfully. You can now login with your new password.',
        },
        'analysis': {
            'created': 'Analysis created successfully',
            'updated': 'Analysis updated successfully',
            'deleted': 'Analysis deleted successfully',
            'not_found': 'Analysis not found',
            'unauthorized': 'You are not authorized to access this analysis',
        },
        'credits': {
            'insufficient': 'Insufficient credits',
            'credit_purchased': 'Credits purchased successfully',
            'purchase_pending': 'Purchase is pending approval',
        },
        'general': {
            'error': 'An error occurred',
            'success': 'Operation completed successfully',
            'invalid_input': 'Invalid input provided',
            'server_error': 'Internal server error',
        }
    },
    'ar': {
        'auth': {
            'login_success': 'تم تسجيل الدخول بنجاح',
            'register_success': 'تم التسجيل بنجاح. يرجى التحقق من بريدك الإلكتروني لتأكيد حسابك.',
            'invalid_credentials': 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
            'email_required': 'البريد الإلكتروني مطلوب',
            'password_required': 'كلمة المرور مطلوبة',
            'user_exists': 'هذا البريد الإلكتروني مسجل بالفعل',
            'password_changed': 'تم تغيير كلمة المرور بنجاح',
            'not_authenticated': 'لم يتم المصادقة',
            'invalid_token': 'رمز غير صحيح أو منتهي الصلاحية',
            'email_verified': 'تم تأكيد البريد الإلكتروني بنجاح!',
            'verification_sent': 'تم إرسال رابط التحقق إلى بريدك الإلكتروني.',
            'email_not_found': 'البريد الإلكتروني غير مسجل',
            'email_already_verified': 'البريد الإلكتروني مؤكد بالفعل',
            'invalid_code': 'رمز التحقق غير صحيح',
            'code_expired': 'انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد.',
            'email_code_required': 'البريد الإلكتروني ورمز التحقق مطلوبان',
            'verify_email_first': 'يرجى تأكيد بريدك الإلكتروني قبل تسجيل الدخول.',
            'password_not_set': 'حسابك يتطلب كلمة مرور. يرجى استخدام خيار نسيت كلمة المرور لتعيينها.',
            'account_deactivated': 'الحساب معطل',
            'current_new_password_required': 'كلمة المرور الحالية والجديدة مطلوبتان',
            'current_password_incorrect': 'كلمة المرور الحالية غير صحيحة',
            'logout_success': 'تم تسجيل الخروج بنجاح',
            'referral_bonus_title': 'لقد حصلت على مكافأة إحالة!',
            'referral_bonus_message': '{email} قام بالتسجيل باستخدام رمز الإحالة الخاص بك. لقد حصلت على 1 رصيد!',
            'referral_welcome_title': 'مرحباً! حصلت على رصيد إضافي!',
            'referral_welcome_message': 'لقد قمت بالتسجيل باستخدام رمز إحالة من {email} وحصلت على 1 رصيد إضافي!',
            'reset_code_sent': 'إذا كان هناك حساب بهذا البريد الإلكتروني، فقد تم إرسال رمز إعادة تعيين كلمة المرور.',
            'invalid_reset_code': 'رمز إعادة التعيين غير صحيح أو منتهي الصلاحية',
            'no_reset_requested': 'لم يتم طلب إعادة تعيين كلمة المرور لهذا الحساب',
            'too_many_attempts': 'محاولات فاشلة كثيرة جداً. يرجى طلب رمز إعادة تعيين جديد.',
            'code_verified': 'تم التحقق من الرمز بنجاح',
            'all_fields_required': 'جميع الحقول مطلوبة',
            'password_too_short': 'يجب أن تكون كلمة المرور 6 أحرف على الأقل',
            'password_reset_success': 'تم إعادة تعيين كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.',
        },
        'analysis': {
            'created': 'تم إنشاء التحليل بنجاح',
            'updated': 'تم تحديث التحليل بنجاح',
            'deleted': 'تم حذف التحليل بنجاح',
            'not_found': 'لم يتم العثور على التحليل',
            'unauthorized': 'أنت غير مصرح بالوصول إلى هذا التحليل',
        },
        'credits': {
            'insufficient': 'أرصدة غير كافية',
            'credit_purchased': 'تم شراء الأرصدة بنجاح',
            'purchase_pending': 'الشراء قيد الانتظار للموافقة',
        },
        'general': {
            'error': 'حدث خطأ',
            'success': 'تمت العملية بنجاح',
            'invalid_input': 'تم توفير إدخال غير صحيح',
            'server_error': 'خطأ في الخادم الداخلي',
        }
    }
}

def get_language(request_headers):
    """
    Get language from request headers, defaulting to Arabic
    """
    raw_lang = request_headers.get('Accept-Language', DEFAULT_LANGUAGE)
    return 'ar' if 'ar' in raw_lang or raw_lang == DEFAULT_LANGUAGE else 'en'

def get_message(key, language=None):
    """
    Get a translated message by key
    Args:
        key: dot-separated key like 'auth.login_success'
        language: 'en' or 'ar' (defaults to Arabic)
    """
    if language is None:
        language = DEFAULT_LANGUAGE
    lang = translations.get(language, translations[DEFAULT_LANGUAGE])
    keys = key.split('.')
    value = lang
    
    for k in keys:
        if isinstance(value, dict):
            value = value.get(k, key)
        else:
            return key
    
    return value

def translate_response(data, language='en'):
    """
    Add language to API response
    """
    return {
        **data,
        'language': language
    }
