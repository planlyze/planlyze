"""
Application configuration management.
Supports multiple environments (development, testing, production).
"""
import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Base configuration"""
    # Flask
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = False
    TESTING = False
    
    # Database
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False
    
    # JWT
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = int(os.environ.get('JWT_ACCESS_TOKEN_EXPIRES', 86400))  # 24 hours
    
    # External Services
    ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY')
    
    # CORS
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')
    
    # Pagination
    ITEMS_PER_PAGE = int(os.environ.get('ITEMS_PER_PAGE', 20))


class DevelopmentConfig(Config):
    """Development environment configuration"""
    DEBUG = True
    SQLALCHEMY_ECHO = True


class TestingConfig(Config):
    """Testing environment configuration"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'


class ProductionConfig(Config):
    """Production environment configuration"""
    DEBUG = False
    # In production, all secrets must be provided via environment variables


def get_config(env=None):
    """Get configuration object based on environment"""
    if env is None:
        env = os.environ.get('FLASK_ENV', 'development')
    
    config_map = {
        'development': DevelopmentConfig,
        'testing': TestingConfig,
        'production': ProductionConfig,
    }
    
    return config_map.get(env, DevelopmentConfig)
