import React, { useState, useEffect } from 'react';
import { Menu, X, ChevronLeft, ChevronRight, Search, Bell, User } from 'lucide-react';

const ResponsiveLayout = ({ 
  children, 
  sidebar, 
  header,
  showSidebar = true,
  showHeader = true,
  className = ""
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      const handleClickOutside = (event) => {
        if (!event.target.closest('.sidebar') && !event.target.closest('.sidebar-toggle')) {
          setSidebarOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMobile, sidebarOpen]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Mobile Header */}
      {showHeader && isMobile && (
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            {showSidebar && (
              <button
                onClick={toggleSidebar}
                className="sidebar-toggle p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <h1 className="text-lg font-semibold text-gray-900">BA Agent</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <User className="w-5 h-5" />
            </button>
          </div>
        </header>
      )}

      {/* Tablet Header */}
      {showHeader && isTablet && (
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            {showSidebar && (
              <button
                onClick={toggleSidebar}
                className="sidebar-toggle p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <h1 className="text-xl font-semibold text-gray-900">BA Agent</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <User className="w-5 h-5" />
            </button>
          </div>
        </header>
      )}

      <div className="flex">
        {/* Sidebar */}
        {showSidebar && (
          <>
            {/* Mobile Sidebar Overlay */}
            {isMobile && sidebarOpen && (
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-50"
                onClick={() => setSidebarOpen(false)}
              />
            )}

            {/* Sidebar */}
            <aside className={`
              sidebar bg-white shadow-lg border-r border-gray-200 transition-all duration-300 ease-in-out
              ${isMobile 
                ? `fixed top-0 left-0 h-full w-80 z-50 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
                : isTablet
                ? `fixed top-0 left-0 h-full w-80 z-50 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
                : 'relative w-80 flex-shrink-0'
              }
            `}>
              {/* Mobile Sidebar Header */}
              {(isMobile || isTablet) && (
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Sidebar Content */}
              <div className="h-full overflow-y-auto">
                {sidebar}
              </div>
            </aside>
          </>
        )}

        {/* Main Content */}
        <main className={`
          flex-1 min-h-screen transition-all duration-300 ease-in-out
          ${showSidebar && !isMobile && !isTablet ? 'ml-0' : ''}
          ${showHeader ? 'pt-0' : ''}
        `}>
          {/* Desktop Header */}
          {showHeader && !isMobile && !isTablet && (
            <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 sticky top-0 z-30">
              {header}
            </header>
          )}

          {/* Content */}
          <div className="p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

// Responsive Grid Component
export const ResponsiveGrid = ({ 
  children, 
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 4,
  className = ""
}) => {
  const getGridCols = () => {
    return `grid-cols-${cols.mobile} md:grid-cols-${cols.tablet} lg:grid-cols-${cols.desktop}`;
  };

  return (
    <div className={`grid gap-${gap} ${getGridCols()} ${className}`}>
      {children}
    </div>
  );
};

// Responsive Card Component
export const ResponsiveCard = ({ 
  children, 
  className = "",
  padding = { mobile: 4, tablet: 6, desktop: 8 }
}) => {
  return (
    <div className={`
      bg-white rounded-lg shadow-sm border border-gray-200
      p-${padding.mobile} md:p-${padding.tablet} lg:p-${padding.desktop}
      ${className}
    `}>
      {children}
    </div>
  );
};

// Responsive Button Component
export const ResponsiveButton = ({ 
  children, 
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = "",
  ...props
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600 text-white hover:bg-blue-700';
      case 'secondary':
        return 'bg-gray-200 text-gray-900 hover:bg-gray-300';
      case 'danger':
        return 'bg-red-600 text-white hover:bg-red-700';
      case 'success':
        return 'bg-green-600 text-white hover:bg-green-700';
      default:
        return 'bg-blue-600 text-white hover:bg-blue-700';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-2 text-sm';
      case 'md':
        return 'px-4 py-2 text-base';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2 text-base';
    }
  };

  return (
    <button
      className={`
        ${getVariantClasses()}
        ${getSizeClasses()}
        ${fullWidth ? 'w-full' : ''}
        rounded-lg font-medium transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

// Responsive Input Component
export const ResponsiveInput = ({ 
  type = 'text',
  placeholder = '',
  value,
  onChange,
  fullWidth = true,
  className = "",
  ...props
}) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`
        w-full px-4 py-2 border border-gray-300 rounded-lg
        focus:ring-2 focus:ring-blue-500 focus:border-transparent
        transition-colors duration-200
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    />
  );
};

// Responsive Modal Component
export const ResponsiveModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  className = ""
}) => {
  if (!isOpen) return null;

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'max-w-md';
      case 'md':
        return 'max-w-2xl';
      case 'lg':
        return 'max-w-4xl';
      case 'xl':
        return 'max-w-6xl';
      case 'full':
        return 'max-w-full mx-4';
      default:
        return 'max-w-2xl';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal content */}
        <div className={`
          inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all
          sm:my-8 sm:align-middle ${getSizeClasses()} sm:w-full
          ${className}
        `}>
          {/* Header */}
          {title && (
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// Responsive Table Component
export const ResponsiveTable = ({ 
  headers, 
  data, 
  className = "",
  mobileView = 'cards' // 'cards' or 'scroll'
}) => {
  if (mobileView === 'cards') {
    return (
      <div className={`space-y-4 ${className}`}>
        {data.map((row, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="space-y-2">
              {headers.map((header, headerIndex) => (
                <div key={headerIndex} className="flex justify-between">
                  <span className="font-medium text-gray-700">{header.label}:</span>
                  <span className="text-gray-900">{row[header.key]}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full bg-white rounded-lg shadow-sm border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {headers.map((header, index) => (
              <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {header.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((row, index) => (
            <tr key={index} className="hover:bg-gray-50">
              {headers.map((header, headerIndex) => (
                <td key={headerIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {row[header.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ResponsiveLayout;

