import React, { useState, useMemo } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, prism } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface JsonViewerProps {
  data: any;
  title: string;
  maxHeight?: string;
  className?: string;
  theme?: 'light' | 'dark';
}

const JsonViewer: React.FC<JsonViewerProps> = ({
  data,
  title,
  maxHeight = '200px',
  className = '',
  theme = 'light'
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const formattedJson = useMemo(() => {
    try {
      let processedData = data;
      
      // 문자열인 경우 JSON 파싱 시도
      if (typeof data === 'string') {
        try {
          processedData = JSON.parse(data);
        } catch {
          return data; // JSON이 아닌 문자열은 그대로 반환
        }
      }
      
      return JSON.stringify(processedData, null, 2);
    } catch (error) {
      return typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    }
  }, [data]);

  const isJsonData = useMemo(() => {
    try {
      if (typeof data === 'string') {
        JSON.parse(data);
        return true;
      }
      return typeof data === 'object';
    } catch {
      return false;
    }
  }, [data]);

  if (!data) return null;

  return (
    <div className={`text-sm ${className}`}>
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors mb-2 w-full text-left"
        title={isCollapsed ? 'Expand' : 'Collapse'}
      >
        <svg 
          className={`w-4 h-4 transform transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <div className="font-semibold">{title}</div>
      </button>
      
      {!isCollapsed && (
        <div className={`rounded border overflow-hidden ${maxHeight ? `max-h-[${maxHeight}]` : ''} overflow-y-auto`}>
          {isJsonData ? (
            <SyntaxHighlighter
              language="json"
              style={theme === 'dark' ? vscDarkPlus : prism}
              customStyle={{
                margin: 0,
                padding: '12px',
                fontSize: '11px',
                lineHeight: '1.4',
                background: theme === 'dark' ? '#1e1e1e' : '#f8f9fa',
              }}
              showLineNumbers={false}
              wrapLines={true}
              wrapLongLines={true}
            >
              {formattedJson}
            </SyntaxHighlighter>
          ) : (
            <pre 
              className={`p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap ${
                theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'
              }`}
              style={{ maxHeight }}
            >
              {formattedJson}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

export default JsonViewer;