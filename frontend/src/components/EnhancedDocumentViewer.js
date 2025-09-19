import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, FileImage, FilePdf, FileWord, FileCode, 
  Download, Eye, X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
  RotateCw, RotateCcw, Maximize2, Minimize2, Search, Filter,
  Calendar, User, Tag, Clock, FileCheck, AlertCircle
} from 'lucide-react';

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
  const [previewScale, setPreviewScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [thumbnails, setThumbnails] = useState({});
  const [loadingThumbnails, setLoadingThumbnails] = useState(new Set());
  const canvasRef = useRef(null);

  // Enhanced file type detection
  const getFileIcon = (filename) => {
    const ext = filename.toLowerCase().split('.').pop();
    switch (ext) {
      case 'pdf':
        return FilePdf;
      case 'doc':
      case 'docx':
        return FileWord;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'webp':
      case 'svg':
        return FileImage;
      case 'txt':
      case 'md':
      case 'rtf':
        return FileText;
      case 'json':
      case 'xml':
      case 'html':
      case 'css':
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
        return FileCode;
      case 'xlsx':
      case 'xls':
        return FileCheck;
      case 'pptx':
      case 'ppt':
        return FileCheck;
      default:
        return FileText;
    }
  };

  const getFileTypeColor = (filename) => {
    const ext = filename.toLowerCase().split('.').pop();
    switch (ext) {
      case 'pdf':
        return 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100';
      case 'doc':
      case 'docx':
        return 'text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'webp':
      case 'svg':
        return 'text-green-600 bg-green-50 border-green-200 hover:bg-green-100';
      case 'txt':
      case 'md':
      case 'rtf':
        return 'text-gray-600 bg-gray-50 border-gray-200 hover:bg-gray-100';
      case 'json':
      case 'xml':
      case 'html':
      case 'css':
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
        return 'text-purple-600 bg-purple-50 border-purple-200 hover:bg-purple-100';
      case 'xlsx':
      case 'xls':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100';
      case 'pptx':
      case 'ppt':
        return 'text-orange-600 bg-orange-50 border-orange-200 hover:bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200 hover:bg-gray-100';
    }
  };

  const getFileTypeLabel = (filename) => {
    const ext = filename.toLowerCase().split('.').pop();
    switch (ext) {
      case 'pdf':
        return 'PDF Document';
      case 'doc':
      case 'docx':
        return 'Word Document';
      case 'jpg':
      case 'jpeg':
        return 'JPEG Image';
      case 'png':
        return 'PNG Image';
      case 'gif':
        return 'GIF Image';
      case 'txt':
        return 'Text File';
      case 'md':
        return 'Markdown';
      case 'json':
        return 'JSON File';
      case 'xml':
        return 'XML File';
      case 'html':
        return 'HTML File';
      case 'css':
        return 'CSS File';
      case 'js':
        return 'JavaScript';
      case 'ts':
        return 'TypeScript';
      case 'xlsx':
      case 'xls':
        return 'Excel Spreadsheet';
      case 'pptx':
      case 'ppt':
        return 'PowerPoint';
      default:
        return 'Document';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date) => {
    if (!date) return 'Unknown date';
    const d = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now - d);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return d.toLocaleDateString();
  };

  // Generate thumbnail for images
  const generateThumbnail = async (document) => {
    if (!showThumbnails || !document.url) return;
    
    const ext = (document.filename || document.name || '').toLowerCase().split('.').pop();
    if (!['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) return;

    setLoadingThumbnails(prev => new Set([...prev, document.id || document.filename]));

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate thumbnail dimensions (max 200x200)
        const maxSize = 200;
        let { width, height } = img;
        
        if (width > height) {
          height = (height * maxSize) / width;
          width = maxSize;
        } else {
          width = (width * maxSize) / height;
          height = maxSize;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw image with rounded corners
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(0, 0, width, height, 8);
        ctx.clip();
        ctx.drawImage(img, 0, 0, width, height);
        ctx.restore();
        
        const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
        setThumbnails(prev => ({
          ...prev,
          [document.id || document.filename]: thumbnailUrl
        }));
      };
      
      img.onerror = () => {
        console.warn('Failed to generate thumbnail for:', document.filename);
      };
      
      img.src = document.url;
    } catch (error) {
      console.warn('Error generating thumbnail:', error);
    } finally {
      setLoadingThumbnails(prev => {
        const newSet = new Set(prev);
        newSet.delete(document.id || document.filename);
        return newSet;
      });
    }
  };

  // Filter and sort documents
  const getFilteredAndSortedDocuments = () => {
    let filtered = documents.filter(doc => {
      const matchesSearch = !searchTerm || 
        (doc.filename || doc.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.content || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterType === 'all' || 
        (doc.filename || doc.name || '').toLowerCase().endsWith(`.${filterType}`);
      
      return matchesSearch && matchesFilter;
    });

    // Sort documents
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = (a.filename || a.name || '').toLowerCase();
          bValue = (b.filename || b.name || '').toLowerCase();
          break;
        case 'size':
          aValue = a.size || 0;
          bValue = b.size || 0;
          break;
        case 'date':
          aValue = new Date(a.uploadDate || a.date || 0);
          bValue = new Date(b.uploadDate || b.date || 0);
          break;
        case 'type':
          aValue = (a.filename || a.name || '').toLowerCase().split('.').pop();
          bValue = (b.filename || b.name || '').toLowerCase().split('.').pop();
          break;
        default:
          aValue = aValue || '';
          bValue = bValue || '';
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  };

  const handleDocumentClick = (document) => {
    setSelectedDocument(document);
    setIsPreviewOpen(true);
    setPreviewScale(1);
    setRotation(0);
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
    setSelectedDocument(null);
    setIsFullscreen(false);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleDownload = (document) => {
    if (onDownload) {
      onDownload(document);
    } else {
      // Default download behavior
      const link = document.createElement('a');
      link.href = document.url || `data:text/plain;charset=utf-8,${encodeURIComponent(document.content || '')}`;
      link.download = document.filename || document.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const rotateImage = (direction) => {
    setRotation(prev => prev + (direction === 'cw' ? 90 : -90));
  };

  const resetView = () => {
    setPreviewScale(1);
    setRotation(0);
  };

  // Enhanced preview content rendering
  const renderPreviewContent = (document) => {
    if (!document) return null;

    const ext = (document.filename || document.name || '').toLowerCase().split('.').pop();

    switch (ext) {
      case 'pdf':
        return (
          <div className="w-full h-full">
            <iframe
              src={document.url || `data:application/pdf;base64,${document.content}`}
              className="w-full h-full border-0"
              title={document.filename || document.name}
            />
          </div>
        );
      
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'webp':
      case 'svg':
        return (
          <div className="flex items-center justify-center h-full bg-gray-100">
            <img
              src={document.url || `data:image/${ext};base64,${document.content}`}
              alt={document.filename || document.name}
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{ 
                transform: `scale(${previewScale}) rotate(${rotation}deg)`,
                cursor: previewScale > 1 ? 'grab' : 'default'
              }}
              draggable={false}
            />
          </div>
        );
      
      case 'doc':
      case 'docx':
        return (
          <div className="flex items-center justify-center h-full text-center bg-gray-50">
            <div className="p-8 max-w-md">
              <FileWord className="w-24 h-24 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {document.filename || document.name}
              </h3>
              <p className="text-gray-600 mb-4">
                Microsoft Word documents cannot be previewed directly in the browser.
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => handleDownload(document)}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Document
                </button>
                <p className="text-sm text-gray-500">
                  Open with Microsoft Word or compatible application
                </p>
              </div>
            </div>
          </div>
        );
      
      case 'xlsx':
      case 'xls':
        return (
          <div className="flex items-center justify-center h-full text-center bg-gray-50">
            <div className="p-8 max-w-md">
              <FileCheck className="w-24 h-24 text-emerald-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {document.filename || document.name}
              </h3>
              <p className="text-gray-600 mb-4">
                Excel spreadsheets cannot be previewed directly in the browser.
              </p>
              <button
                onClick={() => handleDownload(document)}
                className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Spreadsheet
              </button>
            </div>
          </div>
        );
      
      default:
        // Text-based files with syntax highlighting
        return (
          <div className="h-full overflow-auto bg-gray-900 text-gray-100">
            <pre className="whitespace-pre-wrap text-sm font-mono p-4 leading-relaxed">
              {document.content || 'No content available'}
            </pre>
          </div>
        );
    }
  };

  // Generate thumbnails on component mount
  useEffect(() => {
    documents.forEach(doc => {
      if (showThumbnails && !thumbnails[doc.id || doc.filename]) {
        generateThumbnail(doc);
      }
    });
  }, [documents, showThumbnails]);

  const filteredDocuments = getFilteredAndSortedDocuments();

  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-500">No documents uploaded yet</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Enhanced Document List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header with Search and Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500">
                {filteredDocuments.length} of {documents.length} documents
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">View:</span>
              <button
                onClick={() => setShowThumbnails(!showThumbnails)}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  showThumbnails 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {showThumbnails ? 'Thumbnails' : 'List'}
              </button>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="pdf">PDF</option>
              <option value="docx">Word</option>
              <option value="jpg">Images</option>
              <option value="txt">Text</option>
              <option value="json">JSON</option>
            </select>
            
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sort, order] = e.target.value.split('-');
                setSortBy(sort);
                setSortOrder(order);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="size-desc">Largest First</option>
              <option value="size-asc">Smallest First</option>
            </select>
          </div>
        </div>

        {/* Document Grid/List */}
        <div className="p-6">
          {showThumbnails ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredDocuments.map((document, index) => {
                const Icon = getFileIcon(document.filename || document.name);
                const colorClasses = getFileTypeColor(document.filename || document.name);
                const thumbnail = thumbnails[document.id || document.filename];
                const isLoading = loadingThumbnails.has(document.id || document.filename);
                
                return (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${colorClasses}`}
                    onClick={() => handleDocumentClick(document)}
                  >
                    {/* Thumbnail or Icon */}
                    <div className="aspect-square mb-3 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                      {thumbnail ? (
                        <img 
                          src={thumbnail} 
                          alt="Thumbnail"
                          className="w-full h-full object-cover"
                        />
                      ) : isLoading ? (
                        <div className="animate-pulse">
                          <Icon className="w-12 h-12 text-gray-400" />
                        </div>
                      ) : (
                        <Icon className="w-12 h-12 text-gray-400" />
                      )}
                    </div>
                    
                    {/* Document Info */}
                    <div className="space-y-1">
                      <h4 className="font-medium text-gray-900 truncate text-sm">
                        {document.filename || document.name}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {getFileTypeLabel(document.filename || document.name)}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{document.size ? formatFileSize(document.size) : 'Unknown size'}</span>
                        <span>{formatDate(document.uploadDate)}</span>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(document);
                        }}
                        className="flex-1 px-2 py-1 bg-white bg-opacity-80 text-gray-600 rounded text-xs hover:bg-opacity-100 transition-colors"
                        title="Download"
                      >
                        <Download className="w-3 h-3 mx-auto" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDocumentClick(document);
                        }}
                        className="flex-1 px-2 py-1 bg-white bg-opacity-80 text-gray-600 rounded text-xs hover:bg-opacity-100 transition-colors"
                        title="Preview"
                      >
                        <Eye className="w-3 h-3 mx-auto" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDocuments.map((document, index) => {
                const Icon = getFileIcon(document.filename || document.name);
                const colorClasses = getFileTypeColor(document.filename || document.name);
                
                return (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${colorClasses}`}
                    onClick={() => handleDocumentClick(document)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <Icon className="w-8 h-8 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-gray-900 truncate">
                            {document.filename || document.name}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>{getFileTypeLabel(document.filename || document.name)}</span>
                            <span>{document.size ? formatFileSize(document.size) : 'Unknown size'}</span>
                            <span>{formatDate(document.uploadDate)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(document);
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDocumentClick(document);
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Document Preview Modal */}
      {isPreviewOpen && selectedDocument && (
        <div className={`fixed inset-0 z-50 overflow-y-auto ${isFullscreen ? 'bg-white' : ''}`}>
          <div className={`flex items-center justify-center min-h-screen ${isFullscreen ? '' : 'pt-4 px-4 pb-20 text-center sm:block sm:p-0'}`}>
            {/* Background overlay */}
            {!isFullscreen && (
              <div 
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                onClick={closePreview}
              ></div>
            )}

            {/* Modal content */}
            <div className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all ${
              isFullscreen 
                ? 'w-full h-full rounded-none' 
                : 'sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full'
            }`}>
              {/* Header */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-gray-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {selectedDocument.filename || selectedDocument.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {getFileTypeLabel(selectedDocument.filename || selectedDocument.name)} • 
                        {selectedDocument.size ? formatFileSize(selectedDocument.size) : 'Unknown size'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Enhanced Controls */}
                    {(selectedDocument.filename || selectedDocument.name || '').toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/) && (
                      <>
                        <button
                          onClick={() => rotateImage('ccw')}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Rotate Left"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => rotateImage('cw')}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Rotate Right"
                        >
                          <RotateCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={resetView}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Reset View"
                        >
                          <Minimize2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    
                    {/* Zoom Controls */}
                    <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-lg px-2 py-1">
                      <button
                        onClick={() => setPreviewScale(Math.max(0.25, previewScale - 0.25))}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </button>
                      <span className="text-sm text-gray-600 min-w-[3rem] text-center">
                        {Math.round(previewScale * 100)}%
                      </span>
                      <button
                        onClick={() => setPreviewScale(Math.min(5, previewScale + 0.25))}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {/* Fullscreen Toggle */}
                    {enableFullscreen && (
                      <button
                        onClick={toggleFullscreen}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                      >
                        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                      </button>
                    )}
                    
                    {/* Download Button */}
                    <button
                      onClick={() => handleDownload(selectedDocument)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                    
                    {/* Close Button */}
                    <button
                      onClick={closePreview}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Preview Content */}
              <div className={`overflow-hidden ${isFullscreen ? 'h-[calc(100vh-120px)]' : 'h-96'}`}>
                {renderPreviewContent(selectedDocument)}
              </div>

              {/* Footer */}
              {!isFullscreen && (
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-4">
                      <span>
                        Size: {selectedDocument.size ? formatFileSize(selectedDocument.size) : 'Unknown'}
                      </span>
                      {selectedDocument.uploadDate && (
                        <span>
                          Uploaded: {formatDate(selectedDocument.uploadDate)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Type: {getFileTypeLabel(selectedDocument.filename || selectedDocument.name)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EnhancedDocumentViewer;
