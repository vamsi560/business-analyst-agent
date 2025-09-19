import React, { useState } from 'react';
import { 
  FileText, ChevronDown, ChevronRight, Hash, CheckCircle, 
  AlertTriangle, Info, Target, Users, Zap, Shield, Database,
  ArrowRight, Copy, Download, Eye
} from 'lucide-react';

const ProfessionalTRDFormatter = ({ content, title = "Technical Requirements Document" }) => {
  const [expandedSections, setExpandedSections] = useState({});
  const [activeTab, setActiveTab] = useState('formatted');

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
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

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
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

      // Main section headers (## or **bold** or ALL CAPS)
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
      // Subsection headers
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
      // Regular content
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
    
    // Add the last section
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
    // Format numbered lists
    if (/^\d+\./.test(line)) {
      return {
        type: 'numbered',
        content: line.replace(/^\d+\.\s*/, ''),
        number: line.match(/^\d+/)[0]
      };
    }
    // Format bullet points
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return {
        type: 'bullet',
        content: line.replace(/^[-*]\s*/, '')
      };
    }
    // Format requirements with IDs
    if (/^REQ-\d+|^FR-\d+|^NFR-\d+/.test(line)) {
      return {
        type: 'requirement',
        id: line.match(/^[A-Z]+-\d+/)[0],
        content: line.replace(/^[A-Z]+-\d+:?\s*/, '')
      };
    }
    // Regular text
    return {
      type: 'text',
      content: line
    };
  };

  const getSectionIcon = (type) => {
    const iconMap = {
      requirements: Target,
      security: Shield,
      performance: Zap,
      interface: Users,
      data: Database,
      integration: ArrowRight,
      assumptions: Info,
      general: FileText
    };
    return iconMap[type] || FileText;
  };

  const getSectionColor = (type) => {
    const colorMap = {
      requirements: 'blue',
      security: 'red',
      performance: 'green',
      interface: 'purple',
      data: 'indigo',
      integration: 'orange',
      assumptions: 'gray',
      general: 'slate'
    };
    return colorMap[type] || 'slate';
  };

  const sections = parseContent(content);

  const renderFormattedContent = (item) => {
    switch (item.type) {
      case 'numbered':
        return (
          <div className="flex items-start gap-3 mb-2">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-bold">
              {item.number}
            </span>
            <span className="text-gray-700">{item.content}</span>
          </div>
        );
      case 'bullet':
        return (
          <div className="flex items-start gap-3 mb-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
            <span className="text-gray-700">{item.content}</span>
          </div>
        );
      case 'requirement':
        return (
          <div className="flex items-start gap-3 mb-3 p-3 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
            <span className="flex-shrink-0 px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded">
              {item.id}
            </span>
            <span className="text-gray-800 font-medium">{item.content}</span>
          </div>
        );
      case 'table':
        return renderTable(item);
      default:
        return (
          <p className="text-gray-700 mb-2 leading-relaxed">{item.content}</p>
        );
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

  return (
    <div className="bg-white rounded-lg shadow-lg border">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-600">Professional Business Requirements Documentation</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
              Version 1.0
            </span>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
              {sections.length} Sections
            </span>
          </div>
        </div>
      </div>

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
            Raw Content
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
              const isExpanded = expandedSections[section.id] !== false; // Default to expanded

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
                      {/* Section content */}
                      {section.content.map((item, idx) => (
                        <div key={idx}>
                          {renderFormattedContent(item)}
                        </div>
                      ))}

                      {/* Subsections */}
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
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
              {content}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfessionalTRDFormatter;

