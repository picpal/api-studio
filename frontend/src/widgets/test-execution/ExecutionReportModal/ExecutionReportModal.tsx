import React from 'react';
import { TestExecution } from '../../../entities/test-execution';
import { useReportGeneration } from '../../../features/test-automation/model/useReportGeneration';
import { useReportExport } from '../../../features/test-automation/model/useReportExport';
import JsonViewer from '../../../features/test-automation/ui/JsonViewer';

interface ExecutionReportModalProps {
  currentExecution: TestExecution[];
  showModal: boolean;
  onClose: () => void;
}

export const ExecutionReportModal: React.FC<ExecutionReportModalProps> = ({
  currentExecution,
  showModal,
  onClose
}) => {
  const { reportData } = useReportGeneration(currentExecution);
  const { exportReport } = useReportExport();

  const handleExportReport = () => {
    if (reportData) {
      exportReport(reportData);
    }
  };

  if (!showModal) return null;

  if (!reportData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6">
          <p className="text-center text-gray-500">No test data available for reporting</p>
          <div className="flex justify-center mt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-7xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b bg-blue-600 text-white rounded-t-lg">
          <div>
            <h2 className="text-2xl font-bold">📊 Test Execution Report</h2>
            <p className="text-sm opacity-90 mt-1">Generated on {new Date().toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportReport}
              className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm bg-white text-blue-600 rounded hover:bg-gray-100 transition-colors font-medium"
            >
              <span className="sm:hidden">📥</span>
              <span className="hidden sm:inline">📥 Export HTML</span>
            </button>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="text-xl font-bold mb-4 text-gray-800">실행 요약</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                  <div className="text-3xl font-bold text-blue-600">{reportData.summary.totalTests}</div>
                  <div className="text-sm text-blue-700 font-medium">Total Tests</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                  <div className="text-3xl font-bold text-green-600">{reportData.summary.successRate.toFixed(1)}%</div>
                  <div className="text-sm text-green-700 font-medium">Success Rate</div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                  <div className="text-3xl font-bold text-blue-600">{reportData.summary.avgResponseTime.toFixed(0)}ms</div>
                  <div className="text-sm text-blue-700 font-medium">Avg Response</div>
                </div>
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-lg border border-indigo-200">
                  <div className="text-3xl font-bold text-indigo-600">{reportData.summary.validationRate.toFixed(1)}%</div>
                  <div className="text-sm text-indigo-700 font-medium">Validation Rate</div>
                </div>
              </div>
            </div>

            {reportData.pipelineStats.totalPipelines > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                <h3 className="text-xl font-bold mb-4 text-blue-800">Pipeline 통계</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-blue-600">{reportData.pipelineStats.totalPipelines}</div>
                    <div className="text-sm text-gray-600">Total Pipelines</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-green-600">{reportData.pipelineStats.successfulPipelines}</div>
                    <div className="text-sm text-gray-600">Successful</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-orange-600">{reportData.pipelineStats.totalSteps}</div>
                    <div className="text-sm text-gray-600">Total Steps</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-blue-600">
                      {reportData.pipelineStats.successfulSteps}/{reportData.pipelineStats.totalSteps}
                    </div>
                    <div className="text-sm text-gray-600">Steps Passed</div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="text-xl font-bold mb-4 text-gray-800">테스트 결과</h3>
              <div className="mb-4">
                <div className="flex items-center gap-4 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-sm font-medium">Success ({reportData.summary.successCount})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span className="text-sm font-medium">Failed ({reportData.summary.failureCount})</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-green-600 h-8 rounded-full transition-all duration-500 flex items-center justify-center text-white font-bold text-sm"
                    style={{ width: `${reportData.summary.successRate}%` }}
                  >
                    {reportData.summary.successRate > 10 && `${reportData.summary.successRate.toFixed(1)}%`}
                  </div>
                </div>
              </div>
            </div>

            {reportData.failedTests.length > 0 && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                <h3 className="text-xl font-bold text-red-800 mb-4">🚨 테스트 실패 내역</h3>
                <div className="space-y-3">
                  {reportData.failedTests.slice(0, 5).map((test, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg border border-red-200 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-red-800">{test.apiName}</h4>
                        <span className="text-sm font-medium text-red-600">{test.method}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{test.url}</p>
                      {test.error && (
                        <div className="text-sm text-red-700 bg-red-100 p-2 rounded">{test.error}</div>
                      )}
                    </div>
                  ))}
                  {reportData.failedTests.length > 5 && (
                    <p className="text-sm text-red-600 text-center font-medium">
                      ... and {reportData.failedTests.length - 5} more failed tests
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="text-xl font-bold mb-4 text-gray-800">테스트 결과 상세</h3>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {reportData.executions.map((execution, index) => (
                  <div 
                    key={index} 
                    className={`p-4 rounded-lg ${
                      execution.type === 'pipeline' 
                        ? 'bg-blue-50' 
                        : execution.status === 'success' 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-red-500 bg-red-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {execution.type === 'pipeline' && (
                          <span className="px-2 py-1 text-xs font-bold rounded bg-blue-200 text-blue-800">
                            PIPELINE
                          </span>
                        )}
                        <h4 className="font-semibold text-lg">{execution.apiName}</h4>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 text-xs font-bold rounded ${
                          execution.status === 'success' 
                            ? 'bg-green-200 text-green-800' 
                            : 'bg-red-200 text-red-800'
                        }`}>
                          {execution.status.toUpperCase()}
                        </span>
                        {execution.statusCode && (
                          <span className={`px-3 py-1 text-xs font-bold rounded ${
                            execution.statusCode >= 200 && execution.statusCode < 300 
                              ? 'bg-blue-200 text-blue-800' 
                              : 'bg-orange-200 text-orange-800'
                          }`}>
                            {execution.statusCode}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {execution.type === 'pipeline' ? (
                      <div>
                        <p className="text-sm text-gray-600 mb-3">
                          Total Time: {execution.responseTime || 0}ms | Steps: {execution.stepExecutions?.length || 0}
                        </p>
                        {execution.stepExecutions && execution.stepExecutions.length > 0 && (
                          <div className="space-y-3">
                            {execution.stepExecutions.map((step, stepIndex) => (
                              <div key={stepIndex} className="bg-white rounded-lg border border-blue-200 overflow-hidden">
                                <div className="p-3 border-b border-blue-100">
                                  <div className="flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-bold">
                                      {step.stepOrder || stepIndex + 1}
                                    </span>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3">
                                        <span className="font-medium">{step.stepName}</span>
                                        <span className={`text-xs px-2 py-1 rounded font-medium ${
                                          step.status === 'success' 
                                            ? 'bg-green-100 text-green-600' 
                                            : 'bg-red-100 text-red-600'
                                        }`}>
                                          {step.status === 'success' ? '✅' : '❌'} {step.statusCode || 'N/A'}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                          {(() => {
                                            try {
                                              if (step.requestData && typeof step.requestData === 'string') {
                                                const requestData = JSON.parse(step.requestData);
                                                if (requestData.method) {
                                                  return `${requestData.method} • ${step.responseTime || 0}ms`;
                                                }
                                              }
                                            } catch (e) {
                                              // 파싱 실패시 기본값 사용
                                            }
                                            return `${step.apiItem?.method || step.method} • ${step.responseTime || 0}ms`;
                                          })()}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="p-4 border-t bg-gray-50 space-y-3">
                                  <div className="text-sm">
                                    <div className="font-semibold text-gray-700 mb-1">📍 Endpoint:</div>
                                    <div className="bg-white p-2 rounded border text-xs font-mono">
                                      {(() => {
                                        // requestData에서 실제 URL 추출
                                        try {
                                          if (step.requestData && typeof step.requestData === 'string') {
                                            const requestData = JSON.parse(step.requestData);
                                            if (requestData.url && requestData.method) {
                                              return `${requestData.method} ${requestData.url}`;
                                            }
                                          }
                                        } catch (e) {
                                          // 파싱 실패시 기본값으로
                                        }
                                        
                                        // 백업: apiItem 정보 사용
                                        const method = step.apiItem?.method || step.method || 'UNKNOWN';
                                        if (step.apiItem?.baseUrl && step.apiItem?.url) {
                                          return `${method} ${step.apiItem.baseUrl}${step.apiItem.url}`;
                                        } else if (step.apiItem?.url) {
                                          return `${method} ${step.apiItem.url}`;
                                        } else {
                                          return `${method} [URL not available]`;
                                        }
                                      })()}
                                    </div>
                                  </div>
                                  
                                  {step.requestHeaders && Object.keys(step.requestHeaders).length > 0 && (
                                    <div className="text-sm">
                                      <div className="font-semibold text-gray-700 mb-1">📤 Request Headers:</div>
                                      <pre className="bg-white p-2 rounded border text-xs overflow-x-auto">
{JSON.stringify(step.requestHeaders, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                  
                                  {step.requestBody && (
                                    <JsonViewer
                                      data={step.requestBody}
                                      title="📤 Request Body"
                                      maxHeight="160px"
                                      className=""
                                      theme="light"
                                    />
                                  )}
                                  
                                  {step.injectedData && Object.keys(step.injectedData).length > 0 && (
                                    <div className="text-sm">
                                      <div className="font-semibold text-blue-700 mb-1">🔼 Injected Variables:</div>
                                      <div className="bg-blue-50 border border-blue-200 p-2 rounded">
                                        <pre className="text-xs text-blue-900">
{JSON.stringify(step.injectedData, null, 2)}
                                        </pre>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {step.responseHeaders && Object.keys(step.responseHeaders).length > 0 && (
                                    <div className="text-sm">
                                      <div className="font-semibold text-gray-700 mb-1">📥 Response Headers:</div>
                                      <pre className="bg-white p-2 rounded border text-xs overflow-x-auto">
{JSON.stringify(step.responseHeaders, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                  
                                  {step.responseBody && (
                                    <JsonViewer
                                      data={step.responseBody}
                                      title="📥 Response Body"
                                      maxHeight="200px"
                                      className=""
                                      theme="light"
                                    />
                                  )}
                                  
                                  {step.extractedData && Object.keys(step.extractedData).length > 0 && (
                                    <div className="text-sm">
                                      <div className="font-semibold text-green-700 mb-1">🔽 Extracted Variables:</div>
                                      <div className="bg-green-50 border border-green-200 p-2 rounded">
                                        <pre className="text-xs text-green-900">
{JSON.stringify(step.extractedData, null, 2)}
                                        </pre>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {step.error && (
                                    <div className="text-sm">
                                      <div className="font-semibold text-red-700 mb-1">❌ Error:</div>
                                      <div className="bg-red-50 border border-red-200 p-2 rounded text-red-700 text-xs">
                                        {step.error}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 font-medium">
                          View Details
                        </summary>
                        <div className="mt-3 space-y-3 p-3 bg-white rounded-lg">
                          <div className="text-sm">
                            <div className="font-semibold text-gray-700 mb-1">📍 Endpoint:</div>
                            <div className="bg-gray-50 p-2 rounded border text-xs font-mono">
                              {execution.method} {execution.url}
                            </div>
                          </div>
                          
                          {execution.requestHeaders && Object.keys(execution.requestHeaders).length > 0 && (
                            <div className="text-sm">
                              <div className="font-semibold text-gray-700 mb-1">📤 Request Headers:</div>
                              <pre className="bg-gray-50 p-2 rounded border text-xs overflow-x-auto">
{JSON.stringify(execution.requestHeaders, null, 2)}
                              </pre>
                            </div>
                          )}
                          
                          {execution.requestParams && (
                            <div className="text-sm">
                              <div className="font-semibold text-gray-700 mb-1">📤 Request Parameters:</div>
                              <pre className="bg-gray-50 p-2 rounded border text-xs overflow-x-auto">
{typeof execution.requestParams === 'string' 
  ? execution.requestParams 
  : JSON.stringify(execution.requestParams, null, 2)}
                              </pre>
                            </div>
                          )}
                          
                          {execution.requestBody && (
                            <JsonViewer
                              data={execution.requestBody}
                              title="📤 Request Body"
                              maxHeight="160px"
                              className=""
                              theme="light"
                            />
                          )}
                          
                          {execution.responseData && (
                            <JsonViewer
                              data={execution.responseData}
                              title="📥 Response Data"
                              maxHeight="200px"
                              className=""
                              theme="light"
                            />
                          )}
                          
                          {execution.validationEnabled && execution.validationResult && (
                            <div className="text-sm">
                              <div className="font-semibold text-gray-700 mb-1">✅ Validation Results:</div>
                              <div className={`p-2 rounded border ${
                                execution.validationResult.passed 
                                  ? 'bg-green-50 border-green-200' 
                                  : 'bg-red-50 border-red-200'
                              }`}>
                                <div className="text-xs font-medium mb-1">
                                  Status: {execution.validationResult.passed ? '✅ PASSED' : '❌ FAILED'}
                                </div>
                                {execution.validationResult.results && execution.validationResult.results.length > 0 && (
                                  <div className="space-y-1">
                                    {execution.validationResult.results.map((result, idx) => (
                                      <div key={idx} className={`text-xs ${result.passed ? 'text-green-700' : 'text-red-700'}`}>
                                        {result.passed ? '✓' : '✗'} {result.key}: 
                                        {result.passed 
                                          ? ` "${result.actualValue}"` 
                                          : ` Expected "${result.expectedValue}", Got "${result.actualValue}"`}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t">
                            <span>Response Time: {execution.responseTime || 0}ms</span>
                            <span>Status Code: {execution.statusCode || 'N/A'}</span>
                          </div>
                        </div>
                      </details>
                    )}
                    
                    {execution.error && (
                      <div className="mt-3 p-2 bg-red-100 text-red-700 rounded text-sm">
                        Error: {execution.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};