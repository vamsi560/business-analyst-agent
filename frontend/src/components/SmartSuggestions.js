import React, { useState, useEffect } from 'react';
import { 
  Lightbulb, CheckCircle, XCircle, AlertTriangle, 
  FileText, Target, Users, Clock, TrendingUp,
  ChevronDown, ChevronUp, RefreshCw, Star,
  MessageSquare, ThumbsUp, ThumbsDown, BookOpen
} from 'lucide-react';

const SmartSuggestions = ({ 
  document, 
  analysis, 
  onApplySuggestion,
  onDismissSuggestion,
  showSuggestions = true,
  maxSuggestions = 5
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedSuggestion, setExpandedSuggestion] = useState(null);
  const [feedback, setFeedback] = useState({});
  const [showAll, setShowAll] = useState(false);

  // Generate smart suggestions based on document content
  const generateSuggestions = async () => {
    if (!document && !analysis) return;

    setLoading(true);
    try {
      // Call actual AI service for suggestions
      const response = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document: document,
          analysis: analysis,
          maxSuggestions: maxSuggestions
        })
      });

      if (response.ok) {
        const suggestions = await response.json();
        setSuggestions(suggestions);
      } else {
        console.error('Failed to generate suggestions');
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Apply suggestion
  const handleApplySuggestion = (suggestion) => {
    if (onApplySuggestion) {
      onApplySuggestion(suggestion);
    }
    
    // Mark as applied
    setSuggestions(prev => 
      prev.map(s => 
        s.id === suggestion.id 
          ? { ...s, applied: true, appliedAt: new Date().toISOString() }
          : s
      )
    );
  };

  // Dismiss suggestion
  const handleDismissSuggestion = (suggestion) => {
    if (onDismissSuggestion) {
      onDismissSuggestion(suggestion);
    }
    
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  };

  // Provide feedback on suggestion
  const handleFeedback = (suggestionId, feedbackType) => {
    setFeedback(prev => ({
      ...prev,
      [suggestionId]: feedbackType
    }));
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Get effort color
  const getEffortColor = (effort) => {
    switch (effort) {
      case 'Low':
        return 'text-green-600';
      case 'Medium':
        return 'text-yellow-600';
      case 'High':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // Generate suggestions on component mount or when document changes
  useEffect(() => {
    if (document || analysis) {
      generateSuggestions();
    }
  }, [document, analysis]);

  if (!showSuggestions || (!document && !analysis)) {
    return null;
  }

  const visibleSuggestions = showAll ? suggestions : suggestions.slice(0, 3);
  const hasMoreSuggestions = suggestions.length > 3;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Lightbulb className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Smart Suggestions</h3>
            <p className="text-sm text-gray-500">
              AI-powered recommendations to improve your document
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={generateSuggestions}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            title="Refresh suggestions"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="text-gray-600">Generating smart suggestions...</span>
          </div>
        </div>
      ) : suggestions.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">Great job!</h4>
          <p className="text-gray-500">
            Your document looks comprehensive. No major improvements needed at this time.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleSuggestions.map((suggestion) => {
            const Icon = suggestion.icon;
            const isExpanded = expandedSuggestion === suggestion.id;
            const isApplied = suggestion.applied;
            const userFeedback = feedback[suggestion.id];

            return (
              <div
                key={suggestion.id}
                className={`
                  border rounded-lg p-4 transition-all duration-200
                  ${suggestion.bgColor} ${suggestion.borderColor}
                  ${isApplied ? 'opacity-75' : 'hover:shadow-md'}
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${suggestion.bgColor}`}>
                      <Icon className={`w-5 h-5 ${suggestion.color}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900">{suggestion.title}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(suggestion.priority)}`}>
                          {suggestion.priority}
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {suggestion.category}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">{suggestion.description}</p>
                      
                      {isExpanded && (
                        <div className="space-y-3">
                          <div className="bg-white bg-opacity-50 rounded-lg p-3">
                            <h5 className="font-medium text-gray-900 mb-2">Suggestion:</h5>
                            <p className="text-sm text-gray-700">{suggestion.suggestion}</p>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Impact: </span>
                              <span className="text-gray-600">{suggestion.impact}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Effort: </span>
                              <span className={`font-medium ${getEffortColor(suggestion.effort)}`}>
                                {suggestion.effort}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {!isApplied && (
                      <>
                        <button
                          onClick={() => setExpandedSuggestion(isExpanded ? null : suggestion.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          title={isExpanded ? "Show less" : "Show more"}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        
                        <button
                          onClick={() => handleApplySuggestion(suggestion)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Apply
                        </button>
                        
                        <button
                          onClick={() => handleDismissSuggestion(suggestion)}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Dismiss suggestion"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    
                    {isApplied && (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Applied</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Feedback Section */}
                {isExpanded && !isApplied && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">Was this suggestion helpful?</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleFeedback(suggestion.id, 'helpful')}
                          className={`p-1 rounded ${
                            userFeedback === 'helpful' 
                              ? 'bg-green-100 text-green-600' 
                              : 'text-gray-400 hover:text-green-600'
                          }`}
                          title="Helpful"
                        >
                          <ThumbsUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleFeedback(suggestion.id, 'not-helpful')}
                          className={`p-1 rounded ${
                            userFeedback === 'not-helpful' 
                              ? 'bg-red-100 text-red-600' 
                              : 'text-gray-400 hover:text-red-600'
                          }`}
                          title="Not helpful"
                        >
                          <ThumbsDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          
          {hasMoreSuggestions && (
            <div className="text-center pt-4">
              <button
                onClick={() => setShowAll(!showAll)}
                className="px-4 py-2 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
              >
                {showAll ? 'Show less' : `Show ${suggestions.length - 3} more suggestions`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartSuggestions;

