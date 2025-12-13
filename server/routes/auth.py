from flask import Blueprint, request, jsonify
from server.models import db, User
from server.utils.translations import get_message
import bcrypt
import jwt
import os
from datetime import datetime, timedelta
import uuid

auth_bp = Blueprint('auth', __name__)

JWT_SECRET = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
JWT_EXPIRES = 86400  # 24 hours

def generate_referral_code():
    return uuid.uuid4().hex[:8].upper()

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
        default: en
        description: Language code (en or ar)
    responses:
      201:
        description: User registered successfully
      400:
        description: Invalid input or user already exists
    """
    data = request.get_json()
    lang = request.headers.get('Accept-Language', 'en')
    
    email = data.get('email')
    password = data.get('password')
    full_name = data.get('full_name', '')
    
    if not email or not password:
        return jsonify({
            'error': get_message('auth.email_required' if not email else 'auth.password_required', lang)
        }), 400
    
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({'error': get_message('auth.user_exists', lang)}), 400
    
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    user = User(
        email=email,
        password_hash=password_hash,
        full_name=full_name,
        referral_code=generate_referral_code(),
        credits=3,  # Initial free credits
        language=lang
    )
    
    db.session.add(user)
    db.session.commit()
    
    token = create_token(user.id, user.email)
    
    return jsonify({
        'message': get_message('auth.register_success', lang),
        'token': token,
        'user': user.to_dict()
    }), 201

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
    """
    data = request.get_json()
    lang = request.headers.get('Accept-Language', 'en')
    
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
        return jsonify({'error': 'Account is deactivated'}), 401
    
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
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Not authenticated'}), 401
    
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
            language:
              type: string
              enum: [en, ar]
            profile_image:
              type: string
    responses:
      200:
        description: User profile updated successfully
      401:
        description: Not authenticated
    """
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.get_json()
    
    if 'full_name' in data:
        user.full_name = data['full_name']
    if 'language' in data:
        user.language = data['language']
    if 'profile_image' in data:
        user.profile_image = data['profile_image']
    
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
    user = get_current_user()
    lang = request.headers.get('Accept-Language', 'en')
    
    if not user:
        return jsonify({'error': get_message('auth.not_authenticated', lang)}), 401
    
    data = request.get_json()
    current_password = data.get('current_password')
    new_password = data.get('new_password')
    
    if not current_password or not new_password:
        return jsonify({'error': 'Current and new password are required'}), 400
    
    if not bcrypt.checkpw(current_password.encode('utf-8'), user.password_hash.encode('utf-8')):
        return jsonify({'error': 'Current password is incorrect'}), 401
    
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
    return jsonify({'message': 'Logged out successfully'})
