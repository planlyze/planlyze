"""
Flask application factory and initialization.
"""
from flask import Flask, jsonify
from flask_cors import CORS
from flask_migrate import Migrate
from flasgger import Swagger
from .models import db
from server.config import get_config
from server.exceptions import APIException
from server.utils.response import APIResponse
import logging
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_app(config=None):
    """Application factory function"""
    app = Flask(__name__)
    
    # Load configuration
    if config is None:
        config = get_config(os.environ.get('FLASK_ENV', 'development'))
    app.config.from_object(config)
    
    # Initialize extensions
    db.init_app(app)
    migrate = Migrate(app, db)
    
    # Initialize Swagger for API documentation
    swagger = Swagger(app, template={
        "swagger": "2.0",
        "info": {
            "title": "Planlyze API",
            "description": "Professional Business Analysis Platform API",
            "version": "1.0.0",
            "contact": {
                "name": "Planlyze Support"
            }
        },
        "schemes": ["http", "https"],
        "basePath": "/api"
    })
    
    # Setup CORS
    CORS(app, origins=app.config['CORS_ORIGINS'], resources={
        r"/api/*": {
            "methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
    })
    
    # Register blueprints
    _register_blueprints(app)
    
    # Register error handlers
    _register_error_handlers(app)
    
    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health():
        """
        Health check endpoint
        ---
        responses:
          200:
            description: Server is healthy
            schema:
              properties:
                status:
                  type: string
                  example: healthy
        """
        return APIResponse.success({'status': 'healthy'}, message='Server is running')
    
    # Create database tables if they don't exist
    with app.app_context():
        db.create_all()
        logger.info("Database initialized")
    
    logger.info(f"Application created with {app.config.get('FLASK_ENV', 'development')} configuration")
    logger.info(f"Swagger UI available at http://localhost:3000/api/apidocs")
    
    return app
    
    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health():
        return APIResponse.success({'status': 'healthy'}, message='Server is running')
    
    # Create database tables if they don't exist
    with app.app_context():
        db.create_all()
        logger.info("Database initialized")
    
    logger.info(f"Application created with {app.config.get('FLASK_ENV', 'development')} configuration")
    logger.info(f"Swagger UI available at http://localhost:3000/api/docs")
    
    return app


def _register_blueprints(app):
    """Register all route blueprints"""
    from server.routes.auth import auth_bp
    from server.routes.entities import entities_bp
    from server.routes.ai import ai_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(entities_bp, url_prefix='/api')
    app.register_blueprint(ai_bp, url_prefix='/api/ai')
    
    logger.info("Blueprints registered successfully")


def _register_error_handlers(app):
    """Register error handlers for consistent error responses"""
    
    @app.errorhandler(APIException)
    def handle_api_exception(error):
        """Handle custom API exceptions"""
        response = error.to_dict()
        return jsonify(response), error.status_code
    
    @app.errorhandler(400)
    def handle_bad_request(error):
        """Handle 400 Bad Request"""
        return APIResponse.error("Bad request", status_code=400)
    
    @app.errorhandler(401)
    def handle_unauthorized(error):
        """Handle 401 Unauthorized"""
        return APIResponse.error("Unauthorized", status_code=401)
    
    @app.errorhandler(403)
    def handle_forbidden(error):
        """Handle 403 Forbidden"""
        return APIResponse.error("Forbidden", status_code=403)
    
    @app.errorhandler(404)
    def handle_not_found(error):
        """Handle 404 Not Found"""
        return APIResponse.error("Resource not found", status_code=404)
    
    @app.errorhandler(500)
    def handle_internal_error(error):
        """Handle 500 Internal Server Error"""
        logger.error(f"Internal server error: {str(error)}")
        return APIResponse.error("Internal server error", status_code=500)
    
    logger.info("Error handlers registered")
