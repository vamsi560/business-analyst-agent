import React, { useState, useEffect } from 'react';
import { 
  Globe, Languages, CheckCircle, AlertCircle, 
  Download, Upload, FileText, Settings, 
  ChevronDown, ChevronUp, Eye, EyeOff
} from 'lucide-react';

const MultiLanguageSupport = ({ 
  document,
  onLanguageChange,
  onTranslationRequest,
  supportedLanguages = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
    { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' }
  ],
  showLanguageSelector = true,
  enableTranslation = true,
  enableAutoDetection = true
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [detectedLanguage, setDetectedLanguage] = useState(null);
  const [translations, setTranslations] = useState({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [showAllLanguages, setShowAllLanguages] = useState(false);
  const [translationHistory, setTranslationHistory] = useState([]);
  const [autoTranslate, setAutoTranslate] = useState(false);

  // Language detection
  useEffect(() => {
    if (enableAutoDetection && document?.content) {
      detectLanguage(document.content);
    }
  }, [document?.content, enableAutoDetection]);

  // Language detection using actual API
  const detectLanguage = async (content) => {
    try {
      const response = await fetch('/api/ai/detect-language', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content
        })
      });

      if (response.ok) {
        const result = await response.json();
        setDetectedLanguage(result.language);
        
        // Auto-select detected language if auto-translate is enabled
        if (autoTranslate && result.language !== 'en') {
          setSelectedLanguage(result.language);
        }
      } else {
        console.error('Language detection failed');
      }
    } catch (error) {
      console.error('Language detection failed:', error);
    }
  };

  // Translate content
  const translateContent = async (content, targetLanguage) => {
    if (!enableTranslation || !content) return null;

    setIsTranslating(true);
    try {
      const response = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content,
          targetLanguage: targetLanguage,
          sourceLanguage: detectedLanguage || 'en'
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        setTranslations(prev => ({
          ...prev,
          [targetLanguage]: {
            content: result.translatedContent,
            translatedAt: new Date().toISOString(),
            confidence: result.confidence || 0.9
          }
        }));

        // Add to translation history
        setTranslationHistory(prev => [{
          id: Date.now(),
          sourceLanguage: detectedLanguage || 'en',
          targetLanguage,
          content: content.substring(0, 100) + '...',
          translatedAt: new Date().toISOString()
        }, ...prev.slice(0, 9)]); // Keep last 10 translations

        return result.translatedContent;
      } else {
        console.error('Translation failed');
        return null;
      }
    } catch (error) {
      console.error('Translation failed:', error);
      return null;
    } finally {
      setIsTranslating(false);
    }
  };


  // Handle language selection
  const handleLanguageSelect = async (languageCode) => {
    setSelectedLanguage(languageCode);
    
    if (onLanguageChange) {
      onLanguageChange(languageCode);
    }

    // Auto-translate if enabled and translation doesn't exist
    if (autoTranslate && document?.content && !translations[languageCode]) {
      await translateContent(document.content, languageCode);
    }
  };

  // Get current content (original or translated)
  const getCurrentContent = () => {
    if (selectedLanguage === 'en' || !translations[selectedLanguage]) {
      return document?.content || '';
    }
    return translations[selectedLanguage]?.content || '';
  };

  // Get language info
  const getLanguageInfo = (code) => {
    return supportedLanguages.find(lang => lang.code === code);
  };

  const currentLanguage = getLanguageInfo(selectedLanguage);
  const detectedLanguageInfo = detectedLanguage ? getLanguageInfo(detectedLanguage) : null;
  const currentTranslation = translations[selectedLanguage];

  if (!showLanguageSelector) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Globe className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Multi-Language Support</h3>
            <p className="text-sm text-gray-500">
              Translate and view documents in multiple languages
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={autoTranslate}
              onChange={(e) => setAutoTranslate(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Auto-translate
          </label>
        </div>
      </div>

      {/* Language Detection */}
      {detectedLanguage && detectedLanguage !== 'en' && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-800">
              Detected language: {detectedLanguageInfo?.flag} {detectedLanguageInfo?.nativeName} ({detectedLanguageInfo?.name})
            </span>
          </div>
        </div>
      )}

      {/* Language Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Language:</label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {supportedLanguages.slice(0, showAllLanguages ? supportedLanguages.length : 8).map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageSelect(language.code)}
              className={`p-3 rounded-lg border text-left transition-all ${
                selectedLanguage === language.code
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{language.flag}</span>
                <div>
                  <div className="font-medium text-sm">{language.nativeName}</div>
                  <div className="text-xs text-gray-500">{language.name}</div>
                </div>
                {selectedLanguage === language.code && (
                  <CheckCircle className="w-4 h-4 text-blue-600 ml-auto" />
                )}
              </div>
            </button>
          ))}
        </div>
        
        {supportedLanguages.length > 8 && (
          <button
            onClick={() => setShowAllLanguages(!showAllLanguages)}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            {showAllLanguages ? 'Show less' : `Show ${supportedLanguages.length - 8} more languages`}
          </button>
        )}
      </div>

      {/* Translation Status */}
      {selectedLanguage !== 'en' && (
        <div className="mb-4">
          {currentTranslation ? (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-800">
                  Translated to {currentLanguage?.nativeName} 
                  (Confidence: {Math.round(currentTranslation.confidence * 100)}%)
                </span>
              </div>
              <div className="text-xs text-green-600">
                {new Date(currentTranslation.translatedAt).toLocaleString()}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  Not translated to {currentLanguage?.nativeName}
                </span>
              </div>
              <button
                onClick={() => translateContent(document?.content, selectedLanguage)}
                disabled={isTranslating || !document?.content}
                className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTranslating ? 'Translating...' : 'Translate'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Translation History */}
      {translationHistory.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Translations:</h4>
          <div className="space-y-2">
            {translationHistory.slice(0, 3).map((translation) => (
              <div key={translation.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    {getLanguageInfo(translation.sourceLanguage)?.flag} → {getLanguageInfo(translation.targetLanguage)?.flag}
                  </span>
                  <span className="text-xs text-gray-600">{translation.content}</span>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(translation.translatedAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content Display */}
      {document?.content && (
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">
              Content ({currentLanguage?.nativeName})
            </h4>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const content = getCurrentContent();
                  const blob = new Blob([content], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `document_${selectedLanguage}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Download content"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
              {getCurrentContent()}
            </pre>
          </div>
        </div>
      )}

      {/* Translation Loading */}
      {isTranslating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Translating...</h3>
              <p className="text-gray-600">
                Translating to {currentLanguage?.nativeName}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiLanguageSupport;

