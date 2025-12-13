"""
Backend translations for API responses and messages
"""

translations = {
    'en': {
        'auth': {
            'login_success': 'Login successful',
            'register_success': 'Registration successful. Please log in.',
            'invalid_credentials': 'Invalid email or password',
            'email_required': 'Email is required',
            'password_required': 'Password is required',
            'user_exists': 'Email already registered',
            'password_changed': 'Password changed successfully',
            'not_authenticated': 'Not authenticated',
            'invalid_token': 'Invalid or expired token',
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
            'register_success': 'تم التسجيل بنجاح. يرجى تسجيل الدخول.',
            'invalid_credentials': 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
            'email_required': 'البريد الإلكتروني مطلوب',
            'password_required': 'كلمة المرور مطلوبة',
            'user_exists': 'هذا البريد الإلكتروني مسجل بالفعل',
            'password_changed': 'تم تغيير كلمة المرور بنجاح',
            'not_authenticated': 'لم يتم المصادقة',
            'invalid_token': 'رمز غير صحيح أو منتهي الصلاحية',
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

def get_message(key, language='en'):
    """
    Get a translated message by key
    Args:
        key: dot-separated key like 'auth.login_success'
        language: 'en' or 'ar'
    """
    lang = translations.get(language, translations['en'])
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
