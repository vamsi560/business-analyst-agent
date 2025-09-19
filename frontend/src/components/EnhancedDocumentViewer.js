import React, { useState } from 'react';
import PropTypes from 'prop-types';

// Simple icon replacements without lucide-react
const SimpleIcons = {
  FileText: () => <span style={{fontSize: '16px'}}>📄</span>,
  FileImage: () => <span style={{fontSize: '16px'}}>🖼️</span>,
  File: () => <span style={{fontSize: '16px'}}>📄</span>,
  FileWord: () => <span style={{fontSize: '16px'}}>📝</span>,
  FileCode: () => <span style={{fontSize: '16px'}}>💻</span>,
  Download: () => <span style={{fontSize: '16px'}}>⬇️</span>,
  Eye: () => <span style={{fontSize: '16px'}}>👁️</span>,
  X: () => <span style={{fontSize: '16px'}}>✕</span>,
  ChevronLeft: () => <span style={{fontSize: '16px'}}>‹</span>,
  ChevronRight: () => <span style={{fontSize: '16px'}}>›</span>,
  ZoomIn: () => <span style={{fontSize: '16px'}}>🔍+</span>,
  ZoomOut: () => <span style={{fontSize: '16px'}}>🔍-</span>,
  RotateCw: () => <span style={{fontSize: '16px'}}>↻</span>,
  RotateCcw: () => <span style={{fontSize: '16px'}}>↺</span>,
  Maximize2: () => <span style={{fontSize: '16px'}}>⛶</span>,
  Minimize2: () => <span style={{fontSize: '16px'}}>⚏</span>,
  Search: () => <span style={{fontSize: '16px'}}>🔍</span>,
  Filter: () => <span style={{fontSize: '16px'}}>🔽</span>,
  Calendar: () => <span style={{fontSize: '16px'}}>📅</span>,
  User: () => <span style={{fontSize: '16px'}}>👤</span>,
  Tag: () => <span style={{fontSize: '16px'}}>🏷️</span>,
  Clock: () => <span style={{fontSize: '16px'}}>🕒</span>,
  FileCheck: () => <span style={{fontSize: '16px'}}>✅</span>,
  AlertCircle: () => <span style={{fontSize: '16px'}}>⚠️</span>
};

const EnhancedDocumentViewer = ({ 
  documents = [], 
  onDownload, 
  title = "Uploaded Documents",
  showThumbnails = true,
  enableFullscreen = true,
  enableAnnotations = false
}) => {
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Enhanced file type detection
  const getFileIcon = (filename) => {
    const ext = filename.toLowerCase().split('.').pop();
    switch (ext) {
      case 'pdf':
        return SimpleIcons.File;
      case 'doc':
      case 'docx':
        return SimpleIcons.FileWord;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'webp':
      case 'svg':
        return SimpleIcons.FileImage;
      case 'txt':
      case 'md':
      case 'rtf':
        return SimpleIcons.FileText;
      case 'json':
      case 'xml':
      case 'html':
      case 'css':
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
        return SimpleIcons.FileCode;
      case 'xlsx':
      case 'xls':
        return SimpleIcons.FileCheck;
      case 'pptx':
      case 'ppt':
        return SimpleIcons.FileCheck;
      default:
        return SimpleIcons.FileText;
    }
  };

  const handleDocumentClick = (document) => {
    setSelectedDocument(document);
    setIsPreviewOpen(true);
  };

  const handleDownload = (document) => {
    if (onDownload) {
      onDownload(document);
    }
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
    setSelectedDocument(null);
    setPreviewScale(1);
    setRotation(0);
    setIsFullscreen(false);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeColor = (filename) => {
    const ext = filename.toLowerCase().split('.').pop();
    switch (ext) {
      case 'pdf': return 'border-red-200 bg-red-50';
      case 'doc': case 'docx': return 'border-blue-200 bg-blue-50';
      case 'jpg': case 'jpeg': case 'png': case 'gif': return 'border-green-200 bg-green-50';
      case 'txt': case 'md': return 'border-gray-200 bg-gray-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  // Filter and sort documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = (doc.filename || doc.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || (doc.filename || doc.name || '').toLowerCase().includes(filterType);
    return matchesSearch && matchesFilter;
  });

  if (!documents || documents.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-8">
        <div className="text-center">
          <SimpleIcons.AlertCircle />
          <h3 className="text-lg font-medium text-gray-900 mt-4">No Documents Found</h3>
          <p className="text-gray-500 mt-2">Upload some documents to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <span className="text-sm text-gray-500">
            {filteredDocuments.length} document(s)
          </span>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <SimpleIcons.Search />
            </div>
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="pdf">PDF</option>
            <option value="doc">Word Documents</option>
            <option value="jpg">Images</option>
            <option value="txt">Text Files</option>
          </select>
        </div>
      </div>

      {/* Document Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((document, index) => {
            const Icon = getFileIcon(document.filename || document.name);
            const colorClasses = getFileTypeColor(document.filename || document.name);
            
            return (
              <button
                key={document.id || document.name || index}
                className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md hover:scale-105 ${colorClasses} text-left w-full`}
                onClick={() => handleDocumentClick(document)}
                aria-label={`Open document ${document.name || document.filename}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Icon />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-gray-900 truncate">
                        {document.filename || document.name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(document.size)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(document);
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Download"
                    >
                      <SimpleIcons.Download />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDocumentClick(document);
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Preview"
                    >
                      <SimpleIcons.Eye />
                    </button>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Preview Modal */}
      {isPreviewOpen && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden ${isFullscreen ? 'fixed inset-4' : ''}`}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {selectedDocument.filename || selectedDocument.name}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(selectedDocument)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <SimpleIcons.Download />
                  Download
                </button>
                <button
                  onClick={closePreview}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <SimpleIcons.X />
                </button>
              </div>
            </div>

            {/* Preview Content */}
            <div className="p-4 max-h-96 overflow-auto">
              <div className="text-center text-gray-500">
                <SimpleIcons.File />
                <p className="mt-4">Preview not available</p>
                <p className="text-sm">Click download to view the file</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

EnhancedDocumentViewer.propTypes = {
  documents: PropTypes.array,
  onDownload: PropTypes.func,
  title: PropTypes.string,
  showThumbnails: PropTypes.bool,
  enableFullscreen: PropTypes.bool,
  enableAnnotations: PropTypes.bool
};

export default EnhancedDocumentViewer;