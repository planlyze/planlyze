"""
Response wrapper and utilities for consistent API responses.
"""
from flask import jsonify
from datetime import datetime


class APIResponse:
    """Wrapper for consistent API responses"""
    
    @staticmethod
    def success(data=None, message="Success", status_code=200):
        """Return a successful response"""
        response = {
            'success': True,
            'message': message,
            'timestamp': datetime.utcnow().isoformat(),
        }
        if data is not None:
            response['data'] = data
        return jsonify(response), status_code

    @staticmethod
    def error(message, status_code=400, error_code=None, details=None):
        """Return an error response"""
        response = {
            'success': False,
            'error': message,
            'error_code': error_code or 'ERROR',
            'timestamp': datetime.utcnow().isoformat(),
        }
        if details:
            response['details'] = details
        return jsonify(response), status_code

    @staticmethod
    def paginated(data, page, per_page, total, message="Success"):
        """Return a paginated response"""
        response = {
            'success': True,
            'message': message,
            'data': data,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': (total + per_page - 1) // per_page
            },
            'timestamp': datetime.utcnow().isoformat(),
        }
        return jsonify(response), 200
