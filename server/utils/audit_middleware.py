import time
import json
from flask import request, g
import jwt
import os

SENSITIVE_FIELDS = [
    'password', 'token', 'secret', 'api_key', 'apikey', 'authorization',
    'access_token', 'refresh_token', 'jwt', 'credit_card', 'card_number',
    'cvv', 'ssn', 'social_security', 'pin', 'otp', 'verification_code'
]

SENSITIVE_HEADERS = [
    'authorization', 'x-api-key', 'cookie', 'set-cookie'
]

EXCLUDED_PATHS = [
    '/api/health', '/api/ping', '/api/apidocs', '/flasgger_static',
    '/static', '/assets', '/_next', '/favicon.ico'
]

EXCLUDED_EXTENSIONS = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2']

MAX_BODY_SIZE = 10000


def mask_sensitive_data(data, depth=0):
    if depth > 10:
        return '[MAX_DEPTH]'
    
    if isinstance(data, dict):
        masked = {}
        for key, value in data.items():
            if any(sensitive in key.lower() for sensitive in SENSITIVE_FIELDS):
                masked[key] = '[MASKED]'
            else:
                masked[key] = mask_sensitive_data(value, depth + 1)
        return masked
    elif isinstance(data, list):
        return [mask_sensitive_data(item, depth + 1) for item in data[:50]]
    elif isinstance(data, str) and len(data) > 1000:
        return data[:1000] + '...[TRUNCATED]'
    else:
        return data


def mask_headers(headers):
    masked = {}
    for key, value in headers.items():
        if any(sensitive in key.lower() for sensitive in SENSITIVE_HEADERS):
            masked[key] = '[MASKED]'
        else:
            masked[key] = value
    return masked


def should_log_request(path):
    if any(path.startswith(excluded) for excluded in EXCLUDED_PATHS):
        return False
    
    if any(path.endswith(ext) for ext in EXCLUDED_EXTENSIONS):
        return False
    
    return True


def truncate_body(body, max_size=MAX_BODY_SIZE):
    if body is None:
        return None
    
    if isinstance(body, str):
        if len(body) > max_size:
            return body[:max_size] + '...[TRUNCATED]'
        return body
    
    if isinstance(body, dict):
        body_str = json.dumps(body)
        if len(body_str) > max_size:
            return {'_truncated': True, '_message': f'Body exceeds {max_size} chars'}
        return body
    
    return body


def get_user_from_token():
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None, None
    
    token = auth_header[7:]
    try:
        secret = os.environ.get('JWT_SECRET_KEY', os.environ.get('SECRET_KEY', 'dev-secret'))
        payload = jwt.decode(token, secret, algorithms=['HS256'])
        return payload.get('email'), payload.get('role')
    except:
        return None, None


def get_request_body():
    try:
        if request.content_type and 'application/json' in request.content_type:
            data = request.get_json(silent=True)
            if data:
                return mask_sensitive_data(data)
        elif request.form:
            return mask_sensitive_data(dict(request.form))
        return None
    except:
        return None


def setup_audit_logging(app):
    from server.models import ApiRequestLog, db
    
    @app.before_request
    def before_request():
        g.start_time = time.time()
        g.request_body = get_request_body()
    
    @app.after_request
    def after_request(response):
        if not should_log_request(request.path):
            return response
        
        try:
            execution_time = (time.time() - getattr(g, 'start_time', time.time())) * 1000
            
            user_email, user_role = get_user_from_token()
            
            response_body = None
            try:
                if response.content_type and 'application/json' in response.content_type:
                    response_data = response.get_json(silent=True)
                    if response_data:
                        response_body = mask_sensitive_data(response_data)
                        response_body = truncate_body(response_body)
            except:
                pass
            
            error_message = None
            if response.status_code >= 400:
                try:
                    error_data = response.get_json(silent=True)
                    if error_data and 'error' in error_data:
                        error_message = str(error_data.get('error', ''))[:500]
                except:
                    pass
            
            log = ApiRequestLog(
                method=request.method,
                path=request.path,
                full_url=request.url[:2000] if request.url else None,
                query_params=dict(request.args) if request.args else None,
                request_headers=mask_headers(dict(request.headers)),
                request_body=truncate_body(getattr(g, 'request_body', None)),
                response_status=response.status_code,
                response_body=response_body,
                user_email=user_email,
                user_role=user_role,
                ip_address=request.remote_addr or request.headers.get('X-Forwarded-For', '')[:50],
                user_agent=request.headers.get('User-Agent', '')[:500],
                execution_time_ms=round(execution_time, 2),
                error_message=error_message
            )
            db.session.add(log)
            db.session.commit()
            
        except Exception as e:
            print(f"Audit logging error: {e}")
            try:
                db.session.rollback()
            except:
                pass
        
        return response
    
    return app
