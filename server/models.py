from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import uuid

db = SQLAlchemy()

def generate_uuid():
    return str(uuid.uuid4())

def default_notification_preferences():
    return {
        'email_notifications': True,
        'analysis_complete': True,
        'analysis_failed': True,
        'credits_low': True,
        'credits_purchased': True,
        'payment_approved': True,
        'payment_rejected': True,
        'system': True
    }

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(255))
    display_name = db.Column(db.String(255))
    role_id = db.Column(db.String(36), db.ForeignKey('roles.id'))
    credits = db.Column(db.Integer, default=0)
    referral_code = db.Column(db.String(50), unique=True)
    referred_by = db.Column(db.String(50))
    language = db.Column(db.String(10), default='en')
    profile_image = db.Column(db.Text)
    phone_number = db.Column(db.String(50))
    country = db.Column(db.String(100))
    city = db.Column(db.String(100))
    notification_preferences = db.Column(db.JSON, default=default_notification_preferences)
    email_verified = db.Column(db.Boolean, default=False)
    verification_token = db.Column(db.String(100))
    verification_token_expires = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)
    last_login = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    role = db.relationship('Role', backref=db.backref('users', lazy='dynamic'))
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'full_name': self.full_name,
            'display_name': self.display_name,
            'role': self.role.name if self.role else 'user',
            'role_id': self.role_id,
            'permissions': self.role.permissions if self.role else {},
            'credits': self.credits,
            'referral_code': self.referral_code,
            'referred_by': self.referred_by,
            'language': self.language,
            'profile_image': self.profile_image,
            'phone_number': self.phone_number,
            'country': self.country,
            'city': self.city,
            'notification_preferences': self.notification_preferences or {},
            'email_verified': self.email_verified,
            'is_active': self.is_active,
            'last_login': self.last_login.isoformat() if self.last_login else None,
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
    report_type = db.Column(db.String(20), default='free')  # 'free' or 'premium'
    report_language = db.Column(db.String(20), default='english')  # 'english' or 'arabic'
    pending_transaction_id = db.Column(db.String(36), db.ForeignKey('transactions.id'))
    last_error = db.Column(db.Text)  # Store error message on failure
    report = db.Column(db.JSON)
    executive_summary = db.Column(db.Text)
    market_analysis = db.Column(db.JSON)
    financial_projections = db.Column(db.JSON)
    risk_assessment = db.Column(db.JSON)
    recommendations = db.Column(db.JSON)
    score = db.Column(db.Integer)
    is_deleted = db.Column(db.Boolean, default=False)
    deleted_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Tab-specific data fields (generated separately via Claude API)
    tab_overview = db.Column(db.JSON)
    tab_market = db.Column(db.JSON)
    tab_business = db.Column(db.JSON)
    tab_technical = db.Column(db.JSON)
    tab_financial = db.Column(db.JSON)
    tab_strategy = db.Column(db.JSON)
    
    # Relationship to pending transaction
    pending_transaction = db.relationship('Transaction', foreign_keys=[pending_transaction_id])
    
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
            'report_type': self.report_type,
            'report_language': self.report_language,
            'pending_transaction_id': self.pending_transaction_id,
            'last_error': self.last_error,
            'report': self.report,
            'executive_summary': self.executive_summary,
            'market_analysis': self.market_analysis,
            'financial_projections': self.financial_projections,
            'risk_assessment': self.risk_assessment,
            'recommendations': self.recommendations,
            'score': self.score,
            'is_deleted': self.is_deleted,
            'deleted_at': self.deleted_at.isoformat() if self.deleted_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'tab_overview': self.tab_overview,
            'tab_market': self.tab_market,
            'tab_business': self.tab_business,
            'tab_technical': self.tab_technical,
            'tab_financial': self.tab_financial,
            'tab_strategy': self.tab_strategy
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
    name_ar = db.Column(db.String(255))
    credits = db.Column(db.Integer, nullable=False)
    price_usd = db.Column(db.Float, nullable=False)
    description = db.Column(db.Text)
    description_ar = db.Column(db.Text)
    features = db.Column(db.JSON, default=list)
    features_ar = db.Column(db.JSON, default=list)
    is_active = db.Column(db.Boolean, default=True)
    is_popular = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'name_en': self.name,
            'name_ar': self.name_ar,
            'credits': self.credits,
            'price_usd': self.price_usd,
            'description': self.description,
            'description_en': self.description,
            'description_ar': self.description_ar,
            'features': self.features or [],
            'features_en': self.features or [],
            'features_ar': self.features_ar or [],
            'is_active': self.is_active,
            'is_popular': self.is_popular,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Payment(db.Model):
    __tablename__ = 'payments'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_email = db.Column(db.String(255), db.ForeignKey('users.email'), nullable=False)
    amount_usd = db.Column(db.Float, nullable=False)
    original_amount = db.Column(db.Float)
    credits = db.Column(db.Integer, nullable=False)
    payment_method = db.Column(db.String(100))
    payment_proof = db.Column(db.Text)
    discount_code = db.Column(db.String(100))
    discount_amount = db.Column(db.Float)
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
            'original_amount': self.original_amount,
            'credits': self.credits,
            'payment_method': self.payment_method,
            'payment_proof': self.payment_proof,
            'discount_code': self.discount_code,
            'discount_amount': self.discount_amount,
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
        details = self.details or {}
        return {
            'id': self.id,
            'name': self.name,
            'name_en': details.get('name_en') or self.name,
            'name_ar': details.get('name_ar'),
            'logo_url': details.get('logo_url'),
            'description': details.get('description'),
            'sort_order': details.get('sort_order', 0),
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
    description_en = db.Column(db.Text)
    description_ar = db.Column(db.Text)
    min_purchase_amount = db.Column(db.Float, default=0)
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
            'description_en': self.description_en,
            'description_ar': self.description_ar,
            'min_purchase_amount': self.min_purchase_amount or 0,
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
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'permissions': self.permissions,
            'description': self.description,
            'is_active': self.is_active if self.is_active is not None else True,
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

class ApiRequestLog(db.Model):
    __tablename__ = 'api_request_logs'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    method = db.Column(db.String(10), nullable=False)
    path = db.Column(db.String(500), nullable=False)
    full_url = db.Column(db.String(2000))
    query_params = db.Column(db.JSON)
    request_headers = db.Column(db.JSON)
    request_body = db.Column(db.JSON)
    response_status = db.Column(db.Integer)
    response_body = db.Column(db.JSON)
    user_email = db.Column(db.String(255))
    user_role = db.Column(db.String(100))
    ip_address = db.Column(db.String(50))
    user_agent = db.Column(db.String(500))
    execution_time_ms = db.Column(db.Float)
    error_message = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'method': self.method,
            'path': self.path,
            'full_url': self.full_url,
            'query_params': self.query_params,
            'request_headers': self.request_headers,
            'request_body': self.request_body,
            'response_status': self.response_status,
            'response_body': self.response_body,
            'user_email': self.user_email,
            'user_role': self.user_role,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'execution_time_ms': self.execution_time_ms,
            'error_message': self.error_message,
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

class SystemSettings(db.Model):
    __tablename__ = 'system_settings'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    key = db.Column(db.String(100), unique=True, nullable=False)
    value = db.Column(db.Text)
    description = db.Column(db.String(255))
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'key': self.key,
            'value': self.value,
            'description': self.description,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Partner(db.Model):
    __tablename__ = 'partners'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(255), nullable=False)
    name_ar = db.Column(db.String(255))
    logo_url = db.Column(db.Text)
    website_url = db.Column(db.Text)
    color = db.Column(db.String(10), default='6B46C1')
    display_order = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'name_ar': self.name_ar,
            'logo_url': self.logo_url,
            'website_url': self.website_url,
            'color': self.color,
            'display_order': self.display_order,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class SeedVersion(db.Model):
    __tablename__ = 'seed_versions'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    seed_name = db.Column(db.String(100), unique=True, nullable=False)
    version = db.Column(db.Integer, default=1)
    applied_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'seed_name': self.seed_name,
            'version': self.version,
            'applied_at': self.applied_at.isoformat() if self.applied_at else None
        }

class ContactMessage(db.Model):
    __tablename__ = 'contact_messages'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    email_sent = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'message': self.message,
            'is_read': self.is_read,
            'email_sent': self.email_sent,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class SocialMedia(db.Model):
    __tablename__ = 'social_media'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    platform = db.Column(db.String(50), nullable=False)
    url = db.Column(db.Text, nullable=False)
    icon = db.Column(db.String(50), nullable=False)
    hover_color = db.Column(db.String(100), default='hover:bg-orange-500 hover:border-orange-500')
    display_order = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'platform': self.platform,
            'url': self.url,
            'icon': self.icon,
            'hover_color': self.hover_color,
            'display_order': self.display_order,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
