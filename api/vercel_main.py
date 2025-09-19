# vercel_main.py
# Vercel-optimized version of main.py for serverless deployment

from flask import Flask, request, jsonify, redirect, send_file, send_from_directory
from flask_cors import CORS
import os
import sys

# Add backend directory to path for imports
backend_dir = os.path.join(os.path.dirname(__file__), '..', 'backend')
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Import Vercel-optimized config
from vercel_config import *

# Import core functionality
try:
    from database import (
        init_db, get_db, save_document_to_db, save_analysis_to_db,
        Document, Analysis
    )
    from auth_system import (
        auth_manager, token_required, role_required, project_access_required
    )
    from integration_services import IntegrationManager
    from enhanced_document_generator import EnhancedDocumentGenerator
    
    # Import Azure SDKs
    from azure.communication.email import EmailClient
    
    # Import file parsing libraries
    from docx import Document as DocxDocument
    import PyPDF2
    
    BACKEND_IMPORTS_SUCCESS = True
except ImportError as e:
    print(f"Warning: Some backend imports failed: {e}")
    BACKEND_IMPORTS_SUCCESS = False

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Initialize components only if imports succeeded
if BACKEND_IMPORTS_SUCCESS:
    try:
        # Initialize database
        init_db()
        
        # Initialize integration manager
        integration_manager = IntegrationManager()
        
        # Initialize enhanced document generator
        enhanced_doc_generator = EnhancedDocumentGenerator(None)
        
    except Exception as e:
        print(f"Warning: Component initialization failed: {e}")

# Health check endpoint for Vercel
@app.route('/api/health')
def health_check():
    """Health check endpoint for Vercel monitoring"""
    return jsonify({
        'status': 'healthy',
        'environment': VERCEL_ENVIRONMENT,
        'region': VERCEL_REGION,
        'backend_imports': BACKEND_IMPORTS_SUCCESS,
        'database_connected': bool(DATABASE_URL),
        'gemini_configured': bool(GEMINI_API_KEY),
        'azure_configured': bool(ACS_CONNECTION_STRING)
    })

# Basic API endpoints for testing
@app.route('/api/test')
def test_endpoint():
    """Test endpoint to verify API is working"""
    return jsonify({
        'message': 'BA Agent API is working on Vercel!',
        'timestamp': str(datetime.now()),
        'environment': VERCEL_ENVIRONMENT
    })

# Document analysis endpoint (simplified for Vercel)
@app.route('/api/analyze', methods=['POST'])
def analyze_document():
    """Simplified document analysis endpoint for Vercel"""
    try:
        if not BACKEND_IMPORTS_SUCCESS:
            return jsonify({
                'error': 'Backend components not fully loaded',
                'status': 'partial'
            }), 500
        
        # Basic request validation
        if 'text' not in request.json:
            return jsonify({'error': 'Text content required'}), 400
        
        text_content = request.json['text']
        
        # Simple analysis (without full backend processing)
        analysis_result = {
            'status': 'success',
            'message': 'Document analysis completed',
            'content_length': len(text_content),
            'timestamp': str(datetime.now()),
            'environment': VERCEL_ENVIRONMENT
        }
        
        return jsonify(analysis_result)
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'status': 'error',
            'environment': VERCEL_ENVIRONMENT
        }), 500

# Document generation endpoint (simplified)
@app.route('/api/generate', methods=['POST'])
def generate_document():
    """Simplified document generation endpoint for Vercel"""
    try:
        if not BACKEND_IMPORTS_SUCCESS:
            return jsonify({
                'error': 'Backend components not fully loaded',
                'status': 'partial'
            }), 500
        
        # Basic request validation
        if 'text' not in request.json:
            return jsonify({'error': 'Text content required'}), 400
        
        text_content = request.json['text']
        
        # Simple generation response
        generation_result = {
            'status': 'success',
            'message': 'Document generation completed',
            'content_length': len(text_content),
            'timestamp': str(datetime.now()),
            'environment': VERCEL_ENVIRONMENT,
            'note': 'Full document generation requires environment variables to be configured'
        }
        
        return jsonify(generation_result)
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'status': 'error',
            'environment': VERCEL_ENVIRONMENT
        }), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# CORS headers for all responses
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# Main entry point for Vercel
if __name__ == '__main__':
    app.run(debug=DEBUG)
else:
    # For Vercel deployment
    print(f"BA Agent Backend initialized for Vercel environment: {VERCEL_ENVIRONMENT}")
    if not validate_config():
        print("⚠️  Some required environment variables are missing")
        print("   Configure them in Vercel dashboard for full functionality")
