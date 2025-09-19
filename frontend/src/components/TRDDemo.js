import React, { useState } from 'react';
import EditableTRDFormatter from './EditableTRDFormatter';
import DocumentViewer from './DocumentViewer';

const TRDDemo = () => {
  const [sampleTRD, setSampleTRD] = useState(`# TECHNICAL REQUIREMENTS DOCUMENT

## 1. EXECUTIVE SUMMARY
- Project Overview: BA Agent System Enhancement
- Key Objectives: Improve document processing and user experience
- Success Criteria: 90% user satisfaction, 50% faster processing

## 2. SYSTEM OVERVIEW
- High-Level Architecture: Microservices-based system
- System Components: Frontend, Backend, Database, AI Services
- Technology Stack: React, Flask, PostgreSQL, Azure Services

## 3. FUNCTIONAL REQUIREMENTS
- User Stories and Use Cases: Document upload, analysis, generation
- Business Rules: Approval workflow, role-based access
- Data Requirements: Structured data storage, file management

## 4. NON-FUNCTIONAL REQUIREMENTS

### 4.1 Performance Requirements
- Response Time: System must respond within 2 seconds for 95% of requests
- Throughput: Support 1000+ concurrent users
- Scalability: Handle 10x growth in data volume
- Availability: 99.9% uptime requirement

### 4.2 Security Requirements
- Authentication: Multi-factor authentication (MFA) support
- Authorization: Role-based access control (RBAC)
- Data Encryption: AES-256 encryption at rest and in transit
- Audit Logging: Complete audit trail for all user actions
- Compliance: GDPR, SOC2, and industry-specific regulations

### 4.3 Scalability Requirements
- Horizontal scaling capability
- Load balancing support
- Database sharding and partitioning
- Microservices architecture support
- Cloud-native deployment ready

## 5. TECHNICAL SPECIFICATIONS
- API Specifications: RESTful APIs with OpenAPI documentation
- Database Design: Normalized schema with proper indexing
- Integration Points: Azure services, third-party APIs
- Data Flow: Real-time processing with event-driven architecture

### 5.1 API Endpoints Summary
| Endpoint | Method | Purpose | Authentication |
|----------|--------|---------|----------------|
| /api/analyze | POST | Document analysis | Required |
| /api/generate | POST | Generate TRD/HLD/LLD | Required |
| /api/approve | POST | Approval workflow | Required |
| /api/convert-to-docx | POST | Convert markdown to DOCX | Required |
| /api/save-trd | POST | Save TRD documents | Required |

### 5.2 Database Schema Overview
| Table | Purpose | Key Fields | Relationships |
|-------|---------|------------|---------------|
| users | User management | id, email, role | Many-to-many with projects |
| projects | Project tracking | id, name, status, created_at | One-to-many with documents |
| documents | Document storage | id, project_id, type, content | Many-to-one with projects |
| approvals | Approval workflow | id, document_id, approver_id, status | Many-to-one with documents |

### 5.3 Performance Benchmarks
| Metric | Current | Target | Measurement Method |
|--------|---------|--------|-------------------|
| Response Time | 3.2s | 2.0s | 95th percentile |
| Throughput | 500 users | 1000+ users | Concurrent load test |
| Availability | 99.5% | 99.9% | Uptime monitoring |
| Error Rate | 2.1% | <1% | Error tracking |

## 6. SECURITY CONSIDERATIONS
- Authentication & Authorization: JWT tokens, OAuth 2.0
- Data Protection: PII handling, data anonymization
- Compliance Requirements: Industry standards and regulations
- Security Testing: Penetration testing, vulnerability assessment

### 6.1 Security Matrix
| Security Layer | Technology | Compliance | Testing Frequency |
|----------------|------------|------------|-------------------|
| Authentication | JWT + MFA | SOC2 | Quarterly |
| Authorization | RBAC | GDPR | Monthly |
| Encryption | AES-256 | HIPAA | Bi-annually |
| Audit Logging | Structured logs | SOX | Continuous |

## 7. DEPLOYMENT & OPERATIONS
- Infrastructure Requirements: Cloud-native, containerized deployment
- Deployment Strategy: CI/CD pipelines, blue-green deployment
- Monitoring & Maintenance: Real-time monitoring, automated alerts
- Performance Optimization: Caching strategies, CDN integration

## 8. TESTING STRATEGY
- Test Types: Unit, integration, end-to-end testing
- Quality Assurance: Automated testing, code quality gates
- Acceptance Criteria: User acceptance testing, performance testing
- Security Testing: Vulnerability scanning, security testing

### 8.1 Test Coverage Requirements
| Test Type | Coverage Target | Tools | Frequency |
|-----------|----------------|-------|-----------|
| Unit Tests | 90%+ | Jest, PyTest | Every commit |
| Integration | 85%+ | Postman, Newman | Daily |
| E2E Tests | 80%+ | Cypress, Selenium | Weekly |
| Performance | 100% | JMeter, K6 | Monthly |

## 9. RISK ASSESSMENT
- Technical Risks: Integration complexity, performance bottlenecks
- Business Risks: User adoption, competitive landscape
- Mitigation Strategies: Phased rollout, user training
- Contingency Plans: Rollback procedures, alternative solutions

## 10. SUCCESS METRICS
- Key Performance Indicators: Response time, throughput, availability
- Business Metrics: User satisfaction, adoption rate, ROI
- Technical Metrics: System performance, error rates, uptime
- User Experience Metrics: Usability scores, task completion rates`);

  const [sampleDocuments] = useState([
    {
      filename: "Business_Requirements.docx",
      name: "Business Requirements",
      size: 245760,
      uploadDate: "2025-01-02T10:30:00Z",
      type: "docx",
      content: "Sample business requirements document content..."
    },
    {
      filename: "System_Architecture.pdf",
      name: "System Architecture",
      size: 1048576,
      uploadDate: "2025-01-02T09:15:00Z",
      type: "pdf",
      content: "Sample PDF content..."
    },
    {
      filename: "User_Stories.md",
      name: "User Stories",
      size: 15360,
      uploadDate: "2025-01-02T08:45:00Z",
      type: "md",
      content: "# User Stories\n\n## As a Business Analyst\nI want to upload documents\nSo that I can analyze requirements\n\n## As a Developer\nI want to view technical specifications\nSo that I can implement features"
    },
    {
      filename: "API_Specification.json",
      name: "API Specification",
      size: 8192,
      uploadDate: "2025-01-02T07:30:00Z",
      type: "json",
      content: '{"openapi": "3.0.0", "info": {"title": "BA Agent API", "version": "1.0.0"}, "paths": {}}'
    }
  ]);

  const handleTRDSave = async (saveData) => {
    try {
      const response = await fetch('/api/save-trd', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saveData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('TRD saved successfully:', result);
        return result;
      } else {
        const error = await response.json();
        return { success: false, error: error.error };
      }
    } catch (error) {
      console.error('Error saving TRD:', error);
      return { success: false, error: error.message };
    }
  };

  const handleDocumentDownload = (document) => {
    console.log('Downloading document:', document);
    // Implement actual download logic here
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            BA Agent TRD Enhancement Demo
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Experience the enhanced Technical Requirements Document capabilities with editing, 
            saving, and document viewing features.
          </p>
        </div>

        <div className="space-y-8">
          {/* TRD Editor Section */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              📝 Editable TRD Document
            </h2>
            <EditableTRDFormatter
              content={sampleTRD}
              title="Enhanced Technical Requirements Document"
              onSave={handleTRDSave}
              documentId="demo-trd-001"
              isEditable={true}
            />
          </div>

          {/* Document Viewer Section */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              📁 Document Management & Preview
            </h2>
            <DocumentViewer
              documents={sampleDocuments}
              onDownload={handleDocumentDownload}
              title="Sample Project Documents"
            />
          </div>

          {/* Features Overview */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              ✨ New Features Overview
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="text-center p-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📝</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Editable TRD Documents
                </h3>
                <p className="text-gray-600 text-sm">
                  Edit and save Technical Requirements Documents directly in the browser with 
                  real-time formatting and validation.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="text-center p-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💾</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Auto-Save & Version Control
                </h3>
                <p className="text-gray-600 text-sm">
                  Automatic saving with change tracking and version history. Never lose your work again.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="text-center p-4">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📄</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Document Preview
                </h3>
                <p className="text-gray-600 text-sm">
                  Click on any uploaded document to preview it in a popup with zoom controls and download options.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="text-center p-4">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⬇️</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Multiple Export Formats
                </h3>
                <p className="text-gray-600 text-sm">
                  Download TRD documents in Markdown or DOCX format for easy sharing and collaboration.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="text-center p-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔍</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Enhanced Non-Functional Requirements
                </h3>
                <p className="text-gray-600 text-sm">
                  Comprehensive NFR sections including performance, security, scalability, and usability requirements.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="text-center p-4">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Professional Formatting
                </h3>
                <p className="text-gray-600 text-sm">
                  Beautiful, professional document formatting with collapsible sections and table of contents.
                </p>
              </div>
            </div>
          </div>

          {/* Usage Instructions */}
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">
              🚀 How to Use These Features
            </h3>
            <div className="space-y-3 text-blue-800">
              <div className="flex items-start gap-3">
                <span className="font-semibold">1.</span>
                <p>Click the <strong>Edit</strong> button in the TRD document to start editing</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-semibold">2.</span>
                <p>Make your changes in the edit mode and click <strong>Save Changes</strong></p>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-semibold">3.</span>
                <p>Use the download buttons to export in Markdown (.md) or DOCX format</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-semibold">4.</span>
                <p>Click on any document in the Document Management section to preview it</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-semibold">5.</span>
                <p>Use zoom controls and download options in the document preview</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TRDDemo;
