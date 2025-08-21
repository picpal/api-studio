import React from 'react';
import Button from '../ui/Button';
import Editor from '@monaco-editor/react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface BodyEditorProps {
  body: string;
  showPreview: boolean;
  onBodyChange: (body: string) => void;
  onTogglePreview: () => void;
  onFormat: () => void;
}

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

const renderSyntaxHighlighter = (content: string): React.JSX.Element => {
  const stringContent = String(content);
  const language = detectContentLanguage(stringContent);

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

const BodyEditor: React.FC<BodyEditorProps> = ({
  body,
  showPreview,
  onBodyChange,
  onTogglePreview,
  onFormat
}) => {
  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-700">Request Body</span>
          <div className="flex items-center gap-2">
            <Button
              onClick={onFormat}
              disabled={!body}
              variant="primary"
              size="sm"
            >
              Format
            </Button>
            <Button
              onClick={onTogglePreview}
              disabled={!body}
              variant={showPreview ? "primary" : "secondary"}
              size="sm"
            >
              {showPreview ? 'Edit' : 'Preview'}
            </Button>
          </div>
        </div>
      </div>
      
      {showPreview && body ? (
        <div className="flex-1 overflow-auto">
          {renderSyntaxHighlighter(body)}
        </div>
      ) : (
        <div className="flex-1 border border-gray-300 rounded overflow-hidden">
          <Editor
            height="300px"
            language={getMonacoLanguage(body)}
            value={body}
            onChange={(value) => onBodyChange(value || '')}
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
      )}
    </div>
  );
};

export default BodyEditor;