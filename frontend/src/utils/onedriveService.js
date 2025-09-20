// onedriveService.js
// Frontend service for OneDrive integration

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000');

class OneDriveService {
  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/integrations/onedrive`;
  }

  /**
   * Get files from OneDrive
   * @param {string} folderId - Optional folder ID to list contents
   * @returns {Promise<Array>} Array of files and folders
   */
  async getFiles(folderId = null) {
    try {
      const url = folderId 
        ? `${this.baseUrl}/files?folder_id=${folderId}`
        : `${this.baseUrl}/files`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.files || [];
    } catch (error) {
      console.error('Error fetching OneDrive files:', error);
      throw error;
    }
  }

  /**
   * Upload file to OneDrive
   * @param {File} file - File to upload
   * @param {string} folderId - Optional folder ID to upload to
   * @returns {Promise<Object>} Upload result
   */
  async uploadFile(file, folderId = null) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (folderId) {
        formData.append('folder_id', folderId);
      }

      const response = await fetch(`${this.baseUrl}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error uploading file to OneDrive:', error);
      throw error;
    }
  }

  /**
   * Download file from OneDrive
   * @param {string} fileId - File ID to download
   * @returns {Promise<Blob>} File blob
   */
  async downloadFile(fileId) {
    try {
      const response = await fetch(`${this.baseUrl}/download/${fileId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error downloading file from OneDrive:', error);
      throw error;
    }
  }

  /**
   * Create folder in OneDrive
   * @param {string} folderName - Name of the folder to create
   * @param {string} parentId - Optional parent folder ID
   * @returns {Promise<Object>} Created folder info
   */
  async createFolder(folderName, parentId = null) {
    try {
      const response = await fetch(`${this.baseUrl}/folders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          name: folderName,
          parent_id: parentId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating OneDrive folder:', error);
      throw error;
    }
  }

  /**
   * Search files in OneDrive
   * @param {string} query - Search query
   * @param {string} folderId - Optional folder ID to search in
   * @returns {Promise<Array>} Search results
   */
  async searchFiles(query, folderId = null) {
    try {
      const url = folderId 
        ? `${this.baseUrl}/search?q=${encodeURIComponent(query)}&folder_id=${folderId}`
        : `${this.baseUrl}/search?q=${encodeURIComponent(query)}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error searching OneDrive files:', error);
      throw error;
    }
  }

  /**
   * Get OneDrive connection status
   * @returns {Promise<Object>} Connection status
   */
  async getConnectionStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting OneDrive status:', error);
      throw error;
    }
  }

  /**
   * Get authentication token from localStorage or other storage
   * @returns {string|null} Auth token
   */
  getAuthToken() {
    // This should be implemented based on your authentication system
    // For now, return null or get from localStorage
    return localStorage.getItem('authToken') || null;
  }

  /**
   * Check if OneDrive integration is available
   * @returns {boolean} True if available
   */
  isAvailable() {
    // Check if OneDrive credentials are configured
    // This could be a simple check or an API call
    return true; // For now, assume it's available
  }

  /**
   * Format file size for display
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted file size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Format date for display
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date
   */
  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
  }

  /**
   * Get file icon based on file type
   * @param {string} fileName - File name
   * @returns {string} File type
   */
  getFileType(fileName) {
    if (!fileName) return '';
    const parts = fileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }

  /**
   * Validate file for upload
   * @param {File} file - File to validate
   * @returns {Object} Validation result
   */
  validateFile(file) {
    const maxSize = 100 * 1024 * 1024; // 100MB
    const allowedTypes = ['pdf', 'docx', 'doc', 'txt', 'md', 'xlsx', 'xls', 'pptx', 'ppt'];
    
    const fileType = this.getFileType(file.name);
    const isValidType = allowedTypes.includes(fileType);
    const isValidSize = file.size <= maxSize;
    
    return {
      isValid: isValidType && isValidSize,
      isValidType,
      isValidSize,
      fileType,
      maxSize: this.formatFileSize(maxSize)
    };
  }
}

// Create singleton instance
const onedriveService = new OneDriveService();

export default onedriveService;

