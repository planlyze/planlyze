from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import uuid

db = SQLAlchemy()

def generate_uuid():
    return str(uuid.uuid4())

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(255))
    role = db.Column(db.String(50), default='user')
    credits = db.Column(db.Integer, default=0)
    referral_code = db.Column(db.String(50), unique=True)
    referred_by = db.Column(db.String(50))
    language = db.Column(db.String(10), default='en')
    profile_image = db.Column(db.Text)
    # onboarding fields removed
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'full_name': self.full_name,
            'role': self.role,
            'credits': self.credits,
            'referral_code': self.referral_code,
            'referred_by': self.referred_by,
            'language': self.language,
            'profile_image': self.profile_image,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Analysis(db.Model):
    __tablename__ = 'analyses'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_email = db.Column(db.String(255), db.ForeignKey('users.email'), nullable=False)
    business_idea = db.Column(db.Text, nullable=False)
    industry = db.Column(db.String(255))
    target_market = db.Column(db.String(255))
    location = db.Column(db.String(255))
    budget = db.Column(db.String(100))
    status = db.Column(db.String(50), default='pending')
    report = db.Column(db.JSON)
    executive_summary = db.Column(db.Text)
    market_analysis = db.Column(db.JSON)
    financial_projections = db.Column(db.JSON)
    risk_assessment = db.Column(db.JSON)
    recommendations = db.Column(db.JSON)
    score = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_email': self.user_email,
            'business_idea': self.business_idea,
            'industry': self.industry,
            'target_market': self.target_market,
            'location': self.location,
            'budget': self.budget,
            'status': self.status,
            'report': self.report,
            'executive_summary': self.executive_summary,
            'market_analysis': self.market_analysis,
            'financial_projections': self.financial_projections,
            'risk_assessment': self.risk_assessment,
            'recommendations': self.recommendations,
            'score': self.score,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Transaction(db.Model):
    __tablename__ = 'transactions'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_email = db.Column(db.String(255), db.ForeignKey('users.email'), nullable=False)
    type = db.Column(db.String(50), nullable=False)
    credits = db.Column(db.Integer, nullable=False)
    amount_usd = db.Column(db.Float)
    description = db.Column(db.Text)
    reference_id = db.Column(db.String(255))
    status = db.Column(db.String(50), default='completed')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_email': self.user_email,
            'type': self.type,
            'credits': self.credits,
            'amount_usd': self.amount_usd,
            'description': self.description,
            'reference_id': self.reference_id,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class CreditPackage(db.Model):
    __tablename__ = 'credit_packages'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(255), nullable=False)
    credits = db.Column(db.Integer, nullable=False)
    price_usd = db.Column(db.Float, nullable=False)
    description = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    is_popular = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'credits': self.credits,
            'price_usd': self.price_usd,
            'description': self.description,
            'is_active': self.is_active,
            'is_popular': self.is_popular,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Payment(db.Model):
    __tablename__ = 'payments'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_email = db.Column(db.String(255), db.ForeignKey('users.email'), nullable=False)
    amount_usd = db.Column(db.Float, nullable=False)
    credits = db.Column(db.Integer, nullable=False)
    payment_method = db.Column(db.String(100))
    payment_proof = db.Column(db.Text)
    status = db.Column(db.String(50), default='pending')
    notes = db.Column(db.Text)
    approved_by = db.Column(db.String(255))
    approved_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_email': self.user_email,
            'amount_usd': self.amount_usd,
            'credits': self.credits,
            'payment_method': self.payment_method,
            'payment_proof': self.payment_proof,
            'status': self.status,
            'notes': self.notes,
            'approved_by': self.approved_by,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class EmailTemplate(db.Model):
    __tablename__ = 'email_templates'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    template_key = db.Column(db.String(100), unique=True, nullable=False)
    name = db.Column(db.String(255), nullable=False)
    subject_en = db.Column(db.String(255))
    subject_ar = db.Column(db.String(255))
    body_en = db.Column(db.Text)
    body_ar = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'template_key': self.template_key,
            'name': self.name,
            'subject_en': self.subject_en,
            'subject_ar': self.subject_ar,
            'body_en': self.body_en,
            'body_ar': self.body_ar,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class PaymentMethod(db.Model):
    __tablename__ = 'payment_methods'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(255), nullable=False)
    type = db.Column(db.String(100))
    details = db.Column(db.JSON)
    instructions = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'type': self.type,
            'details': self.details,
            'instructions': self.instructions,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class DiscountCode(db.Model):
    __tablename__ = 'discount_codes'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    code = db.Column(db.String(50), unique=True, nullable=False)
    discount_percent = db.Column(db.Integer)
    discount_amount = db.Column(db.Float)
    max_uses = db.Column(db.Integer)
    used_count = db.Column(db.Integer, default=0)
    valid_from = db.Column(db.DateTime)
    valid_until = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'code': self.code,
            'discount_percent': self.discount_percent,
            'discount_amount': self.discount_amount,
            'max_uses': self.max_uses,
            'used_count': self.used_count,
            'valid_from': self.valid_from.isoformat() if self.valid_from else None,
            'valid_until': self.valid_until.isoformat() if self.valid_until else None,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Role(db.Model):
    __tablename__ = 'roles'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(100), unique=True, nullable=False)
    permissions = db.Column(db.JSON)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'permissions': self.permissions,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    action_type = db.Column(db.String(100), nullable=False)
    user_email = db.Column(db.String(255))
    performed_by = db.Column(db.String(255))
    description = db.Column(db.Text)
    meta_data = db.Column(db.JSON)
    entity_id = db.Column(db.String(255))
    entity_type = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'action_type': self.action_type,
            'user_email': self.user_email,
            'performed_by': self.performed_by,
            'description': self.description,
            'meta_data': self.meta_data,
            'entity_id': self.entity_id,
            'entity_type': self.entity_type,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class ActivityFeed(db.Model):
    __tablename__ = 'activity_feed'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_email = db.Column(db.String(255))
    action_type = db.Column(db.String(100), nullable=False)
    title = db.Column(db.String(255))
    description = db.Column(db.Text)
    meta_data = db.Column(db.JSON)
    is_public = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_email': self.user_email,
            'action_type': self.action_type,
            'title': self.title,
            'description': self.description,
            'metadata': self.metadata,
            'is_public': self.is_public,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Notification(db.Model):
    __tablename__ = 'notifications'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_email = db.Column(db.String(255), nullable=False)
    type = db.Column(db.String(100))
    title = db.Column(db.String(255))
    message = db.Column(db.Text)
    is_read = db.Column(db.Boolean, default=False)
    meta_data = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_email': self.user_email,
            'type': self.type,
            'title': self.title,
            'message': self.message,
            'is_read': self.is_read,
            'meta_data': self.meta_data,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class ReportShare(db.Model):
    __tablename__ = 'report_shares'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    analysis_id = db.Column(db.String(36), db.ForeignKey('analyses.id'), nullable=False)
    share_token = db.Column(db.String(100), unique=True, nullable=False)
    created_by = db.Column(db.String(255))
    is_active = db.Column(db.Boolean, default=True)
    expires_at = db.Column(db.DateTime)
    access_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'analysis_id': self.analysis_id,
            'share_token': self.share_token,
            'created_by': self.created_by,
            'is_active': self.is_active,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'access_count': self.access_count,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class ChatConversation(db.Model):
    __tablename__ = 'chat_conversations'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_email = db.Column(db.String(255), nullable=False)
    analysis_id = db.Column(db.String(36), db.ForeignKey('analyses.id'))
    title = db.Column(db.String(255))
    messages = db.Column(db.JSON, default=list)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_email': self.user_email,
            'analysis_id': self.analysis_id,
            'title': self.title,
            'messages': self.messages,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Referral(db.Model):
    __tablename__ = 'referrals'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    referrer_email = db.Column(db.String(255), nullable=False)
    referred_email = db.Column(db.String(255), nullable=False)
    referral_code = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(50), default='pending')
    rewarded_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'referrer_email': self.referrer_email,
            'referred_email': self.referred_email,
            'referral_code': self.referral_code,
            'status': self.status,
            'rewarded_at': self.rewarded_at.isoformat() if self.rewarded_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
