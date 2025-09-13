import { useState } from 'react';
import axios from 'axios';
import { ApiItem } from '../../../types/api';
import { validateResponse, ValidationResult } from '../../../utils/responseValidation';
import { testHistoryApi } from '../../../services/api';
import { TestExecution, PipelineStepExecution } from '../ui/TestExecution';
import { TestBatchResult } from '../ui/TestHistory';
import { 
  extractTemplateVariablesFromRequestWithDefaults,
  replaceTemplateVariables,
  TemplateVariable
} from '../../../shared/utils/templateVariables';
import { pipelineApi, Pipeline, PipelineExecutionResult } from '../../../services/pipelineApi';

export const useTestExecution = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentExecution, setCurrentExecution] = useState<TestExecution[]>([]);
  const [templateVariables, setTemplateVariables] = useState<TemplateVariable[]>([]);
  const [showVariableModal, setShowVariableModal] = useState(false);
  const [pendingBatchExecution, setPendingBatchExecution] = useState<{
    selectedApis: Set<string>;
    apiList: ApiItem[];
    selectedPipelines: Set<string>;
    pipelineList: Pipeline[];
    activeTab: 'apis' | 'pipelines';
    onBatchComplete: (batchResult: TestBatchResult) => void;
  } | null>(null);

  // 실제 API 호출
  const executeApiCall = async (api: ApiItem, templateVariables: Record<string, string> = {}): Promise<{
    responseBody: string;
    responseHeaders: Record<string, string>;
    statusCode: number;
  }> => {
    try {
      // API 아이템에서 정보 추출
      const method = api.method;
      let url = api.url;
      let requestHeaders = api.requestHeaders ? (typeof api.requestHeaders === 'string' ? JSON.parse(api.requestHeaders) : api.requestHeaders) : {};
      let requestBody = api.requestBody || '';
      const requestParams = api.requestParams ? (typeof api.requestParams === 'string' ? JSON.parse(api.requestParams) : api.requestParams) : [];

      // 템플릿 변수 치환
      url = replaceTemplateVariables(url, templateVariables);
      requestBody = replaceTemplateVariables(requestBody, templateVariables);
      
      // Headers에서 템플릿 변수 치환
      const processedHeaders: Record<string, string> = {};
      Object.entries(requestHeaders).forEach(([key, value]) => {
        processedHeaders[key] = replaceTemplateVariables(String(value), templateVariables);
      });
      requestHeaders = processedHeaders;

      // MainContent와 동일하게 파라미터를 객체로 변환 (템플릿 변수 치환 포함)
      const paramsObject: Record<string, string> = {};
      if (requestParams.length > 0) {
        requestParams.forEach((param: any) => {
          if (param.key && param.value && param.key.trim() !== '' && param.value.trim() !== '') {
            const processedValue = replaceTemplateVariables(param.value, templateVariables);
            paramsObject[param.key] = processedValue;
          }
        });
      }
      
      const startTime = Date.now();

      const { createAxiosConfig } = await import('../../../utils/apiRouter');
      
      const axiosConfig = createAxiosConfig(
        method,
        url,
        paramsObject,
        requestHeaders,
        undefined
      );

      if (method !== 'GET' && requestBody && requestBody.trim() !== '') {
        try {
          axiosConfig.data = JSON.parse(requestBody);
        } catch {
          axiosConfig.data = requestBody;
        }
      }

      const result = await axios(axiosConfig);
      const endTime = Date.now();

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
        responseBody = 'Unable to process response body';
      }

      return {
        responseBody,
        responseHeaders,
        statusCode: result.status
      };

    } catch (error: any) {
      
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

  // Pipeline 실행 함수
  const executePipeline = async (pipeline: Pipeline): Promise<{
    status: 'success' | 'failed';
    stepExecutions: PipelineStepExecution[];
    totalTime: number;
    error?: string;
  }> => {
    try {
      const startTime = Date.now();
      
      // Pipeline execution API 호출
      const response = await pipelineApi.executePipeline(pipeline.id.toString());
      
      // 실행 완료까지 대기
      let executionResult: PipelineExecutionResult;
      let attempts = 0;
      const maxAttempts = 150; // 최대 5분 대기 (2초 간격: 150 × 2초 = 300초)
      
      do {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 대기 (5초 → 2초로 단축)
        executionResult = await pipelineApi.getExecutionResults(response.id.toString());
        attempts++;
      } while (
        (executionResult.status === 'RUNNING' || executionResult.status === 'PENDING') && 
        attempts < maxAttempts
      );
      
      const endTime = Date.now();
      
      // 시간 초과 체크
      if (attempts >= maxAttempts && (executionResult.status === 'RUNNING' || executionResult.status === 'PENDING')) {
        return {
          status: 'failed',
          stepExecutions: [],
          totalTime: endTime - startTime,
          error: 'Pipeline execution timed out after 5 minutes'
        };
      }
      
      // Step executions 변환
      const stepExecutions: PipelineStepExecution[] = (executionResult.stepResults || []).map((step: any) => {
        const stepStatus = step.status?.toLowerCase();
        
        // 추출된 데이터 파싱
        let extractedData = {};
        if (step.extractedData) {
          try {
            extractedData = typeof step.extractedData === 'string' ? JSON.parse(step.extractedData) : step.extractedData;
          } catch (e) {
            extractedData = {};
          }
        }
        
        // 주입된 데이터 파싱
        let injectedData = {};
        if (step.injectedData) {
          try {
            injectedData = typeof step.injectedData === 'string' ? JSON.parse(step.injectedData) : step.injectedData;
          } catch (e) {
            injectedData = {};
          }
        }
        
        return {
          id: step.id || `step-${step.stepOrder}`,
          stepName: step.stepName || `Step ${step.stepOrder}`,
          stepOrder: step.stepOrder || 0,
          status: (stepStatus === 'success' || stepStatus === 'completed') ? 'success' : 
                   (stepStatus === 'failed' || stepStatus === 'error') ? 'failed' :
                   (stepStatus === 'running') ? 'running' : 'pending',
          responseTime: step.responseTime || 0,
          statusCode: step.httpStatus || step.statusCode,
          error: step.errorMessage,
          method: step.method || 'POST',
          url: step.url || '',
          requestBody: step.requestData || step.requestBody || '',
          requestHeaders: step.requestHeaders ? (typeof step.requestHeaders === 'string' ? JSON.parse(step.requestHeaders) : step.requestHeaders) : {},
          responseBody: step.responseBody || step.responseData || '',
          responseHeaders: step.responseHeaders ? (typeof step.responseHeaders === 'string' ? JSON.parse(step.responseHeaders) : step.responseHeaders) : {},
          extractedData: extractedData,
          injectedData: injectedData,
          requestData: step.requestData, // 실제 요청 데이터 별도 필드로 추가
          responseData: step.responseData, // 실제 응답 데이터 별도 필드로 추가
          apiItem: step.apiItem
        };
      });

      const finalStatus = (executionResult.status === 'SUCCESS' || executionResult.status === 'COMPLETED') ? 'success' : 'failed';
      
      // 총 실행 시간 계산
      let totalTime = endTime - startTime;
      if (executionResult.startedAt && executionResult.completedAt) {
        const startedAt = new Date(executionResult.startedAt).getTime();
        const completedAt = new Date(executionResult.completedAt).getTime();
        totalTime = completedAt - startedAt;
      }
      
      return {
        status: finalStatus,
        stepExecutions,
        totalTime,
        error: executionResult.errorMessage
      };
    } catch (error: any) {
      console.error('Pipeline execution error:', error);
      return {
        status: 'failed',
        stepExecutions: [],
        totalTime: 0,
        error: error.message || 'Pipeline execution failed'
      };
    }
  };

  // 템플릿 변수 감지 및 실행 함수
  const checkTemplateVariablesAndExecute = (
    selectedApis: Set<string>, 
    apiList: ApiItem[], 
    selectedPipelines: Set<string>,
    pipelineList: Pipeline[],
    activeTab: 'apis' | 'pipelines',
    onBatchComplete: (batchResult: TestBatchResult) => void
  ) => {
    if (activeTab === 'apis' && selectedApis.size === 0) {
      alert('테스트할 API를 선택해주세요.');
      return;
    }
    
    if (activeTab === 'pipelines' && selectedPipelines.size === 0) {
      alert('테스트할 Pipeline을 선택해주세요.');
      return;
    }

    // 템플릿 변수 검사는 API만 수행 (Pipeline은 내부적으로 처리)
    if (activeTab === 'apis') {
      // 선택된 API들에서 템플릿 변수 감지
      const selectedApiList = apiList.filter(api => selectedApis.has(api.id));
      const allTemplateVariables = new Map<string, TemplateVariable>();
      
      selectedApiList.forEach(api => {
        const request = {
          url: api.url,
          headers: api.requestHeaders ? (typeof api.requestHeaders === 'string' ? JSON.parse(api.requestHeaders) : api.requestHeaders) : {},
          body: api.requestBody || '',
          params: api.requestParams || []
        };
        
        const variables = extractTemplateVariablesFromRequestWithDefaults(request);
        variables.forEach(variable => {
          if (!allTemplateVariables.has(variable.name)) {
            allTemplateVariables.set(variable.name, variable);
          }
        });
      });

      const templateVariablesList = Array.from(allTemplateVariables.values());
      
      if (templateVariablesList.length > 0) {
        // 템플릿 변수가 있으면 모달 표시
        setTemplateVariables(templateVariablesList);
        setPendingBatchExecution({ selectedApis, apiList, selectedPipelines, pipelineList, activeTab, onBatchComplete });
        setShowVariableModal(true);
        return;
      }
    }
    
    // 템플릿 변수가 없거나 Pipeline인 경우 바로 실행
    executeBatchInternal(selectedApis, apiList, selectedPipelines, pipelineList, activeTab, onBatchComplete, {});
  };

  const executeBatch = async (
    selectedApis: Set<string>, 
    apiList: ApiItem[], 
    selectedPipelines: Set<string>,
    pipelineList: Pipeline[],
    activeTab: 'apis' | 'pipelines',
    onBatchComplete: (batchResult: TestBatchResult) => void
  ) => {
    checkTemplateVariablesAndExecute(selectedApis, apiList, selectedPipelines, pipelineList, activeTab, onBatchComplete);
  };

  const executeBatchInternal = async (
    selectedApis: Set<string>, 
    apiList: ApiItem[], 
    selectedPipelines: Set<string>,
    pipelineList: Pipeline[],
    activeTab: 'apis' | 'pipelines',
    onBatchComplete: (batchResult: TestBatchResult) => void, 
    templateVariablesMap: Record<string, string> = {}
  ) => {
    setIsRunning(true);
    let executions: TestExecution[] = [];

    if (activeTab === 'apis') {
      const selectedApiList = apiList.filter(api => selectedApis.has(api.id));
      executions = selectedApiList.map(api => ({
        id: `exec-${Date.now()}-${api.id}`,
        apiName: api.name,
        method: api.method,
        url: api.url,
        status: 'pending',
        timestamp: new Date(),
        validationEnabled: api.validationEnabled || false,
        type: 'api' as const
      }));
    } else {
      const selectedPipelineList = pipelineList.filter(pipeline => selectedPipelines.has(pipeline.id.toString()));
      executions = selectedPipelineList.map(pipeline => ({
        id: `exec-${Date.now()}-${pipeline.id}`,
        apiName: pipeline.name,
        method: 'PIPELINE',
        url: 'Pipeline Execution',
        status: 'pending',
        timestamp: new Date(),
        validationEnabled: false,
        type: 'pipeline' as const,
        pipelineId: pipeline.id.toString(),
        stepExecutions: []
      }));
    }

    setCurrentExecution(executions);

    // 순차적으로 실행 (API 또는 Pipeline)
    let successCount = 0;
    let failureCount = 0;
    const startTime = Date.now();

    if (activeTab === 'apis') {
      const selectedApiList = apiList.filter(api => selectedApis.has(api.id));
      
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
          execution.requestHeaders = {};
        }
        
        // 요청 파라미터 저장
        try {
          execution.requestParams = api.requestParams ? (typeof api.requestParams === 'string' ? JSON.parse(api.requestParams) : api.requestParams) : [];
        } catch (error) {
          execution.requestParams = [];
        }
        
        // 실제 API 호출 (템플릿 변수 전달)
        const response = await executeApiCall(api, templateVariablesMap);
        
        const apiEndTime = Date.now();
        
        // HTTP 상태 코드에 따른 기본 성공/실패 판단
        let finalStatus: 'success' | 'failed' = (response.statusCode >= 200 && response.statusCode < 300) ? 'success' : 'failed';
        
        // API 요청인데 HTML이 반환되는 경우 실패로 처리 (SPA fallback 방지)
        if (finalStatus === 'success' && api.url.includes('/api/') && 
            response.responseBody && response.responseBody.trim().startsWith('<!DOCTYPE html>')) {
          finalStatus = 'failed';
        }
        
        // Validation 수행 (활성화된 경우)
        let validationResult: ValidationResult | undefined;
        

        // 성공 응답에 대해서만 validation 수행
        if (api.validationEnabled && api.expectedValues && finalStatus === 'success') {
          try {
            const expectedValues = JSON.parse(api.expectedValues);
            
            if (expectedValues && expectedValues.length > 0) {
              // 응답 body를 JSON으로 파싱하여 validation 수행
              let responseJson: any;
              try {
                responseJson = JSON.parse(response.responseBody);
              } catch (error) {
                // JSON 파싱 실패 시 문자열 그대로 사용
                responseJson = response.responseBody;
              }
              
              validationResult = validateResponse(responseJson, expectedValues);
              
              // Validation 실패 시 전체 테스트도 실패로 처리
              if (!validationResult.passed) {
                finalStatus = 'failed';
              }
            }
          } catch (error) {
            // Validation 오류 발생 시에도 테스트 실패로 처리
            finalStatus = 'failed';
          }
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
    } else {
      // Pipeline execution
      const selectedPipelineList = pipelineList.filter(pipeline => selectedPipelines.has(pipeline.id.toString()));
      
      for (let i = 0; i < selectedPipelineList.length; i++) {
        const pipeline = selectedPipelineList[i];
        const execution = executions[i];

        // 실행 상태로 변경
        execution.status = 'running';
        setCurrentExecution([...executions]);

        try {
          const pipelineResult = await executePipeline(pipeline);
          
          execution.status = pipelineResult.status;
          execution.responseTime = pipelineResult.totalTime;
          execution.stepExecutions = pipelineResult.stepExecutions;
          execution.error = pipelineResult.error;
          
          // 전체 Pipeline 상태에 따라 성공/실패 카운트
          if (pipelineResult.status === 'success') {
            successCount++;
          } else {
            failureCount++;
          }
        } catch (error) {
          execution.status = 'failed';
          execution.error = error instanceof Error ? error.message : 'Unknown error';
          execution.stepExecutions = [];
          failureCount++;
        }

        setCurrentExecution([...executions]);
      }
    }

    const totalTime = Date.now() - startTime;

    // 결과를 히스토리에 저장
    const totalTests = activeTab === 'apis' ? selectedApis.size : selectedPipelines.size;
    const batchResult: TestBatchResult = {
      id: `batch-${Date.now()}`,
      totalTests,
      successCount,
      failureCount,
      totalTime,
      executions: [...executions],
      createdAt: new Date()
    };

    // DB에 저장
    try {
      const savedHistory = await testHistoryApi.save({
        totalTests,
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

    } catch (error) {
      // Failed to save test history
      // 저장 실패해도 메모리에는 보관
    }

    onBatchComplete(batchResult);
    setIsRunning(false);
  };

  const setExecutionResults = (executions: TestExecution[]) => {
    setCurrentExecution(executions);
  };

  // 템플릿 변수 모달 핸들러
  const handleVariableConfirm = async (variables: Record<string, string>) => {
    if (!pendingBatchExecution) return;
    
    setShowVariableModal(false);
    
    // 치환된 요청으로 배치 실행
    await executeBatchInternal(
      pendingBatchExecution.selectedApis,
      pendingBatchExecution.apiList,
      pendingBatchExecution.selectedPipelines,
      pendingBatchExecution.pipelineList,
      pendingBatchExecution.activeTab,
      pendingBatchExecution.onBatchComplete,
      variables
    );
    
    setPendingBatchExecution(null);
    setTemplateVariables([]);
  };

  const handleVariableModalClose = () => {
    setShowVariableModal(false);
    setPendingBatchExecution(null);
    setTemplateVariables([]);
  };

  return {
    isRunning,
    currentExecution,
    executeBatch,
    setExecutionResults,
    // 템플릿 변수 관련
    showVariableModal,
    templateVariables,
    handleVariableConfirm,
    handleVariableModalClose
  };
};