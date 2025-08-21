import React, { useState } from 'react';
import Button from '../ui/Button';

interface CurlViewerProps {
  curlCommand: string;
  onReset: () => void;
}

const CurlViewer: React.FC<CurlViewerProps> = ({ curlCommand, onReset }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(curlCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy curl command:', err);
    }
  };

  return (
    <div className="p-6 border-t border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">cURL Command</h3>
        <div className="flex gap-2">
          <Button
            variant="secondary" 
            size="sm"
            onClick={handleCopy}
          >
            {copied ? '복사됨!' : '복사'}
          </Button>
          <Button
            variant="ghost" 
            size="sm"
            onClick={onReset}
          >
            초기화
          </Button>
        </div>
      </div>
      
      <div className="bg-gray-50 border rounded-lg p-4">
        <pre className="text-sm text-gray-800 whitespace-pre-wrap break-words font-mono">
          {curlCommand}
        </pre>
      </div>
    </div>
  );
};

export default CurlViewer;