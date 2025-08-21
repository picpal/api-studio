import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';

interface BodyEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

const BodyEditor: React.FC<BodyEditorProps> = ({
  value,
  onChange,
  placeholder = "요청 본문을 입력하세요...",
  readOnly = false
}) => {
  const [isValidJson, setIsValidJson] = useState(true);
  const [formattedValue, setFormattedValue] = useState(value);

  useEffect(() => {
    setFormattedValue(value);
    validateJson(value);
  }, [value]);

  const validateJson = (jsonString: string) => {
    if (!jsonString.trim()) {
      setIsValidJson(true);
      return;
    }

    try {
      JSON.parse(jsonString);
      setIsValidJson(true);
    } catch (e) {
      setIsValidJson(false);
    }
  };

  const handleFormat = () => {
    if (!value.trim()) return;

    try {
      const parsed = JSON.parse(value);
      const formatted = JSON.stringify(parsed, null, 2);
      setFormattedValue(formatted);
      onChange(formatted);
      setIsValidJson(true);
    } catch (e) {
      console.error('Invalid JSON for formatting:', e);
    }
  };

  const handleMinify = () => {
    if (!value.trim()) return;

    try {
      const parsed = JSON.parse(value);
      const minified = JSON.stringify(parsed);
      setFormattedValue(minified);
      onChange(minified);
      setIsValidJson(true);
    } catch (e) {
      console.error('Invalid JSON for minification:', e);
    }
  };

  const handleChange = (newValue: string) => {
    setFormattedValue(newValue);
    onChange(newValue);
    validateJson(newValue);
  };

  return (
    <div className="flex flex-col h-full">
      {!readOnly && (
        <div className="flex justify-between items-center p-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Request Body</span>
            {!isValidJson && (
              <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                Invalid JSON
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="xs"
              onClick={handleFormat}
              disabled={!isValidJson || !value.trim()}
            >
              Format
            </Button>
            <Button
              variant="ghost"
              size="xs"
              onClick={handleMinify}
              disabled={!isValidJson || !value.trim()}
            >
              Minify
            </Button>
          </div>
        </div>
      )}
      
      <div className="flex-1 relative">
        <textarea
          value={formattedValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`w-full h-full p-3 font-mono text-sm border-0 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            readOnly ? 'bg-gray-50' : 'bg-white'
          } ${!isValidJson ? 'border-red-300' : ''}`}
          style={{ minHeight: '200px' }}
        />
      </div>
    </div>
  );
};

export default BodyEditor;