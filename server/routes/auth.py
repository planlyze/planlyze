from flask import Blueprint, request, jsonify
from server.models import db, User
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
    data = request.get_json()
    
    email = data.get('email')
    password = data.get('password')
    full_name = data.get('full_name', '')
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400
    
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({'error': 'Email already registered'}), 400
    
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    user = User(
        email=email,
        password_hash=password_hash,
        full_name=full_name,
        referral_code=generate_referral_code(),
        credits=3  # Initial free credits
    )
    
    db.session.add(user)
    db.session.commit()
    
    token = create_token(user.id, user.email)
    
    return jsonify({
        'token': token,
        'user': user.to_dict()
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400
    
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'Invalid email or password'}), 401
    
    if not bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
        return jsonify({'error': 'Invalid email or password'}), 401
    
    if not user.is_active:
        return jsonify({'error': 'Account is deactivated'}), 401
    
    token = create_token(user.id, user.email)
    
    return jsonify({
        'token': token,
        'user': user.to_dict()
    })

@auth_bp.route('/me', methods=['GET'])
def get_me():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Not authenticated'}), 401
    
    return jsonify(user.to_dict())

@auth_bp.route('/me', methods=['PUT'])
def update_me():
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
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.get_json()
    current_password = data.get('current_password')
    new_password = data.get('new_password')
    
    if not current_password or not new_password:
        return jsonify({'error': 'Current and new password are required'}), 400
    
    if not bcrypt.checkpw(current_password.encode('utf-8'), user.password_hash.encode('utf-8')):
        return jsonify({'error': 'Current password is incorrect'}), 401
    
    user.password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    db.session.commit()
    
    return jsonify({'message': 'Password changed successfully'})

@auth_bp.route('/logout', methods=['POST'])
def logout():
    return jsonify({'message': 'Logged out successfully'})
