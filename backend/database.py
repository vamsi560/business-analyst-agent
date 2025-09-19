# database.py
# Fresh Database Configuration for BA Agent

import os
import uuid
import json
from datetime import datetime
from sqlalchemy import create_engine, Column, String, DateTime, Text, Integer, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError
import psycopg2
from psycopg2.extras import RealDictCursor

# ============================================================================
# DATABASE CONFIGURATION
# ============================================================================

# PostgreSQL Configuration
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql+psycopg2://bauser:Valuemomentum123@baagent.postgres.database.azure.com:5432/ba_agent')

# Create SQLAlchemy engine and session
engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Qdrant Vector Database Configuration
QDRANT_ENABLED = os.getenv('QDRANT_ENABLED', 'true').lower() == 'true'
QDRANT_HOST = os.getenv('QDRANT_HOST', 'localhost')
QDRANT_PORT = int(os.getenv('QDRANT_PORT', 6333))
VECTOR_SIZE = 384

# Initialize Qdrant client
qdrant_client = None
embedding_model = None

if QDRANT_ENABLED:
    try:
        from qdrant_client import QdrantClient
        from qdrant_client.models import Distance, VectorParams, PointStruct
        
        # Test Qdrant connection first
        qdrant_client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)
        
        # Try to initialize embedding model with error handling
        try:
            from sentence_transformers import SentenceTransformer
            embedding_model = SentenceTransformer('all-MiniLM-L6-v2', device='cpu')
            print("✅ Qdrant vector database connected successfully with embeddings")
        except Exception as embedding_error:
            print(f"⚠️ Embedding model initialization failed: {embedding_error}")
            print("ℹ️ Qdrant will work without embeddings (text-only mode)")
            embedding_model = None
            
    except Exception as e:
        print(f"⚠️ Qdrant initialization failed: {e}")
        print("ℹ️ Falling back to text-only mode")
        qdrant_client = None
        embedding_model = None
else:
    print("ℹ️ Qdrant vector database disabled")

# ============================================================================
# DATABASE MODELS
# ============================================================================

class Document(Base):
    """Document model for storing uploaded files"""
    __tablename__ = "documents"
    
    id = Column(String, primary_key=True)
    user_email = Column(String, nullable=False, default="guest")
    name = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    upload_date = Column(DateTime, default=datetime.utcnow)
    file_path = Column(String, nullable=False)
    content = Column(Text)
    meta = Column(JSON)
    status = Column(String, default="uploaded")

class Analysis(Base):
    """Analysis model for storing analysis results"""
    __tablename__ = "analyses"
    
    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    date = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="completed")
    original_text = Column(Text)
    results = Column(JSON)
    document_id = Column(String)
    user_email = Column(String)

class Approval(Base):
    """Approval model for tracking approval workflow"""
    __tablename__ = "approvals"
    
    id = Column(String, primary_key=True)
    analysis_id = Column(String, nullable=False)
    status = Column(String, default="pending")  # pending, approved, rejected
    created_date = Column(DateTime, default=datetime.utcnow)
    updated_date = Column(DateTime, default=datetime.utcnow)
    approver_email = Column(String)
    results_summary = Column(JSON)
    approver_response = Column(String)
    ado_result = Column(JSON)

# ============================================================================
# DATABASE OPERATIONS
# ============================================================================

def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initialize database tables"""
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully")
        
        # Initialize Qdrant collections if enabled
        if qdrant_client:
            init_qdrant_collections()
            
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        raise e

def init_qdrant_collections():
    """Initialize Qdrant collections"""
    collections = ["documents", "analyses", "requirements"]
    
    for collection_name in collections:
        try:
            # Check if collection exists
            try:
                qdrant_client.get_collection(collection_name)
                print(f"Collection '{collection_name}' already exists")
            except Exception:
                # Create collection
                qdrant_client.create_collection(
                    collection_name=collection_name,
                    vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE)
                )
                print(f"Collection '{collection_name}' created successfully")
        except Exception as e:
            print(f"Error initializing collection '{collection_name}': {e}")

# ============================================================================
# DOCUMENT OPERATIONS
# ============================================================================

def save_document_to_db(db, user_email: str, file_name: str, file_type: str, file_path: str, file_content: str, meta: dict, status: str):
    """Save document to database"""
    try:
        # Use the ID from meta if available, otherwise generate new one
        doc_id = meta.get('id', str(uuid.uuid4()))
        
        new_doc = Document(
            id=doc_id,
            user_email=user_email,
            name=file_name,
            file_type=file_type,
            upload_date=datetime.utcnow(),
            file_path=file_path,
            content=file_content,
            meta=meta,
            status=status
        )
        db.add(new_doc)
        db.commit()
        print(f"✅ Document saved to database: {new_doc.id}")
        return new_doc
    except Exception as e:
        print(f"❌ Failed to save document: {e}")
        db.rollback()
        return None

def get_all_documents_from_db(db):
    """Get all documents from database"""
    try:
        documents = db.query(Document).order_by(Document.upload_date.desc()).all()
        return [
            {
                'id': doc.id,
                'name': doc.name,
                'file_type': doc.file_type,
                'upload_date': doc.upload_date.isoformat(),
                'file_path': doc.file_path,
                'content': doc.content,
                'meta': doc.meta,
                'status': doc.status,
                'user_email': doc.user_email
            }
            for doc in documents
        ]
    except Exception as e:
        print(f"❌ Error getting documents: {e}")
        return []

def get_document_by_id(db, doc_id: str):
    """Get document by ID"""
    try:
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if doc:
            return {
                'id': doc.id,
                'name': doc.name,
                'file_type': doc.file_type,
                'upload_date': doc.upload_date.isoformat(),
                'file_path': doc.file_path,
                'content': doc.content,
                'meta': doc.meta,
                'status': doc.status,
                'user_email': doc.user_email
            }
        return None
    except Exception as e:
        print(f"❌ Error getting document: {e}")
        return None

def check_document_exists_by_name(db, filename: str):
    """Check if document exists by name"""
    try:
        doc = db.query(Document).filter(Document.name == filename).first()
        return doc is not None
    except Exception as e:
        print(f"❌ Error checking document existence: {e}")
        return False

# ============================================================================
# ANALYSIS OPERATIONS
# ============================================================================

def save_analysis_to_db(db, analysis_data: dict):
    """Save analysis to database"""
    try:
        analysis = Analysis(
            id=analysis_data['id'],
            title=analysis_data['title'],
            original_text=analysis_data['originalText'],
            results=analysis_data['results'],
            document_id=analysis_data.get('document_id'),
            user_email=analysis_data.get('user_email')
        )
        db.add(analysis)
        db.commit()
        print(f"✅ Analysis saved to database: {analysis.id}")
        return analysis
    except Exception as e:
        print(f"❌ Failed to save analysis: {e}")
        db.rollback()
        return None

def get_all_analyses_from_db(db, limit=50, offset=0):
    """Get analyses from database with pagination to avoid memory issues"""
    try:
        # Only select essential fields to avoid memory issues
        analyses = db.query(
            Analysis.id,
            Analysis.title,
            Analysis.date,
            Analysis.status,
            Analysis.document_id,
            Analysis.user_email
        ).order_by(Analysis.date.desc()).offset(offset).limit(limit).all()
        
        return [
            {
                'id': analysis.id,
                'title': analysis.title,
                'date': analysis.date.isoformat(),
                'status': analysis.status,
                'document_id': analysis.document_id,
                'user_email': analysis.user_email,
                'original_text': None,  # Not loaded to save memory
                'results': None  # Not loaded to save memory
            }
            for analysis in analyses
        ]
    except Exception as e:
        print(f"❌ Error getting analyses: {e}")
        return []

def get_analysis_details_from_db(db, analysis_id):
    """Get full analysis details including original_text and results for a specific analysis"""
    try:
        analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if analysis:
            return {
                'id': analysis.id,
                'title': analysis.title,
                'date': analysis.date.isoformat(),
                'status': analysis.status,
                'original_text': analysis.original_text,
                'results': analysis.results,
                'document_id': analysis.document_id,
                'user_email': analysis.user_email
            }
        return None
    except Exception as e:
        print(f"❌ Error getting analysis details: {e}")
        return None

def get_analysis_by_id_from_db(db, analysis_id: str):
    """Get analysis by ID"""
    try:
        analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if analysis:
            return {
                'id': analysis.id,
                'title': analysis.title,
                'date': analysis.date.isoformat(),
                'status': analysis.status,
                'original_text': analysis.original_text,
                'results': analysis.results,
                'document_id': analysis.document_id,
                'user_email': analysis.user_email
            }
        return None
    except Exception as e:
        print(f"❌ Error getting analysis: {e}")
        return None

# ============================================================================
# APPROVAL OPERATIONS
# ============================================================================

def save_approval_to_db(db, approval_data: dict):
    """Save approval to database"""
    try:
        approval = Approval(
            id=approval_data['id'],
            analysis_id=approval_data['analysis_id'],
            status=approval_data['status'],
            created_date=datetime.fromisoformat(approval_data['created_date']),
            updated_date=datetime.fromisoformat(approval_data['updated_date']),
            approver_email=approval_data['approver_email'],
            results_summary=approval_data['results_summary']
        )
        db.add(approval)
        db.commit()
        print(f"✅ Approval saved to database: {approval.id}")
        return approval
    except Exception as e:
        print(f"❌ Failed to save approval: {e}")
        db.rollback()
        return None

def get_approval_from_db(db, approval_id: str):
    """Get approval from database"""
    try:
        approval = db.query(Approval).filter(Approval.id == approval_id).first()
        if approval:
            return {
                'id': approval.id,
                'analysis_id': approval.analysis_id,
                'status': approval.status,
                'created_date': approval.created_date.isoformat(),
                'updated_date': approval.updated_date.isoformat(),
                'approver_email': approval.approver_email,
                'results_summary': approval.results_summary,
                'approver_response': approval.approver_response,
                'ado_result': approval.ado_result
            }
        return None
    except Exception as e:
        print(f"❌ Error getting approval: {e}")
        return None

def update_approval_in_db(db, approval_id: str, new_status: str):
    """Update approval status"""
    try:
        approval = db.query(Approval).filter(Approval.id == approval_id).first()
        if approval:
            approval.status = new_status
            approval.updated_date = datetime.utcnow()
            db.commit()
            print(f"✅ Approval status updated: {approval_id} -> {new_status}")
            return approval
        return None
    except Exception as e:
        print(f"❌ Failed to update approval: {e}")
        db.rollback()
        return None

def update_approval_in_db_with_data(db, approval_id: str, update_data: dict):
    """Update approval with additional data"""
    try:
        approval = db.query(Approval).filter(Approval.id == approval_id).first()
        if approval:
            if 'status' in update_data:
                approval.status = update_data['status']
            if 'updated_date' in update_data:
                approval.updated_date = datetime.fromisoformat(update_data['updated_date'])
            if 'approver_response' in update_data:
                approval.approver_response = update_data['approver_response']
            if 'ado_result' in update_data:
                approval.ado_result = update_data['ado_result']
            
            db.commit()
            print(f"✅ Approval updated with data: {approval_id}")
            return approval
        return None
    except Exception as e:
        print(f"❌ Failed to update approval with data: {e}")
        db.rollback()
        return None

# ============================================================================
# VECTOR DATABASE OPERATIONS
# ============================================================================

def add_to_vector_db(content: str, meta: dict, collection_name: str = "documents"):
    """Add content to vector database"""
    if not qdrant_client or not embedding_model:
        print("Vector database not available")
        return
    
    try:
        # Generate embedding
        embedding = embedding_model.encode(content).tolist()
        
        # Create point ID
        point_id = meta.get('id', str(uuid.uuid4()))
        
        # Add to collection
        qdrant_client.upsert(
            collection_name=collection_name,
            points=[
                PointStruct(
                    id=point_id,
                    vector=embedding,
                    payload=meta
                )
            ]
        )
        print(f"✅ Added to vector database: {point_id}")
    except Exception as e:
        print(f"❌ Failed to add to vector database: {e}")

def search_vector_db(query: str, collection_name: str = "documents", limit: int = 10):
    """Search vector database"""
    if not qdrant_client or not embedding_model:
        print("Vector database not available")
        return []
    
    try:
        # Generate query embedding
        query_embedding = embedding_model.encode(query).tolist()
        
        # Search
        results = qdrant_client.search(
            collection_name=collection_name,
            query_vector=query_embedding,
            limit=limit
        )
        
        return [
            {
                'id': result.id,
                'score': result.score,
                'payload': result.payload
            }
            for result in results
        ]
    except Exception as e:
        print(f"❌ Failed to search vector database: {e}")
        return []

def delete_from_vector_db(point_id: str, collection_name: str = "documents"):
    """Delete from vector database"""
    if not qdrant_client:
        print("Vector database not available")
        return
    
    try:
        qdrant_client.delete(
            collection_name=collection_name,
            points_selector=[point_id]
        )
        print(f"✅ Deleted from vector database: {point_id}")
    except Exception as e:
        print(f"❌ Failed to delete from vector database: {e}")

# ============================================================================
# DIRECT DATABASE OPERATIONS (for compatibility)
# ============================================================================

def save_document_to_db_direct(filename: str, file_type: str, file_path: str, content: str):
    """Save document using direct psycopg2 connection"""
    try:
        # Extract connection details from DATABASE_URL
        db_url = DATABASE_URL.replace('postgresql+psycopg2://', '')
        user_pass, host_port_db = db_url.split('@')
        user, password = user_pass.split(':')
        host_port, dbname = host_port_db.split('/')
        host, port = host_port.split(':')
        
        conn = psycopg2.connect(
            host=host,
            port=port,
            dbname=dbname,
            user=user,
            password=password
        )
        cursor = conn.cursor()
        
        cursor.execute(
            "INSERT INTO documents (id, user_email, name, file_type, file_path, content, upload_date, status) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
            (str(uuid.uuid4()), "guest", filename, file_type, file_path, content, datetime.utcnow(), "uploaded")
        )
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"✅ Document saved directly: {filename}")
        return True
    except Exception as e:
        print(f"❌ Failed to save document directly: {e}")
        return False

def get_all_documents_from_db_direct():
    """Get all documents using direct psycopg2 connection"""
    try:
        # Extract connection details from DATABASE_URL
        db_url = DATABASE_URL.replace('postgresql+psycopg2://', '')
        user_pass, host_port_db = db_url.split('@')
        user, password = user_pass.split(':')
        host_port, dbname = host_port_db.split('/')
        host, port = host_port.split(':')
        
        conn = psycopg2.connect(
            host=host,
            port=port,
            dbname=dbname,
            user=user,
            password=password
        )
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute("SELECT * FROM documents ORDER BY upload_date DESC")
        documents = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return [dict(doc) for doc in documents]
    except Exception as e:
        print(f"❌ Failed to get documents directly: {e}")
        return []

def check_document_exists_by_name_direct(filename: str):
    """Check if document exists by name using direct connection"""
    try:
        # Extract connection details from DATABASE_URL
        db_url = DATABASE_URL.replace('postgresql+psycopg2://', '')
        user_pass, host_port_db = db_url.split('@')
        user, password = user_pass.split(':')
        host_port, dbname = host_port_db.split('/')
        host, port = host_port.split(':')
        
        conn = psycopg2.connect(
            host=host,
            port=port,
            dbname=dbname,
            user=user,
            password=password
        )
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM documents WHERE name = %s", (filename,))
        count = cursor.fetchone()[0]
        
        cursor.close()
        conn.close()
        
        return count > 0
    except Exception as e:
        print(f"❌ Failed to check document existence directly: {e}")
        return False
