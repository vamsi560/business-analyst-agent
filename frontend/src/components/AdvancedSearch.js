import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, X, Calendar, Tag, User, FileText, 
  ChevronDown, ChevronUp, SortAsc, SortDesc, Clock,
  CheckCircle, AlertCircle, Eye, EyeOff
} from 'lucide-react';

const AdvancedSearch = ({ 
  documents = [], 
  analyses = [],
  onSearchResults,
  placeholder = "Search documents and analyses...",
  showFilters = true,
  showSorting = true,
  enableSavedSearches = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState({
    // Content filters
    contentTypes: [],
    fileTypes: [],
    dateRange: { start: '', end: '' },
    
    // Status filters
    statuses: [],
    lobs: [],
    tags: [],
    
    // User filters
    authors: [],
    uploaders: [],
    
    // Size filters
    sizeRange: { min: '', max: '' },
    
    // Text filters
    hasContent: true,
    hasAttachments: false,
    isPublic: false,
    
    // Advanced filters
    searchInContent: true,
    searchInMetadata: true,
    caseSensitive: false,
    wholeWords: false,
    useRegex: false
  });
  
  const [sorting, setSorting] = useState({
    field: 'date',
    order: 'desc',
    secondaryField: 'name',
    secondaryOrder: 'asc'
  });
  
  const [savedSearches, setSavedSearches] = useState([]);
  const [showSavedSearches, setShowSavedSearches] = useState(false);

  // Available filter options
  const filterOptions = {
    contentTypes: [
      { value: 'document', label: 'Documents', icon: FileText },
      { value: 'analysis', label: 'Analyses', icon: CheckCircle },
      { value: 'trd', label: 'TRD', icon: FileText },
      { value: 'brd', label: 'BRD', icon: FileText }
    ],
    fileTypes: [
      { value: 'pdf', label: 'PDF', color: 'text-red-600' },
      { value: 'docx', label: 'Word', color: 'text-blue-600' },
      { value: 'xlsx', label: 'Excel', color: 'text-emerald-600' },
      { value: 'pptx', label: 'PowerPoint', color: 'text-orange-600' },
      { value: 'txt', label: 'Text', color: 'text-gray-600' },
      { value: 'json', label: 'JSON', color: 'text-purple-600' },
      { value: 'jpg', label: 'Images', color: 'text-green-600' }
    ],
    statuses: [
      { value: 'completed', label: 'Completed', color: 'text-green-600' },
      { value: 'pending', label: 'Pending', color: 'text-yellow-600' },
      { value: 'in_progress', label: 'In Progress', color: 'text-blue-600' },
      { value: 'failed', label: 'Failed', color: 'text-red-600' },
      { value: 'draft', label: 'Draft', color: 'text-gray-600' }
    ],
    lobs: [
      { value: 'insurance', label: 'Insurance', icon: '🏢' },
      { value: 'banking', label: 'Banking', icon: '🏦' },
      { value: 'healthcare', label: 'Healthcare', icon: '🏥' },
      { value: 'retail', label: 'Retail', icon: '🛒' },
      { value: 'manufacturing', label: 'Manufacturing', icon: '🏭' }
    ],
    sortFields: [
      { value: 'date', label: 'Date' },
      { value: 'name', label: 'Name' },
      { value: 'size', label: 'Size' },
      { value: 'type', label: 'Type' },
      { value: 'status', label: 'Status' },
      { value: 'lob', label: 'Line of Business' },
      { value: 'author', label: 'Author' },
      { value: 'relevance', label: 'Relevance' }
    ]
  };

  // Extract unique values from data
  const extractUniqueValues = (items, field) => {
    const values = new Set();
    items.forEach(item => {
      const value = item[field];
      if (value) {
        if (Array.isArray(value)) {
          value.forEach(v => values.add(v));
        } else {
          values.add(value);
        }
      }
    });
    return Array.from(values).sort();
  };

  const availableTags = extractUniqueValues([...documents, ...analyses], 'tags');
  const availableAuthors = extractUniqueValues([...documents, ...analyses], 'author');
  const availableUploaders = extractUniqueValues([...documents, ...analyses], 'uploader');

  // Perform search with filters
  const performSearch = () => {
    const allItems = [
      ...documents.map(doc => ({ ...doc, type: 'document' })),
      ...analyses.map(analysis => ({ ...analysis, type: 'analysis' }))
    ];

    let results = allItems;

    // Text search
    if (searchQuery.trim()) {
      const query = searchQuery.trim();
      const searchRegex = filters.useRegex ? new RegExp(query, filters.caseSensitive ? 'g' : 'gi') : null;
      
      results = results.filter(item => {
        const searchFields = [];
        
        if (filters.searchInContent) {
          searchFields.push(item.content || '');
          searchFields.push(item.text || '');
          searchFields.push(item.description || '');
        }
        
        if (filters.searchInMetadata) {
          searchFields.push(item.filename || item.name || item.title || '');
          searchFields.push(item.tags?.join(' ') || '');
          searchFields.push(item.lob || '');
          searchFields.push(item.author || '');
        }

        const searchText = searchFields.join(' ').toLowerCase();
        
        if (filters.useRegex && searchRegex) {
          return searchRegex.test(searchText);
        } else if (filters.wholeWords) {
          const words = query.toLowerCase().split(' ');
          return words.every(word => 
            searchText.includes(word)
          );
        } else {
          return searchText.includes(query.toLowerCase());
        }
      });
    }

    // Apply filters
    if (filters.contentTypes.length > 0) {
      results = results.filter(item => filters.contentTypes.includes(item.type));
    }

    if (filters.fileTypes.length > 0) {
      results = results.filter(item => {
        const fileExt = (item.filename || item.name || '').toLowerCase().split('.').pop();
        return filters.fileTypes.includes(fileExt);
      });
    }

    if (filters.statuses.length > 0) {
      results = results.filter(item => filters.statuses.includes(item.status));
    }

    if (filters.lobs.length > 0) {
      results = results.filter(item => filters.lobs.includes(item.lob));
    }

    if (filters.tags.length > 0) {
      results = results.filter(item => 
        item.tags && filters.tags.some(tag => item.tags.includes(tag))
      );
    }

    if (filters.authors.length > 0) {
      results = results.filter(item => filters.authors.includes(item.author));
    }

    if (filters.uploaders.length > 0) {
      results = results.filter(item => filters.uploaders.includes(item.uploader));
    }

    // Date range filter
    if (filters.dateRange.start || filters.dateRange.end) {
      results = results.filter(item => {
        const itemDate = new Date(item.uploadDate || item.date || item.createdAt);
        const startDate = filters.dateRange.start ? new Date(filters.dateRange.start) : null;
        const endDate = filters.dateRange.end ? new Date(filters.dateRange.end) : null;
        
        if (startDate && itemDate < startDate) return false;
        if (endDate && itemDate > endDate) return false;
        return true;
      });
    }

    // Size range filter
    if (filters.sizeRange.min || filters.sizeRange.max) {
      results = results.filter(item => {
        const size = item.size || 0;
        const minSize = filters.sizeRange.min ? parseInt(filters.sizeRange.min) * 1024 : 0;
        const maxSize = filters.sizeRange.max ? parseInt(filters.sizeRange.max) * 1024 : Infinity;
        return size >= minSize && size <= maxSize;
      });
    }

    // Boolean filters
    if (filters.hasContent) {
      results = results.filter(item => item.content || item.text);
    }

    if (filters.hasAttachments) {
      results = results.filter(item => item.attachments && item.attachments.length > 0);
    }

    if (filters.isPublic) {
      results = results.filter(item => item.isPublic === true);
    }

    // Sort results
    results.sort((a, b) => {
      let aValue, bValue;
      
      switch (sorting.field) {
        case 'date':
          aValue = new Date(a.uploadDate || a.date || a.createdAt);
          bValue = new Date(b.uploadDate || b.date || b.createdAt);
          break;
        case 'name':
          aValue = (a.filename || a.name || a.title || '').toLowerCase();
          bValue = (b.filename || b.name || b.title || '').toLowerCase();
          break;
        case 'size':
          aValue = a.size || 0;
          bValue = b.size || 0;
          break;
        case 'type':
          aValue = (a.filename || a.name || '').toLowerCase().split('.').pop();
          bValue = (b.filename || b.name || '').toLowerCase().split('.').pop();
          break;
        case 'status':
          aValue = (a.status || '').toLowerCase();
          bValue = (b.status || '').toLowerCase();
          break;
        case 'lob':
          aValue = (a.lob || '').toLowerCase();
          bValue = (b.lob || '').toLowerCase();
          break;
        case 'author':
          aValue = (a.author || '').toLowerCase();
          bValue = (b.author || '').toLowerCase();
          break;
        case 'relevance':
          // Simple relevance scoring based on search query matches
          aValue = calculateRelevance(a, searchQuery);
          bValue = calculateRelevance(b, searchQuery);
          break;
        default:
          aValue = aValue || '';
          bValue = bValue || '';
      }
      
      let comparison = 0;
      if (aValue > bValue) comparison = 1;
      if (aValue < bValue) comparison = -1;
      
      if (comparison === 0 && sorting.secondaryField && sorting.secondaryField !== sorting.field) {
        // Secondary sort
        switch (sorting.secondaryField) {
          case 'name':
            aValue = (a.filename || a.name || a.title || '').toLowerCase();
            bValue = (b.filename || b.name || b.title || '').toLowerCase();
            break;
          case 'date':
            aValue = new Date(a.uploadDate || a.date || a.createdAt);
            bValue = new Date(b.uploadDate || b.date || b.createdAt);
            break;
        }
        if (aValue > bValue) comparison = 1;
        if (aValue < bValue) comparison = -1;
      }
      
      return sorting.order === 'asc' ? comparison : -comparison;
    });

    return results;
  };

  // Calculate relevance score for search results
  const calculateRelevance = (item, query) => {
    if (!query) return 0;
    
    const searchText = [
      item.filename || item.name || item.title || '',
      item.content || item.text || '',
      item.tags?.join(' ') || '',
      item.lob || '',
      item.author || ''
    ].join(' ').toLowerCase();
    
    const queryWords = query.toLowerCase().split(' ');
    let score = 0;
    
    queryWords.forEach(word => {
      if (searchText.includes(word)) {
        score += 1;
        // Bonus for exact matches in filename/title
        if ((item.filename || item.name || item.title || '').toLowerCase().includes(word)) {
          score += 2;
        }
      }
    });
    
    return score;
  };

  // Handle filter changes
  const updateFilter = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const toggleArrayFilter = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType].includes(value)
        ? prev[filterType].filter(item => item !== value)
        : [...prev[filterType], value]
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      contentTypes: [],
      fileTypes: [],
      dateRange: { start: '', end: '' },
      statuses: [],
      lobs: [],
      tags: [],
      authors: [],
      uploaders: [],
      sizeRange: { min: '', max: '' },
      hasContent: true,
      hasAttachments: false,
      isPublic: false,
      searchInContent: true,
      searchInMetadata: true,
      caseSensitive: false,
      wholeWords: false,
      useRegex: false
    });
  };

  const saveSearch = () => {
    const searchConfig = {
      id: Date.now(),
      name: searchQuery || 'Advanced Search',
      query: searchQuery,
      filters: filters,
      sorting: sorting,
      createdAt: new Date().toISOString()
    };
    
    setSavedSearches(prev => [...prev, searchConfig]);
    setShowSavedSearches(false);
  };

  const loadSavedSearch = (savedSearch) => {
    setSearchQuery(savedSearch.query);
    setFilters(savedSearch.filters);
    setSorting(savedSearch.sorting);
    setShowSavedSearches(false);
  };

  // Perform search when filters change
  useEffect(() => {
    const results = performSearch();
    if (onSearchResults) {
      onSearchResults(results);
    }
  }, [searchQuery, filters, sorting, documents, analyses]);

  const hasActiveFilters = Object.values(filters).some(value => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(v => v !== '' && v !== false);
    }
    return value !== '' && value !== false && value !== true;
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      {/* Search Bar */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {showFilters && (
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
              hasActiveFilters
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1">
                {Object.values(filters).filter(v => 
                  Array.isArray(v) ? v.length > 0 : 
                  typeof v === 'object' ? Object.values(v).some(x => x !== '' && x !== false) :
                  v !== '' && v !== false && v !== true
                ).length}
              </span>
            )}
            {showAdvancedFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
        
        {enableSavedSearches && (
          <button
            onClick={() => setShowSavedSearches(!showSavedSearches)}
            className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Saved
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="border-t border-gray-200 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Content Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content Types</label>
              <div className="space-y-2">
                {filterOptions.contentTypes.map(option => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.contentTypes.includes(option.value)}
                      onChange={() => toggleArrayFilter('contentTypes', option.value)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* File Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">File Types</label>
              <div className="space-y-2">
                {filterOptions.fileTypes.map(option => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.fileTypes.includes(option.value)}
                      onChange={() => toggleArrayFilter('fileTypes', option.value)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`ml-2 text-sm ${option.color}`}>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <div className="space-y-2">
                {filterOptions.statuses.map(option => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.statuses.includes(option.value)}
                      onChange={() => toggleArrayFilter('statuses', option.value)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`ml-2 text-sm ${option.color}`}>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, start: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Start date"
                />
                <input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, end: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="End date"
                />
              </div>
            </div>

            {/* Size Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Size Range (KB)</label>
              <div className="space-y-2">
                <input
                  type="number"
                  value={filters.sizeRange.min}
                  onChange={(e) => updateFilter('sizeRange', { ...filters.sizeRange, min: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Min size"
                />
                <input
                  type="number"
                  value={filters.sizeRange.max}
                  onChange={(e) => updateFilter('sizeRange', { ...filters.sizeRange, max: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Max size"
                />
              </div>
            </div>

            {/* Search Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Options</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.searchInContent}
                    onChange={(e) => updateFilter('searchInContent', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Search in content</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.searchInMetadata}
                    onChange={(e) => updateFilter('searchInMetadata', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Search in metadata</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.caseSensitive}
                    onChange={(e) => updateFilter('caseSensitive', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Case sensitive</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.wholeWords}
                    onChange={(e) => updateFilter('wholeWords', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Whole words only</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.useRegex}
                    onChange={(e) => updateFilter('useRegex', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Use regex</span>
                </label>
              </div>
            </div>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Sorting Options */}
      {showSorting && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              value={sorting.field}
              onChange={(e) => setSorting(prev => ({ ...prev, field: e.target.value }))}
              className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {filterOptions.sortFields.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <button
              onClick={() => setSorting(prev => ({ ...prev, order: prev.order === 'asc' ? 'desc' : 'asc' }))}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title={`Sort ${sorting.order === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              {sorting.order === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Saved Searches */}
      {showSavedSearches && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Saved Searches</h3>
            <button
              onClick={saveSearch}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Current
            </button>
          </div>
          <div className="space-y-2">
            {savedSearches.map(search => (
              <div key={search.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{search.name}</p>
                  <p className="text-xs text-gray-500">{search.query}</p>
                </div>
                <button
                  onClick={() => loadSavedSearch(search)}
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Load
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;

