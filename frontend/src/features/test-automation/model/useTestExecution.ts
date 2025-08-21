import { useState } from 'react';
import axios from 'axios';
import { ApiItem } from '../../../types/api';
import { validateResponse, ValidationResult } from '../../../utils/responseValidation';
import { testHistoryApi } from '../../../services/api';
import { TestExecution } from '../ui/TestExecution';
import { TestBatchResult } from '../ui/TestHistory';

export const useTestExecution = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentExecution, setCurrentExecution] = useState<TestExecution[]>([]);

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
      const requestHeaders = api.requestHeaders ? (typeof api.requestHeaders === 'string' ? JSON.parse(api.requestHeaders) : api.requestHeaders) : {};
      const requestBody = api.requestBody || '';
      const requestParams = api.requestParams ? (typeof api.requestParams === 'string' ? JSON.parse(api.requestParams) : api.requestParams) : [];

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

  const executeBatch = async (selectedApis: Set<string>, apiList: ApiItem[], onBatchComplete: (batchResult: TestBatchResult) => void) => {
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
          execution.requestHeaders = api.requestHeaders ? (typeof api.requestHeaders === 'string' ? JSON.parse(api.requestHeaders) : api.requestHeaders) : {};
        } catch (error) {
          console.error('Failed to parse request headers:', error);
          execution.requestHeaders = {};
        }
        
        // 요청 파라미터 저장
        try {
          execution.requestParams = api.requestParams ? (typeof api.requestParams === 'string' ? JSON.parse(api.requestParams) : api.requestParams) : [];
        } catch (error) {
          console.error('Failed to parse request params:', error);
          execution.requestParams = [];
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
        
        // 응답 데이터 저장 (JSON 파싱 시도)
        try {
          if (response.responseBody) {
            execution.responseData = JSON.parse(response.responseBody);
          }
        } catch (error) {
          // JSON이 아닌 경우 원본 문자열로 저장
          execution.responseData = response.responseBody;
        }
        
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
        execution.responseData = null;
        
        // 에러가 발생해도 validation 설정과 요청 정보는 보존
        execution.validationEnabled = api.validationEnabled;
        execution.validationResult = undefined;
        
        // 요청 정보도 저장 (에러 시에도 요청 내용은 기록)
        try {
          execution.requestParams = api.requestParams ? (typeof api.requestParams === 'string' ? JSON.parse(api.requestParams) : api.requestParams) : [];
          execution.requestHeaders = api.requestHeaders ? (typeof api.requestHeaders === 'string' ? JSON.parse(api.requestHeaders) : api.requestHeaders) : {};
        } catch (parseError) {
          execution.requestParams = [];
          execution.requestHeaders = {};
        }
        execution.requestBody = api.requestBody || '';
        
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

    // DB에 저장
    try {
      const savedHistory = await testHistoryApi.save({
        totalTests: selectedApiList.length,
        successCount,
        failureCount,
        totalTime,
        executionResults: JSON.stringify(executions)
      });

      // 저장된 ID를 포함한 결과로 업데이트
      batchResult.id = `saved-${savedHistory.id}`;
      batchResult.savedId = savedHistory.id;
      batchResult.name = savedHistory.name;
      batchResult.createdBy = savedHistory.createdBy;

      console.log('Test history saved successfully:', savedHistory);
    } catch (error) {
      console.error('Failed to save test history:', error);
      // 저장 실패해도 메모리에는 보관
    }

    onBatchComplete(batchResult);
    setIsRunning(false);
  };

  const setExecutionResults = (executions: TestExecution[]) => {
    setCurrentExecution(executions);
  };

  return {
    isRunning,
    currentExecution,
    executeBatch,
    setExecutionResults
  };
};