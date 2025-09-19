import React, { useState } from 'react';
import { 
  FileText, FileImage, FilePdf, FileWord, FileCode, 
  Download, Eye, X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut
} from 'lucide-react';

const DocumentViewer = ({ documents = [], onDownload, title = "Uploaded Documents" }) => {
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewScale, setPreviewScale] = useState(1);

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
        return FileImage;
      case 'txt':
      case 'md':
        return FileText;
      case 'json':
      case 'xml':
      case 'html':
      case 'css':
      case 'js':
        return FileCode;
      default:
        return FileText;
    }
  };

  const getFileTypeColor = (filename) => {
    const ext = filename.toLowerCase().split('.').pop();
    switch (ext) {
      case 'pdf':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'doc':
      case 'docx':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'txt':
      case 'md':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'json':
      case 'xml':
      case 'html':
      case 'css':
      case 'js':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDocumentClick = (document) => {
    setSelectedDocument(document);
    setIsPreviewOpen(true);
    setPreviewScale(1);
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
    setSelectedDocument(null);
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

  const renderPreviewContent = (document) => {
    if (!document) return null;

    const ext = document.filename?.toLowerCase().split('.').pop() || 
                document.name?.toLowerCase().split('.').pop() || 'txt';

    switch (ext) {
      case 'pdf':
        return (
          <iframe
            src={document.url || `data:application/pdf;base64,${document.content}`}
            className="w-full h-full border-0"
            title={document.filename || document.name}
          />
        );
      
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
        return (
          <div className="flex items-center justify-center h-full">
            <img
              src={document.url || `data:image/${ext};base64,${document.content}`}
              alt={document.filename || document.name}
              className="max-w-full max-h-full object-contain"
              style={{ transform: `scale(${previewScale})` }}
            />
          </div>
        );
      
      case 'doc':
      case 'docx':
        return (
          <div className="flex items-center justify-center h-full text-center">
            <div className="p-8">
              <FileWord className="w-24 h-24 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {document.filename || document.name}
              </h3>
              <p className="text-gray-600 mb-4">
                Microsoft Word documents cannot be previewed directly.
              </p>
              <button
                onClick={() => handleDownload(document)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4 inline mr-2" />
                Download Document
              </button>
            </div>
          </div>
        );
      
      default:
        // Text-based files
        return (
          <div className="h-full overflow-auto">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono p-4">
              {document.content || 'No content available'}
            </pre>
          </div>
        );
    }
  };

  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-500">No documents uploaded yet</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Document List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <span className="text-sm text-gray-500">{documents.length} document(s)</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((document, index) => {
            const Icon = getFileIcon(document.filename || document.name);
            const colorClasses = getFileTypeColor(document.filename || document.name);
            
            return (
              <div
                key={index}
                className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md hover:scale-105 ${colorClasses}`}
                onClick={() => handleDocumentClick(document)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Icon className="w-8 h-8 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-gray-900 truncate">
                        {document.filename || document.name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {document.size ? formatFileSize(document.size) : 'Unknown size'}
                      </p>
                      {document.uploadDate && (
                        <p className="text-xs text-gray-400">
                          {new Date(document.uploadDate).toLocaleDateString()}
                        </p>
                      )}
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
      </div>

      {/* Document Preview Modal */}
      {isPreviewOpen && selectedDocument && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={closePreview}
            ></div>

            {/* Modal content */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              {/* Header */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedDocument.filename || selectedDocument.name}
                    </h3>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Zoom Controls */}
                    <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-lg px-2 py-1">
                      <button
                        onClick={() => setPreviewScale(Math.max(0.5, previewScale - 0.1))}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </button>
                      <span className="text-sm text-gray-600 min-w-[3rem] text-center">
                        {Math.round(previewScale * 100)}%
                      </span>
                      <button
                        onClick={() => setPreviewScale(Math.min(3, previewScale + 0.1))}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                    </div>
                    
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
              <div className="h-96 overflow-hidden">
                {renderPreviewContent(selectedDocument)}
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>
                    Size: {selectedDocument.size ? formatFileSize(selectedDocument.size) : 'Unknown'}
                  </span>
                  {selectedDocument.uploadDate && (
                    <span>
                      Uploaded: {new Date(selectedDocument.uploadDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DocumentViewer;
