import { ReportData } from '../../../entities/test-execution';

export const useReportExport = () => {
  const exportReport = (reportData: ReportData) => {
    if (!reportData) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test Execution Report - ${new Date().toLocaleString()}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e3a8a; background: #f0f9ff; }
            .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 40px; border-radius: 12px; margin-bottom: 30px; box-shadow: 0 10px 30px rgba(59,130,246,0.2); }
            .header h1 { font-size: 2.5em; margin-bottom: 10px; }
            .header .date { opacity: 0.9; font-size: 1.1em; }
            
            .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
            .stat-card { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 15px rgba(59,130,246,0.08); transition: transform 0.2s; border: 1px solid #dbeafe; }
            .stat-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(59,130,246,0.15); }
            .stat-value { font-size: 2.5em; font-weight: bold; margin-bottom: 5px; }
            .stat-label { color: #6b7280; font-size: 0.95em; text-transform: uppercase; letter-spacing: 1px; }
            
            .success-value { color: #10b981; }
            .error-value { color: #ef4444; }
            .info-value { color: #3b82f6; }
            .warning-value { color: #f59e0b; }
            
            .section { background: white; border-radius: 12px; padding: 30px; margin-bottom: 25px; box-shadow: 0 4px 15px rgba(59,130,246,0.08); border: 1px solid #dbeafe; }
            .section-title { font-size: 1.8em; margin-bottom: 20px; color: #1e3a8a; border-bottom: 3px solid #dbeafe; padding-bottom: 10px; }
            
            .progress-bar { width: 100%; height: 30px; background: #e5e7eb; border-radius: 15px; overflow: hidden; margin: 20px 0; }
            .progress-fill { height: 100%; transition: width 0.3s; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; }
            .progress-success { background: linear-gradient(90deg, #10b981, #34d399); }
            .progress-error { background: linear-gradient(90deg, #ef4444, #f87171); }
            
            .test-item { border-left: 4px solid #dbeafe; padding: 20px; margin-bottom: 15px; background: white; border-radius: 8px; transition: all 0.2s; border: 1px solid #e5e7eb; }
            .test-item:hover { background: #f8fafc; border-left-color: #3b82f6; }
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
            
            .pipeline-section { background: #eff6ff; border: 2px solid #3b82f6; }
            .pipeline-header { background: #3b82f6; color: white; padding: 10px 15px; border-radius: 8px; margin-bottom: 15px; }
            
            .step-container { margin-left: 20px; margin-top: 15px; }
            .step-item { display: flex; align-items: flex-start; gap: 15px; margin-bottom: 15px; padding: 15px; background: white; border-radius: 8px; border: 1px solid #e5e7eb; }
            .step-number { min-width: 35px; height: 35px; background: #3b82f6; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; }
            .step-content { flex: 1; }
            .step-name { font-weight: 600; margin-bottom: 5px; }
            .step-details { color: #6b7280; font-size: 0.9em; }
            
            .expandable { cursor: pointer; user-select: none; }
            .expandable-content { max-height: 0; overflow: hidden; transition: max-height 0.3s; }
            .expandable-content.expanded { max-height: 500px; overflow-y: auto; }
            
            .code-block { background: #f1f5f9; color: #334155; padding: 15px; border-radius: 8px; font-family: 'Courier New', monospace; font-size: 0.9em; overflow-x: auto; margin-top: 10px; border: 1px solid #e2e8f0; }
            
            .variable-badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 0.85em; font-weight: 600; margin-right: 5px; }
            .var-extracted { background: #d1fae5; color: #065f46; }
            .var-injected { background: #dbeafe; color: #1e40af; }
            
            .error-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin-top: 10px; color: #991b1b; }
            
            .charts-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 20px; }
            .chart-box { background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; }
            
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
              <h1>Testing Report</h1>
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
                <h2 class="section-title">📊 Pipeline 통계</h2>
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
              <h2 class="section-title">📈 실행 결과</h2>
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
                <h2 class="section-title" style="color: #991b1b; border-bottom-color: #fecaca;">⚠️ 테스트 실패 내역</h2>
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
              <h2 class="section-title">테스트 결과 상세</h2>
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

  return {
    exportReport
  };
};