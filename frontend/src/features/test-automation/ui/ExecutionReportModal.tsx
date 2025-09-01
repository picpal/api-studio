import React from 'react';
import { TestExecution } from './TestExecution';
import JsonViewer from './JsonViewer';

interface ExecutionReportModalProps {
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
  pipelineStats: {
    totalPipelines: number;
    successfulPipelines: number;
    failedPipelines: number;
    totalSteps: number;
    successfulSteps: number;
    failedSteps: number;
  };
}

export const ExecutionReportModal: React.FC<ExecutionReportModalProps> = ({
  currentExecution,
  showModal,
  onClose
}) => {
  const generateReportData = (): ReportData | null => {
    const allExecutions = [...currentExecution];
    if (allExecutions.length === 0) return null;

    const totalTests = allExecutions.length;
    const successCount = allExecutions.filter(e => e.status === 'success').length;
    const failureCount = allExecutions.filter(e => e.status === 'failed').length;
    const successRate = totalTests > 0 ? (successCount / totalTests) * 100 : 0;
    
    const executionsWithResponseTime = allExecutions.filter(e => e.responseTime);
    const avgResponseTime = executionsWithResponseTime.length > 0 
      ? executionsWithResponseTime.reduce((sum, e) => sum + (e.responseTime || 0), 0) / executionsWithResponseTime.length
      : 0;

    const validationTests = allExecutions.filter(e => e.validationEnabled && e.type !== 'pipeline');
    const validationPassed = validationTests.filter(e => e.validationResult?.passed).length;
    const validationRate = validationTests.length > 0 ? (validationPassed / validationTests.length) * 100 : 0;

    const failedTests = allExecutions.filter(e => e.status === 'failed');
    
    const statusCodeStats = allExecutions.reduce((acc: Record<number, number>, e) => {
      if (e.type === 'pipeline' && e.stepExecutions) {
        e.stepExecutions.forEach(step => {
          if (step.statusCode) {
            acc[step.statusCode] = (acc[step.statusCode] || 0) + 1;
          }
        });
      } else if (e.statusCode) {
        acc[e.statusCode] = (acc[e.statusCode] || 0) + 1;
      }
      return acc;
    }, {});

    const pipelines = allExecutions.filter(e => e.type === 'pipeline');
    const pipelineStats = {
      totalPipelines: pipelines.length,
      successfulPipelines: pipelines.filter(p => p.status === 'success').length,
      failedPipelines: pipelines.filter(p => p.status === 'failed').length,
      totalSteps: pipelines.reduce((sum, p) => sum + (p.stepExecutions?.length || 0), 0),
      successfulSteps: pipelines.reduce((sum, p) => 
        sum + (p.stepExecutions?.filter(s => s.status === 'success').length || 0), 0),
      failedSteps: pipelines.reduce((sum, p) => 
        sum + (p.stepExecutions?.filter(s => s.status === 'failed').length || 0), 0)
    };

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
      statusCodeStats,
      pipelineStats
    };
  };

  const exportReport = () => {
    const reportData = generateReportData();
    if (!reportData) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test Execution Report - ${new Date().toLocaleString()}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
            .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; border-radius: 12px; margin-bottom: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
            .header h1 { font-size: 2.5em; margin-bottom: 10px; }
            .header .date { opacity: 0.9; font-size: 1.1em; }
            
            .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
            .stat-card { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); transition: transform 0.2s; }
            .stat-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.12); }
            .stat-value { font-size: 2.5em; font-weight: bold; margin-bottom: 5px; }
            .stat-label { color: #666; font-size: 0.95em; text-transform: uppercase; letter-spacing: 1px; }
            
            .success-value { color: #10b981; }
            .error-value { color: #ef4444; }
            .info-value { color: #3b82f6; }
            .warning-value { color: #f59e0b; }
            
            .section { background: white; border-radius: 12px; padding: 30px; margin-bottom: 25px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); }
            .section-title { font-size: 1.8em; margin-bottom: 20px; color: #1f2937; border-bottom: 3px solid #e5e7eb; padding-bottom: 10px; }
            
            .progress-bar { width: 100%; height: 30px; background: #e5e7eb; border-radius: 15px; overflow: hidden; margin: 20px 0; }
            .progress-fill { height: 100%; transition: width 0.3s; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; }
            .progress-success { background: linear-gradient(90deg, #10b981, #34d399); }
            .progress-error { background: linear-gradient(90deg, #ef4444, #f87171); }
            
            .test-item { border-left: 4px solid #e5e7eb; padding: 20px; margin-bottom: 15px; background: #fafafa; border-radius: 8px; transition: all 0.2s; }
            .test-item:hover { background: #f3f4f6; border-left-color: #9ca3af; }
            .test-success { border-left-color: #10b981; }
            .test-failed { border-left-color: #ef4444; background: #fef2f2; }
            
            .test-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
            .test-name { font-weight: 600; font-size: 1.1em; color: #1f2937; }
            .test-status { padding: 4px 12px; border-radius: 20px; font-size: 0.85em; font-weight: 600; }
            .status-success { background: #d1fae5; color: #065f46; }
            .status-failed { background: #fee2e2; color: #991b1b; }
            
            .test-details { color: #6b7280; font-size: 0.95em; margin-top: 8px; }
            .test-metrics { display: flex; gap: 20px; margin-top: 10px; }
            .metric { display: flex; align-items: center; gap: 5px; }
            .metric-label { font-weight: 500; }
            
            .pipeline-section { background: linear-gradient(135deg, #f3e7fc 0%, #e9d5ff 100%); border: 2px solid #c084fc; }
            .pipeline-header { background: #8b5cf6; color: white; padding: 10px 15px; border-radius: 8px; margin-bottom: 15px; }
            
            .step-container { margin-left: 20px; margin-top: 15px; }
            .step-item { display: flex; align-items: flex-start; gap: 15px; margin-bottom: 15px; padding: 15px; background: white; border-radius: 8px; border: 1px solid #e5e7eb; }
            .step-number { min-width: 35px; height: 35px; background: #8b5cf6; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; }
            .step-content { flex: 1; }
            .step-name { font-weight: 600; margin-bottom: 5px; }
            .step-details { color: #6b7280; font-size: 0.9em; }
            
            .expandable { cursor: pointer; user-select: none; }
            .expandable-content { max-height: 0; overflow: hidden; transition: max-height 0.3s; }
            .expandable-content.expanded { max-height: 500px; overflow-y: auto; }
            
            .code-block { background: #1f2937; color: #f3f4f6; padding: 15px; border-radius: 8px; font-family: 'Courier New', monospace; font-size: 0.9em; overflow-x: auto; margin-top: 10px; }
            
            .variable-badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 0.85em; font-weight: 600; margin-right: 5px; }
            .var-extracted { background: #d1fae5; color: #065f46; }
            .var-injected { background: #dbeafe; color: #1e40af; }
            
            .error-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin-top: 10px; color: #991b1b; }
            
            .charts-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 20px; }
            .chart-box { background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; }
            
            @media print {
              body { background: white; }
              .container { max-width: 100%; }
              .section { box-shadow: none; border: 1px solid #e5e7eb; }
            }
          </style>
          <script>
            function toggleExpand(id) {
              const element = document.getElementById(id);
              element.classList.toggle('expanded');
            }
          </script>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🧪 Test Execution Report</h1>
              <div class="date">Generated on ${new Date().toLocaleString()}</div>
            </div>
            
            <div class="summary-grid">
              <div class="stat-card">
                <div class="stat-value info-value">${reportData.summary.totalTests}</div>
                <div class="stat-label">Total Tests</div>
              </div>
              <div class="stat-card">
                <div class="stat-value success-value">${reportData.summary.successRate.toFixed(1)}%</div>
                <div class="stat-label">Success Rate</div>
              </div>
              <div class="stat-card">
                <div class="stat-value warning-value">${reportData.summary.avgResponseTime.toFixed(0)}ms</div>
                <div class="stat-label">Avg Response Time</div>
              </div>
              <div class="stat-card">
                <div class="stat-value info-value">${reportData.summary.validationRate.toFixed(1)}%</div>
                <div class="stat-label">Validation Pass Rate</div>
              </div>
            </div>
            
            ${reportData.pipelineStats.totalPipelines > 0 ? `
              <div class="section">
                <h2 class="section-title">📊 Pipeline Statistics</h2>
                <div class="summary-grid">
                  <div class="stat-card">
                    <div class="stat-value info-value">${reportData.pipelineStats.totalPipelines}</div>
                    <div class="stat-label">Total Pipelines</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-value success-value">${reportData.pipelineStats.successfulPipelines}</div>
                    <div class="stat-label">Successful</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-value warning-value">${reportData.pipelineStats.totalSteps}</div>
                    <div class="stat-label">Total Steps</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-value ${reportData.pipelineStats.failedSteps > 0 ? 'error-value' : 'success-value'}">
                      ${reportData.pipelineStats.successfulSteps}/${reportData.pipelineStats.totalSteps}
                    </div>
                    <div class="stat-label">Steps Passed</div>
                  </div>
                </div>
              </div>
            ` : ''}
            
            <div class="section">
              <h2 class="section-title">📈 Execution Overview</h2>
              <div class="progress-bar">
                <div class="progress-fill progress-success" style="width: ${reportData.summary.successRate}%">
                  ${reportData.summary.successRate.toFixed(1)}% Success
                </div>
              </div>
              <div class="test-metrics">
                <div class="metric">
                  <span class="metric-label">✅ Passed:</span>
                  <span class="success-value">${reportData.summary.successCount}</span>
                </div>
                <div class="metric">
                  <span class="metric-label">❌ Failed:</span>
                  <span class="error-value">${reportData.summary.failureCount}</span>
                </div>
                <div class="metric">
                  <span class="metric-label">⏱️ Total Time:</span>
                  <span>${(reportData.executions.reduce((sum, e) => sum + (e.responseTime || 0), 0) / 1000).toFixed(2)}s</span>
                </div>
              </div>
            </div>
            
            ${reportData.failedTests.length > 0 ? `
              <div class="section" style="background: #fef2f2; border: 2px solid #fecaca;">
                <h2 class="section-title" style="color: #991b1b; border-bottom-color: #fecaca;">⚠️ Failed Tests</h2>
                ${reportData.failedTests.map((test, index) => `
                  <div class="test-item test-failed">
                    <div class="test-header">
                      <div class="test-name">${test.apiName}</div>
                      <span class="test-status status-failed">FAILED</span>
                    </div>
                    <div class="test-details">
                      <div><strong>Method:</strong> ${test.method} | <strong>URL:</strong> ${test.url}</div>
                      ${test.statusCode ? `<div><strong>Status Code:</strong> ${test.statusCode}</div>` : ''}
                      ${test.error ? `<div class="error-box">Error: ${test.error}</div>` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : ''}
            
            <div class="section">
              <h2 class="section-title">📝 Detailed Test Results</h2>
              ${reportData.executions.map((execution, index) => `
                ${execution.type === 'pipeline' ? `
                  <div class="test-item pipeline-section">
                    <div class="pipeline-header">
                      <div class="test-header">
                        <div class="test-name">🔄 Pipeline: ${execution.apiName}</div>
                        <span class="test-status ${execution.status === 'success' ? 'status-success' : 'status-failed'}">
                          ${execution.status.toUpperCase()}
                        </span>
                      </div>
                      <div class="test-details" style="color: white; opacity: 0.9;">
                        Total Time: ${execution.responseTime || 0}ms | 
                        Steps: ${execution.stepExecutions?.length || 0}
                      </div>
                    </div>
                    
                    ${execution.stepExecutions && execution.stepExecutions.length > 0 ? `
                      <div class="step-container">
                        ${execution.stepExecutions.map((step, stepIndex) => `
                          <div class="step-item">
                            <div class="step-number">${step.stepOrder || stepIndex + 1}</div>
                            <div class="step-content">
                              <div class="step-name">${step.stepName}</div>
                              <div class="step-details">
                                <div><strong>${step.method}</strong> ${step.url || 'N/A'}</div>
                                <div class="test-metrics">
                                  <div class="metric">
                                    <span class="metric-label">Status:</span>
                                    <span class="${step.status === 'success' ? 'success-value' : 'error-value'}">
                                      ${step.status === 'success' ? '✅' : '❌'} ${step.statusCode || 'N/A'}
                                    </span>
                                  </div>
                                  <div class="metric">
                                    <span class="metric-label">Time:</span>
                                    <span>${step.responseTime || 0}ms</span>
                                  </div>
                                </div>
                                
                                ${step.extractedData && Object.keys(step.extractedData).length > 0 ? `
                                  <div style="margin-top: 10px;">
                                    <span class="variable-badge var-extracted">🔽 Extracted Variables</span>
                                    <div class="code-block">${JSON.stringify(step.extractedData, null, 2)}</div>
                                  </div>
                                ` : ''}
                                
                                ${step.injectedData && Object.keys(step.injectedData).length > 0 ? `
                                  <div style="margin-top: 10px;">
                                    <span class="variable-badge var-injected">🔼 Injected Variables</span>
                                    <div class="code-block">${JSON.stringify(step.injectedData, null, 2)}</div>
                                  </div>
                                ` : ''}
                                
                                ${step.error ? `
                                  <div class="error-box">Error: ${step.error}</div>
                                ` : ''}
                                
                                <div class="expandable" onclick="toggleExpand('step-${index}-${stepIndex}')" style="margin-top: 10px;">
                                  <strong style="color: #3b82f6; cursor: pointer;">▶ View Details</strong>
                                </div>
                                <div id="step-${index}-${stepIndex}" class="expandable-content">
                                  ${step.requestBody ? `
                                    <div style="margin-top: 10px;">
                                      <strong>Request Body:</strong>
                                      <div class="code-block">${step.requestBody}</div>
                                    </div>
                                  ` : ''}
                                  ${step.responseBody ? `
                                    <div style="margin-top: 10px;">
                                      <strong>Response:</strong>
                                      <div class="code-block">${step.responseBody.substring(0, 1000)}${step.responseBody.length > 1000 ? '...' : ''}</div>
                                    </div>
                                  ` : ''}
                                </div>
                              </div>
                            </div>
                          </div>
                        `).join('')}
                      </div>
                    ` : ''}
                  </div>
                ` : `
                  <div class="test-item ${execution.status === 'success' ? 'test-success' : 'test-failed'}">
                    <div class="test-header">
                      <div class="test-name">${execution.apiName}</div>
                      <span class="test-status ${execution.status === 'success' ? 'status-success' : 'status-failed'}">
                        ${execution.status.toUpperCase()}
                      </span>
                    </div>
                    <div class="test-details">
                      <div><strong>${execution.method}</strong> ${execution.url}</div>
                      <div class="test-metrics">
                        <div class="metric">
                          <span class="metric-label">Status Code:</span>
                          <span class="${execution.statusCode && execution.statusCode >= 200 && execution.statusCode < 300 ? 'success-value' : 'error-value'}">
                            ${execution.statusCode || 'N/A'}
                          </span>
                        </div>
                        <div class="metric">
                          <span class="metric-label">Response Time:</span>
                          <span>${execution.responseTime || 0}ms</span>
                        </div>
                        ${execution.validationEnabled ? `
                          <div class="metric">
                            <span class="metric-label">Validation:</span>
                            <span class="${execution.validationResult?.passed ? 'success-value' : 'error-value'}">
                              ${execution.validationResult?.passed ? '✅ PASSED' : '❌ FAILED'}
                            </span>
                          </div>
                        ` : ''}
                      </div>
                      
                      ${execution.error ? `<div class="error-box">Error: ${execution.error}</div>` : ''}
                      
                      <div class="expandable" onclick="toggleExpand('test-${index}')" style="margin-top: 10px;">
                        <strong style="color: #3b82f6; cursor: pointer;">▶ View Details</strong>
                      </div>
                      <div id="test-${index}" class="expandable-content">
                        ${execution.requestBody ? `
                          <div style="margin-top: 10px;">
                            <strong>Request Body:</strong>
                            <div class="code-block">${execution.requestBody}</div>
                          </div>
                        ` : ''}
                        ${execution.responseData ? `
                          <div style="margin-top: 10px;">
                            <strong>Response:</strong>
                            <div class="code-block">${JSON.stringify(execution.responseData, null, 2).substring(0, 1000)}${JSON.stringify(execution.responseData).length > 1000 ? '...' : ''}</div>
                          </div>
                        ` : ''}
                      </div>
                    </div>
                  </div>
                `}
              `).join('')}
            </div>
            
            <div class="section">
              <h2 class="section-title">📊 Status Code Distribution</h2>
              <div class="chart-box">
                ${Object.entries(reportData.statusCodeStats).map(([code, count]) => `
                  <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="font-weight: 600; color: ${parseInt(code) >= 200 && parseInt(code) < 300 ? '#10b981' : '#ef4444'}">
                      ${code}
                    </span>
                    <span>${count} requests</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
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
      <div className="bg-white rounded-lg w-full max-w-7xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b bg-blue-600 text-white rounded-t-lg">
          <div>
            <h2 className="text-2xl font-bold">📊 Test Execution Report</h2>
            <p className="text-sm opacity-90 mt-1">Generated on {new Date().toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportReport}
              className="px-4 py-2 text-sm bg-white text-blue-600 rounded hover:bg-gray-100 transition-colors font-medium"
            >
              📥 Export HTML
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
              <h3 className="text-xl font-bold mb-4 text-gray-800">Executive Summary</h3>
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
                <h3 className="text-xl font-bold mb-4 text-blue-800">🔄 Pipeline Statistics</h3>
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
              <h3 className="text-xl font-bold mb-4 text-gray-800">Test Results Overview</h3>
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
                <h3 className="text-xl font-bold text-red-800 mb-4">⚠️ Failed Tests Analysis</h3>
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
              <h3 className="text-xl font-bold mb-4 text-gray-800">📝 Detailed Test Results</h3>
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
                          View Details ▼
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