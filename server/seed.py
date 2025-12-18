import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from server.app import create_app
from server.models import db, User, Role, CreditPackage, PaymentMethod
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
            'credits': 10,
            'price_usd': 9.99,
            'description': 'Perfect for trying out the platform',
            'is_active': True,
            'is_popular': False
        },
        {
            'name': 'Basic',
            'credits': 25,
            'price_usd': 19.99,
            'description': 'Great for small businesses',
            'is_active': True,
            'is_popular': False
        },
        {
            'name': 'Professional',
            'credits': 50,
            'price_usd': 34.99,
            'description': 'Best value for growing businesses',
            'is_active': True,
            'is_popular': True
        },
        {
            'name': 'Enterprise',
            'credits': 100,
            'price_usd': 59.99,
            'description': 'For serious entrepreneurs and teams',
            'is_active': True,
            'is_popular': False
        },
        {
            'name': 'Ultimate',
            'credits': 250,
            'price_usd': 129.99,
            'description': 'Maximum value for power users',
            'is_active': True,
            'is_popular': False
        }
    ]
    
    for pkg_data in packages_data:
        existing = CreditPackage.query.filter_by(name=pkg_data['name']).first()
        if existing:
            existing.credits = pkg_data['credits']
            existing.price_usd = pkg_data['price_usd']
            existing.description = pkg_data['description']
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

def run_seed():
    """Run all seed operations"""
    app = create_app()
    with app.app_context():
        print("Starting seed process...")
        seed_roles()
        seed_credit_packages()
        seed_payment_methods()
        
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
