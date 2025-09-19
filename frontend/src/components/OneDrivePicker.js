import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  Folder, 
  FileText, 
  Download, 
  RefreshCw, 
  X,
  ChevronRight,
  ChevronDown,
  Home,
  Search
} from 'lucide-react';

const OneDrivePicker = ({ 
  onFileSelect, 
  onClose, 
  isVisible = false,
  title = "Select from OneDrive"
}) => {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentPath, setCurrentPath] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [authUrl, setAuthUrl] = useState(null);

  useEffect(() => {
    if (isVisible) {
      loadOneDriveContent();
    }
  }, [isVisible, currentPath]);

  const loadOneDriveContent = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check OneDrive connection status first
      const statusResponse = await fetch('/api/integrations/onedrive/status');
      const statusData = await statusResponse.json();
      
      if (!statusData.configured) {
        setConnectionStatus('not_configured');
        setError('OneDrive integration not configured on the server.');
        return;
      }
      
      if (!statusData.user_connected) {
        setConnectionStatus('not_connected');
        // Get auth URL for user to connect
        const authResponse = await fetch('/api/integrations/onedrive/auth');
        if (authResponse.ok) {
          const authData = await authResponse.json();
          setAuthUrl(authData.auth_url);
        }
        return;
      }
      
      setConnectionStatus('connected');
      
      // Get files from OneDrive
      const folderId = currentPath.length > 0 ? currentPath[currentPath.length - 1] : '';
      const response = await fetch(`/api/integrations/onedrive/files?folder_id=${folderId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.files) {
        // Separate files and folders
        const fileItems = [];
        const folderItems = [];
        
        data.files.forEach(item => {
          if (item.folder) {
            folderItems.push({
              id: item.id,
              name: item.name,
              item_count: item.item_count || 0
            });
          } else {
            fileItems.push({
              id: item.id,
              name: item.name,
              size: item.size || 0,
              last_modified: item.last_modified,
              file_type: item.file_type || '',
              download_url: item.download_url
            });
          }
        });
        
        setFiles(fileItems);
        setFolders(folderItems);
      } else {
        setFiles([]);
        setFolders([]);
      }
    } catch (err) {
      console.error('OneDrive loading error:', err);
      if (err.message.includes('401') || err.message.includes('403')) {
        setError('Authentication failed. Please check your OneDrive credentials.');
        setConnectionStatus('auth_failed');
      } else {
        setError(`Failed to load OneDrive content: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFolderClick = (folder) => {
    setCurrentPath([...currentPath, folder.id]);
  };

  const handleBackClick = () => {
    if (currentPath.length > 0) {
      setCurrentPath(currentPath.slice(0, -1));
    }
  };

  const handleFileSelect = (file) => {
    setSelectedFile(file);
  };

  const handleConfirmSelection = async () => {
    if (selectedFile && onFileSelect) {
      try {
        // Download the file from OneDrive
        const response = await fetch(`/api/integrations/onedrive/download/${selectedFile.id}`);
        
        if (!response.ok) {
          throw new Error(`Download failed: ${response.statusText}`);
        }
        
        const blob = await response.blob();
        
        // Create a File object from the blob
        const file = new File([blob], selectedFile.name, { 
          type: blob.type || 'application/octet-stream' 
        });
        
        // Add OneDrive metadata to the file
        file.onedriveId = selectedFile.id;
        file.onedriveSource = 'onedrive';
        
        // Call the parent handler with the downloaded file
        onFileSelect(file);
        onClose();
        
      } catch (error) {
        console.error('Error downloading OneDrive file:', error);
        setError(`Failed to download file: ${error.message}`);
      }
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    // TODO: Implement search functionality
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getFileIcon = (fileType) => {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'docx':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'md':
        return <FileText className="w-5 h-5 text-gray-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  if (!isVisible) return null;

  // Show connection status and connect button if not connected
  if (connectionStatus === 'not_configured') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="text-center">
            <Cloud className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">OneDrive Not Configured</h3>
            <p className="text-gray-600 mb-4">
              OneDrive integration is not configured on the server. Please contact your administrator.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (connectionStatus === 'not_connected') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="text-center">
            <Cloud className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Your OneDrive</h3>
            <p className="text-gray-600 mb-4">
              To access your OneDrive files, you need to connect your Microsoft account first.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Please use the "Connect OneDrive" button in the upload section to authorize access.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Cloud className="w-6 h-6" />
              <h2 className="text-xl font-bold">{title}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Breadcrumb Navigation */}
        <div className="bg-gray-50 px-4 py-3 border-b">
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => setCurrentPath([])}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
            >
              <Home className="w-4 h-4" />
              OneDrive
            </button>
            {currentPath.map((pathId, index) => (
              <div key={`path-${index}-${pathId}`} className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">
                  {folders.find(f => f.id === pathId)?.name || 'Folder'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search files and folders..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
              <span className="ml-2 text-gray-600">Loading OneDrive content...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-500 mb-2">❌ {error}</div>
              <button
                onClick={loadOneDriveContent}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Folders */}
              {folders.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Folder className="w-4 h-4 text-blue-500" />
                    Folders
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {folders.map((folder) => (
                      <button
                        key={folder.id}
                        onClick={() => handleFolderClick(folder)}
                        className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-all text-left"
                      >
                        <Folder className="w-8 h-8 text-blue-500" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{folder.name}</div>
                          <div className="text-sm text-gray-500">{folder.item_count} items</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Files */}
              {files.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-green-500" />
                    Files
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {files.map((file) => (
                      <button
                        key={file.id}
                        onClick={() => handleFileSelect(file)}
                        className={`flex items-center gap-3 p-3 border rounded-lg transition-all text-left ${
                          selectedFile?.id === file.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        {getFileIcon(file.file_type)}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{file.name}</div>
                          <div className="text-sm text-gray-500">
                            {formatFileSize(file.size)} • {formatDate(file.last_modified)}
                          </div>
                        </div>
                        {selectedFile?.id === file.id && (
                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {files.length === 0 && folders.length === 0 && (
                <div className="text-center py-12">
                  <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No files or folders found</h3>
                  <p className="text-gray-500">This folder is empty or you don't have access to its contents.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-4 py-3 border-t flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {selectedFile ? (
              <span>Selected: <strong>{selectedFile.name}</strong></span>
            ) : (
              <span>No file selected</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmSelection}
              disabled={!selectedFile}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedFile
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Select File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OneDrivePicker;

