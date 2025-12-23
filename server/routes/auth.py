from flask import Blueprint, request, jsonify
from server.models import db, User, Role, Referral, Notification, Transaction
from server.utils.translations import get_message, get_language
from server.services.email_service import (
    send_verification_email, 
    send_referral_bonus_email_to_referrer,
    send_referral_bonus_email_to_referred
)
import bcrypt
import jwt
import os
from datetime import datetime, timedelta
import uuid
import secrets

auth_bp = Blueprint('auth', __name__)

JWT_SECRET = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
JWT_EXPIRES = 86400  # 24 hours
APP_DOMAIN = os.environ.get('REPLIT_DEV_DOMAIN', os.environ.get('REPLIT_DOMAINS', 'localhost:5000'))

def generate_referral_code():
    return uuid.uuid4().hex[:8].upper()

def generate_verification_token():
    return str(secrets.randbelow(900000) + 100000)

def create_token(user_id, email):
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': datetime.utcnow() + timedelta(seconds=JWT_EXPIRES)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

def verify_token(token):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def get_current_user():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header.split(' ')[1]
    payload = verify_token(token)
    if not payload:
        return None
    
    user = User.query.filter_by(email=payload['email']).first()
    return user

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Register a new user
    ---
    tags:
      - Authentication
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            email:
              type: string
              example: user@example.com
            password:
              type: string
              example: securepassword123
            full_name:
              type: string
              example: John Doe
          required:
            - email
            - password
      - name: Accept-Language
        in: header
        type: string
        default: ar
        description: Language code (en or ar)
    responses:
      201:
        description: User registered successfully, verification email sent
      400:
        description: Invalid input or user already exists
    """
    data = request.get_json()
    lang = get_language(request.headers)
    
    email = data.get('email')
    password = data.get('password')
    full_name = data.get('full_name', '')
    referral_code = data.get('referral_code', '')
    
    if not email or not password:
        return jsonify({
            'error': get_message('auth.email_required' if not email else 'auth.password_required', lang)
        }), 400
    
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({'error': get_message('auth.user_exists', lang)}), 400
    
    referrer = None
    if referral_code:
        referrer = User.query.filter_by(referral_code=referral_code).first()
    
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    verification_token = generate_verification_token()
    verification_expires = datetime.utcnow() + timedelta(minutes=15)
    
    default_role = Role.query.filter_by(name='user').first()
    
    user = User(
        email=email,
        password_hash=password_hash,
        full_name=full_name,
        referral_code=generate_referral_code(),
        referred_by=referrer.email if referrer else None,
        role_id=default_role.id if default_role else None,
        credits=1 if referrer else 0,
        language=lang,
        email_verified=False,
        verification_token=verification_token,
        verification_token_expires=verification_expires
    )
    
    db.session.add(user)
    db.session.commit()
    
    if referrer:
        referrer.credits = (referrer.credits or 0) + 1
        
        referral_record = Referral(
            referrer_email=referrer.email,
            referred_email=user.email,
            referral_code=referral_code,
            status='completed'
        )
        db.session.add(referral_record)
        
        referrer_notification = Notification(
            user_email=referrer.email,
            type='referral_bonus',
            title=get_message('auth.referral_bonus_title', lang),
            message=get_message('auth.referral_bonus_message', lang).format(email=user.email),
            meta_data={'referred_email': user.email, 'credits_earned': 1}
        )
        db.session.add(referrer_notification)
        
        referred_notification = Notification(
            user_email=user.email,
            type='referral_welcome',
            title=get_message('auth.referral_welcome_title', lang),
            message=get_message('auth.referral_welcome_message', lang).format(email=referrer.email),
            meta_data={'referrer_email': referrer.email, 'credits_received': 1}
        )
        db.session.add(referred_notification)
        
        referrer_transaction = Transaction(
            user_email=referrer.email,
            type='referral_bonus',
            credits=1,
            amount_usd=0,
            description=f'Referral bonus: {user.email} signed up using your code',
            reference_id=referral_record.id,
            status='completed'
        )
        db.session.add(referrer_transaction)
        
        referred_transaction = Transaction(
            user_email=user.email,
            type='referral_welcome',
            credits=1,
            amount_usd=0,
            description=f'Welcome bonus: Signed up with referral from {referrer.email}',
            reference_id=referral_record.id,
            status='completed'
        )
        db.session.add(referred_transaction)
        
        db.session.commit()
        
        app_url = f"https://{APP_DOMAIN}"
        referrer_lang = referrer.language or 'en'
        
        send_referral_bonus_email_to_referrer(
            referrer_email=referrer.email,
            referrer_name=referrer.full_name,
            referred_email=user.email,
            referral_code=referrer.referral_code,
            app_url=app_url,
            lang=referrer_lang
        )
        
        send_referral_bonus_email_to_referred(
            referred_email=user.email,
            referred_name=full_name,
            referrer_email=referrer.email,
            app_url=app_url,
            lang=lang
        )
    
    email_sent = send_verification_email(email, full_name, verification_token, lang)
    
    return jsonify({
        'message': get_message('auth.register_success', lang),
        'email_sent': email_sent,
        'requires_verification': True
    }), 201

@auth_bp.route('/verify-email', methods=['POST'])
def verify_email():
    """
    Verify user email with OTP code
    ---
    tags:
      - Authentication
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            email:
              type: string
            code:
              type: string
          required:
            - email
            - code
      - name: Accept-Language
        in: header
        type: string
        default: en
    responses:
      200:
        description: Email verified successfully
      400:
        description: Invalid or expired code
    """
    data = request.get_json()
    lang = get_language(request.headers)
    email = data.get('email')
    code = data.get('code')
    
    if not email or not code:
        return jsonify({'error': get_message('auth.email_code_required', lang)}), 400
    
    user = User.query.filter_by(email=email).first()
    
    if not user:
        return jsonify({'error': get_message('auth.email_not_found', lang)}), 400
    
    if user.email_verified:
        return jsonify({'error': get_message('auth.email_already_verified', lang)}), 400
    
    if user.verification_token != code:
        return jsonify({'error': get_message('auth.invalid_code', lang)}), 400
    
    if user.verification_token_expires and user.verification_token_expires < datetime.utcnow():
        return jsonify({'error': get_message('auth.code_expired', lang)}), 400
    
    user.email_verified = True
    user.verification_token = None
    user.verification_token_expires = None
    db.session.commit()
    
    auth_token = create_token(user.id, user.email)
    
    return jsonify({
        'message': get_message('auth.email_verified', lang),
        'token': auth_token,
        'user': user.to_dict()
    })

@auth_bp.route('/resend-verification', methods=['POST'])
def resend_verification():
    """
    Resend verification email
    ---
    tags:
      - Authentication
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            email:
              type: string
          required:
            - email
      - name: Accept-Language
        in: header
        type: string
        default: en
    responses:
      200:
        description: Verification email resent
      400:
        description: Email not found or already verified
    """
    data = request.get_json()
    lang = get_language(request.headers)
    email = data.get('email')
    
    if not email:
        return jsonify({'error': get_message('auth.email_required', lang)}), 400
    
    user = User.query.filter_by(email=email).first()
    
    if not user:
        return jsonify({'error': get_message('auth.email_not_found', lang)}), 400
    
    if user.email_verified:
        return jsonify({'error': get_message('auth.email_already_verified', lang)}), 400
    
    verification_token = generate_verification_token()
    verification_expires = datetime.utcnow() + timedelta(minutes=15)
    
    user.verification_token = verification_token
    user.verification_token_expires = verification_expires
    db.session.commit()
    
    email_sent = send_verification_email(email, user.full_name, verification_token, lang)
    
    return jsonify({
        'message': get_message('auth.verification_sent', lang),
        'email_sent': email_sent
    })

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    User login
    ---
    tags:
      - Authentication
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            email:
              type: string
              example: user@example.com
            password:
              type: string
              example: securepassword123
          required:
            - email
            - password
      - name: Accept-Language
        in: header
        type: string
        default: en
        description: Language code (en or ar)
    responses:
      200:
        description: Login successful
      401:
        description: Invalid credentials or account deactivated
      403:
        description: Email not verified
    """
    data = request.get_json()
    lang = get_language(request.headers)
    
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': get_message('auth.email_required' if not email else 'auth.password_required', lang)}), 400
    
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': get_message('auth.invalid_credentials', lang)}), 401
    
    if not bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
        return jsonify({'error': get_message('auth.invalid_credentials', lang)}), 401
    
    if not user.is_active:
        return jsonify({'error': get_message('auth.account_deactivated', lang)}), 401
    
    if not user.email_verified:
        return jsonify({
            'error': get_message('auth.verify_email_first', lang),
            'requires_verification': True,
            'email': email
        }), 403
    
    user.last_login = datetime.utcnow()
    db.session.commit()
    
    token = create_token(user.id, user.email)
    
    return jsonify({
        'message': get_message('auth.login_success', lang),
        'token': token,
        'user': user.to_dict()
    })

@auth_bp.route('/me', methods=['GET'])
def get_me():
    """
    Get current user profile
    ---
    tags:
      - Authentication
    security:
      - Bearer: []
    responses:
      200:
        description: User profile retrieved successfully
      401:
        description: Not authenticated
    """
    lang = get_language(request.headers)
    user = get_current_user()
    if not user:
        return jsonify({'error': get_message('auth.not_authenticated', lang)}), 401
    
    return jsonify(user.to_dict())

@auth_bp.route('/me', methods=['PUT'])
def update_me():
    """
    Update current user profile
    ---
    tags:
      - Authentication
    security:
      - Bearer: []
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            full_name:
              type: string
            display_name:
              type: string
            language:
              type: string
              enum: [en, ar]
            profile_image:
              type: string
            phone_number:
              type: string
            country:
              type: string
            city:
              type: string
    responses:
      200:
        description: User profile updated successfully
      401:
        description: Not authenticated
    """
    lang = get_language(request.headers)
    user = get_current_user()
    if not user:
        return jsonify({'error': get_message('auth.not_authenticated', lang)}), 401
    
    data = request.get_json()
    
    if 'full_name' in data:
        user.full_name = data['full_name']
    if 'display_name' in data:
        user.display_name = data['display_name']
    if 'language' in data:
        user.language = data['language']
    if 'profile_image' in data:
        user.profile_image = data['profile_image']
    if 'phone_number' in data:
        user.phone_number = data['phone_number']
    if 'country' in data:
        user.country = data['country']
    if 'city' in data:
        user.city = data['city']
    if 'notification_preferences' in data:
        user.notification_preferences = data['notification_preferences']
    
    db.session.commit()
    
    return jsonify(user.to_dict())

@auth_bp.route('/change-password', methods=['POST'])
def change_password():
    """
    Change user password
    ---
    tags:
      - Authentication
    security:
      - Bearer: []
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            current_password:
              type: string
            new_password:
              type: string
          required:
            - current_password
            - new_password
      - name: Accept-Language
        in: header
        type: string
        default: en
    responses:
      200:
        description: Password changed successfully
      400:
        description: Missing required fields
      401:
        description: Invalid current password or not authenticated
    """
    lang = get_language(request.headers)
    user = get_current_user()
    
    if not user:
        return jsonify({'error': get_message('auth.not_authenticated', lang)}), 401
    
    data = request.get_json()
    current_password = data.get('current_password')
    new_password = data.get('new_password')
    
    if not current_password or not new_password:
        return jsonify({'error': get_message('auth.current_new_password_required', lang)}), 400
    
    if not bcrypt.checkpw(current_password.encode('utf-8'), user.password_hash.encode('utf-8')):
        return jsonify({'error': get_message('auth.current_password_incorrect', lang)}), 401
    
    user.password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    db.session.commit()
    
    return jsonify({'message': get_message('auth.password_changed', lang)})

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """
    User logout
    ---
    tags:
      - Authentication
    security:
      - Bearer: []
    responses:
      200:
        description: Logged out successfully
    """
    lang = get_language(request.headers)
    return jsonify({'message': get_message('auth.logout_success', lang)})
