import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from server.app import create_app
from server.models import db, User, Role
import bcrypt

def seed_roles():
    """Seed the roles table with default roles"""
    roles_data = [
        {
            'name': 'super_admin',
            'description': 'Super Administrator with full system access',
            'permissions': {
                'users': ['create', 'read', 'update', 'delete', 'manage_roles'],
                'analyses': ['create', 'read', 'update', 'delete', 'view_all'],
                'payments': ['create', 'read', 'update', 'delete', 'approve'],
                'settings': ['read', 'update'],
                'roles': ['create', 'read', 'update', 'delete'],
                'system': ['full_access']
            }
        },
        {
            'name': 'admin',
            'description': 'Administrator with management access',
            'permissions': {
                'users': ['read', 'update'],
                'analyses': ['read', 'view_all'],
                'payments': ['read', 'approve'],
                'settings': ['read'],
                'roles': ['read']
            }
        },
        {
            'name': 'user',
            'description': 'Regular user with basic access',
            'permissions': {
                'analyses': ['create', 'read', 'update', 'delete'],
                'payments': ['create', 'read'],
                'profile': ['read', 'update']
            }
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
    user = User.query.filter_by(email=email).first()
    
    if user:
        user.role = 'super_admin'
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
            role='super_admin',
            email_verified=True,
            is_active=True,
            credits=1000
        )
        db.session.add(user)
        print(f"Created super admin user: {email}")
    
    db.session.commit()
    return user

def run_seed():
    """Run all seed operations"""
    app = create_app()
    with app.app_context():
        print("Starting seed process...")
        seed_roles()
        
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
