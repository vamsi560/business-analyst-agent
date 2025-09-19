# vercel_config.py
# Vercel-optimized configuration for BA Agent backend

import os
from dotenv import load_dotenv

# Load environment variables (Vercel will provide these)
load_dotenv()


# Database Configuration
DATABASE_URL = 'postgresql+psycopg2://bauser:Valuemomentum123@baagent.postgres.database.azure.com:5432/ba_agent'

# Qdrant Vector Database Configuration
QDRANT_ENABLED = True
QDRANT_HOST = 'localhost'
QDRANT_PORT = 6333

# Azure Configuration
ACS_CONNECTION_STRING = 'endpoint=https://baagentacs123.india.communication.azure.com/;accesskey=3NFm6rs3wKyuP2B5BljzjkjGlWUC7SXWIilVOiHlF0jlpJQ8PiQ6JQQJ99BIACULyCpAhliiAAAAAZCSEmoo'
ACS_SENDER_ADDRESS = 'DoNotReply@0a996688-51d4-48e5-a65c-ad35a83a9c77.azurecomm.net'
APPROVAL_RECIPIENT_EMAIL = 'Raghavendra.Lakkamaraju@valuemomentum.com'
BACKEND_BASE_URL = 'https://your-project.vercel.app'

# Azure DevOps Configuration
ADO_ORGANIZATION_URL = 'https://dev.azure.com/prayankagochipatula/'
ADO_PROJECT_NAME = 'Backstage'
ADO_PAT = 'DHDzeRhCouK9QI5q2q0cgu7OJpwKU7bJzkwvq2HxZhOquS4qkdxUJQQJ99BIACAAAAAAhliiAAASAZDO39lF'

# Gemini API Configuration
GEMINI_API_KEY = 'AIzaSyA5_KnR58T2MTG4oOvBeAqbd8idJCdOlRA'
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

# Lucid Integration
LUCID_ENABLED = False
LUCID_API_KEY = ''
LUCID_TEAM_ID = ''
LUCID_BASE_URL = 'https://api.lucid.co'

# Vercel-specific configurations
VERCEL_ENVIRONMENT = 'production'
VERCEL_REGION = 'iad1'

# File storage configuration for Vercel
# Since Vercel doesn't support persistent file storage, we'll use Azure Blob Storage
AZURE_STORAGE_CONNECTION_STRING = ''
AZURE_STORAGE_CONTAINER_NAME = 'ba-agent-files'

# Debug mode (disabled in production)
DEBUG = False

# Validate required environment variables
def validate_config():
    """Validate that all required environment variables are set"""
    required_vars = [
        'DATABASE_URL',
        'GEMINI_API_KEY',
        'ACS_CONNECTION_STRING',
        'ACS_SENDER_ADDRESS'
    ]
    
    missing_vars = []
    for var in required_vars:
        if not globals().get(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"WARNING: Missing required environment variables: {missing_vars}")
        print("These will need to be set in Vercel dashboard for full functionality")
    
    return len(missing_vars) == 0

# Validate configuration on import
if __name__ == "__main__":
    validate_config()
else:
    # Only validate in production
    if VERCEL_ENVIRONMENT == 'production':
        validate_config()
