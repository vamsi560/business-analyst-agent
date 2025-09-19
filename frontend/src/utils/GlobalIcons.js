// Global icon replacements for lucide-react
// Simple emoji-based icons that work without external dependencies

const GlobalIcons = {
  // File icons
  FileText: () => <span style={{fontSize: '16px'}}>📄</span>,
  FileImage: () => <span style={{fontSize: '16px'}}>🖼️</span>,
  File: () => <span style={{fontSize: '16px'}}>📄</span>,
  FileWord: () => <span style={{fontSize: '16px'}}>📝</span>,
  FileCode: () => <span style={{fontSize: '16px'}}>💻</span>,
  FileCheck: () => <span style={{fontSize: '16px'}}>✅</span>,
  FileEdit: () => <span style={{fontSize: '16px'}}>📝</span>,
  
  // Action icons
  Download: () => <span style={{fontSize: '16px'}}>⬇️</span>,
  Upload: () => <span style={{fontSize: '16px'}}>⬆️</span>,
  UploadCloud: () => <span style={{fontSize: '16px'}}>☁️⬆️</span>,
  Eye: () => <span style={{fontSize: '16px'}}>👁️</span>,
  EyeOff: () => <span style={{fontSize: '16px'}}>�</span>,
  X: () => <span style={{fontSize: '16px'}}>✕</span>,
  Plus: () => <span style={{fontSize: '16px'}}>➕</span>,
  Send: () => <span style={{fontSize: '16px'}}>📤</span>,
  SendIcon: () => <span style={{fontSize: '16px'}}>📤</span>,
  Copy: () => <span style={{fontSize: '16px'}}>📋</span>,
  Edit: () => <span style={{fontSize: '16px'}}>✏️</span>,
  Edit3: () => <span style={{fontSize: '16px'}}>✏️</span>,
  Save: () => <span style={{fontSize: '16px'}}>💾</span>,
  Trash: () => <span style={{fontSize: '16px'}}>🗑️</span>,
  Trash2: () => <span style={{fontSize: '16px'}}>�️</span>,
  
  // Navigation icons
  ChevronLeft: () => <span style={{fontSize: '16px'}}>‹</span>,
  ChevronRight: () => <span style={{fontSize: '16px'}}>›</span>,
  ChevronDown: () => <span style={{fontSize: '16px'}}>⌄</span>,
  ChevronUp: () => <span style={{fontSize: '16px'}}>⌃</span>,
  ArrowRight: () => <span style={{fontSize: '16px'}}>→</span>,
  ArrowLeft: () => <span style={{fontSize: '16px'}}>←</span>,
  Menu: () => <span style={{fontSize: '16px'}}>☰</span>,
  Reply: () => <span style={{fontSize: '16px'}}>↩️</span>,
  
  // Zoom and controls
  ZoomIn: () => <span style={{fontSize: '16px'}}>�+</span>,
  ZoomOut: () => <span style={{fontSize: '16px'}}>�-</span>,
  RotateCw: () => <span style={{fontSize: '16px'}}>↻</span>,
  RotateCcw: () => <span style={{fontSize: '16px'}}>↺</span>,
  Maximize2: () => <span style={{fontSize: '16px'}}>⛶</span>,
  Minimize2: () => <span style={{fontSize: '16px'}}>⚏</span>,
  RefreshCw: () => <span style={{fontSize: '16px'}}>🔄</span>,
  
  // UI icons
  Search: () => <span style={{fontSize: '16px'}}>🔍</span>,
  Filter: () => <span style={{fontSize: '16px'}}>🔽</span>,
  Settings: () => <span style={{fontSize: '16px'}}>⚙️</span>,
  Calendar: () => <span style={{fontSize: '16px'}}>�</span>,
  User: () => <span style={{fontSize: '16px'}}>�</span>,
  Tag: () => <span style={{fontSize: '16px'}}>🏷️</span>,
  Clock: () => <span style={{fontSize: '16px'}}>�</span>,
  Bell: () => <span style={{fontSize: '16px'}}>🔔</span>,
  Home: () => <span style={{fontSize: '16px'}}>🏠</span>,
  
  // Status icons
  CheckCircle: () => <span style={{fontSize: '16px'}}>✅</span>,
  XCircle: () => <span style={{fontSize: '16px'}}>❌</span>,
  AlertTriangle: () => <span style={{fontSize: '16px'}}>⚠️</span>,
  AlertCircle: () => <span style={{fontSize: '16px'}}>⚠️</span>,
  
  // Data and analytics
  TrendingUp: () => <span style={{fontSize: '16px'}}>�</span>,
  BarChart3: () => <span style={{fontSize: '16px'}}>�</span>,
  PieChart: () => <span style={{fontSize: '16px'}}>🥧</span>,
  Activity: () => <span style={{fontSize: '16px'}}>�</span>,
  Target: () => <span style={{fontSize: '16px'}}>🎯</span>,
  Zap: () => <span style={{fontSize: '16px'}}>⚡</span>,
  
  // Organization
  Users: () => <span style={{fontSize: '16px'}}>�</span>,
  Folder: () => <span style={{fontSize: '16px'}}>�</span>,
  ListCollapse: () => <span style={{fontSize: '16px'}}>�</span>,
  Cloud: () => <span style={{fontSize: '16px'}}>☁️</span>,
  Link: () => <span style={{fontSize: '16px'}}>🔗</span>,
  LogOut: () => <span style={{fontSize: '16px'}}>🚪</span>,
  Archive: () => <span style={{fontSize: '16px'}}>�</span>,
  
  // Social and communication
  Lightbulb: () => <span style={{fontSize: '16px'}}>💡</span>,
  Star: () => <span style={{fontSize: '16px'}}>⭐</span>,
  MessageSquare: () => <span style={{fontSize: '16px'}}>�</span>,
  MessageCircle: () => <span style={{fontSize: '16px'}}>💬</span>,
  ThumbsUp: () => <span style={{fontSize: '16px'}}>�</span>,
  ThumbsDown: () => <span style={{fontSize: '16px'}}>�</span>,
  BookOpen: () => <span style={{fontSize: '16px'}}>�</span>,
  Flag: () => <span style={{fontSize: '16px'}}>�</span>,
  
  // Language and location
  Languages: () => <span style={{fontSize: '16px'}}>🌍</span>,
  Globe: () => <span style={{fontSize: '16px'}}>🌐</span>,
  
  // Sorting and organization
  SortAsc: () => <span style={{fontSize: '16px'}}>🔼</span>,
  SortDesc: () => <span style={{fontSize: '16px'}}>�</span>,
  MoreVertical: () => <span style={{fontSize: '16px'}}>⋮</span>,
  Hash: () => <span style={{fontSize: '16px'}}>#</span>,
  Info: () => <span style={{fontSize: '16px'}}>ℹ️</span>,
  Database: () => <span style={{fontSize: '16px'}}>🗄️</span>,
  
  // Security
  Lock: () => <span style={{fontSize: '16px'}}>🔒</span>,
  Unlock: () => <span style={{fontSize: '16px'}}>�</span>,
  Shield: () => <span style={{fontSize: '16px'}}>�️</span>,
};

export default GlobalIcons;