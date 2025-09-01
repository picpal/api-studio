import React from 'react';
import { TestExecution } from './TestExecution';

interface TestReportModalProps {
  currentExecution: TestExecution[];
  showModal: boolean;
  onClose: () => void;
}

interface ReportData {
  summary: {
    totalTests: number;
    successCount: number;
    failureCount: number;
    successRate: number;
    avgResponseTime: number;
    validationTests: number;
    validationPassed: number;
    validationRate: number;
  };
  executions: TestExecution[];
  failedTests: TestExecution[];
  statusCodeStats: Record<number, number>;
}

export const TestReportModal: React.FC<TestReportModalProps> = ({
  currentExecution,
  showModal,
  onClose
}) => {
  // 리포트 생성 로직
  const generateReportData = (): ReportData | null => {
    const allExecutions = [...currentExecution];
    if (allExecutions.length === 0) return null;

    const totalTests = allExecutions.length;
    const successCount = allExecutions.filter(e => e.status === 'success').length;
    const failureCount = allExecutions.filter(e => e.status === 'failed').length;
    const successRate = totalTests > 0 ? (successCount / totalTests) * 100 : 0;
    
    // 응답 시간 계산 - API와 Pipeline 구분
    const executionsWithResponseTime = allExecutions.filter(e => e.responseTime);
    const avgResponseTime = executionsWithResponseTime.length > 0 
      ? executionsWithResponseTime.reduce((sum, e) => sum + (e.responseTime || 0), 0) / executionsWithResponseTime.length
      : 0;

    // Validation은 API에만 적용
    const validationTests = allExecutions.filter(e => e.validationEnabled && e.type !== 'pipeline');
    const validationPassed = validationTests.filter(e => e.validationResult?.passed).length;
    const validationRate = validationTests.length > 0 ? (validationPassed / validationTests.length) * 100 : 0;

    const failedTests = allExecutions.filter(e => e.status === 'failed');
    
    // Status code 통계 - API에서만 가져오거나 Pipeline의 Step에서 가져오기
    const statusCodeStats = allExecutions.reduce((acc: Record<number, number>, e) => {
      if (e.type === 'pipeline' && e.stepExecutions) {
        // Pipeline의 각 Step에서 status code 수집
        e.stepExecutions.forEach(step => {
          if (step.statusCode) {
            acc[step.statusCode] = (acc[step.statusCode] || 0) + 1;
          }
        });
      } else if (e.statusCode) {
        // 일반 API의 status code
        acc[e.statusCode] = (acc[e.statusCode] || 0) + 1;
      }
      return acc;
    }, {});

    return {
      summary: {
        totalTests,
        successCount,
        failureCount,
        successRate,
        avgResponseTime,
        validationTests: validationTests.length,
        validationPassed,
        validationRate
      },
      executions: allExecutions,
      failedTests,
      statusCodeStats
    };
  };

  const exportReport = () => {
    const reportData = generateReportData();
    if (!reportData) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
            .stat-card { background: white; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
            .test-result { border: 1px solid #ddd; margin-bottom: 10px; padding: 10px; border-radius: 5px; }
            .success { border-left: 5px solid #10b981; }
            .failed { border-left: 5px solid #ef4444; }
          </style>
        </head>
        <body>
          <h1>Test Report</h1>
          <div class="summary">
            <h2>Summary</h2>
            <div class="stats">
              <div class="stat-card">
                <h3>Total Tests</h3>
                <p style="font-size: 24px; margin: 0;">${reportData.summary.totalTests}</p>
              </div>
              <div class="stat-card">
                <h3>Success Rate</h3>
                <p style="font-size: 24px; margin: 0; color: #10b981;">${reportData.summary.successRate.toFixed(1)}%</p>
              </div>
              <div class="stat-card">
                <h3>Avg Response Time</h3>
                <p style="font-size: 24px; margin: 0;">${reportData.summary.avgResponseTime.toFixed(0)}ms</p>
              </div>
              <div class="stat-card">
                <h3>Validation Rate</h3>
                <p style="font-size: 24px; margin: 0; color: #6366f1;">${reportData.summary.validationRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
          <h2>Test Results</h2>
          ${reportData.executions.map(execution => `
            <div class="test-result ${execution.status}">
              <h3>${execution.apiName} ${execution.type === 'pipeline' ? '(PIPELINE)' : ''} (${execution.status.toUpperCase()})</h3>
              ${execution.type === 'pipeline' ? `
                <p><strong>Type:</strong> Pipeline | <strong>Total Time:</strong> ${execution.responseTime || 'N/A'}ms</p>
                <p><strong>Steps:</strong> ${execution.stepExecutions?.length || 0}</p>
                ${execution.stepExecutions && execution.stepExecutions.length > 0 ? `
                  <div style="margin: 10px 0;">
                    <h4 style="margin: 5px 0; font-size: 14px; color: #4b5563;">Pipeline Step Details:</h4>
                    ${execution.stepExecutions.map((step, index) => `
                      <div style="margin: 10px 0; padding: 10px; border: 1px solid #e5e7eb; border-left: 3px solid ${step.status === 'success' ? '#10b981' : '#ef4444'}; background: #f9fafb; border-radius: 4px;">
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                          <span style="display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; background: #8b5cf6; color: white; border-radius: 50%; font-size: 12px; font-weight: bold;">
                            ${step.stepOrder || index + 1}
                          </span>
                          <strong style="font-size: 14px;">${step.stepName}</strong>
                          <span style="padding: 2px 8px; font-size: 11px; background: ${step.status === 'success' ? '#d1fae5' : '#fee2e2'}; color: ${step.status === 'success' ? '#065f46' : '#991b1b'}; border-radius: 4px;">
                            ${step.status.toUpperCase()}
                          </span>
                        </div>
                        
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                          <strong>Method:</strong> ${step.method} | <strong>URL:</strong> ${step.url || 'N/A'}
                          <br><strong>Status Code:</strong> ${step.statusCode || 'N/A'} | <strong>Response Time:</strong> ${step.responseTime || 'N/A'}ms
                        </div>
                        
                        ${step.error ? `
                          <div style="margin: 8px 0; padding: 6px; background: #fee2e2; border: 1px solid #fecaca; border-radius: 4px;">
                            <span style="color: #991b1b; font-size: 12px;"><strong>Error:</strong> ${step.error}</span>
                          </div>
                        ` : ''}
                        
                        ${step.requestBody ? `
                          <details style="margin-top: 8px;">
                            <summary style="cursor: pointer; font-size: 12px; font-weight: 600; color: #4b5563;">Request Body (Click to expand)</summary>
                            <pre style="background: #fef3c7; padding: 8px; border-radius: 4px; font-size: 11px; max-height: 150px; overflow-y: auto; margin-top: 4px; white-space: pre-wrap; word-break: break-all;">${
                              step.requestBody.length > 500 
                                ? step.requestBody.substring(0, 500) + '... (truncated)' 
                                : step.requestBody
                            }</pre>
                          </details>
                        ` : ''}
                        
                        ${step.requestHeaders && Object.keys(step.requestHeaders).length > 0 ? `
                          <details style="margin-top: 8px;">
                            <summary style="cursor: pointer; font-size: 12px; font-weight: 600; color: #4b5563;">Request Headers (Click to expand)</summary>
                            <pre style="background: #fef3c7; padding: 8px; border-radius: 4px; font-size: 11px; max-height: 100px; overflow-y: auto; margin-top: 4px;">${JSON.stringify(step.requestHeaders, null, 2)}</pre>
                          </details>
                        ` : ''}
                        
                        ${step.responseBody ? `
                          <details style="margin-top: 8px;">
                            <summary style="cursor: pointer; font-size: 12px; font-weight: 600; color: #4b5563;">Response Data (Click to expand)</summary>
                            <pre style="background: #f3f4f6; padding: 8px; border-radius: 4px; font-size: 11px; max-height: 200px; overflow-y: auto; margin-top: 4px; white-space: pre-wrap; word-break: break-all;">${
                              step.responseBody.length > 1000 
                                ? step.responseBody.substring(0, 1000) + '... (truncated)' 
                                : step.responseBody
                            }</pre>
                          </details>
                        ` : ''}
                        
                        ${step.responseHeaders && Object.keys(step.responseHeaders).length > 0 ? `
                          <details style="margin-top: 8px;">
                            <summary style="cursor: pointer; font-size: 12px; font-weight: 600; color: #4b5563;">Response Headers (Click to expand)</summary>
                            <pre style="background: #f3f4f6; padding: 8px; border-radius: 4px; font-size: 11px; max-height: 150px; overflow-y: auto; margin-top: 4px;">${JSON.stringify(step.responseHeaders, null, 2)}</pre>
                          </details>
                        ` : ''}
                        
                        ${step.extractedData && Object.keys(step.extractedData).length > 0 ? `
                          <details style="margin-top: 8px;">
                            <summary style="cursor: pointer; font-size: 12px; font-weight: 600; color: #059669;">🔽 Extracted Variables (Click to expand)</summary>
                            <pre style="background: #d1fae5; border: 1px solid #a7f3d0; padding: 8px; border-radius: 4px; font-size: 11px; max-height: 150px; overflow-y: auto; margin-top: 4px; color: #065f46;">${JSON.stringify(step.extractedData, null, 2)}</pre>
                          </details>
                        ` : ''}
                        
                        ${step.injectedData && Object.keys(step.injectedData).length > 0 ? `
                          <details style="margin-top: 8px;">
                            <summary style="cursor: pointer; font-size: 12px; font-weight: 600; color: #2563eb;">🔼 Injected Variables (Click to expand)</summary>
                            <pre style="background: #dbeafe; border: 1px solid #93c5fd; padding: 8px; border-radius: 4px; font-size: 11px; max-height: 150px; overflow-y: auto; margin-top: 4px; color: #1d4ed8;">${JSON.stringify(step.injectedData, null, 2)}</pre>
                          </details>
                        ` : ''}
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
              ` : `
                <p><strong>Method:</strong> ${execution.method} | <strong>URL:</strong> ${execution.url}</p>
                <p><strong>Status Code:</strong> ${execution.statusCode || 'N/A'} | <strong>Response Time:</strong> ${execution.responseTime || 'N/A'}ms</p>
              `}
              
              ${execution.type !== 'pipeline' && execution.requestParams ? `
                <div style="margin: 10px 0;">
                  <h4 style="margin: 5px 0; font-size: 14px; color: #4b5563;">Request Parameters:</h4>
                  <pre style="background: #f3f4f6; padding: 8px; border-radius: 4px; font-size: 12px; max-height: 100px; overflow-y: auto;">${typeof execution.requestParams === 'string' ? execution.requestParams : JSON.stringify(execution.requestParams, null, 2)}</pre>
                </div>
              ` : ''}
              
              ${execution.type !== 'pipeline' && execution.requestHeaders && Object.keys(execution.requestHeaders).length > 0 ? `
                <div style="margin: 10px 0;">
                  <h4 style="margin: 5px 0; font-size: 14px; color: #4b5563;">Request Headers:</h4>
                  <pre style="background: #f3f4f6; padding: 8px; border-radius: 4px; font-size: 12px; max-height: 100px; overflow-y: auto;">${JSON.stringify(execution.requestHeaders, null, 2)}</pre>
                </div>
              ` : ''}
              
              ${execution.type !== 'pipeline' && execution.requestBody ? `
                <div style="margin: 10px 0;">
                  <h4 style="margin: 5px 0; font-size: 14px; color: #4b5563;">Request Body:</h4>
                  <pre style="background: #f3f4f6; padding: 8px; border-radius: 4px; font-size: 12px; max-height: 100px; overflow-y: auto;">${execution.requestBody}</pre>
                </div>
              ` : ''}
              
              ${execution.type !== 'pipeline' && execution.responseData ? `
                <div style="margin: 10px 0;">
                  <h4 style="margin: 5px 0; font-size: 14px; color: #4b5563;">Response Data:</h4>
                  <pre style="background: #dbeafe; padding: 8px; border-radius: 4px; font-size: 12px; max-height: 100px; overflow-y: auto;">${typeof execution.responseData === 'string' ? execution.responseData : JSON.stringify(execution.responseData, null, 2)}</pre>
                </div>
              ` : ''}
              
              ${execution.type !== 'pipeline' && execution.validationEnabled && execution.validationResult ? `
                <p><strong>Validation:</strong> ${execution.validationResult.passed ? 'PASSED' : 'FAILED'}</p>
              ` : ''}
              ${execution.error ? `<p style="color: #ef4444;"><strong>Error:</strong> ${execution.error}</p>` : ''}
            </div>
          `).join('')}
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-report-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!showModal) return null;

  const reportData = generateReportData();
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
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Test Report</h2>
            <p className="text-sm text-gray-500">Generated on {new Date().toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportReport}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              Export HTML
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 모달 내용 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* 요약 통계 */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Executive Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded border">
                  <div className="text-2xl font-bold text-blue-600">{reportData.summary.totalTests}</div>
                  <div className="text-sm text-gray-600">Total Tests</div>
                </div>
                <div className="bg-white p-4 rounded border">
                  <div className="text-2xl font-bold text-green-600">{reportData.summary.successRate.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
                <div className="bg-white p-4 rounded border">
                  <div className="text-2xl font-bold text-purple-600">{reportData.summary.avgResponseTime.toFixed(0)}ms</div>
                  <div className="text-sm text-gray-600">Avg Response Time</div>
                </div>
                <div className="bg-white p-4 rounded border">
                  <div className="text-2xl font-bold text-indigo-600">{reportData.summary.validationRate.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">Validation Rate</div>
                </div>
              </div>
            </div>

            {/* 성공/실패 비율 시각화 */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Test Results Overview</h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-sm">Success ({reportData.summary.successCount})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span className="text-sm">Failed ({reportData.summary.failureCount})</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-green-500 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${reportData.summary.successRate}%` }}
                ></div>
              </div>
            </div>

            {/* 실패한 테스트 분석 */}
            {reportData.failedTests.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-800 mb-4">Failed Tests Analysis</h3>
                <div className="space-y-3">
                  {reportData.failedTests.map((test, index) => (
                    <div key={index} className="bg-white p-4 rounded border border-red-200">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-red-800">{test.apiName}</h4>
                        <span className="text-sm text-red-600">{test.method}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{test.url}</p>
                      {test.error && (
                        <p className="text-sm text-red-700 bg-red-100 p-2 rounded">{test.error}</p>
                      )}
                      {test.validationResult && !test.validationResult.passed && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-red-700">Validation Failures:</p>
                          {test.validationResult.results.filter(r => !r.passed).map((result, idx) => (
                            <p key={idx} className="text-sm text-red-600 ml-2">
                              • {result.key}: 기대값 "{result.expectedValue}", 실제값 "{typeof result.actualValue === 'undefined' ? 'undefined' : result.actualValue}"
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 상세 결과 목록 */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Detailed Results</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {reportData.executions.map((execution, index) => (
                  <div 
                    key={index} 
                    className={`p-4 rounded border-l-4 ${
                      execution.status === 'success' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{execution.apiName}</h4>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded ${
                          execution.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {execution.status.toUpperCase()}
                        </span>
                        {execution.statusCode && (
                          <span className={`px-2 py-1 text-xs rounded ${
                            execution.statusCode >= 200 && execution.statusCode < 300 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {execution.statusCode}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{execution.method} • {execution.url}</p>
                    
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>Response Time: {execution.responseTime || 'N/A'}ms</span>
                      {execution.validationEnabled && (
                        <span className={`${execution.validationResult?.passed ? 'text-green-600' : 'text-red-600'}`}>
                          Validation: {execution.validationResult?.passed ? 'PASSED' : 'FAILED'}
                        </span>
                      )}
                    </div>
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