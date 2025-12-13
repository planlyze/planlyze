"""
WSGI application for Planlyze
This file is used for running the Flask app and migrations
"""
import sys
import os
from server.app import app

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3000))
    app.run(host='0.0.0.0', port=port, debug=True)
