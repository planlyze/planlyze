import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime
from server.app import create_app
from server.models import SocialMedia, db, User, Role, CreditPackage, PaymentMethod, EmailTemplate, SystemSettings, Partner, SeedVersion
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

SEED_VERSIONS = {
    'roles': 1,
    'credit_packages': 1,
    'payment_methods': 1,
    'email_templates': 1,
    'system_settings': 1,
    'partners': 1,
    'social_media' : 1,
}

def get_applied_version(seed_name):
    try:
        record = SeedVersion.query.filter_by(seed_name=seed_name).first()
        return record.version if record else 0
    except Exception:
        return 0

def set_applied_version(seed_name, version):
    record = SeedVersion.query.filter_by(seed_name=seed_name).first()
    if record:
        record.version = version
        record.applied_at = datetime.utcnow()
    else:
        record = SeedVersion(seed_name=seed_name, version=version)
        db.session.add(record)
    db.session.commit()

def should_run_seed(seed_name):
    current_version = SEED_VERSIONS.get(seed_name, 1)
    applied_version = get_applied_version(seed_name)
    return applied_version < current_version

def seed_roles():
    if not should_run_seed('roles'):
        print("Roles seed already applied (version up to date), skipping...")
        return
    
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
        if not existing_role:
            role = Role(
                name=role_data['name'],
                description=role_data['description'],
                permissions=role_data['permissions']
            )
            db.session.add(role)
            print(f"Created role: {role_data['name']}")
        else:
            print(f"Role already exists: {role_data['name']}")
    
    db.session.commit()
    set_applied_version('roles', SEED_VERSIONS['roles'])
    print("Roles seeded successfully!")

def create_super_admin(email, password=None, full_name="Super Admin"):
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
    if not should_run_seed('credit_packages'):
        print("Credit packages seed already applied (version up to date), skipping...")
        return
    
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
    
    for pkg_data in packages_data:
        existing = CreditPackage.query.filter_by(name=pkg_data['name']).first()
        if not existing:
            package = CreditPackage(**pkg_data)
            db.session.add(package)
            print(f"Created credit package: {pkg_data['name']}")
        else:
            print(f"Credit package already exists: {pkg_data['name']}")
    
    db.session.commit()
    set_applied_version('credit_packages', SEED_VERSIONS['credit_packages'])
    print("Credit packages seeded successfully!")

def seed_payment_methods():
    if not should_run_seed('payment_methods'):
        print("Payment methods seed already applied (version up to date), skipping...")
        return
    
    methods_data = [
        {
            'name': 'Bank Transfer',
            'name_ar': 'تحويل بنكي',
            'type': 'bank_transfer',
            'details': {
                'bank_name': 'Example Bank',
                'account_name': 'Planlyze LLC',
                'account_number': '1234567890',
                'iban': 'XX00XXXX0000000000000000',
                'swift': 'EXAMPLEXXX'
            },
            'instructions': 'Please transfer the exact amount to our bank account and upload the receipt as proof of payment.',           
            'instructions_ar': 'AR Please transfer the exact amount to our bank account and upload the receipt as proof of payment.',           
            'is_active': True
        }
    ]
    
    for method_data in methods_data:
        existing = PaymentMethod.query.filter_by(name=method_data['name']).first()
        if not existing:
            method = PaymentMethod(**method_data)
            db.session.add(method)
            print(f"Created payment method: {method_data['name']}")
        else:
            print(f"Payment method already exists: {method_data['name']}")
    
    db.session.commit()
    set_applied_version('payment_methods', SEED_VERSIONS['payment_methods'])
    print("Payment methods seeded successfully!")

def seed_email_templates():
    if not should_run_seed('email_templates'):
        print("Email templates seed already applied (version up to date), skipping...")
        return
    
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
            'subject_en': 'Running Low on Credits',
            'subject_ar': 'رصيدك ينفد',
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
            'subject_en': 'Your Analysis Report is Ready!',
            'subject_ar': 'تقرير التحليل الخاص بك جاهز!',
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
            'subject_en': 'You Earned a Referral Bonus!',
            'subject_ar': 'لقد حصلت على مكافأة إحالة!',
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
            'subject_en': 'Welcome! You Got a Bonus Credit!',
            'subject_ar': 'مرحباً! حصلت على رصيد إضافي!',
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
        },
        {
            'template_key': 'payment_approved',
            'name': 'Payment Approved',
            'subject_en': 'Payment Approved - Credits Added!',
            'subject_ar': 'تم الموافقة على الدفع - تمت إضافة الأرصدة!',
            'body_en': '''<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 10px;">
  <h2 style="color: #22c55e;">Payment Approved!</h2>
  <p>Hi {{user_name}},</p>
  <p>Your payment has been approved and credits have been added to your account.</p>
  <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0;">
    <p style="color: white; margin: 0; font-size: 14px;">Credits Added</p>
    <p style="color: white; margin: 10px 0; font-size: 36px; font-weight: bold;">+{{credits}} Credits</p>
  </div>
  <p><strong>New Balance:</strong> {{total_credits}} credits</p>
  <a href="{{dashboard_url}}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #7c3aed, #6366f1); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">Go to Dashboard</a>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
  <p style="color: #94a3b8; font-size: 12px;">© 2024 Planlyze. All rights reserved.</p>
</div>''',
            'body_ar': '''<div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 10px;">
  <h2 style="color: #22c55e;">تم الموافقة على الدفع!</h2>
  <p>مرحباً {{user_name}}،</p>
  <p>تم الموافقة على دفعتك وتمت إضافة الأرصدة إلى حسابك.</p>
  <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0;">
    <p style="color: white; margin: 0; font-size: 14px;">الأرصدة المضافة</p>
    <p style="color: white; margin: 10px 0; font-size: 36px; font-weight: bold;">+{{credits}} رصيد</p>
  </div>
  <p><strong>الرصيد الجديد:</strong> {{total_credits}} رصيد</p>
  <a href="{{dashboard_url}}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #7c3aed, #6366f1); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">الذهاب إلى لوحة التحكم</a>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
  <p style="color: #94a3b8; font-size: 12px;">© 2024 Planlyze. جميع الحقوق محفوظة.</p>
</div>''',
            'is_active': True
        },
        {
            'template_key': 'payment_rejected',
            'name': 'Payment Rejected',
            'subject_en': 'Payment Request Update',
            'subject_ar': 'تحديث طلب الدفع',
            'body_en': '''<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 10px;">
  <h2 style="color: #ef4444;">Payment Not Approved</h2>
  <p>Hi {{user_name}},</p>
  <p>Unfortunately, your payment request could not be approved.</p>
  <p><strong>Reason:</strong> {{rejection_reason}}</p>
  <p>Please submit a new payment request with the correct information.</p>
  <a href="{{credits_url}}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #7c3aed, #6366f1); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">Try Again</a>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
  <p style="color: #94a3b8; font-size: 12px;">© 2024 Planlyze. All rights reserved.</p>
</div>''',
            'body_ar': '''<div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 10px;">
  <h2 style="color: #ef4444;">لم تتم الموافقة على الدفع</h2>
  <p>مرحباً {{user_name}}،</p>
  <p>للأسف، لم نتمكن من الموافقة على طلب الدفع الخاص بك.</p>
  <p><strong>السبب:</strong> {{rejection_reason}}</p>
  <p>يرجى تقديم طلب دفع جديد بالمعلومات الصحيحة.</p>
  <a href="{{credits_url}}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #7c3aed, #6366f1); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">حاول مرة أخرى</a>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
  <p style="color: #94a3b8; font-size: 12px;">© 2024 Planlyze. جميع الحقوق محفوظة.</p>
</div>''',
            'is_active': True
        },
        {
            'template_key': 'email_verification',
            'name': 'Email Verification',
            'subject_en': 'Verify Your Planlyze Account',
            'subject_ar': 'تأكيد حساب Planlyze الخاص بك',
            'body_en': '''<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 10px;">
  <h2 style="color: #7c3aed;">Welcome to Planlyze!</h2>
  <p>Hi {{user_name}},</p>
  <p>Thank you for signing up! Please verify your email address to activate your account.</p>
  <a href="{{verification_url}}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #7c3aed, #6366f1); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">Verify Email</a>
  <p style="color: #64748b; font-size: 14px;">This link will expire in 24 hours.</p>
  <p style="color: #64748b; font-size: 14px;">If you didn't create an account, please ignore this email.</p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
  <p style="color: #94a3b8; font-size: 12px;">© 2024 Planlyze. All rights reserved.</p>
</div>''',
            'body_ar': '''<div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 10px;">
  <h2 style="color: #7c3aed;">مرحباً بك في Planlyze!</h2>
  <p>مرحباً {{user_name}}،</p>
  <p>شكراً لتسجيلك! يرجى تأكيد عنوان بريدك الإلكتروني لتفعيل حسابك.</p>
  <a href="{{verification_url}}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #7c3aed, #6366f1); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">تأكيد البريد الإلكتروني</a>
  <p style="color: #64748b; font-size: 14px;">سينتهي هذا الرابط خلال 24 ساعة.</p>
  <p style="color: #64748b; font-size: 14px;">إذا لم تقم بإنشاء حساب، يرجى تجاهل هذا البريد الإلكتروني.</p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
  <p style="color: #94a3b8; font-size: 12px;">© 2024 Planlyze. جميع الحقوق محفوظة.</p>
</div>''',
            'is_active': True
        }
    ]
    
    for template_data in templates_data:
        existing = EmailTemplate.query.filter_by(template_key=template_data['template_key']).first()
        if not existing:
            template = EmailTemplate(**template_data)
            db.session.add(template)
            print(f"Created email template: {template_data['template_key']}")
        else:
            print(f"Email template already exists: {template_data['template_key']}")
    
    db.session.commit()
    set_applied_version('email_templates', SEED_VERSIONS['email_templates'])
    print("Email templates seeded successfully!")

def seed_system_settings():
    if not should_run_seed('system_settings'):
        print("System settings seed already applied (version up to date), skipping...")
        return
    
    settings_data = [
        {
            'key': 'syrian_apps_count',
            'value': '150',
            'description': 'Number of Syrian apps to display on landing page statistics'
        }
    ]
    
    for setting_data in settings_data:
        existing = SystemSettings.query.filter_by(key=setting_data['key']).first()
        if not existing:
            setting = SystemSettings(**setting_data)
            db.session.add(setting)
            print(f"Created system setting: {setting_data['key']}")
        else:
            print(f"System setting already exists: {setting_data['key']}")
    
    db.session.commit()
    set_applied_version('system_settings', SEED_VERSIONS['system_settings'])
    print("System settings seeded successfully!")

def seed_partners():
    if not should_run_seed('partners'):
        print("Partners seed already applied (version up to date), skipping...")
        return
    
    partners_data = []
    
    for partner_data in partners_data:
        existing = Partner.query.filter_by(name=partner_data['name']).first()
        if not existing:
            partner = Partner(**partner_data)
            db.session.add(partner)
            print(f"Created partner: {partner_data['name']}")
        else:
            print(f"Partner already exists: {partner_data['name']}")
    
    db.session.commit()
    set_applied_version('partners', SEED_VERSIONS['partners'])
    print("Partners seeded successfully!")

def seed_social_media():
    if not should_run_seed('social_media'):
        print("Social media seed already applied (version up to date), skipping...")
        return

    social_media_data = [
        { 
            'platform': "Facebook",
            'url': "https://facebook.com/planlyze",
            'icon': "Facebook",            
            'display_order': 1,
            'is_active': True
        },
        { 
            'platform': "Linkedin",
            'url': "https://www.linkedin.com/company/planlyzeco",
            'icon': "Linkedin",            
            'display_order': 2,
            'is_active': True
        },
        { 
            'platform': "Instagram",
            'url': "https://instagram.com/planlyze",
            'icon': "Instagram",            
            'display_order': 3,
            'is_active': True
        },
        {
            'platform': "Whatsapp",
            'url': "https://chat.whatsapp.com/IP3RfknGF262dWfB9u1Cjt",
            'icon': "MessageCircle",            
            'display_order': 4,
            'hover_color' :"hover:bg-blue-500 hover:border-blue-500",
            'is_active': True
        },
        { 
            'platform': "Telegram",
            'url': "https://t.me/planlyze",
            'icon': "Send",            
            'display_order': 1,
            'hover_color': "hover:bg-blue-500 hover:border-blue-500",
            'is_active': True
        }
    ]

    for social_media_data in social_media_data:
        existing = SocialMedia.query.filter_by(platform=social_media_data['platform']).first()
        if not existing:
            social_media = SocialMedia(**social_media_data)
            db.session.add(social_media)
            print(f"Created social media: {social_media_data['platform']}")
        else:
            print(f"Social media already exists: {social_media_data['platform']}")

    db.session.commit()
    set_applied_version('social_media', SEED_VERSIONS['social_media'])
    print("Social media seeded successfully!")    

def run_seed():
    """Run all seed operations with versioning"""
    app = create_app()
    with app.app_context():
        print("Starting seed process with versioning...")
        print("=" * 50)
        
        db.create_all()
        
        seed_roles()
        seed_credit_packages()
        seed_payment_methods()
        seed_email_templates()
        seed_system_settings()
        seed_partners()
        seed_social_media()
        
        admin_email = os.environ.get('ADMIN_EMAIL', 'admin@planlyze.com')
        admin_password = os.environ.get('ADMIN_PASSWORD', 'Admin@123')
        existing_admin = User.query.filter_by(email=admin_email).first()
        if not existing_admin:
            create_super_admin(admin_email, admin_password, "Super Admin")
        else:
            print(f"Admin user already exists: {admin_email}")
        
        print("=" * 50)
        print("Seed process completed!")
        
        versions = SeedVersion.query.all()
        print("\nApplied seed versions:")
        for v in versions:
            print(f"  - {v.seed_name}: v{v.version} (applied: {v.applied_at})")

if __name__ == '__main__':
    run_seed()
