import React from 'react';
import { TestExecution } from './TestExecution';

interface ExecutionDetailModalProps {
  selectedExecution: TestExecution | null;
  showModal: boolean;
  onClose: () => void;
}

export const ExecutionDetailModal: React.FC<ExecutionDetailModalProps> = ({
  selectedExecution,
  showModal,
  onClose
}) => {
  if (!showModal || !selectedExecution) return null;

  const getStatusIcon = (status: TestExecution['status']) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'running':
        return '🔄';
      case 'success':
        return '✅';
      case 'failed':
        return '❌';
    }
  };

  const getStatusColor = (status: TestExecution['status']) => {
    switch (status) {
      case 'pending':
        return 'text-gray-500';
      case 'running':
        return 'text-blue-500';
      case 'success':
        return 'text-green-500';
      case 'failed':
        return 'text-red-500';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* 모달 헤더 */}
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <h2 className="text-lg font-medium flex items-center gap-2">
                <span>{getStatusIcon(selectedExecution.status)}</span>
                {selectedExecution.apiName}
              </h2>
              <p className="text-sm text-gray-500">
                {selectedExecution.method} • {selectedExecution.url}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 모달 내용 */}
          <div className="max-h-[80vh] overflow-y-auto p-4">
            {/* 실행 정보 */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-xs text-gray-500">Status</div>
                <div className={`text-sm font-medium ${getStatusColor(selectedExecution.status)}`}>
                  {selectedExecution.status.toUpperCase()}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-xs text-gray-500">Status Code</div>
                <div className={`text-sm font-medium ${selectedExecution.statusCode && selectedExecution.statusCode >= 200 && selectedExecution.statusCode < 300 ? 'text-green-600' : selectedExecution.statusCode ? 'text-red-600' : ''}`}>
                  {selectedExecution.statusCode || 'N/A'}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-xs text-gray-500">Response Time</div>
                <div className="text-sm font-medium">
                  {selectedExecution.responseTime ? `${selectedExecution.responseTime}ms` : 'N/A'}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-xs text-gray-500">Validation</div>
                <div className="text-sm font-medium">
                  {selectedExecution.validationEnabled ? (
                    selectedExecution.validationResult ? (
                      <span className={selectedExecution.validationResult.passed ? 'text-green-600' : 'text-red-600'}>
                        {selectedExecution.validationResult.passed ? '✅ Passed' : '❌ Failed'}
                      </span>
                    ) : '⏳ Running'
                  ) : (
                    <span className="text-gray-500">Disabled</span>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-xs text-gray-500">Timestamp</div>
                <div className="text-sm font-medium">
                  {selectedExecution.timestamp instanceof Date 
                    ? selectedExecution.timestamp.toLocaleTimeString()
                    : new Date(selectedExecution.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>

            {/* 에러 메시지 (있는 경우) */}
            {selectedExecution.error && (
              <div className="mb-6">
                <h3 className="text-md font-semibold text-red-600 mb-2">Error</h3>
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <code className="text-sm text-red-700">{selectedExecution.error}</code>
                </div>
              </div>
            )}

            {/* Request/Response 탭 */}
            <div className="space-y-6">
              {/* Request Headers */}
              {selectedExecution.requestHeaders && Object.keys(selectedExecution.requestHeaders).length > 0 && (
                <div>
                  <h3 className="text-md font-semibold mb-2">Request Headers</h3>
                  <div className="bg-gray-50 border rounded p-3">
                    <pre className="text-xs text-gray-700 overflow-x-auto">
                      {JSON.stringify(selectedExecution.requestHeaders, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Request Body */}
              {selectedExecution.requestBody && (
                <div>
                  <h3 className="text-md font-semibold mb-2">Request Body</h3>
                  <div className="bg-gray-50 border rounded p-3">
                    <pre className="text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap">
                      {selectedExecution.requestBody}
                    </pre>
                  </div>
                </div>
              )}

              {/* Response Headers */}
              {selectedExecution.responseHeaders && Object.keys(selectedExecution.responseHeaders).length > 0 && (
                <div>
                  <h3 className="text-md font-semibold mb-2">Response Headers</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <pre className="text-xs text-gray-700 overflow-x-auto">
                      {JSON.stringify(selectedExecution.responseHeaders, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Response Body */}
              {selectedExecution.responseBody && (
                <div>
                  <h3 className="text-md font-semibold mb-2">Response Body</h3>
                  <div className="bg-green-50 border border-green-200 rounded p-3 max-h-80 overflow-y-auto">
                    <pre className="text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap">
                      {selectedExecution.responseBody}
                    </pre>
                  </div>
                </div>
              )}

              {/* Validation Results */}
              {selectedExecution.validationEnabled && selectedExecution.validationResult && (
                <div>
                  <h3 className="text-md font-semibold mb-2">
                    Validation Results 
                    <span className={`ml-2 text-sm ${selectedExecution.validationResult.passed ? 'text-green-600' : 'text-red-600'}`}>
                      ({selectedExecution.validationResult.passed ? 'PASSED' : 'FAILED'})
                    </span>
                  </h3>
                  <div className={`border rounded p-3 ${selectedExecution.validationResult.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    {selectedExecution.validationResult.results.length > 0 ? (
                      <div className="space-y-3">
                        <div className="text-sm font-medium text-gray-700 mb-2">
                          Test Results: {selectedExecution.validationResult.results.filter(r => r.passed).length} / {selectedExecution.validationResult.results.length} passed
                        </div>
                        {selectedExecution.validationResult.results.map((result, index) => (
                          <div key={index} className={`p-2 rounded border text-xs ${result.passed ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'}`}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`font-medium ${result.passed ? 'text-green-700' : 'text-red-700'}`}>
                                    {result.passed ? '✅' : '❌'} {result.key}
                                  </span>
                                </div>
                                <div className="text-gray-600">
                                  <div>Expected: <span className="font-mono">{result.expectedValue}</span></div>
                                  <div>
                                    Actual: <span className="font-mono">
                                      {typeof result.actualValue === 'undefined' ? 'undefined' : 
                                       typeof result.actualValue === 'string' ? `"${result.actualValue}"` :
                                       JSON.stringify(result.actualValue)}
                                    </span>
                                  </div>
                                </div>
                                {result.error && (
                                  <div className="text-red-600 mt-1">
                                    Error: {result.error}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600">No validation rules defined</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 모달 푸터 */}
          <div className="flex justify-end p-4 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};