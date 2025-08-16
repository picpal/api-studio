import React, { useState, useEffect } from 'react';
import { BaseUrl, ApiItem } from '../types/api';
import { validateResponse, ValidationResult } from '../utils/responseValidation';
import axios from 'axios';

interface TestAutomationPageProps {
  baseUrls: BaseUrl[];
  selectedItem: ApiItem | null;
  onResetForm: () => void;
  onUpdateSelectedItem: (updatedItem: Partial<ApiItem>) => void;
}

interface TestExecution {
  id: string;
  apiName: string;
  method: string;
  url: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  responseTime?: number;
  statusCode?: number;
  error?: string;
  timestamp: Date;
  responseBody?: string;
  responseHeaders?: Record<string, string>;
  requestBody?: string;
  requestHeaders?: Record<string, string>;
  validationResult?: ValidationResult;
  validationEnabled?: boolean;
}

interface TestBatchResult {
  id: string;
  totalTests: number;
  successCount: number;
  failureCount: number;
  totalTime: number;
  executions: TestExecution[];
  createdAt: Date;
}

const TestAutomationPage: React.FC<TestAutomationPageProps> = ({ 
  baseUrls, 
  selectedItem, 
  onResetForm, 
  onUpdateSelectedItem 
}) => {
  const [selectedApis, setSelectedApis] = useState<Set<string>>(new Set());
  const [isRunning, setIsRunning] = useState(false);
  const [currentExecution, setCurrentExecution] = useState<TestExecution[]>([]);
  const [batchHistory, setBatchHistory] = useState<TestBatchResult[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<TestBatchResult | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedExecution, setSelectedExecution] = useState<TestExecution | null>(null);
  const [apiSectionCollapsed, setApiSectionCollapsed] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // 폴더와 API 목록
  const [folders, setFolders] = useState<any[]>([]);
  const [apiList, setApiList] = useState<ApiItem[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null);

  useEffect(() => {
    loadFoldersAndApis();
  }, []);

  const loadFoldersAndApis = async () => {
    try {
      // 실제 API 호출
      const [foldersResponse, apisResponse] = await Promise.all([
        fetch('http://localhost:8080/api/folders', { credentials: 'include' }),
        fetch('http://localhost:8080/api/items', { credentials: 'include' })
      ]);

      if (foldersResponse.ok && apisResponse.ok) {
        const foldersData = await foldersResponse.json();
        const apisData = await apisResponse.json();
        
        setFolders(foldersData);
        setApiList(apisData);
      }
    } catch (error) {
      console.error('Failed to load folders and APIs:', error);
      
      // 실패 시 임시 데이터
      const mockFolders = [
        { id: 1, name: 'User APIs', description: 'User management APIs' },
        { id: 2, name: 'Product APIs', description: 'Product management APIs' }
      ];
      
      const mockApis: ApiItem[] = [
        {
          id: '1',
          name: 'Get User Info',
          method: 'GET',
          url: 'https://api.example.com/users/1',
          description: 'Get user information',
          requestParams: '[]',
          requestHeaders: '{}',
          requestBody: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          folderId: 1
        },
        {
          id: '2',
          name: 'Create User',
          method: 'POST',
          url: 'https://api.example.com/users',
          description: 'Create new user',
          requestParams: '[]',
          requestHeaders: '{"Content-Type": "application/json"}',
          requestBody: '{"name": "test", "email": "test@example.com"}',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          folderId: 1
        }
      ];
      
      setFolders(mockFolders);
      setApiList(mockApis);
    }
  };

  const handleApiSelection = (apiId: string, selected: boolean) => {
    const newSelection = new Set(selectedApis);
    if (selected) {
      newSelection.add(apiId);
    } else {
      newSelection.delete(apiId);
    }
    setSelectedApis(newSelection);
  };

  const handleSelectAll = () => {
    const currentList = selectedFolder 
      ? apiList.filter(api => api.folderId === selectedFolder)
      : apiList;
      
    const currentIds = new Set(currentList.map(api => api.id));
    const isAllSelected = currentIds.size > 0 && [...currentIds].every(id => selectedApis.has(id));
    
    if (isAllSelected) {
      // 현재 목록의 모든 항목을 선택 해제
      const newSelection = new Set(selectedApis);
      currentIds.forEach(id => newSelection.delete(id));
      setSelectedApis(newSelection);
    } else {
      // 현재 목록의 모든 항목을 선택
      const newSelection = new Set(selectedApis);
      currentIds.forEach(id => newSelection.add(id));
      setSelectedApis(newSelection);
    }
  };

  const executeBatch = async () => {
    if (selectedApis.size === 0) {
      alert('테스트할 API를 선택해주세요.');
      return;
    }

    setIsRunning(true);
    const selectedApiList = apiList.filter(api => selectedApis.has(api.id));
    const executions: TestExecution[] = selectedApiList.map(api => ({
      id: `exec-${Date.now()}-${api.id}`,
      apiName: api.name,
      method: api.method,
      url: api.url,
      status: 'pending',
      timestamp: new Date(),
      validationEnabled: api.validationEnabled || false
    }));

    setCurrentExecution(executions);

    // 순차적으로 API 실행
    let successCount = 0;
    let failureCount = 0;
    const startTime = Date.now();

    for (let i = 0; i < selectedApiList.length; i++) {
      const api = selectedApiList[i];
      const execution = executions[i];

      // 실행 상태로 변경
      execution.status = 'running';
      setCurrentExecution([...executions]);

      try {
        const apiStartTime = Date.now();
        
        // 요청 정보 저장
        execution.requestBody = api.requestBody || '';
        try {
          execution.requestHeaders = api.requestHeaders ? JSON.parse(api.requestHeaders) : {};
        } catch (error) {
          console.error('Failed to parse request headers:', error);
          execution.requestHeaders = {};
        }
        
        // 실제 API 호출
        console.log('About to call executeApiCall for:', api.name);
        const response = await executeApiCall(api);
        console.log('executeApiCall completed for:', api.name, 'Status:', response.statusCode);
        
        const apiEndTime = Date.now();
        
        // HTTP 상태 코드에 따른 기본 성공/실패 판단
        let finalStatus: 'success' | 'failed' = (response.statusCode >= 200 && response.statusCode < 300) ? 'success' : 'failed';
        
        // API 요청인데 HTML이 반환되는 경우 실패로 처리 (SPA fallback 방지)
        if (finalStatus === 'success' && api.url.includes('/api/') && 
            response.responseBody && response.responseBody.trim().startsWith('<!DOCTYPE html>')) {
          finalStatus = 'failed';
          console.warn('API endpoint returned HTML instead of expected data:', api.url);
        }
        
        // Validation 수행 (활성화된 경우)
        let validationResult: ValidationResult | undefined;
        
        console.log('Validation check:', {
          validationEnabled: api.validationEnabled,
          hasExpectedValues: !!api.expectedValues,
          expectedValues: api.expectedValues,
          responseBody: response.responseBody?.substring(0, 200),
          finalStatus: finalStatus
        });

        // 성공 응답에 대해서만 validation 수행
        if (api.validationEnabled && api.expectedValues && finalStatus === 'success') {
          try {
            const expectedValues = JSON.parse(api.expectedValues);
            console.log('Parsed expected values:', expectedValues);
            
            if (expectedValues && expectedValues.length > 0) {
              // 응답 body를 JSON으로 파싱하여 validation 수행
              let responseJson: any;
              try {
                responseJson = JSON.parse(response.responseBody);
                console.log('Parsed response JSON:', responseJson);
              } catch (error) {
                // JSON 파싱 실패 시 문자열 그대로 사용
                responseJson = response.responseBody;
                console.log('Using response as string:', responseJson);
              }
              
              console.log('Running validation...');
              validationResult = validateResponse(responseJson, expectedValues);
              console.log('Validation result:', validationResult);
              
              // Validation 실패 시 전체 테스트도 실패로 처리
              if (!validationResult.passed) {
                finalStatus = 'failed';
              }
            } else {
              console.log('No expected values to validate');
            }
          } catch (error) {
            console.error('Validation error:', error);
            // Validation 오류 발생 시에도 테스트 실패로 처리
            finalStatus = 'failed';
          }
        } else {
          console.log('Validation skipped - not enabled, no expected values, or not a successful response');
        }
        
        execution.status = finalStatus;
        execution.responseTime = apiEndTime - apiStartTime;
        execution.statusCode = response.statusCode;
        execution.responseBody = response.responseBody;
        execution.responseHeaders = response.responseHeaders;
        execution.validationResult = validationResult;
        
        if (finalStatus === 'success') {
          successCount++;
        } else {
          failureCount++;
        }
      } catch (error) {
        console.error('Execution error for API:', api.name, error);
        console.error('Error stack:', error instanceof Error ? error.stack : error);
        
        execution.status = 'failed';
        execution.error = error instanceof Error ? error.message : 'Unknown error';
        execution.statusCode = 500;
        execution.responseBody = '';
        execution.responseHeaders = {};
        
        // 에러가 발생해도 validation 설정은 보존
        execution.validationEnabled = api.validationEnabled;
        execution.validationResult = undefined;
        
        failureCount++;
      }

      setCurrentExecution([...executions]);
    }

    const totalTime = Date.now() - startTime;

    // 결과를 히스토리에 저장
    const batchResult: TestBatchResult = {
      id: `batch-${Date.now()}`,
      totalTests: selectedApiList.length,
      successCount,
      failureCount,
      totalTime,
      executions: [...executions],
      createdAt: new Date()
    };

    setBatchHistory([batchResult, ...batchHistory]);
    setIsRunning(false);
  };

  // 실제 API 호출
  const executeApiCall = async (api: ApiItem): Promise<{
    responseBody: string;
    responseHeaders: Record<string, string>;
    statusCode: number;
  }> => {
    try {
      // API 아이템에서 정보 추출
      const method = api.method;
      const url = api.url;
      const requestHeaders = api.requestHeaders ? JSON.parse(api.requestHeaders) : {};
      const requestBody = api.requestBody || '';
      const requestParams = api.requestParams ? JSON.parse(api.requestParams) : [];

      // MainContent와 동일하게 파라미터를 객체로 변환
      const paramsObject: Record<string, string> = {};
      if (requestParams.length > 0) {
        requestParams.forEach((param: any) => {
          if (param.key && param.value && param.key.trim() !== '' && param.value.trim() !== '') {
            paramsObject[param.key] = param.value;
          }
        });
      }
      
      let fullUrl = url;
      console.log(`Executing ${method} request to: ${fullUrl}`);

      const startTime = Date.now();

      // MainContent와 동일한 방식으로 외부 API 프록시 처리
      if (fullUrl.includes('devpg.bluewalnut.co.kr')) {
        fullUrl = fullUrl.replace('https://devpg.bluewalnut.co.kr', '/api/external');
      }
      
      const axiosConfig: any = {
        method: method.toLowerCase(),
        url: fullUrl,
        params: paramsObject,
        headers: requestHeaders,
        withCredentials: true,
      };

      if (method !== 'GET' && requestBody && requestBody.trim() !== '') {
        try {
          axiosConfig.data = JSON.parse(requestBody);
        } catch {
          axiosConfig.data = requestBody;
        }
      }

      console.log('Making axios request:', {
        method: axiosConfig.method,
        url: axiosConfig.url,
        params: axiosConfig.params,
        headers: axiosConfig.headers,
        data: axiosConfig.data
      });

      const result = await axios(axiosConfig);
      const endTime = Date.now();

      console.log('Axios response received:', {
        status: result.status,
        statusText: result.statusText,
        headers: result.headers,
        url: axiosConfig.url,
        data: typeof result.data === 'object' ? JSON.stringify(result.data).substring(0, 200) : String(result.data).substring(0, 200)
      });

      // 응답 헤더 변환
      const responseHeaders: Record<string, string> = {};
      Object.keys(result.headers).forEach(key => {
        responseHeaders[key] = result.headers[key];
      });

      // 응답 시간 헤더 추가
      responseHeaders['X-Response-Time'] = `${endTime - startTime}ms`;
      
      // 응답 본문 처리
      let responseBody = '';
      try {
        if (typeof result.data === 'object') {
          responseBody = JSON.stringify(result.data, null, 2);
        } else {
          responseBody = String(result.data);
        }
      } catch (error) {
        console.error('Response body processing error:', error);
        responseBody = 'Unable to process response body';
      }

      console.log(`API call completed: ${fullUrl}, Status: ${result.status}, Time: ${endTime - startTime}ms`);

      return {
        responseBody,
        responseHeaders,
        statusCode: result.status
      };

    } catch (error: any) {
      console.error('API call error:', error);
      
      // axios 에러 처리
      if (error.response) {
        // 서버가 응답했지만 에러 상태 코드
        const responseHeaders: Record<string, string> = {};
        Object.keys(error.response.headers || {}).forEach(key => {
          responseHeaders[key] = error.response.headers[key];
        });

        let errorBody = '';
        try {
          if (typeof error.response.data === 'object') {
            errorBody = JSON.stringify(error.response.data, null, 2);
          } else {
            errorBody = String(error.response.data);
          }
        } catch {
          errorBody = 'Unable to parse error response';
        }

        return {
          responseBody: errorBody,
          responseHeaders,
          statusCode: error.response.status
        };
      } else {
        throw new Error(error.message || 'Network request failed');
      }
    }
  };

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

  // 상세보기 핸들러
  const handleShowExecutionDetail = (execution: TestExecution) => {
    setSelectedExecution(execution);
    setShowDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedExecution(null);
  };

  // 리포트 생성 로직
  const generateReportData = () => {
    const allExecutions = [...currentExecution];
    if (allExecutions.length === 0) return null;

    const totalTests = allExecutions.length;
    const successCount = allExecutions.filter(e => e.status === 'success').length;
    const failureCount = allExecutions.filter(e => e.status === 'failed').length;
    const successRate = totalTests > 0 ? (successCount / totalTests) * 100 : 0;
    
    const avgResponseTime = allExecutions
      .filter(e => e.responseTime)
      .reduce((sum, e) => sum + (e.responseTime || 0), 0) / allExecutions.filter(e => e.responseTime).length;

    const validationTests = allExecutions.filter(e => e.validationEnabled);
    const validationPassed = validationTests.filter(e => e.validationResult?.passed).length;
    const validationRate = validationTests.length > 0 ? (validationPassed / validationTests.length) * 100 : 0;

    const failedTests = allExecutions.filter(e => e.status === 'failed');
    const statusCodeStats = allExecutions.reduce((acc: any, e) => {
      if (e.statusCode) {
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

  const handleShowReport = () => {
    setShowReportModal(true);
  };

  const handleCloseReport = () => {
    setShowReportModal(false);
  };

  const exportReport = () => {
    const reportData = generateReportData();
    if (!reportData) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test Automation Report</title>
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
          <h1>Test Automation Report</h1>
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
              <h3>${execution.apiName} (${execution.status.toUpperCase()})</h3>
              <p><strong>Method:</strong> ${execution.method} | <strong>URL:</strong> ${execution.url}</p>
              <p><strong>Status Code:</strong> ${execution.statusCode || 'N/A'} | <strong>Response Time:</strong> ${execution.responseTime || 'N/A'}ms</p>
              ${execution.validationEnabled && execution.validationResult ? `
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

  // 폴더별 필터링된 API 목록
  const filteredApiList = selectedFolder 
    ? apiList.filter(api => api.folderId === selectedFolder)
    : apiList;

  return (
    <div className="h-screen bg-gray-100">
      {/* 데스크톱: 기존 가로 분할, 태블릿: 세로 분할 */}
      <div className="h-full flex flex-col lg:flex-row">
        {/* 좌측/상단: 폴더 및 API 목록 */}
        <div className="w-full lg:w-80 bg-white border-r lg:border-r border-b lg:border-b-0 border-gray-200 flex flex-col lg:h-full max-h-96 lg:max-h-none">
        {/* 폴더 목록 */}
        <div className="border-b p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">API Selection</h3>
              {apiSectionCollapsed && selectedApis.size > 0 && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                  {selectedApis.size} selected
                </span>
              )}
            </div>
            <button
              onClick={() => setApiSectionCollapsed(!apiSectionCollapsed)}
              className="lg:hidden p-1 text-gray-500 hover:text-gray-700 rounded"
              title={apiSectionCollapsed ? "Expand API Selection" : "Collapse API Selection"}
            >
              <svg className={`w-5 h-5 transition-transform ${apiSectionCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>
          {!apiSectionCollapsed && (
            <>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedFolder(null)}
                  className={`w-full text-left p-2 rounded text-sm ${
                    selectedFolder === null ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                  }`}
                >
                  All APIs ({apiList.length})
                </button>
                {folders.map(folder => (
                  <button
                    key={folder.id}
                    onClick={() => setSelectedFolder(folder.id)}
                    className={`w-full text-left p-2 rounded text-sm ${
                      selectedFolder === folder.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    {folder.name} ({apiList.filter(api => api.folderId === folder.id).length})
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* API 목록 */}
        {!apiSectionCollapsed && (
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-md font-semibold">APIs</h3>
              <button
                onClick={handleSelectAll}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {selectedApis.size === filteredApiList.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            <div className="space-y-2">
              {filteredApiList.map(api => (
                <label key={api.id} className="flex items-start p-2 border rounded hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedApis.has(api.id)}
                    onChange={(e) => handleApiSelection(api.id, e.target.checked)}
                    className="mt-1 mr-2"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                        api.method === 'GET' ? 'bg-green-100 text-green-800' :
                        api.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                        api.method === 'PUT' ? 'bg-orange-100 text-orange-800' :
                        api.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {api.method}
                      </span>
                      <span className="text-sm font-medium truncate">{api.name}</span>
                    </div>
                    {api.description && (
                      <div className="text-xs text-gray-400 truncate mt-1">{api.description}</div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

        {/* 우측/하단: 실행 영역과 결과 */}
        <div className="flex-1 flex flex-col lg:flex-row">
          {/* 실행 컨트롤 */}
          <div className="w-full lg:flex-1 flex flex-col">
            {/* API 선택 및 실행 */}
            <div className="bg-white border-b p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-lg font-semibold">Test Automation</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={executeBatch}
                    disabled={isRunning || selectedApis.size === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                  >
                    {isRunning ? 'Running...' : `Run Tests (${selectedApis.size})`}
                  </button>
                </div>
              </div>
            </div>

            {/* 실행 결과 영역 */}
            <div className="bg-white p-4 flex-1 flex flex-col min-h-0">
              <h3 className="text-md font-semibold mb-3">Current Execution</h3>
              {currentExecution.length > 0 ? (
                <div className="space-y-2 flex-1 overflow-y-auto min-h-0">
                  {currentExecution.map(execution => (
                    <div 
                      key={execution.id} 
                      className={`flex items-center justify-between p-3 bg-gray-50 rounded border transition-colors ${
                        (execution.status === 'success' || execution.status === 'failed') 
                          ? 'hover:bg-gray-100 cursor-pointer' 
                          : ''
                      }`}
                      onClick={() => {
                        if (execution.status === 'success' || execution.status === 'failed') {
                          handleShowExecutionDetail(execution);
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{getStatusIcon(execution.status)}</span>
                        <div>
                          <div className="font-medium text-sm">{execution.apiName}</div>
                          <div className="text-xs text-gray-500">{execution.method} • {execution.url}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <div className={`text-sm font-medium ${getStatusColor(execution.status)}`}>
                            {execution.status.toUpperCase()}
                          </div>
                          {execution.validationEnabled && (
                            <div className="text-xs px-2 py-1 rounded border">
                              {execution.validationResult ? (
                                <span className={execution.validationResult.passed ? 'text-green-600 bg-green-50 border-green-200' : 'text-red-600 bg-red-50 border-red-200'}>
                                  {execution.validationResult.passed ? '✅' : '❌'}
                                </span>
                              ) : (
                                <span className="text-gray-500 bg-gray-50 border-gray-200">⏳</span>
                              )}
                            </div>
                          )}
                        </div>
                        {execution.responseTime && (
                          <div className="text-xs text-gray-500">{execution.responseTime}ms</div>
                        )}
                        {execution.statusCode && (
                          <div className={`text-xs ${execution.statusCode >= 200 && execution.statusCode < 300 ? 'text-green-600' : 'text-red-600'}`}>
                            Status: {execution.statusCode}
                          </div>
                        )}
                        {execution.error && (
                          <div className="text-xs text-red-500 truncate max-w-32">{execution.error}</div>
                        )}
                        {(execution.status === 'success' || execution.status === 'failed') && (
                          <div className="text-xs text-blue-500 mt-1 hidden sm:block">Click to view details</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  Select APIs and click "Run Tests" to start
                </div>
              )}
            </div>
          </div>

          {/* 테스트 히스토리 */}
          <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l bg-white p-4">
            <h3 className="text-md font-semibold mb-3">Test History</h3>
            {batchHistory.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {batchHistory.map(batch => (
                  <div
                    key={batch.id}
                    className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                      selectedBatch?.id === batch.id ? 'border-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedBatch(batch)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm font-medium">
                        Batch #{batch.id.split('-')[1]?.slice(-4)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {batch.createdAt.toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="text-sm space-y-1">
                      <div>Tests: {batch.totalTests}</div>
                      <div className="flex justify-between">
                        <span className="text-green-600">✅ {batch.successCount}</span>
                        <span className="text-red-600">❌ {batch.failureCount}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Time: {(batch.totalTime / 1000).toFixed(1)}s
                      </div>
                      <div className="text-xs">
                        Success Rate: {((batch.successCount / batch.totalTests) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8 text-sm">
                No test history yet
              </div>
            )}
            
            {/* 선택된 배치의 상세 실행 결과 */}
            {selectedBatch && (
              <div className="mt-4 border-t pt-4">
                <h4 className="text-sm font-semibold mb-2">Execution Details</h4>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {selectedBatch.executions.map(execution => (
                    <div
                      key={execution.id}
                      className="p-2 text-xs border rounded hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleShowExecutionDetail(execution)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <span>{getStatusIcon(execution.status)}</span>
                          <span className="font-medium truncate">{execution.apiName}</span>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 justify-end mb-1">
                            <div className={`text-xs px-2 py-1 rounded font-medium ${getStatusColor(execution.status)} bg-gray-50`}>
                              {execution.status.toUpperCase()}
                            </div>
                            {execution.validationEnabled && (
                              <div className="text-xs px-2 py-1 rounded border">
                                {execution.validationResult ? (
                                  <span className={execution.validationResult.passed ? 'text-green-600 bg-green-50 border-green-200' : 'text-red-600 bg-red-50 border-red-200'}>
                                    {execution.validationResult.passed ? '✅' : '❌'}
                                  </span>
                                ) : (
                                  <span className="text-gray-500 bg-gray-50 border-gray-200">⏳</span>
                                )}
                              </div>
                            )}
                          </div>
                          {execution.responseTime && (
                            <div className="text-gray-500 text-xs">{execution.responseTime}ms</div>
                          )}
                          {execution.statusCode && (
                            <div className="text-gray-600 text-xs">{execution.statusCode}</div>
                          )}
                        </div>
                      </div>
                      {execution.error && (
                        <div className="text-red-500 truncate mt-1">{execution.error}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 실행 결과 상세보기 모달 */}
      {showDetailModal && selectedExecution && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleCloseDetailModal}></div>

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
                  onClick={handleCloseDetailModal}
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
                      {selectedExecution.timestamp.toLocaleTimeString()}
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
                  onClick={handleCloseDetailModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 우측 하단 고정 리포트 버튼 */}
      {currentExecution.length > 0 && (
        <button
          onClick={handleShowReport}
          className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-10"
          title="View Test Report"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>
      )}

      {/* 리포트 모달 */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] flex flex-col">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Test Automation Report</h2>
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
                  onClick={handleCloseReport}
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
              {(() => {
                const reportData = generateReportData();
                if (!reportData) {
                  return (
                    <div className="text-center text-gray-500 py-8">
                      No test data available for reporting
                    </div>
                  );
                }

                return (
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
                            <p className="text-sm text-gray-600">{execution.method} • {execution.url}</p>
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
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestAutomationPage;