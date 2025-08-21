import React from 'react';
import { ApiRequest } from '../../../entities/api-item';
import { Button, Input, Select } from '../../../shared/ui';

interface ApiRequestPanelProps {
  request: ApiRequest;
  loading: boolean;
  onRequestChange: (request: ApiRequest) => void;
  onMethodChange: (method: string) => void;
  onSend: () => void;
}

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

export const ApiRequestPanel: React.FC<ApiRequestPanelProps> = ({
  request,
  loading,
  onRequestChange,
  onMethodChange,
  onSend
}) => {
  return (
    <div className="bg-white border-b border-gray-200 px-3 py-2">
      <div className="flex items-center">
        <Select
          value={request.method}
          onChange={(e) => onMethodChange(e.target.value)}
          className={`border-0 text-xs font-bold ${getMethodColor(request.method)}`}
          options={[
            { value: 'GET', label: 'GET' },
            { value: 'POST', label: 'POST' },
            { value: 'PUT', label: 'PUT' },
            { value: 'DELETE', label: 'DELETE' },
            { value: 'PATCH', label: 'PATCH' }
          ]}
        />
        
        <Input
          type="text"
          className="flex-1 mx-2 text-sm"
          value={request.url}
          onChange={(e) => onRequestChange({...request, url: e.target.value})}
          placeholder="https://api.example.com/endpoint"
        />
        
        <Button
          onClick={onSend}
          loading={loading}
          variant="primary"
          size="sm"
          className="min-w-[60px]"
        >
          Send
        </Button>
      </div>
    </div>
  );
};