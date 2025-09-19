import React, { useState, useEffect } from 'react';
import { 
  FileText, ChevronDown, ChevronRight, Hash, CheckCircle, 
  AlertTriangle, Info, Target, Users, Zap, Shield, Database,
  ArrowRight, Copy, Download, Eye, Edit3, Save, X, FileEdit,
  Upload, Download as DownloadIcon
} from 'lucide-react';

const EditableTRDFormatter = ({ 
  content, 
  title = "Technical Requirements Document",
  onSave,
  documentId,
  isEditable = true 
}) => {
  const [expandedSections, setExpandedSections] = useState({});
  const [activeTab, setActiveTab] = useState('formatted');
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [originalContent, setOriginalContent] = useState(content);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  // Update content when prop changes
  useEffect(() => {
    setEditedContent(content);
    setOriginalContent(content);
    setHasChanges(false);
  }, [content]);

  // Check for changes
  useEffect(() => {
    setHasChanges(editedContent !== originalContent);
  }, [editedContent, originalContent]);

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const handleEdit = () => {
    setIsEditing(true);
    setActiveTab('raw');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedContent(originalContent);
    setHasChanges(false);
    setActiveTab('formatted');
  };

  const handleSave = async () => {
    if (!onSave) {
      // Local save simulation
      setOriginalContent(editedContent);
      setHasChanges(false);
      setIsEditing(false);
      setActiveTab('formatted');
      setSaveStatus({ type: 'success', message: 'Document saved locally' });
      setTimeout(() => setSaveStatus(null), 3000);
      return;
    }

    try {
      setSaveStatus({ type: 'loading', message: 'Saving document...' });
      
      const result = await onSave({
        documentId,
        content: editedContent,
        title,
        timestamp: new Date().toISOString()
      });

      if (result.success) {
        setOriginalContent(editedContent);
        setHasChanges(false);
        setIsEditing(false);
        setActiveTab('formatted');
        setSaveStatus({ type: 'success', message: 'Document saved successfully!' });
      } else {
        setSaveStatus({ type: 'error', message: result.error || 'Failed to save document' });
      }
    } catch (error) {
      setSaveStatus({ type: 'error', message: 'Error saving document: ' + error.message });
    }

    setTimeout(() => setSaveStatus(null), 5000);
  };

  const handleContentChange = (e) => {
    setEditedContent(e.target.value);
  };

  const handleDownload = () => {
    const blob = new Blob([editedContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadDocx = async () => {
    try {
      // Call backend to convert markdown to DOCX
      const response = await fetch('/api/convert-to-docx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editedContent,
          filename: `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        console.error('Failed to convert to DOCX');
      }
    } catch (error) {
      console.error('Error converting to DOCX:', error);
    }
  };

  // Parse TRD content into structured sections with enhanced table support
  const parseContent = (content) => {
    if (!content) return [];
    
    const sections = [];
    const lines = content.split('\n');
    let currentSection = null;
    let currentSubsection = null;
    let sectionCounter = 1;
    let subsectionCounter = 1;
    let currentTable = null;
    let tableRows = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line) continue;

      // Check if this line is a table row (contains | characters)
      const isTableRow = line.includes('|') && line.split('|').length > 2;
      
      if (isTableRow) {
        // Start or continue table
        if (!currentTable) {
          currentTable = {
            type: 'table',
            headers: [],
            rows: [],
            rawContent: []
          };
        }
        
        // Parse table row
        const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);
        currentTable.rawContent.push(line);
        
        // Check if this is a header row (contains dashes or is the first row)
        if (line.includes('---') || currentTable.headers.length === 0) {
          if (line.includes('---')) {
            // Skip separator row
            continue;
          } else {
            // This is the header row
            currentTable.headers = cells;
          }
        } else {
          // This is a data row
          currentTable.rows.push(cells);
        }
        
        continue;
      } else if (currentTable) {
        // End of table, add it to content and reset
        if (currentSubsection) {
          currentSubsection.content.push(currentTable);
        } else if (currentSection) {
          currentSection.content.push(currentTable);
        }
        currentTable = null;
      }

      if (line.startsWith('##') || line.startsWith('**') || line === line.toUpperCase() && line.length > 5) {
        if (currentSection) {
          sections.push(currentSection);
          sectionCounter++;
          subsectionCounter = 1;
        }
        
        currentSection = {
          id: `section-${sectionCounter}`,
          title: line.replace(/^#+\s*/, '').replace(/\*\*/g, ''),
          type: getSectionType(line),
          number: sectionCounter,
          content: [],
          subsections: []
        };
        currentSubsection = null;
      }
      else if (line.startsWith('###') || (line.includes(':') && line.length < 100)) {
        if (currentSection) {
          currentSubsection = {
            id: `subsection-${sectionCounter}-${subsectionCounter}`,
            title: line.replace(/^#+\s*/, '').replace(':', ''),
            number: `${sectionCounter}.${subsectionCounter}`,
            content: []
          };
          currentSection.subsections.push(currentSubsection);
          subsectionCounter++;
        }
      }
      else {
        const formattedLine = formatLine(line);
        if (currentSubsection) {
          currentSubsection.content.push(formattedLine);
        } else if (currentSection) {
          currentSection.content.push(formattedLine);
        }
      }
    }
    
    // Don't forget to add the last table if it exists
    if (currentTable) {
      if (currentSubsection) {
        currentSubsection.content.push(currentTable);
      } else if (currentSection) {
        currentSection.content.push(currentTable);
      }
    }
    
    if (currentSection) {
      sections.push(currentSection);
    }

    return sections;
  };

  const getSectionType = (line) => {
    const lowerLine = line.toLowerCase();
    if (lowerLine.includes('requirement') || lowerLine.includes('functional')) return 'requirements';
    if (lowerLine.includes('security') || lowerLine.includes('authentication')) return 'security';
    if (lowerLine.includes('performance') || lowerLine.includes('scalability')) return 'performance';
    if (lowerLine.includes('interface') || lowerLine.includes('ui') || lowerLine.includes('user')) return 'interface';
    if (lowerLine.includes('data') || lowerLine.includes('database')) return 'data';
    if (lowerLine.includes('integration') || lowerLine.includes('api')) return 'integration';
    if (lowerLine.includes('assumption') || lowerLine.includes('constraint')) return 'assumptions';
    return 'general';
  };

  const formatLine = (line) => {
    if (/^\d+\./.test(line)) {
      return { type: 'numbered-list', content: line };
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return { type: 'bullet-list', content: line };
    }
    if (line.startsWith('```')) {
      return { type: 'code-block', content: line };
    }
    if (line.includes('**') && line.includes('**')) {
      return { type: 'bold-text', content: line };
    }
    // Note: Table rows are handled separately in parseContent function
    return { type: 'text', content: line };
  };

  const getSectionIcon = (type) => {
    switch (type) {
      case 'requirements': return Target;
      case 'security': return Shield;
      case 'performance': return Zap;
      case 'interface': return Users;
      case 'data': return Database;
      case 'integration': return ArrowRight;
      case 'assumptions': return AlertTriangle;
      default: return Info;
    }
  };

  const getSectionColor = (type) => {
    switch (type) {
      case 'requirements': return 'blue';
      case 'security': return 'red';
      case 'performance': return 'green';
      case 'interface': return 'purple';
      case 'data': return 'indigo';
      case 'integration': return 'orange';
      case 'assumptions': return 'gray';
      default: return 'slate';
    }
  };

  const renderFormattedContent = (item) => {
    switch (item.type) {
      case 'numbered-list':
        return <div className="ml-4 text-gray-700">{item.content}</div>;
      case 'bullet-list':
        return <div className="ml-4 text-gray-700">{item.content}</div>;
      case 'code-block':
        return <div className="bg-gray-100 p-2 rounded font-mono text-sm">{item.content}</div>;
      case 'bold-text':
        return <div className="font-semibold text-gray-800">{item.content}</div>;
      case 'table':
        return renderTable(item);
      default:
        return <div className="text-gray-700 mb-2">{item.content}</div>;
    }
  };

  const renderTable = (tableData) => {
    if (!tableData.headers || tableData.headers.length === 0) {
      return (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 my-4">
          <div className="text-sm text-gray-600 font-mono">
            {tableData.rawContent.map((line, index) => (
              <div key={index} className="mb-1">{line}</div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
          <thead className="bg-gray-50">
            <tr>
              {tableData.headers.map((header, index) => (
                <th 
                  key={index}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tableData.rows.map((row, rowIndex) => (
              <tr 
                key={rowIndex}
                className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
              >
                {row.map((cell, cellIndex) => (
                  <td 
                    key={cellIndex}
                    className="px-4 py-3 text-sm text-gray-900 border-b border-gray-100"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const sections = parseContent(editedContent);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{title}</h2>
              <p className="text-blue-100">Professional Business Requirements Documentation</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Status Badges */}
            <span className="px-3 py-1 bg-white bg-opacity-20 text-white text-sm font-medium rounded-full">
              Version 1.0
            </span>
            <span className="px-3 py-1 bg-white bg-opacity-20 text-white text-sm font-medium rounded-full">
              {sections.length} Sections
            </span>
            
            {/* Action Buttons */}
            {isEditable && (
              <div className="flex items-center gap-2">
                {!isEditing ? (
                  <button
                    onClick={handleEdit}
                    className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={!hasChanges}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        hasChanges 
                          ? 'bg-green-500 hover:bg-green-600' 
                          : 'bg-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                  </>
                )}
              </div>
            )}
            
            {/* Download Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-3 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
                title="Download as Markdown"
              >
                <DownloadIcon className="w-4 h-4" />
              </button>
              <button
                onClick={handleDownloadDocx}
                className="flex items-center gap-2 px-3 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
                title="Download as DOCX"
              >
                <FileText className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Status */}
      {saveStatus && (
        <div className={`px-6 py-3 ${
          saveStatus.type === 'success' ? 'bg-green-50 border-l-4 border-green-400' :
          saveStatus.type === 'error' ? 'bg-red-50 border-l-4 border-red-400' :
          'bg-blue-50 border-l-4 border-blue-400'
        }`}>
          <div className="flex items-center gap-2">
            {saveStatus.type === 'success' && <CheckCircle className="w-5 h-5 text-green-400" />}
            {saveStatus.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-400" />}
            {saveStatus.type === 'loading' && <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />}
            <span className={`text-sm font-medium ${
              saveStatus.type === 'success' ? 'text-green-800' :
              saveStatus.type === 'error' ? 'text-red-800' :
              'text-blue-800'
            }`}>
              {saveStatus.message}
            </span>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('formatted')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'formatted'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Eye className="w-4 h-4" />
            Formatted View
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'raw'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            {isEditing ? 'Edit Mode' : 'Raw Content'}
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'formatted' ? (
          <div className="space-y-6">
            {/* Table of Contents */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Hash className="w-5 h-5" />
                Table of Contents
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {sections.map((section) => {
                  const Icon = getSectionIcon(section.type);
                  const color = getSectionColor(section.type);
                  return (
                    <button
                      key={section.id}
                      onClick={() => toggleSection(section.id)}
                      className={`flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${
                        color === 'blue' ? 'hover:bg-blue-50' :
                        color === 'red' ? 'hover:bg-red-50' :
                        color === 'green' ? 'hover:bg-green-50' :
                        color === 'purple' ? 'hover:bg-purple-50' :
                        color === 'indigo' ? 'hover:bg-indigo-50' :
                        color === 'orange' ? 'hover:bg-orange-50' :
                        color === 'gray' ? 'hover:bg-gray-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${
                        color === 'blue' ? 'text-blue-600' :
                        color === 'red' ? 'text-red-600' :
                        color === 'green' ? 'text-green-600' :
                        color === 'purple' ? 'text-purple-600' :
                        color === 'indigo' ? 'text-indigo-600' :
                        color === 'orange' ? 'text-orange-600' :
                        color === 'gray' ? 'text-gray-600' : 'text-slate-600'
                      }`} />
                      <span className="text-sm font-medium text-gray-700">
                        {section.number}. {section.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sections */}
            {sections.map((section) => {
              const Icon = getSectionIcon(section.type);
              const color = getSectionColor(section.type);
              const isExpanded = expandedSections[section.id] !== false;

              return (
                <div key={section.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection(section.id)}
                    className={`w-full p-4 flex items-center justify-between transition-colors ${
                      color === 'blue' ? 'bg-blue-50 border-b border-blue-100 hover:bg-blue-100' :
                      color === 'red' ? 'bg-red-50 border-b border-red-100 hover:bg-red-100' :
                      color === 'green' ? 'bg-green-50 border-b border-green-100 hover:bg-green-100' :
                      color === 'purple' ? 'bg-purple-50 border-b border-purple-100 hover:bg-purple-100' :
                      color === 'indigo' ? 'bg-indigo-50 border-b border-indigo-100 hover:bg-indigo-100' :
                      color === 'orange' ? 'bg-orange-50 border-b border-orange-100 hover:bg-orange-100' :
                      color === 'gray' ? 'bg-gray-50 border-b border-gray-100 hover:bg-gray-100' : 'bg-slate-50 border-b border-slate-100 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${
                        color === 'blue' ? 'text-blue-600' :
                        color === 'red' ? 'text-red-600' :
                        color === 'green' ? 'text-green-600' :
                        color === 'purple' ? 'text-purple-600' :
                        color === 'indigo' ? 'text-indigo-600' :
                        color === 'orange' ? 'text-orange-600' :
                        color === 'gray' ? 'text-gray-600' : 'text-slate-600'
                      }`} />
                      <span className="text-lg font-semibold text-gray-900">
                        {section.number}. {section.title}
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-500" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="p-6 bg-white">
                      {section.content.map((item, idx) => (
                        <div key={idx}>
                          {renderFormattedContent(item)}
                        </div>
                      ))}

                      {section.subsections.map((subsection) => (
                        <div key={subsection.id} className="mt-6 border-l-2 border-gray-200 pl-4">
                          <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center text-sm font-bold">
                              {subsection.number}
                            </span>
                            {subsection.title}
                          </h4>
                          {subsection.content.map((item, idx) => (
                            <div key={idx}>
                              {renderFormattedContent(item)}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            {isEditing ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Edit Document</h3>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      hasChanges ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {hasChanges ? 'Unsaved Changes' : 'No Changes'}
                    </span>
                  </div>
                </div>
                <textarea
                  value={editedContent}
                  onChange={handleContentChange}
                  className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Edit your TRD document here..."
                />
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!hasChanges}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      hasChanges 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                  {editedContent}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EditableTRDFormatter;
