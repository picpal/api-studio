import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Button from '../ui/Button';
import { ApiRequest } from '../../types/api';

interface BodyEditorProps {
    request: ApiRequest;
    setRequest: React.Dispatch<React.SetStateAction<ApiRequest>>;
}

const BodyEditor: React.FC<BodyEditorProps> = ({ request, setRequest }) => {
    const [showBodyPreview, setShowBodyPreview] = useState(false);

    const detectContentLanguage = (content: string): string => {
        if (!content) return 'plaintext';
        const trimmedContent = content.trim();
        if ((trimmedContent.startsWith('{') && trimmedContent.endsWith('}')) ||
            (trimmedContent.startsWith('[') && trimmedContent.endsWith(']'))) {
            try {
                JSON.parse(trimmedContent);
                return 'json';
            } catch { /* not json */ }
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
                setRequest({...request, body: formatted});
            } catch (error) {
                // Invalid JSON, do nothing
            }
        }
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

    return (
        <div className="flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-700">Request Body</span>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={formatRequestBody}
                            disabled={!request.body}
                            variant="primary"
                            size="sm"
                        >
                            Format
                        </Button>
                        <Button
                            onClick={() => setShowBodyPreview(!showBodyPreview)}
                            disabled={!request.body}
                            variant={showBodyPreview ? "primary" : "secondary"}
                            size="sm"
                        >
                            {showBodyPreview ? 'Edit' : 'Preview'}
                        </Button>
                    </div>
                </div>
            </div>
            
            {showBodyPreview && request.body ? (
                <div className="flex-1 overflow-auto">
                    {renderSyntaxHighlighter(request.body)}
                </div>
            ) : (
                <div className="flex-1 border border-gray-300 rounded overflow-hidden">
                    <Editor
                        height="300px"
                        language={getMonacoLanguage(request.body)}
                        value={request.body}
                        onChange={(value) => setRequest(prev => ({...prev, body: value || ''}))}
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
