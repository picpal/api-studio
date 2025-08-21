import React from 'react';

interface ValidationResult {
  key: string;
  expected: string;
  actual: string | null;
  status: 'success' | 'fail' | 'error';
  message?: string;
}

interface ValidationResultsProps {
  results: ValidationResult[];
  enabled: boolean;
}

const ValidationResults: React.FC<ValidationResultsProps> = ({ results, enabled }) => {
  if (!enabled) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>Validation이 비활성화되어 있습니다.</p>
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>검증할 응답이 없습니다.</p>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return '✅';
      case 'fail':
        return '❌';
      case 'error':
        return '⚠️';
      default:
        return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'fail':
        return 'text-red-600 bg-red-50';
      case 'error':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const totalCount = results.length;

  return (
    <div className="p-4">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Validation Results</h3>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            successCount === totalCount 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {successCount}/{totalCount} Passed
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {results.map((result, index) => (
          <div 
            key={index}
            className={`border rounded-lg p-3 ${getStatusColor(result.status)}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-lg">{getStatusIcon(result.status)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{result.key}</span>
                  <span className="text-sm capitalize font-medium">
                    {result.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Expected:</span>
                    <div className="mt-1 font-mono bg-white bg-opacity-50 rounded px-2 py-1">
                      {result.expected}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Actual:</span>
                    <div className="mt-1 font-mono bg-white bg-opacity-50 rounded px-2 py-1">
                      {result.actual !== null ? result.actual : 'null'}
                    </div>
                  </div>
                </div>
                
                {result.message && (
                  <div className="mt-2 text-sm text-gray-700">
                    <span className="font-medium">Message:</span> {result.message}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ValidationResults;