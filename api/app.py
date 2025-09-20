import os
import sys

# Ensure backend is importable
repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
backend_dir = os.path.join(repo_root, 'backend')
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Import Vercel-optimized backend
try:
    from vercel_main import app as flask_app
    print("✅ Successfully imported Vercel-optimized backend")
    # Test if the app has the required routes
    has_routes = any(rule.rule.startswith('/api/') for rule in flask_app.url_map.iter_rules())
    if not has_routes:
        raise ImportError("Imported app has no API routes")
except ImportError as e:
    print(f"⚠️  Warning: Could not import Vercel-optimized backend: {e}")
    print("   Falling back to basic Flask app")
    
    # Fallback to basic Flask app if imports fail
    from flask import Flask, jsonify
    from flask_cors import CORS
    
    flask_app = Flask(__name__)
    CORS(flask_app)
    
    @flask_app.route('/api/health')
    def health_check():
        return jsonify({
            'status': 'healthy', 
            'environment': 'vercel',
            'note': 'Basic Flask app - backend imports failed'
        })
    
    @flask_app.route('/api/documents')
    def get_documents():
        return jsonify({
            'documents': [],
            'message': 'Fallback mode - full backend not available'
        })
    
    @flask_app.route('/api/analyses')
    def get_analyses():
        return jsonify({
            'analyses': [],
            'message': 'Fallback mode - full backend not available'
        })
    
    @flask_app.route('/api/integrations/onedrive/status')
    def onedrive_status():
        return jsonify({
            'configured': False,
            'user_connected': False,
            'message': 'Fallback mode - OneDrive not available'
        })

# Vercel expects a callable named `app`
app = flask_app

# Add CORS headers for Vercel
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# Additional health check endpoint
@app.route('/api/vercel-health')
def vercel_health():
    return jsonify({
        'status': 'healthy',
        'environment': 'vercel',
        'backend_type': 'vercel-optimized' if 'vercel_main' in sys.modules else 'basic-fallback'
    })
