# vercel_main.py
# Vercel-optimized Flask backend for BA Agent

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
import sqlite3
import json
import uuid
from datetime import datetime

# Disable Qdrant for Vercel deployment
os.environ['QDRANT_ENABLED'] = 'false'

# Import Vercel configuration
from vercel_config import (
    DATABASE_URL, GEMINI_API_KEY, GEMINI_API_URL,
    ACS_CONNECTION_STRING, ACS_SENDER_ADDRESS,
    DEBUG, validate_config
)

app = Flask(__name__)
CORS(app)

# Validate configuration
validate_config()

# Initialize SQLite database for Vercel
def init_sqlite_db():
    """Initialize SQLite database for Vercel deployment"""
    try:
        conn = sqlite3.connect('ba_agent.db')
        cursor = conn.cursor()
        
        # Create documents table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS documents (
                id TEXT PRIMARY KEY,
                user_email TEXT DEFAULT 'guest',
                name TEXT NOT NULL,
                file_type TEXT NOT NULL,
                upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                file_path TEXT NOT NULL,
                content TEXT,
                meta TEXT,
                status TEXT DEFAULT 'uploaded'
            )
        ''')
        
        # Create analyses table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS analyses (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'completed',
                original_text TEXT,
                results TEXT,
                document_id TEXT,
                user_email TEXT
            )
        ''')
        
        conn.commit()
        conn.close()
        print("✅ SQLite database initialized successfully")
    except Exception as e:
        print(f"❌ Error initializing SQLite database: {e}")

# Initialize database on startup
init_sqlite_db()

# --- Health Check Routes ---
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'environment': 'vercel',
        'database_configured': bool(DATABASE_URL),
        'gemini_configured': bool(GEMINI_API_KEY)
    })

@app.route('/api/vercel-health', methods=['GET'])
def vercel_health():
    return jsonify({
        'status': 'healthy',
        'environment': 'vercel',
        'backend_type': 'vercel-optimized'
    })

# --- Document Management Routes ---
@app.route('/api/documents', methods=['GET'])
def get_documents():
    """Get all documents from SQLite database"""
    try:
        conn = sqlite3.connect('ba_agent.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, name, file_type, upload_date, status, user_email, meta
            FROM documents 
            ORDER BY upload_date DESC 
            LIMIT 50
        ''')
        
        documents = []
        for row in cursor.fetchall():
            doc_id, name, file_type, upload_date, status, user_email, meta_str = row
            
            # Parse meta if it exists
            meta = {}
            if meta_str:
                try:
                    meta = json.loads(meta_str)
                except:
                    meta = {}
            
            documents.append({
                'id': doc_id,
                'name': name,
                'file_type': file_type,
                'upload_date': upload_date,
                'status': status,
                'user_email': user_email,
                'meta': meta
            })
        
        conn.close()
        return jsonify({
            'documents': documents,
            'total': len(documents)
        })
    except Exception as e:
        return jsonify({
            'error': 'Failed to retrieve documents',
            'details': str(e),
            'documents': []
        }), 500

@app.route('/api/analyses', methods=['GET'])
def get_analyses():
    """Get all analyses from SQLite database"""
    try:
        conn = sqlite3.connect('ba_agent.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, title, date, status, document_id, user_email
            FROM analyses 
            ORDER BY date DESC 
            LIMIT 50
        ''')
        
        analyses = []
        for row in cursor.fetchall():
            analysis_id, title, date, status, document_id, user_email = row
            
            analyses.append({
                'id': analysis_id,
                'title': title,
                'date': date,
                'status': status,
                'document_id': document_id,
                'user_email': user_email
            })
        
        conn.close()
        return jsonify({
            'analyses': analyses,
            'total': len(analyses)
        })
    except Exception as e:
        return jsonify({
            'error': 'Failed to retrieve analyses',
            'details': str(e),
            'analyses': []
        }), 500

# --- Generation Routes ---
@app.route('/api/generate', methods=['POST'])
def generate_content():
    """Content generation using Gemini API"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        prompt = data.get('prompt', '')
        if not prompt:
            return jsonify({'error': 'No prompt provided'}), 400
        
        # Import requests for API calls
        import requests
        
        # Prepare Gemini API request
        headers = {
            'Content-Type': 'application/json',
        }
        
        payload = {
            "contents": [{
                "parts": [{
                    "text": prompt
                }]
            }]
        }
        
        # Make request to Gemini API
        response = requests.post(
            f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
            headers=headers,
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            
            # Extract the generated text
            if 'candidates' in result and len(result['candidates']) > 0:
                candidate = result['candidates'][0]
                if 'content' in candidate and 'parts' in candidate['content']:
                    generated_text = candidate['content']['parts'][0]['text']
                    return jsonify({
                        'generated_content': generated_text,
                        'status': 'success'
                    })
            
            return jsonify({
                'error': 'Unexpected response format from Gemini API',
                'details': result
            }), 500
        else:
            return jsonify({
                'error': f'Gemini API error: {response.status_code}',
                'details': response.text
            }), 500
            
    except Exception as e:
        return jsonify({
            'error': 'Failed to generate content',
            'details': str(e)
        }), 500

# --- OneDrive Integration Routes ---
@app.route('/api/integrations/onedrive/status', methods=['GET'])
def onedrive_status():
    """Check OneDrive integration status"""
    return jsonify({
        'configured': False,
        'user_connected': False,
        'message': 'OneDrive integration not yet configured for Vercel deployment'
    })

@app.route('/api/integrations/onedrive/auth', methods=['GET'])
def onedrive_auth():
    """OneDrive authentication endpoint"""
    return jsonify({
        'auth_url': None,
        'message': 'OneDrive authentication not yet implemented for Vercel deployment'
    })

@app.route('/api/integrations/onedrive/files', methods=['GET'])
def onedrive_files():
    """Get OneDrive files"""
    return jsonify({
        'files': [],
        'message': 'OneDrive file access not yet implemented for Vercel deployment'
    })

# --- Mermaid Rendering Routes ---
@app.route('/api/render_mermaid', methods=['POST'])
def render_mermaid():
    """Render Mermaid diagrams"""
    try:
        data = request.get_json()
        if not data or 'code' not in data:
            return jsonify({'error': 'No Mermaid code provided'}), 400
        
        # For now, return placeholder response
        return jsonify({
            'message': 'Mermaid rendering not yet implemented for Vercel deployment',
            'code': data.get('code')
        }), 501
    except Exception as e:
        return jsonify({
            'error': 'Failed to render Mermaid diagram',
            'details': str(e)
        }), 500

# --- Error Handlers ---
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'Not Found',
        'message': 'The requested API endpoint does not exist',
        'available_endpoints': [
            '/api/health',
            '/api/vercel-health',
            '/api/documents',
            '/api/analyses',
            '/api/generate',
            '/api/integrations/onedrive/status',
            '/api/integrations/onedrive/auth',
            '/api/integrations/onedrive/files',
            '/api/render_mermaid'
        ]
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'error': 'Internal Server Error',
        'message': 'An unexpected error occurred'
    }), 500

# --- Development Server ---
if __name__ == '__main__':
    print("Starting Vercel-optimized BA Agent Backend...")
    print("Available endpoints:")
    for rule in app.url_map.iter_rules():
        print(f"  {rule.rule} [{', '.join(rule.methods - {'HEAD', 'OPTIONS'})}]")
    
    app.run(debug=DEBUG, port=5000, host='0.0.0.0')