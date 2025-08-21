import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ApiResponse } from '../../types/api';

interface ResponseViewerProps {
  response: ApiResponse | null;
  validationEnabled: boolean;
  lastValidationResult: any;
}

const ResponseViewer: React.FC<ResponseViewerProps> = ({
  response,
  validationEnabled,
  lastValidationResult,
}) => {
  const [responseTab, setResponseTab] = useState<'body' | 'headers' | 'validation'>('body');

  const detectContentLanguage = (content: string): string => {
    if (!content) return 'plaintext';
    
    const trimmedContent = content.trim();
    
    // JSON 감지
    if ((trimmedContent.startsWith('{') && trimmedContent.endsWith('}')) ||
        (trimmedContent.startsWith('[') && trimmedContent.endsWith(']'))) {
      try {
        JSON.parse(trimmedContent);
        return 'json';
      } catch {
        // JSON이 아님
      }
    }
    
    // HTML/XML 감지
    if (trimmedContent.startsWith('<') && trimmedContent.includes('>')) {
      return trimmedContent.toLowerCase().includes('<!doctype html') || 
             trimmedContent.toLowerCase().includes('<html') ? 'html' : 'xml';
    }
    
    return 'plaintext';
  };

  const renderSyntaxHighlighter = (content: any, customLanguage?: string): React.JSX.Element => {
    let stringContent: string;
    let language: string;
    
    if (typeof content === 'object') {
      stringContent = JSON.stringify(content, null, 2);
      language = 'json';
    } else {
      stringContent = String(content);
      language = customLanguage || detectContentLanguage(stringContent);
    }

    return (
      <SyntaxHighlighter
        language={language}
        style={oneLight}
        customStyle={{
          margin: 0,
          padding: '16px',
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          fontSize: '14px',
          lineHeight: '1.4',
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          overflowX: 'auto',
          overflowY: 'auto',
          maxHeight: '400px',
          wordBreak: 'break-all',
          whiteSpace: 'pre-wrap',
          boxSizing: 'border-box'
        }}
        showLineNumbers={stringContent.split('\n').length > 10}
      >
        {stringContent}
      </SyntaxHighlighter>
    );
  };

  if (!response) {
    return (
      <div className="h-1/2 lg:flex-[2] flex flex-col bg-white min-h-0 lg:h-auto lg:min-w-0 lg:max-w-full overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="flex justify-between items-center h-9">
            <h3 className="text-xs px-3 font-medium text-gray-700">Response</h3>
            <span className="px-2 py-0.5 mr-3 rounded text-xs font-semibold bg-gray-100 text-gray-500">
              -
            </span>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-lg font-medium mb-2">요청을 시작할 수 있습니다</p>
            <p className="text-sm">URL을 입력하고 Send 버튼을 눌러 API 테스트를 시작하세요</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-1/2 lg:flex-[2] flex flex-col bg-white min-h-0 lg:h-auto lg:min-w-0 lg:max-w-full overflow-hidden">
      {/* Response Header - Compact */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="flex justify-between items-center h-9">
          <h3 className="text-xs px-3 font-medium text-gray-700">Response</h3>
          <div className="flex items-center gap-3">
            <span className={`px-2 py-0.5 mr-3 rounded text-xs font-semibold ${
              response.status >= 200 && response.status < 300 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {response.status}
            </span>
            <span className="text-gray-600 text-xs mr-3">Time: {response.time}ms</span>
            <span className="text-gray-600 text-xs mr-3">Size: {response.size}</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 border-b border-gray-200">
        <div className="flex h-9 items-center">
          {(['body', 'headers', 'validation'] as const).map((tab) => (
            <button
              key={tab}
              className={`px-3 py-1.5 text-xs font-medium border-b-2 ${
                responseTab === tab 
                  ? 'border-blue-500 text-blue-600 bg-white' 
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              } transition-colors`}
              onClick={() => setResponseTab(tab)}
            >
              {tab === 'validation' ? 'Validation' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="p-3 flex-1 overflow-hidden min-h-[200px] max-h-[500px] w-full">
        {responseTab === 'body' && (
          <div className="h-full max-h-[450px] overflow-auto w-full">
            <div className="w-0 min-w-full overflow-x-auto">
              {renderSyntaxHighlighter(response.data)}
            </div>
          </div>
        )}
        
        {responseTab === 'headers' && (
          <div className="text-sm h-full max-h-[450px] overflow-auto w-full">
            <div className="w-0 min-w-full">
              {Object.entries(response.headers).map(([key, value]) => (
                <div key={key} className="mb-2 break-all">
                  <span className="font-medium text-gray-800">{key}:</span> <span className="break-words">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {responseTab === 'validation' && (
          <div className="h-full max-h-[450px] overflow-auto w-full">
            {validationEnabled ? (
              lastValidationResult ? (
                <div className="space-y-4">
                  {/* 전체 결과 요약 */}
                  <div className={`p-4 rounded-lg border ${
                    lastValidationResult.passed 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-lg ${lastValidationResult.passed ? 'text-green-600' : 'text-red-600'}`}>
                        {lastValidationResult.passed ? '✅' : '❌'}
                      </span>
                      <h3 className={`text-md font-semibold ${lastValidationResult.passed ? 'text-green-800' : 'text-red-800'}`}>
                        Validation {lastValidationResult.passed ? 'Passed' : 'Failed'}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-700">
                      {lastValidationResult.results.filter((r: any) => r.passed).length} / {lastValidationResult.results.length} tests passed
                    </p>
                  </div>

                  {/* 개별 테스트 결과 */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700">Test Results:</h4>
                    {lastValidationResult.results.map((result: any, index: number) => (
                      <div key={index} className={`p-3 rounded border text-sm ${
                        result.passed 
                          ? 'bg-green-100 border-green-300' 
                          : 'bg-red-100 border-red-300'
                      }`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`${result.passed ? 'text-green-700' : 'text-red-700'}`}>
                              {result.passed ? '✅' : '❌'}
                            </span>
                            <span className="font-medium font-mono">{result.key}</span>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${
                            result.passed 
                              ? 'bg-green-200 text-green-800' 
                              : 'bg-red-200 text-red-800'
                          }`}>
                            {result.passed ? 'PASS' : 'FAIL'}
                          </span>
                        </div>
                        
                        <div className="space-y-1 text-xs text-gray-600">
                          <div>
                            <span className="font-medium">Expected:</span> 
                            <span className="font-mono ml-1">{
                              typeof result.expectedValue === 'string' 
                                ? `"${result.expectedValue}"` 
                                : JSON.stringify(result.expectedValue)
                            }</span>
                          </div>
                          <div>
                            <span className="font-medium">Actual:</span> 
                            <span className="font-mono ml-1">{
                              typeof result.actualValue === 'undefined' 
                                ? 'undefined'
                                : typeof result.actualValue === 'string' 
                                ? `"${result.actualValue}"`
                                : JSON.stringify(result.actualValue)
                            }</span>
                          </div>
                          {result.error && (
                            <div className="text-red-600 mt-1">
                              <span className="font-medium">Error:</span> {result.error}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-gray-500">
                  <div className="text-center">
                    <div className="text-2xl mb-2">🔍</div>
                    <div className="text-sm">No validation results yet</div>
                    <div className="text-xs text-gray-400 mt-1">Send a request to see validation results</div>
                  </div>
                </div>
              )
            ) : (
              <div className="flex items-center justify-center h-32 text-gray-500">
                <div className="text-center">
                  <div className="text-2xl mb-2">⚙️</div>
                  <div className="text-sm">Response validation is disabled</div>
                  <div className="text-xs text-gray-400 mt-1">Enable it in the "Response Validation" tab to see validation results</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponseViewer;