import { useState, useCallback } from 'react';
import { ApiRequest, ApiResponse } from '../types/api';
import { ParamItem } from '../components/api-test/ParamsTable';
import { HeaderItem } from '../components/api-test/HeadersTable';
import { ExpectedValue } from '../components/api-test/ValidationTab';
import axios from 'axios';
import { validateResponse } from '../utils/responseValidation';
import { 
  extractTemplateVariablesFromRequest, 
  extractTemplateVariablesFromRequestWithDefaults,
  replaceTemplateVariablesInRequest,
  TemplateVariable
} from '../shared/utils/templateVariables';

export const useApiRequest = () => {
  const [request, setRequest] = useState<ApiRequest>({
    method: 'GET',
    url: '',
    params: {},
    headers: {},
    body: ''
  });
  
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastValidationResult, setLastValidationResult] = useState<any>(null);
  
  // 템플릿 변수 모달 상태
  const [showVariableModal, setShowVariableModal] = useState(false);
  const [templateVariables, setTemplateVariables] = useState<TemplateVariable[]>([]);
  const [pendingRequest, setPendingRequest] = useState<{
    paramsList: ParamItem[];
    validationEnabled: boolean;
    expectedValuesList: ExpectedValue[];
  } | null>(null);

  // 파라미터와 바디 동기화를 위한 헬퍼 함수들
  const convertParamsToFormData = useCallback((params: { [key: string]: string }): string => {
    const validParams = Object.entries(params).filter(([key, value]) => key && value);
    if (validParams.length === 0) return '';
    
    const formData = validParams.reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {} as { [key: string]: string });
    
    return JSON.stringify(formData, null, 2);
  }, []);

  const convertParamsListToBody = useCallback((paramsList: ParamItem[]): string => {
    const validParams = paramsList.filter(p => p.key && p.value);
    
    if (validParams.length === 0) {
      return '';
    }
    
    const formData = validParams.reduce((acc, param) => {
      acc[param.key] = param.value;
      return acc;
    }, {} as { [key: string]: string });
    
    return JSON.stringify(formData, null, 2);
  }, []);

  // HTTP Method 변경 시 params와 body 동기화
  const handleMethodChange = useCallback((
    method: string, 
    paramsList: ParamItem[], 
    headersList: HeaderItem[],
    setParamsList: (params: ParamItem[]) => void,
    setHeadersList: (headers: HeaderItem[]) => void
  ) => {
    const previousMethod = request.method;
    
    // 이전 메소드가 GET/DELETE이고 새 메소드가 POST/PUT/PATCH인 경우
    if (['GET', 'DELETE'].includes(previousMethod) && ['POST', 'PUT', 'PATCH'].includes(method)) {
      const bodyData = convertParamsListToBody(paramsList);
      
      const newHeaders = {...request.headers};
      
      if (bodyData) {
        newHeaders['Content-Type'] = 'application/json';
      }
      
      // headersList도 업데이트
      const hasContentType = headersList.some(h => h.key.toLowerCase() === 'content-type');
      if (!hasContentType && bodyData) {
        const newHeadersList = [...headersList];
        const emptyIndex = newHeadersList.findIndex(h => !h.key && !h.value);
        if (emptyIndex >= 0) {
          newHeadersList[emptyIndex] = { key: 'Content-Type', value: 'application/json', id: newHeadersList[emptyIndex].id };
          newHeadersList.push({ key: '', value: '', id: (Date.now() + newHeadersList.length).toString() });
        } else {
          newHeadersList.push({ key: 'Content-Type', value: 'application/json', id: Date.now().toString() });
          newHeadersList.push({ key: '', value: '', id: (Date.now() + 1).toString() });
        }
        setHeadersList(newHeadersList);
      }
      
      setRequest({
        ...request, 
        method: method as any,
        body: bodyData, 
        headers: newHeaders
      });
    }
    // 이전 메소드가 POST/PUT/PATCH이고 새 메소드가 GET/DELETE인 경우
    else if (['POST', 'PUT', 'PATCH'].includes(previousMethod) && ['GET', 'DELETE'].includes(method)) {
      try {
        let newParams = {};
        let newParamsList = [{ key: '', value: '', description: '', required: false, id: Date.now().toString() }];
        
        if (request.body) {
          const parsedBody = JSON.parse(request.body);
          if (typeof parsedBody === 'object' && parsedBody !== null) {
            newParams = parsedBody;
            
            const paramsArray = Object.entries(parsedBody).map(([key, value], index) => ({
              key,
              value: String(value),
              description: '',
              required: false,
              id: (Date.now() + index).toString()
            }));
            
            if (paramsArray.length > 0) {
              newParamsList = [...paramsArray, { key: '', value: '', description: '', required: false, id: (Date.now() + paramsArray.length).toString() }];
            }
          }
        }
        
        const newHeaders = {...request.headers};
        delete newHeaders['Content-Type'];
        delete newHeaders['content-type'];
        
        const filteredHeadersList = headersList.filter(h => 
          h.key.toLowerCase() !== 'content-type'
        );
        
        if (!filteredHeadersList.some(h => !h.key && !h.value)) {
          filteredHeadersList.push({ key: '', value: '', id: Date.now().toString() });
        }
        
        setHeadersList(filteredHeadersList);
        setParamsList(newParamsList);
        setRequest({
          ...request, 
          method: method as any,
          params: newParams,
          headers: newHeaders,
          body: ''
        });
      } catch (e) {
        const newHeaders = {...request.headers};
        delete newHeaders['Content-Type'];
        delete newHeaders['content-type'];
        
        const filteredHeadersList = headersList.filter(h => 
          h.key.toLowerCase() !== 'content-type'
        );
        
        if (!filteredHeadersList.some(h => !h.key && !h.value)) {
          filteredHeadersList.push({ key: '', value: '', id: Date.now().toString() });
        }
        
        setHeadersList(filteredHeadersList);
        setRequest({
          ...request, 
          method: method as any,
          headers: newHeaders,
          body: ''
        });
      }
    }
    // 같은 카테고리 내에서 변경
    else {
      setRequest({
        ...request, 
        method: method as any
      });
    }
  }, [request, convertParamsListToBody]);

  // 실제 API 호출을 수행하는 내부 함수
  const executeApiRequest = useCallback(async (
    requestToSend: ApiRequest,
    paramsList: ParamItem[], 
    validationEnabled: boolean, 
    expectedValuesList: ExpectedValue[]
  ) => {
    // 필수 파라미터 검증
    for (const param of paramsList) {
      if (param.required) {
        if (!param.key.trim() || !param.value.trim()) {
          const message = param.description.trim() 
            ? `[${param.description}] 항목의 값을 입력해주세요.`
            : '필수 값을 입력해주세요.';
          alert(message);
          return;
        }
      }
    }

    setLoading(true);
    const startTime = Date.now();
    
    try {
      let fullUrl = requestToSend.url;
      
      // 외부 API인 경우 프록시 경로로 변경
      if (fullUrl.includes('devpg.bluewalnut.co.kr')) {
        fullUrl = fullUrl.replace('https://devpg.bluewalnut.co.kr', '/api/external');
      }
      
      const axiosConfig: any = {
        method: requestToSend.method.toLowerCase(),
        url: fullUrl,
        params: requestToSend.params,
        headers: requestToSend.headers,
        withCredentials: true,
      };

      if (requestToSend.method !== 'GET' && requestToSend.body) {
        try {
          axiosConfig.data = JSON.parse(requestToSend.body);
        } catch {
          axiosConfig.data = requestToSend.body;
        }
      }

      const result = await axios(axiosConfig);
      const endTime = Date.now();

      const responseData = {
        status: result.status,
        statusText: result.statusText,
        headers: result.headers as any,
        data: result.data,
        time: endTime - startTime,
        size: JSON.stringify(result.data).length + ' bytes'
      };

      setResponse(responseData);

      // Validation 수행
      if (validationEnabled && expectedValuesList.length > 0) {
        try {
          const filteredExpectedValues = expectedValuesList.filter(ev => ev.key.trim() && ev.value.trim());
          if (filteredExpectedValues.length > 0) {
            const validationResult = validateResponse(result.data, filteredExpectedValues);
            setLastValidationResult(validationResult);
          }
        } catch (error) {
          console.error('Validation error:', error);
          setLastValidationResult({
            passed: false,
            results: [{
              key: 'validation',
              expectedValue: 'N/A',
              actualValue: 'N/A',
              passed: false,
              error: error instanceof Error ? error.message : 'Validation error'
            }]
          });
        }
      } else {
        setLastValidationResult(null);
      }
    } catch (error: any) {
      const endTime = Date.now();
      setResponse({
        status: error.response?.status || 0,
        statusText: error.response?.statusText || 'Network Error',
        headers: error.response?.headers || {},
        data: error.response?.data || error.message,
        time: endTime - startTime,
        size: '0 bytes'
      });
      
      setLastValidationResult(null);
    }
    
    setLoading(false);
  }, []);

  // 새로운 handleSend - 템플릿 변수 감지 기능 포함
  const handleSend = useCallback(async (
    paramsList: ParamItem[], 
    validationEnabled: boolean, 
    expectedValuesList: ExpectedValue[]
  ) => {
    console.log('🚀 handleSend called with template variable detection!');
    console.log('Request data:', request);
    
    // 템플릿 변수 감지 (기본값 포함)
    const variables = extractTemplateVariablesFromRequestWithDefaults(request);
    console.log('Found template variables:', variables);
    
    if (variables.length > 0) {
      // 템플릿 변수가 있으면 모달 표시를 위해 상태 저장
      setTemplateVariables(variables);
      setPendingRequest({ paramsList, validationEnabled, expectedValuesList });
      setShowVariableModal(true);
      return;
    }
    
    // 템플릿 변수가 없으면 바로 실행
    await executeApiRequest(request, paramsList, validationEnabled, expectedValuesList);
  }, [request, executeApiRequest]);

  // 템플릿 변수 입력 후 실행
  const handleVariableConfirm = useCallback(async (variables: Record<string, string>) => {
    if (!pendingRequest) return;
    
    setShowVariableModal(false);
    
    // 템플릿 변수를 실제 값으로 치환
    const processedRequest = replaceTemplateVariablesInRequest(request, variables);
    console.log('Processed request with variables:', processedRequest);
    
    // 치환된 요청으로 API 호출
    await executeApiRequest(
      processedRequest, 
      pendingRequest.paramsList, 
      pendingRequest.validationEnabled, 
      pendingRequest.expectedValuesList
    );
    
    setPendingRequest(null);
    setTemplateVariables([]);
  }, [request, pendingRequest, executeApiRequest]);

  // 템플릿 변수 모달 닫기
  const handleVariableModalClose = useCallback(() => {
    setShowVariableModal(false);
    setPendingRequest(null);
    setTemplateVariables([]);
  }, []);

  const generateCurl = useCallback(() => {
    const fullUrl = request.url;
    
    let curl = `curl -X ${request.method}`;
    
    // Add headers
    Object.entries(request.headers).forEach(([key, value]) => {
      if (key && value) {
        curl += ` \\\n  -H "${key}: ${value}"`;
      }
    });
    
    // Add query parameters
    const queryParams = Object.entries(request.params)
      .filter(([key, value]) => key && value)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    
    const urlWithParams = queryParams ? `${fullUrl}?${queryParams}` : fullUrl;
    
    // Add body for non-GET requests
    if (request.method !== 'GET' && request.body) {
      curl += ` \\\n  -d '${request.body}'`;
    }
    
    curl += ` \\\n  "${urlWithParams}"`;
    
    return curl;
  }, [request]);

  const resetRequest = useCallback(() => {
    setRequest({
      method: 'GET',
      url: '',
      params: {},
      headers: {},
      body: ''
    });
    setResponse(null);
    setLastValidationResult(null);
  }, []);

  return {
    request,
    setRequest,
    response,
    loading,
    lastValidationResult,
    handleMethodChange,
    handleSend,
    generateCurl,
    resetRequest,
    convertParamsToFormData,
    // 템플릿 변수 관련 상태와 함수들
    showVariableModal,
    templateVariables,
    handleVariableConfirm,
    handleVariableModalClose
  };
};