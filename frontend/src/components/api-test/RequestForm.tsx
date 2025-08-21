import React from 'react';
import { ApiRequest } from '../../types/api';

interface RequestFormProps {
  request: ApiRequest;
  loading: boolean;
  onRequestChange: (request: ApiRequest) => void;
  onMethodChange: (method: string) => void;
  onSend: () => void;
}

const RequestForm: React.FC<RequestFormProps> = ({
  request,
  loading,
  onRequestChange,
  onMethodChange,
  onSend,
}) => {
  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'text-green-600 bg-green-50 border-green-300';
      case 'POST':
        return 'text-blue-600 bg-blue-50 border-blue-300';
      case 'PUT':
        return 'text-orange-600 bg-orange-50 border-orange-300';
      case 'DELETE':
        return 'text-red-600 bg-red-50 border-red-300';
      case 'PATCH':
        return 'text-purple-600 bg-purple-50 border-purple-300';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-300';
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-3 py-2">
      <div className="flex items-center">
        {/* Method Selector - Compact */}
        <div className="relative">
          <select 
            className={`appearance-none border-0 px-3 py-2 pr-6 text-xs font-bold rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-400 ${getMethodColor(request.method)}`}
            value={request.method}
            onChange={(e) => onMethodChange(e.target.value)}
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
            <option value="PATCH">PATCH</option>
          </select>
          <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 ${getMethodColor(request.method).split(' ')[0]}`}>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        
        {/* URL Input - Compact */}
        <input
          type="text"
          className="flex-1 mx-2 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
          value={request.url}
          onChange={(e) => onRequestChange({...request, url: e.target.value})}
          placeholder="https://api.example.com/endpoint"
        />
        
        {/* Send Button - Compact */}
        <button
          onClick={onSend}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-400 min-w-[60px] justify-center"
        >
          {loading ? (
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            'Send'
          )}
        </button>
      </div>
    </div>
  );
};

export default RequestForm;