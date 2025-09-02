import React, { useState } from 'react';
import LazyMonacoEditor from '../common/LazyMonacoEditor';
import ParamsTable, { ParamItem } from './ParamsTable';
import HeadersTable, { HeaderItem } from './HeadersTable';
import ValidationTab, { ExpectedValue } from './ValidationTab';
import { ApiRequest } from '../../types/api';

interface RequestTabsProps {
  request: ApiRequest;
  paramsList: ParamItem[];
  headersList: HeaderItem[];
  validationEnabled: boolean;
  expectedValuesList: ExpectedValue[];
  onRequestChange: (request: ApiRequest) => void;
  onUpdateParam: (id: string, field: 'key' | 'value' | 'description' | 'required', value: string | boolean) => void;
  onRemoveParam: (id: string) => void;
  onAddParam: () => void;
  onUpdateHeader: (id: string, field: 'key' | 'value', value: string) => void;
  onRemoveHeader: (id: string) => void;
  onAddHeader: () => void;
  onToggleValidation: (enabled: boolean) => void;
  onUpdateExpectedValue: (index: number, field: 'key' | 'value', value: string) => void;
  onRemoveExpectedValue: (index: number) => void;
  onAddExpectedValue: () => void;
  onReset: () => void;
  generateCurl: () => string;
}

const RequestTabs: React.FC<RequestTabsProps> = ({
  request,
  paramsList,
  headersList,
  validationEnabled,
  expectedValuesList,
  onRequestChange,
  onUpdateParam,
  onRemoveParam,
  onAddParam,
  onUpdateHeader,
  onRemoveHeader,
  onAddHeader,
  onToggleValidation,
  onUpdateExpectedValue,
  onRemoveExpectedValue,
  onAddExpectedValue,
  onReset,
  generateCurl,
}) => {
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body' | 'curl' | 'validation'>('params');
  const [showBodyPreview, setShowBodyPreview] = useState(false);
  const [showCopyAlert, setShowCopyAlert] = useState(false);

  const detectContentLanguage = (content: string): string => {
    if (!content) return 'plaintext';
    
    const trimmedContent = content.trim();
    
    if ((trimmedContent.startsWith('{') && trimmedContent.endsWith('}')) ||
        (trimmedContent.startsWith('[') && trimmedContent.endsWith(']'))) {
      try {
        JSON.parse(trimmedContent);
        return 'json';
      } catch {
        // JSON이 아님
      }
    }
    
    if (trimmedContent.startsWith('<') && trimmedContent.includes('>')) {
      return trimmedContent.toLowerCase().includes('<!doctype html') || 
             trimmedContent.toLowerCase().includes('<html') ? 'html' : 'xml';
    }
    
    return 'plaintext';
  };

  const getMonacoLanguage = (content: string): string => {
    const detectedLang = detectContentLanguage(content);
    switch (detectedLang) {
      case 'json': return 'json';
      case 'html': return 'html';
      case 'xml': return 'xml';
      default: return 'plaintext';
    }
  };

  const formatRequestBody = () => {
    if (!request.body) return;
    
    const language = detectContentLanguage(request.body);
    
    if (language === 'json') {
      try {
        const parsed = JSON.parse(request.body);
        const formatted = JSON.stringify(parsed, null, 2);
        onRequestChange({...request, body: formatted});
      } catch (error) {
        // Invalid JSON, do nothing
      }
    }
  };

  return (
    <div className="lg:flex-[3] flex flex-col lg:border-r border-b lg:border-b-0 border-gray-200">
      {/* Request Header - Compact */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="flex justify-between items-center h-9">
          <h3 className="text-xs px-3 font-medium text-gray-700">Request</h3>
          <button
            onClick={onReset}
            className="mx-3 px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Request Tabs - Compact */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="flex justify-between items-center h-9">
          <div className="flex">
            {(['params', 'headers', 'body', 'curl', 'validation'] as const).map((tab) => (
              <button
                key={tab}
                className={`px-3 py-1.5 text-xs font-medium border-b-2 max-h ${
                  activeTab === tab 
                    ? 'border-blue-500 text-blue-600 bg-white' 
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                } transition-colors`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'curl' ? 'cURL' : tab === 'validation' ? 'Response Validation' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className={`bg-white flex-1 min-h-0 ${(activeTab === 'params' || activeTab === 'headers') ? 'p-0' : activeTab === 'validation' ? 'p-3' : 'p-3'}`}>
        {activeTab === 'params' && (
          <ParamsTable
            paramsList={paramsList}
            onUpdateParam={onUpdateParam}
            onRemoveParam={onRemoveParam}
            onAddParam={onAddParam}
          />
        )}

        {activeTab === 'headers' && (
          <HeadersTable
            headersList={headersList}
            onUpdateHeader={onUpdateHeader}
            onRemoveHeader={onRemoveHeader}
            onAddHeader={onAddHeader}
          />
        )}

        {activeTab === 'body' && (
          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-700">Request Body</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={formatRequestBody}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    disabled={!request.body}
                  >
                    Format
                  </button>
                  <button
                    onClick={() => setShowBodyPreview(!showBodyPreview)}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      showBodyPreview 
                        ? 'bg-green-600 text-white hover:bg-green-700' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    disabled={!request.body}
                  >
                    {showBodyPreview ? 'Edit' : 'Preview'}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex-1 border border-gray-300 rounded overflow-hidden">
              <LazyMonacoEditor
                height="300px"
                language={getMonacoLanguage(request.body)}
                value={request.body}
                onChange={(value) => onRequestChange({...request, body: value || ''})}
                theme="light"
                options={{
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 14,
                  lineNumbers: 'on',
                  wordWrap: 'on',
                  automaticLayout: true,
                  tabSize: 2,
                  insertSpaces: true,
                  folding: true,
                  lineDecorationsWidth: 10,
                  lineNumbersMinChars: 3,
                  glyphMargin: false,
                  contextmenu: true,
                  selectOnLineNumbers: true,
                  roundedSelection: false,
                  readOnly: false,
                  cursorStyle: 'line',
                  smoothScrolling: true,
                  padding: { top: 12, bottom: 12 }
                }}
                loading={<div className="p-4 text-gray-500">Loading editor...</div>}
              />
            </div>
          </div>
        )}

        {activeTab === 'curl' && (
          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-medium text-gray-700">Generated cURL Command</h4>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generateCurl());
                  setShowCopyAlert(true);
                  setTimeout(() => setShowCopyAlert(false), 3000);
                }}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Copy cURL
              </button>
            </div>
            <pre className="flex-1 p-4 bg-gray-50 border border-gray-300 rounded text-sm font-mono overflow-auto whitespace-pre-wrap">
              {generateCurl()}
            </pre>
          </div>
        )}

        {activeTab === 'validation' && (
          <ValidationTab
            validationEnabled={validationEnabled}
            expectedValuesList={expectedValuesList}
            onToggleValidation={onToggleValidation}
            onUpdateExpectedValue={onUpdateExpectedValue}
            onRemoveExpectedValue={onRemoveExpectedValue}
            onAddExpectedValue={onAddExpectedValue}
          />
        )}
      </div>

      {/* Copy Success Toast */}
      {showCopyAlert && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg z-50">
          <div className="flex items-center">
            <span className="text-sm">✅ cURL command copied to clipboard!</span>
            <button
              onClick={() => setShowCopyAlert(false)}
              className="ml-3 text-green-700 hover:text-green-900"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestTabs;