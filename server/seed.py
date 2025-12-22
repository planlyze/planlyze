import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from server.app import create_app
from server.models import db, User, Role, CreditPackage, PaymentMethod, EmailTemplate
import bcrypt

PERMISSIONS = {
    'VIEW_PAYMENTS': 'view_payments',
    'MANAGE_PAYMENTS': 'manage_payments',
    'VIEW_USERS': 'view_users',
    'MANAGE_USERS': 'manage_users',
    'VIEW_CREDITS': 'view_credits',
    'MANAGE_CREDITS': 'manage_credits',
    'VIEW_SETTINGS': 'view_settings',
    'MANAGE_SETTINGS': 'manage_settings',
    'MANAGE_ROLES': 'manage_roles',
    'VIEW_OWNER_DASHBOARD': 'view_owner_dashboard',
    'VIEW_ANALYSES': 'view_analyses',
    'MANAGE_ANALYSES': 'manage_analyses',
    'VIEW_NOTIFICATIONS': 'view_notifications',
    'MANAGE_NOTIFICATIONS': 'manage_notifications',
    'VIEW_EMAIL_TEMPLATES': 'view_email_templates',
    'MANAGE_EMAIL_TEMPLATES': 'manage_email_templates',
    'VIEW_AUDIT_LOGS': 'view_audit_logs',
    'VIEW_DISCOUNTS': 'view_discounts',
    'MANAGE_DISCOUNTS': 'manage_discounts',
}

def seed_roles():
    """Seed the roles table with default roles using flat permission keys"""
    roles_data = [
        {
            'name': 'super_admin',
            'description': 'Super Administrator with full system access',
            'permissions': list(PERMISSIONS.values())
        },
        {
            'name': 'admin',
            'description': 'Administrator with management access',
            'permissions': [
                PERMISSIONS['VIEW_PAYMENTS'],
                PERMISSIONS['MANAGE_PAYMENTS'],
                PERMISSIONS['VIEW_USERS'],
                PERMISSIONS['VIEW_CREDITS'],
                PERMISSIONS['MANAGE_CREDITS'],
                PERMISSIONS['VIEW_SETTINGS'],
                PERMISSIONS['VIEW_OWNER_DASHBOARD'],
                PERMISSIONS['VIEW_ANALYSES'],
                PERMISSIONS['VIEW_NOTIFICATIONS'],
                PERMISSIONS['MANAGE_NOTIFICATIONS'],
                PERMISSIONS['VIEW_EMAIL_TEMPLATES'],
                PERMISSIONS['VIEW_AUDIT_LOGS'],
                PERMISSIONS['VIEW_DISCOUNTS'],
            ]
        },
        {
            'name': 'user',
            'description': 'Regular user with basic access',
            'permissions': []
        }
    ]
    
    for role_data in roles_data:
        existing_role = Role.query.filter_by(name=role_data['name']).first()
        if existing_role:
            existing_role.description = role_data['description']
            existing_role.permissions = role_data['permissions']
            print(f"Updated role: {role_data['name']}")
        else:
            role = Role(
                name=role_data['name'],
                description=role_data['description'],
                permissions=role_data['permissions']
            )
            db.session.add(role)
            print(f"Created role: {role_data['name']}")
    
    db.session.commit()
    print("Roles seeded successfully!")

def create_super_admin(email, password=None, full_name="Super Admin"):
    """Create or update a user to be super admin"""
    super_admin_role = Role.query.filter_by(name='super_admin').first()
    if not super_admin_role:
        print("Error: super_admin role not found. Please run seed_roles() first.")
        return None
    
    user = User.query.filter_by(email=email).first()
    
    if user:
        user.role_id = super_admin_role.id
        user.is_active = True
        user.email_verified = True
        print(f"Updated user {email} to super_admin role")
    else:
        if not password:
            password = "Admin@123"
            print(f"No password provided, using default: {password}")
        
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        user = User(
            email=email,
            password_hash=password_hash,
            full_name=full_name,
            role_id=super_admin_role.id,
            email_verified=True,
            is_active=True,
            credits=1000
        )
        db.session.add(user)
        print(f"Created super admin user: {email}")
    
    db.session.commit()
    return user

def seed_credit_packages():
    """Seed the credit packages table with default packages"""
    packages_data = [
        {
            'name': 'Starter',
            'name_ar': 'المبتدئ',
            'credits': 1,
            'price_usd': 10.00,
            'description': 'Perfect for trying out the platform with 1 premium report',
            'description_ar': 'مثالي لتجربة المنصة مع تقرير مميز واحد',
            'features': [
                '1 Premium AI Report',
                'Full Market Analysis',
                'Technical Strategy',
                'Financial Projections',
                'Risk Assessment',
                'PDF & Excel Export'
            ],
            'features_ar': [
                'تقرير ذكاء اصطناعي مميز واحد',
                'تحليل سوق كامل',
                'استراتيجية تقنية',
                'توقعات مالية',
                'تقييم المخاطر',
                'تصدير PDF و Excel'
            ],
            'is_active': True,
            'is_popular': False
        },
        {
            'name': 'Basic',
            'name_ar': 'الأساسي',
            'credits': 10,
            'price_usd': 90.00,
            'description': 'Great for small businesses with 10 premium reports',
            'description_ar': 'رائع للشركات الصغيرة مع 10 تقارير مميزة',
            'features': [
                '10 Premium AI Reports',
                'All Starter Features',
                'Syrian Market Intelligence',
                'AI Chat Assistant',
                'Competitor Analysis',
                'Priority Support'
            ],
            'features_ar': [
                '10 تقارير ذكاء اصطناعي مميزة',
                'جميع ميزات المبتدئ',
                'بيانات السوق السوري',
                'مساعد ذكاء اصطناعي للدردشة',
                'تحليل المنافسين',
                'دعم ذو أولوية'
            ],
            'is_active': True,
            'is_popular': True
        }
    ]
    
    valid_names = [pkg['name'] for pkg in packages_data]
    
    CreditPackage.query.filter(~CreditPackage.name.in_(valid_names)).update(
        {'is_active': False}, synchronize_session=False
    )
    print(f"Deactivated packages not in: {valid_names}")
    
    for pkg_data in packages_data:
        existing = CreditPackage.query.filter_by(name=pkg_data['name']).first()
        if existing:
            existing.credits = pkg_data['credits']
            existing.price_usd = pkg_data['price_usd']
            existing.description = pkg_data['description']
            existing.description_ar = pkg_data.get('description_ar')
            existing.name_ar = pkg_data.get('name_ar')
            existing.features = pkg_data.get('features', [])
            existing.features_ar = pkg_data.get('features_ar', [])
            existing.is_active = pkg_data['is_active']
            existing.is_popular = pkg_data['is_popular']
            print(f"Updated credit package: {pkg_data['name']}")
        else:
            package = CreditPackage(**pkg_data)
            db.session.add(package)
            print(f"Created credit package: {pkg_data['name']}")
    
    db.session.commit()
    print("Credit packages seeded successfully!")

def seed_payment_methods():
    """Seed the payment methods table with default methods"""
    methods_data = [
        {
            'name': 'Bank Transfer',
            'type': 'bank_transfer',
            'details': {
                'bank_name': 'Example Bank',
                'account_name': 'Planlyze LLC',
                'account_number': '1234567890',
                'iban': 'XX00XXXX0000000000000000',
                'swift': 'EXAMPLEXXX'
            },
            'instructions': 'Please transfer the exact amount to our bank account and upload the receipt as proof of payment.',
            'is_active': True
        },
        {
            'name': 'PayPal',
            'type': 'paypal',
            'details': {
                'email': 'payments@planlyze.com'
            },
            'instructions': 'Send payment to our PayPal email address and include your registered email in the notes.',
            'is_active': True
        },
        {
            'name': 'Cryptocurrency',
            'type': 'crypto',
            'details': {
                'bitcoin': 'bc1qexample...',
                'ethereum': '0xexample...',
                'usdt_trc20': 'TExample...'
            },
            'instructions': 'Send the equivalent amount in cryptocurrency and provide the transaction hash as proof.',
            'is_active': True
        },
        {
            'name': 'Mobile Money',
            'type': 'mobile_money',
            'details': {
                'provider': 'Various',
                'number': '+1234567890'
            },
            'instructions': 'Send payment via mobile money and upload the confirmation screenshot.',
            'is_active': True
        }
    ]
    
    for method_data in methods_data:
        existing = PaymentMethod.query.filter_by(name=method_data['name']).first()
        if existing:
            existing.type = method_data['type']
            existing.details = method_data['details']
            existing.instructions = method_data['instructions']
            existing.is_active = method_data['is_active']
            print(f"Updated payment method: {method_data['name']}")
        else:
            method = PaymentMethod(**method_data)
            db.session.add(method)
            print(f"Created payment method: {method_data['name']}")
    
    db.session.commit()
    print("Payment methods seeded successfully!")

def seed_email_templates():
    """Seed the email templates table with default templates"""
    templates_data = [
        {
            'template_key': 'shared_report_accessed',
            'name': 'Shared Report Accessed',
            'subject_en': 'Your Shared Report Was Viewed',
            'subject_ar': 'تم عرض تقريرك المشترك',
            'body_en': '''<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 10px;">
  <h2 style="color: #7c3aed;">Report Activity</h2>
  <p>Hi {{user_name}},</p>
  <p>Someone just accessed your shared analysis report for "<strong>{{business_idea}}</strong>".</p>
  <p><strong>Accessed by:</strong> {{accessor_email}}<br>
  <strong>Date:</strong> {{access_date}}</p>
  <a href="{{report_url}}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #7c3aed, #6366f1); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">View Report</a>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
  <p style="color: #94a3b8; font-size: 12px;">© 2024 Planlyze. All rights reserved.</p>
</div>''',
            'body_ar': '''<div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 10px;">
  <h2 style="color: #7c3aed;">نشاط التقرير</h2>
  <p>مرحباً {{user_name}}،</p>
  <p>قام شخص ما بالوصول إلى تقرير التحليل المشترك الخاص بك لـ "<strong>{{business_idea}}</strong>".</p>
  <p><strong>تم الوصول بواسطة:</strong> {{accessor_email}}<br>
  <strong>التاريخ:</strong> {{access_date}}</p>
  <a href="{{report_url}}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #7c3aed, #6366f1); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">عرض التقرير</a>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
  <p style="color: #94a3b8; font-size: 12px;">© 2024 Planlyze. جميع الحقوق محفوظة.</p>
</div>''',
            'is_active': True
        },
        {
            'template_key': 'low_credits',
            'name': 'Low Credits Warning',
            'subject_en': 'Running Low on Credits ⚠️',
            'subject_ar': 'رصيدك ينفد ⚠️',
            'body_en': '''<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 10px;">
  <h2 style="color: #f59e0b;">Low Credits Alert</h2>
  <p>Hi {{user_name}},</p>
  <p>You're running low on premium credits! You currently have <strong>{{remaining_credits}}</strong> credit(s) left.</p>
  <p>Purchase more credits to continue creating premium analysis reports.</p>
  <a href="{{credits_url}}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #7c3aed, #6366f1); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">Buy More Credits</a>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
  <p style="color: #94a3b8; font-size: 12px;">© 2024 Planlyze. All rights reserved.</p>
</div>''',
            'body_ar': '''<div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 10px;">
  <h2 style="color: #f59e0b;">تنبيه رصيد منخفض</h2>
  <p>مرحباً {{user_name}}،</p>
  <p>رصيدك المتميز ينفد! لديك حالياً <strong>{{remaining_credits}}</strong> رصيد متبقي.</p>
  <p>اشترِ المزيد من الأرصدة لمواصلة إنشاء تقارير التحليل المتميزة.</p>
  <a href="{{credits_url}}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #7c3aed, #6366f1); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">شراء المزيد من الأرصدة</a>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
  <p style="color: #94a3b8; font-size: 12px;">© 2024 Planlyze. جميع الحقوق محفوظة.</p>
</div>''',
            'is_active': True
        },
        {
            'template_key': 'credit_deducted',
            'name': 'Credit Deducted',
            'subject_en': 'Premium Credit Used for Analysis',
            'subject_ar': 'تم استخدام رصيد متميز للتحليل',
            'body_en': '''<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 10px;">
  <h2 style="color: #ea580c;">Credit Used</h2>
  <p>Hi {{user_name}},</p>
  <p>A premium credit has been deducted from your account for the analysis: "<strong>{{business_idea}}</strong>".</p>
  <p><strong>Credits Remaining:</strong> {{remaining_credits}}</p>
  <a href="{{credits_url}}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #ea580c, #f97316); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">Manage Credits</a>
  <p style="color: #64748b; font-size: 14px;">Thank you for using Planlyze premium features!</p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
  <p style="color: #94a3b8; font-size: 12px;">© 2024 Planlyze. All rights reserved.</p>
</div>''',
            'body_ar': '''<div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 10px;">
  <h2 style="color: #ea580c;">تم استخدام الرصيد</h2>
  <p>مرحباً {{user_name}}،</p>
  <p>تم خصم رصيد متميز من حسابك للتحليل: "<strong>{{business_idea}}</strong>".</p>
  <p><strong>الأرصدة المتبقية:</strong> {{remaining_credits}}</p>
  <a href="{{credits_url}}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #ea580c, #f97316); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">إدارة الأرصدة</a>
  <p style="color: #64748b; font-size: 14px;">شكراً لاستخدامك ميزات Planlyze المتميزة!</p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
  <p style="color: #94a3b8; font-size: 12px;">© 2024 Planlyze. جميع الحقوق محفوظة.</p>
</div>''',
            'is_active': True
        },
        {
            'template_key': 'analysis_completed',
            'name': 'Analysis Completed',
            'subject_en': 'Your Analysis Report is Ready! 🎉',
            'subject_ar': 'تقرير التحليل الخاص بك جاهز! ',
            'body_en': '''<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 10px;">
  <h2 style="color: #7c3aed;">Analysis Complete!</h2>
  <p>Hi {{user_name}},</p>
  <p>Great news! Your business analysis report for "<strong>{{business_idea}}</strong>" is ready to view.</p>
  <a href="{{report_url}}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #7c3aed, #6366f1); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">View Your Report</a>
  <p style="color: #64748b; font-size: 14px;">If you have any questions, feel free to reach out to our support team.</p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
  <p style="color: #94a3b8; font-size: 12px;">© 2024 Planlyze. All rights reserved.</p>
</div>''',
            'body_ar': '''<div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 10px;">
  <h2 style="color: #7c3aed;">اكتمل التحليل!</h2>
  <p>مرحباً {{user_name}}،</p>
  <p>أخبار رائعة! تقرير تحليل عملك لـ "<strong>{{business_idea}}</strong>" جاهز للعرض.</p>
  <a href="{{report_url}}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #7c3aed, #6366f1); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">عرض تقريرك</a>
  <p style="color: #64748b; font-size: 14px;">إذا كان لديك أي أسئلة، لا تتردد في التواصل مع فريق الدعم لدينا.</p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
  <p style="color: #94a3b8; font-size: 12px;">© 2024 Planlyze. جميع الحقوق محفوظة.</p>
</div>''',
            'is_active': True
        },
        {
            'template_key': 'referral_bonus_referrer',
            'name': 'Referral Bonus - Referrer',
            'subject_en': 'You Earned a Referral Bonus! 🎉',
            'subject_ar': 'لقد حصلت على مكافأة إحالة! 🎉',
            'body_en': '''<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 10px;">
  <h2 style="color: #22c55e;">Congratulations! You Earned a Bonus!</h2>
  <p>Hi {{referrer_name}},</p>
  <p>Great news! <strong>{{referred_email}}</strong> just signed up using your referral code.</p>
  <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0;">
    <p style="color: white; margin: 0; font-size: 14px;">You earned</p>
    <p style="color: white; margin: 10px 0; font-size: 36px; font-weight: bold;">+1 Credit</p>
  </div>
  <p style="color: #64748b; font-size: 14px;">Keep sharing your referral code to earn more credits!</p>
  <p><strong>Your Referral Code:</strong> {{referral_code}}</p>
  <a href="{{referrals_url}}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #7c3aed, #6366f1); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">View Your Referrals</a>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
  <p style="color: #94a3b8; font-size: 12px;">© 2024 Planlyze. All rights reserved.</p>
</div>''',
            'body_ar': '''<div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 10px;">
  <h2 style="color: #22c55e;">تهانينا! لقد حصلت على مكافأة!</h2>
  <p>مرحباً {{referrer_name}}،</p>
  <p>أخبار رائعة! <strong>{{referred_email}}</strong> قام للتو بالتسجيل باستخدام رمز الإحالة الخاص بك.</p>
  <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0;">
    <p style="color: white; margin: 0; font-size: 14px;">لقد حصلت على</p>
    <p style="color: white; margin: 10px 0; font-size: 36px; font-weight: bold;">+1 رصيد</p>
  </div>
  <p style="color: #64748b; font-size: 14px;">استمر في مشاركة رمز الإحالة الخاص بك لكسب المزيد من الأرصدة!</p>
  <p><strong>رمز الإحالة الخاص بك:</strong> {{referral_code}}</p>
  <a href="{{referrals_url}}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #7c3aed, #6366f1); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">عرض إحالاتك</a>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
  <p style="color: #94a3b8; font-size: 12px;">© 2024 Planlyze. جميع الحقوق محفوظة.</p>
</div>''',
            'is_active': True
        },
        {
            'template_key': 'referral_bonus_referred',
            'name': 'Referral Bonus - New User',
            'subject_en': 'Welcome! You Got a Bonus Credit! 🎁',
            'subject_ar': 'مرحباً! حصلت على رصيد إضافي! 🎁',
            'body_en': '''<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 10px;">
  <h2 style="color: #7c3aed;">Welcome to Planlyze!</h2>
  <p>Hi {{referred_name}},</p>
  <p>You signed up using a referral code from <strong>{{referrer_email}}</strong> and received a bonus credit!</p>
  <div style="background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%); padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0;">
    <p style="color: white; margin: 0; font-size: 14px;">Your Welcome Bonus</p>
    <p style="color: white; margin: 10px 0; font-size: 36px; font-weight: bold;">+1 Credit</p>
  </div>
  <p style="color: #64748b; font-size: 14px;">Use your credit to create your first AI-powered business analysis!</p>
  <a href="{{analysis_url}}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #ea580c, #f97316); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">Start Your First Analysis</a>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
  <p style="color: #94a3b8; font-size: 12px;">© 2024 Planlyze. All rights reserved.</p>
</div>''',
            'body_ar': '''<div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 10px;">
  <h2 style="color: #7c3aed;">مرحباً بك في Planlyze!</h2>
  <p>مرحباً {{referred_name}}،</p>
  <p>لقد قمت بالتسجيل باستخدام رمز إحالة من <strong>{{referrer_email}}</strong> وحصلت على رصيد إضافي!</p>
  <div style="background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%); padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0;">
    <p style="color: white; margin: 0; font-size: 14px;">مكافأة الترحيب الخاصة بك</p>
    <p style="color: white; margin: 10px 0; font-size: 36px; font-weight: bold;">+1 رصيد</p>
  </div>
  <p style="color: #64748b; font-size: 14px;">استخدم رصيدك لإنشاء أول تحليل أعمال مدعوم بالذكاء الاصطناعي!</p>
  <a href="{{analysis_url}}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #ea580c, #f97316); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">ابدأ تحليلك الأول</a>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
  <p style="color: #94a3b8; font-size: 12px;">© 2024 Planlyze. جميع الحقوق محفوظة.</p>
</div>''',
            'is_active': True
        }
    ]
    
    for template_data in templates_data:
        existing = EmailTemplate.query.filter_by(template_key=template_data['template_key']).first()
        if existing:
            existing.name = template_data['name']
            existing.subject_en = template_data['subject_en']
            existing.subject_ar = template_data['subject_ar']
            existing.body_en = template_data['body_en']
            existing.body_ar = template_data['body_ar']
            existing.is_active = template_data['is_active']
            print(f"Updated email template: {template_data['template_key']}")
        else:
            template = EmailTemplate(**template_data)
            db.session.add(template)
            print(f"Created email template: {template_data['template_key']}")
    
    db.session.commit()
    print("Email templates seeded successfully!")

def run_seed():
    """Run all seed operations"""
    app = create_app()
    with app.app_context():
        print("Starting seed process...")
        seed_roles()
        seed_credit_packages()
        seed_payment_methods()
        seed_email_templates()
        
        super_admin_email = os.environ.get('SUPER_ADMIN_EMAIL', 'admin@planlyze.com')
        super_admin_password = os.environ.get('SUPER_ADMIN_PASSWORD', 'Admin@123')
        
        create_super_admin(
            email=super_admin_email,
            password=super_admin_password,
            full_name="Super Admin"
        )
        
        print("\nSeed completed successfully!")
        print(f"Super Admin Email: {super_admin_email}")
        print(f"Super Admin Password: {super_admin_password}")

if __name__ == '__main__':
    run_seed()
