import React, { useState, useEffect } from 'react';
import { ApiRequest, ApiResponse, BaseUrl, ApiItem, ApiItemHistory } from '../types/api';
import { itemApi, historyApi } from '../services/api';
import SaveHistoryModal from './SaveHistoryModal';
import axios from 'axios';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Editor from '@monaco-editor/react';
import { validateResponse } from '../utils/responseValidation';

interface MainContentProps {
  baseUrls: BaseUrl[];
  selectedItem: ApiItem | null;
  onResetForm: () => void;
  onUpdateSelectedItem: (updatedItem: Partial<ApiItem>) => void;
}

const MainContent: React.FC<MainContentProps> = ({ baseUrls, selectedItem, onResetForm, onUpdateSelectedItem }) => {
  
  const [request, setRequest] = useState<ApiRequest>({
    method: 'GET',
    url: '',
    params: {},
    headers: {},
    body: ''
  });
  
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body' | 'curl' | 'validation'>('params');
  const [responseTab, setResponseTab] = useState<'body' | 'headers' | 'validation'>('body');

  const [paramsList, setParamsList] = useState<Array<{key: string, value: string, description: string, required: boolean, id: string}>>([
    { key: '', value: '', description: '', required: false, id: '1' }
  ]);

  const [headersList, setHeadersList] = useState<Array<{key: string, value: string, id: string}>>([
    { key: '', value: '', id: '1' }
  ]);

  const [showCopyAlert, setShowCopyAlert] = useState(false);
  const [showBodyPreview, setShowBodyPreview] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [apiDescription, setApiDescription] = useState('이 API의 목적과 사용 방법에 대해 설명해주세요...');
  const [tempDescription, setTempDescription] = useState('');
  const [saving, setSaving] = useState(false);

  // 히스토리 관련 상태
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string>('');

  // Response Validation 관련 상태
  const [validationEnabled, setValidationEnabled] = useState(false);
  const [expectedValuesList, setExpectedValuesList] = useState<Array<{key: string, value: string, id: string}>>([
    { key: '', value: '', id: '1' }
  ]);
  const [lastValidationResult, setLastValidationResult] = useState<any>(null);

  // 선택된 아이템이 변경될 때 폼을 로드
  useEffect(() => {
    console.log('=== useEffect triggered ===');
    console.log('selectedItem:', selectedItem);
    if (selectedItem) {
      
      // 저장된 params 파싱
      let savedParams = {};
      let savedHeaders = {};
      let savedBody = '';
      
      try {
        if (selectedItem.requestParams) {
          // requestParams가 있는지 확인하고, 문자열인 경우 파싱
          if (typeof selectedItem.requestParams === 'string') {
            savedParams = JSON.parse(selectedItem.requestParams);
          } else if (typeof selectedItem.requestParams === 'object') {
            savedParams = selectedItem.requestParams;
          }
        }
      } catch (e) {
        console.warn('Failed to parse requestParams:', e);
      }

      try {
        if (selectedItem.requestHeaders) {
          if (typeof selectedItem.requestHeaders === 'string') {
            savedHeaders = JSON.parse(selectedItem.requestHeaders);
          } else if (typeof selectedItem.requestHeaders === 'object') {
            savedHeaders = selectedItem.requestHeaders;
          }
        }
      } catch (e) {
        console.warn('Failed to parse requestHeaders:', e);
      }

      if (selectedItem.requestBody) {
        savedBody = selectedItem.requestBody;
      }

      // Validation 관련 데이터 로드
      console.log('Loading validation data for selectedItem:', {
        validationEnabled: selectedItem.validationEnabled,
        expectedValues: selectedItem.expectedValues
      });
      setValidationEnabled(selectedItem.validationEnabled || false);
      
      let savedExpectedValues = [];
      try {
        if (selectedItem.expectedValues) {
          if (typeof selectedItem.expectedValues === 'string') {
            savedExpectedValues = JSON.parse(selectedItem.expectedValues);
          } else if (Array.isArray(selectedItem.expectedValues)) {
            savedExpectedValues = selectedItem.expectedValues;
          }
        }
      } catch (e) {
        console.warn('Failed to parse expectedValues:', e);
        savedExpectedValues = [];
      }

      if (savedExpectedValues.length > 0) {
        setExpectedValuesList(savedExpectedValues.map((item: any, index: number) => ({
          key: item.key || '',
          value: item.value || '',
          id: (index + 1).toString()
        })));
      } else {
        setExpectedValuesList([{ key: '', value: '', id: '1' }]);
      }
      
      // 요청 정보 로드
      const method = selectedItem.method || 'GET';
      setRequest({
        method: method,
        url: selectedItem.url || '',
        params: savedParams,
        headers: savedHeaders,
        body: savedBody
      });

      // API 설명 로드
      setApiDescription(selectedItem.description || '이 API의 목적과 사용 방법에 대해 설명해주세요...');
      
      // requestParams JSON에서 파라미터 로딩
      try {
        let parametersArray = [];
        if (selectedItem.requestParams && typeof selectedItem.requestParams === 'string') {
          parametersArray = JSON.parse(selectedItem.requestParams);
        }
        
        if (parametersArray && Array.isArray(parametersArray) && parametersArray.length > 0) {
          const paramsWithIds = parametersArray.map((param, index) => ({
            ...param,
            id: (Date.now() + index).toString()
          }));
          const nextId = (Date.now() + paramsWithIds.length + 1).toString();
          setParamsList([...paramsWithIds, { key: '', value: '', description: '', required: false, id: nextId }]);
          
          // request.params도 업데이트
          const params: { [key: string]: string } = {};
          parametersArray.forEach((param: any) => {
            if (param.key && param.value) {
              params[param.key] = param.value;
            }
          });
          setRequest(prev => ({ ...prev, params }));
        } else {
          setParamsList([{ key: '', value: '', description: '', required: false, id: '1' }]);
          setRequest(prev => ({ ...prev, params: {} }));
        }
      } catch (error) {
        console.error('Error parsing requestParams:', error);
        // JSON 파싱 에러 시 빈 파라미터 리스트로 초기화
        setParamsList([{ key: '', value: '', description: '', required: false, id: '1' }]);
        setRequest(prev => ({ ...prev, params: {} }));
      }

      // headersList 로드
      const loadedHeaders = Object.entries(savedHeaders).map(([key, value], index) => ({
        key,
        value: String(value),
        id: (index + 1).toString()
      }));
      if (loadedHeaders.length === 0) {
        setHeadersList([{ key: '', value: '', id: '1' }]);
      } else {
        setHeadersList([...loadedHeaders, { key: '', value: '', id: (loadedHeaders.length + 1).toString() }]);
      }
      
      // 응답 초기화
      setResponse(null);
      setLastValidationResult(null);
      setActiveTab('params');
      
      // 히스토리 목록 로드
      loadHistoryList();
      setSelectedHistoryId('');
    }
  }, [selectedItem]);


  // Save API 기능 - 기본 저장 (히스토리 없이)
  const handleSaveApi = async () => {
    if (!selectedItem) {
      alert('저장할 아이템이 선택되지 않았습니다.');
      return;
    }

    setSaving(true);
    try {
      const itemId = parseInt(selectedItem.id);
      // 파라미터 목록을 JSON 문자열로 변환 (빈 항목 제외)
      const filteredParams = paramsList.filter(p => p.key || p.value || p.description);
      
      // Expected values 목록을 JSON 문자열로 변환 (빈 항목 제외)
      const filteredExpectedValues = expectedValuesList.filter(ev => ev.key || ev.value);
      
      const updateData = {
        name: selectedItem.name, // 이름은 변경하지 않음
        method: request.method,
        url: request.url,
        description: apiDescription,
        requestParams: JSON.stringify(filteredParams), // 파라미터 배열을 JSON으로 저장
        requestHeaders: JSON.stringify(request.headers),
        requestBody: request.body,
        validationEnabled: validationEnabled,
        expectedValues: JSON.stringify(filteredExpectedValues), // expected values 배열을 JSON으로 저장
        folderId: selectedItem.folder ? parseInt(selectedItem.folder) : undefined // 폴더 ID 포함
      };

      await itemApi.update(itemId, updateData);
      
      // 상위 컴포넌트에 업데이트된 데이터 알림
      onUpdateSelectedItem({
        ...selectedItem,
        method: request.method as any,
        url: request.url,
        description: apiDescription,
        requestParams: JSON.stringify(filteredParams),
        requestHeaders: JSON.stringify(request.headers),
        requestBody: request.body,
        validationEnabled: validationEnabled,
        expectedValues: JSON.stringify(filteredExpectedValues),
        folder: selectedItem.folder, // 폴더 ID 유지
        folderName: selectedItem.folderName // 폴더명 유지
      });
      
      // 히스토리 저장 팝업 표시
      setShowSaveModal(true);
      
    } catch (error: any) {
      console.error('Failed to save API:', error);
      console.error('Error details:', error.response?.data || error.message);
      alert(`API 저장 중 오류가 발생했습니다: ${error.response?.data?.message || error.message}`);
    }
    setSaving(false);
  };

  // 히스토리 저장 (중복 호출 방지)
  const [isSavingHistory, setIsSavingHistory] = useState(false);
  
  const handleSaveHistory = async (historyName: string) => {
    if (!selectedItem || isSavingHistory) return;

    setIsSavingHistory(true);
    try {
      const itemId = parseInt(selectedItem.id);
      const savedHistory = await historyApi.save(itemId, historyName);
      
      // 히스토리 목록 새로고침
      await loadHistoryList();
      
      // 방금 저장한 히스토리를 선택 상태로 설정
      if (savedHistory && savedHistory.id) {
        setSelectedHistoryId(savedHistory.id.toString());
      }
      
      setShowSaveModal(false);
      alert('히스토리가 성공적으로 저장되었습니다!');
      
    } catch (error: any) {
      console.error('Failed to save history:', error);
      alert(`히스토리 저장 중 오류가 발생했습니다: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsSavingHistory(false);
    }
  };

  // 히스토리 목록 로드
  const loadHistoryList = async () => {
    if (!selectedItem) {
      setHistoryList([]);
      return;
    }

    try {
      const itemId = parseInt(selectedItem.id);
      const histories = await historyApi.getList(itemId);
      setHistoryList(histories || []);
      
      // 히스토리 자동 선택 비활성화 (메소드 변경 시 방해되지 않도록)
      // if (histories && histories.length > 0) {
      //   setSelectedHistoryId(histories[0].id.toString());
      // } else {
      //   setSelectedHistoryId('');
      // }
    } catch (error: any) {
      console.error('Failed to load history list:', error);
      setHistoryList([]);
      setSelectedHistoryId('');
    }
  };

  // 히스토리 선택
  const handleHistorySelect = async (historyId: string) => {
    if (!selectedItem || !historyId) {
      setSelectedHistoryId('');
      return;
    }

    try {
      const itemId = parseInt(selectedItem.id);
      const historyDetail = await historyApi.getDetail(itemId, parseInt(historyId));
      
      if (historyDetail && historyDetail.snapshot) {
        const snapshot = historyDetail.snapshot;
        
        // 폼 데이터 복원
        setRequest({
          method: snapshot.method,
          url: snapshot.url,
          params: snapshot.requestParams ? JSON.parse(snapshot.requestParams) : {},
          headers: snapshot.requestHeaders ? JSON.parse(snapshot.requestHeaders) : {},
          body: snapshot.requestBody || ''
        });
        
        setApiDescription(snapshot.description || '');
        
        // 파라미터 목록 복원
        if (snapshot.parameters && Array.isArray(snapshot.parameters)) {
          const paramsWithIds = snapshot.parameters.map((param: any, index: number) => ({
            ...param,
            id: (Date.now() + index).toString()
          }));
          setParamsList([...paramsWithIds, { key: '', value: '', description: '', required: false, id: (Date.now() + paramsWithIds.length + 1).toString() }]);
        } else {
          setParamsList([{ key: '', value: '', description: '', required: false, id: '1' }]);
        }
        
        // 헤더 목록 복원
        const savedHeaders = snapshot.requestHeaders ? JSON.parse(snapshot.requestHeaders) : {};
        const loadedHeaders = Object.entries(savedHeaders).map(([key, value], index) => ({
          key,
          value: String(value),
          id: (index + 1).toString()
        }));
        if (loadedHeaders.length === 0) {
          setHeadersList([{ key: '', value: '', id: '1' }]);
        } else {
          setHeadersList([...loadedHeaders, { key: '', value: '', id: (loadedHeaders.length + 1).toString() }]);
        }
        
        // Validation 데이터 복원
        console.log('Loading validation data from history snapshot:', {
          validationEnabled: snapshot.validationEnabled,
          expectedValues: snapshot.expectedValues
        });
        setValidationEnabled(snapshot.validationEnabled || false);
        
        let savedExpectedValues = [];
        try {
          if (snapshot.expectedValues) {
            if (typeof snapshot.expectedValues === 'string') {
              savedExpectedValues = JSON.parse(snapshot.expectedValues);
            } else if (Array.isArray(snapshot.expectedValues)) {
              savedExpectedValues = snapshot.expectedValues;
            }
          }
        } catch (e) {
          console.warn('Failed to parse expectedValues from history:', e);
          savedExpectedValues = [];
        }
        
        if (savedExpectedValues.length > 0) {
          setExpectedValuesList(savedExpectedValues.map((item: any, index: number) => ({
            key: item.key || '',
            value: item.value || '',
            id: (index + 1).toString()
          })));
        } else {
          setExpectedValuesList([{ key: '', value: '', id: '1' }]);
        }
      }
      
      setSelectedHistoryId(historyId);
      
    } catch (error: any) {
      console.error('Failed to load history detail:', error);
      alert('히스토리를 불러오는 중 오류가 발생했습니다.');
    }
  };

  // 유지보수성을 위한 헬퍼 함수들
  const detectContentLanguage = (content: string): string => {
    if (!content) return 'plaintext';
    
    const trimmedContent = content.trim();
    
    // JSON 감지
    if ((trimmedContent.startsWith('{') && trimmedContent.endsWith('}')) ||
        (trimmedContent.startsWith('[') && trimmedContent.endsWith(']'))) {
      try {
        JSON.parse(trimmedContent);
        return 'json';
      } catch {
        // JSON이 아님
      }
    }
    
    // HTML/XML 감지
    if (trimmedContent.startsWith('<') && trimmedContent.includes('>')) {
      return trimmedContent.toLowerCase().includes('<!doctype html') || 
             trimmedContent.toLowerCase().includes('<html') ? 'html' : 'xml';
    }
    
    return 'plaintext';
  };

  // Monaco Editor를 위한 언어 매핑
  const getMonacoLanguage = (content: string): string => {
    const detectedLang = detectContentLanguage(content);
    switch (detectedLang) {
      case 'json': return 'json';
      case 'html': return 'html';
      case 'xml': return 'xml';
      default: return 'plaintext';
    }
  };

  const formatRequestBody = () => {
    if (!request.body) return;
    
    const language = detectContentLanguage(request.body);
    
    if (language === 'json') {
      try {
        const parsed = JSON.parse(request.body);
        const formatted = JSON.stringify(parsed, null, 2);
        setRequest({...request, body: formatted});
      } catch (error) {
        // Invalid JSON, do nothing
      }
    }
  };

  const renderSyntaxHighlighter = (content: any, customLanguage?: string): React.JSX.Element => {
    let stringContent: string;
    let language: string;
    
    if (typeof content === 'object') {
      stringContent = JSON.stringify(content, null, 2);
      language = 'json';
    } else {
      stringContent = String(content);
      language = customLanguage || detectContentLanguage(stringContent);
    }

    return (
      <SyntaxHighlighter
        language={language}
        style={oneLight}
        customStyle={{
          margin: 0,
          padding: '16px',
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          fontSize: '14px',
          lineHeight: '1.4',
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          overflowX: 'auto',
          overflowY: 'auto',
          maxHeight: '400px',
          wordBreak: 'break-all',
          whiteSpace: 'pre-wrap',
          boxSizing: 'border-box'
        }}
        showLineNumbers={stringContent.split('\n').length > 10}
      >
        {stringContent}
      </SyntaxHighlighter>
    );
  };

  // paramsList를 JSON body로 변환하는 함수
  const convertParamsListToBody = (): string => {
    const validParams = paramsList.filter(p => p.key && p.value);
    
    if (validParams.length === 0) {
      return '';
    }
    
    const formData = validParams.reduce((acc, param) => {
      acc[param.key] = param.value;
      return acc;
    }, {} as { [key: string]: string });
    
    return JSON.stringify(formData, null, 2);
  };

  // 파라미터와 바디 동기화를 위한 헬퍼 함수들 (기존 호환성을 위해 유지)
  const convertParamsToFormData = (params: { [key: string]: string }): string => {
    const validParams = Object.entries(params).filter(([key, value]) => key && value);
    if (validParams.length === 0) return '';
    
    const formData = validParams.reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {} as { [key: string]: string });
    
    return JSON.stringify(formData, null, 2);
  };



  // HTTP Method 변경 시 params와 body 동기화
  const handleMethodChange = (method: string) => {
    const previousMethod = request.method;
    
    // selectedItem의 method 업데이트는 Save시에만 하도록 변경
    // onUpdateSelectedItem({ method: method as any });
    
    // 이전 메소드가 GET/DELETE이고 새 메소드가 POST/PUT/PATCH인 경우
    // params를 body로 이동
    if (['GET', 'DELETE'].includes(previousMethod) && ['POST', 'PUT', 'PATCH'].includes(method)) {
      const bodyData = convertParamsListToBody();
      
      const newHeaders = {...request.headers};
      
      if (bodyData) {
        newHeaders['Content-Type'] = 'application/json';
      }
      
      // headersList도 업데이트
      const hasContentType = headersList.some(h => h.key.toLowerCase() === 'content-type');
      if (!hasContentType && bodyData) {
        const newHeadersList = [...headersList];
        // 빈 행이 있으면 그 행에 Content-Type 추가, 없으면 새로 추가
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
      
      
      // body 탭으로 자동 전환 (약간의 지연 후)
      if (bodyData) {
        setTimeout(() => {
          setActiveTab('body');
        }, 10);
      }
    }
    // 이전 메소드가 POST/PUT/PATCH이고 새 메소드가 GET/DELETE인 경우
    // body에서 params로 이동
    else if (['POST', 'PUT', 'PATCH'].includes(previousMethod) && ['GET', 'DELETE'].includes(method)) {
      try {
        // body가 JSON 형태인지 확인하고 params로 변환
        let newParams = {};
        let newParamsList = [{ key: '', value: '', description: '', required: false, id: Date.now().toString() }];
        
        if (request.body) {
          const parsedBody = JSON.parse(request.body);
          if (typeof parsedBody === 'object' && parsedBody !== null) {
            newParams = parsedBody;
            
            // paramsList도 업데이트 (description 없이 key,value만)
            const paramsArray = Object.entries(parsedBody).map(([key, value], index) => ({
              key,
              value: String(value),
              description: '', // body에서 params로 이동할 때는 description 없음
              required: false,
              id: (Date.now() + index).toString()
            }));
            
            if (paramsArray.length > 0) {
              newParamsList = [...paramsArray, { key: '', value: '', description: '', required: false, id: (Date.now() + paramsArray.length).toString() }];
            }
          }
        }
        
        // Content-Type 헤더 제거
        const newHeaders = {...request.headers};
        delete newHeaders['Content-Type'];
        delete newHeaders['content-type']; // 소문자 버전도 제거
        
        // headersList에서도 Content-Type 제거
        const filteredHeadersList = headersList.filter(h => 
          h.key.toLowerCase() !== 'content-type'
        );
        
        // 빈 행이 없으면 추가
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
        
        // params 탭으로 자동 전환
        setActiveTab('params');
      } catch (e) {
        // JSON 파싱 실패 시 기본 동작
        const newHeaders = {...request.headers};
        delete newHeaders['Content-Type'];
        delete newHeaders['content-type'];
        
        // headersList에서도 Content-Type 제거
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
        setActiveTab('params');
      }
    }
    // 같은 카테고리 내에서 변경 (GET<->DELETE, POST<->PUT<->PATCH)
    else {
      setRequest({
        ...request, 
        method: method as any
      });
    }
  };

  // HTTP Method별 색상 반환
  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'text-green-600 bg-green-50 border-green-300';
      case 'POST':
        return 'text-blue-600 bg-blue-50 border-blue-300';
      case 'PUT':
        return 'text-orange-600 bg-orange-50 border-orange-300';
      case 'DELETE':
        return 'text-red-600 bg-red-50 border-red-300';
      case 'PATCH':
        return 'text-purple-600 bg-purple-50 border-purple-300';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-300';
    }
  };

  // API Description 편집 관련 함수들
  const handleEditDescription = () => {
    setTempDescription(apiDescription);
    setIsEditingDescription(true);
  };

  const handleSaveDescription = () => {
    setApiDescription(tempDescription);
    setIsEditingDescription(false);
  };

  const handleCancelDescription = () => {
    setTempDescription('');
    setIsEditingDescription(false);
  };

  const handleSend = async () => {
    // 필수 파라미터 검증
    for (const param of paramsList) {
      if (param.required) {
        // key가 없거나 value가 없으면 오류
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
      let fullUrl = request.url;
      
      // 외부 API인 경우 프록시 경로로 변경
      if (fullUrl.includes('devpg.bluewalnut.co.kr')) {
        fullUrl = fullUrl.replace('https://devpg.bluewalnut.co.kr', '/api/external');
      }
      
      const axiosConfig: any = {
        method: request.method.toLowerCase(),
        url: fullUrl,
        params: request.params,
        headers: request.headers,
        withCredentials: true, // 세션 쿠키 전송을 위해 추가
      };

      if (request.method !== 'GET' && request.body) {
        try {
          axiosConfig.data = JSON.parse(request.body);
        } catch {
          axiosConfig.data = request.body;
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

      // Validation 수행 (활성화된 경우)
      if (validationEnabled && expectedValuesList.length > 0) {
        try {
          const filteredExpectedValues = expectedValuesList.filter(ev => ev.key.trim() && ev.value.trim());
          if (filteredExpectedValues.length > 0) {
            console.log('🔍 Validation Debug:');
            console.log('Response data:', result.data);
            console.log('Expected values:', filteredExpectedValues);
            
            const validationResult = validateResponse(result.data, filteredExpectedValues);
            console.log('Validation result:', validationResult);
            
            setLastValidationResult(validationResult);
            
            // validation 탭으로 자동 전환 (검증 실패 시)
            if (!validationResult.passed) {
              setResponseTab('validation');
            }
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
      
      // 에러 시 validation 결과 초기화
      setLastValidationResult(null);
    }
    
    setLoading(false);
  };

  const addParam = () => {
    const newParamId = Date.now().toString();
    setParamsList([...paramsList, { key: '', value: '', description: '', required: false, id: newParamId }]);
    
    // 새로 추가된 description input에 포커스하고 Add Parameter 버튼으로 스크롤
    setTimeout(() => {
      const descInput = document.querySelector(`input[data-param-id="${newParamId}"][data-field="description"]`) as HTMLInputElement;
      const addButton = document.querySelector('[data-add-param-button]') as HTMLElement;
      
      if (descInput) {
        descInput.focus();
      }
      
      // Add Parameter 버튼이 보이도록 스크롤
      if (addButton) {
        addButton.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'end',
          inline: 'nearest'
        });
      }
    }, 10);
  };

  const removeParam = (id: string) => {
    const updatedParamsList = paramsList.filter(p => p.id !== id);
    setParamsList(updatedParamsList);
    
    // 파라미터 제거 시에도 request.params 업데이트
    const paramToRemove = paramsList.find(p => p.id === id);
    if (paramToRemove && paramToRemove.key) {
      const updatedParams = { ...request.params };
      delete updatedParams[paramToRemove.key];
      
      // 한 번에 모든 상태를 업데이트
      if (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH') {
        const formData = convertParamsToFormData(updatedParams);
        const newHeaders = {...request.headers};
        if (formData) {
          newHeaders['Content-Type'] = 'application/json';
          setRequest({
            ...request, 
            params: updatedParams,
            body: formData, 
            headers: newHeaders
          });
        } else {
          // 파라미터가 모두 비어있으면 body도 비움
          setRequest({
            ...request, 
            params: updatedParams,
            body: '', 
            headers: newHeaders
          });
        }
      } else {
        // GET, DELETE 등의 경우 params만 업데이트
        setRequest({...request, params: updatedParams});
      }
    }
  };

  const updateParam = (id: string, field: 'key' | 'value' | 'description' | 'required', value: string | boolean) => {
    // 업데이트된 paramsList 계산
    const updatedParamsList = paramsList.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    );
    setParamsList(updatedParamsList);
    
    // description이나 required 필드는 request.params에 영향 없음
    if (field === 'description' || field === 'required') {
      return;
    }
    
    // 업데이트된 paramsList에서 현재 파라미터 정보 가져오기
    const updatedParam = updatedParamsList.find(p => p.id === id);
    const oldParam = paramsList.find(p => p.id === id);
    
    // Update request params (key, value 필드만)
    const updatedParams = { ...request.params };
    
    if (updatedParam && oldParam) {
      if (field === 'key') {
        // 기존 키 제거 (있다면)
        if (oldParam.key) delete updatedParams[oldParam.key];
        // 새 키로 값 설정 (키와 값이 모두 있다면)
        if (value && updatedParam.value) updatedParams[value as string] = updatedParam.value;
      } else if (field === 'value') {
        // value 필드 업데이트
        if (updatedParam.key) updatedParams[updatedParam.key] = value as string;
      }
    }
    
    // 한 번에 모든 상태를 업데이트
    if (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH') {
      const formData = convertParamsToFormData(updatedParams);
      const newHeaders = {...request.headers};
      
      if (formData) {
        newHeaders['Content-Type'] = 'application/json';
        setRequest({
          ...request, 
          params: updatedParams,
          body: formData, 
          headers: newHeaders
        });
      } else {
        // 파라미터가 모두 비어있으면 body도 비움
        setRequest({
          ...request, 
          params: updatedParams,
          body: '', 
          headers: newHeaders
        });
      }
    } else {
      // GET, DELETE 등의 경우 params만 업데이트
      setRequest({...request, params: updatedParams});
    }
  };

  const updateHeader = (id: string, field: 'key' | 'value', value: string) => {
    setHeadersList(headersList.map(h => 
      h.id === id ? { ...h, [field]: value } : h
    ));
    
    // Update request headers
    const updatedHeaders = { ...request.headers };
    const header = headersList.find(h => h.id === id);
    if (header) {
      if (field === 'key') {
        if (header.key) delete updatedHeaders[header.key];
        if (value && header.value) updatedHeaders[value] = header.value;
      } else {
        if (header.key) updatedHeaders[header.key] = value;
      }
    }
    setRequest({...request, headers: updatedHeaders});
  };

  const generateCurl = () => {
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
  };

  const handleReset = () => {
    setRequest({
      method: 'GET',
      url: '',
      params: {},
      headers: {},
      body: ''
    });
    setParamsList([{ key: '', value: '', description: '', required: false, id: '1' }]);
    setHeadersList([{ key: '', value: '', id: '1' }]);
    setResponse(null);
    setLastValidationResult(null);
    setActiveTab('params');
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* History Selection Section - 상단 분리 */}
      {selectedItem && (
        <div className="px-4 py-2">
          <div className="flex justify-end">
            <div className="flex items-center gap-2">
              <select
                value={selectedHistoryId}
                onChange={(e) => handleHistorySelect(e.target.value)}
                disabled={historyList.length === 0}
                className={`px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-48 ${
                  historyList.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <option value="">
                  {historyList.length === 0 ? '히스토리 없음' : '히스토리 선택'}
                </option>
                {historyList.map((history) => (
                  <option key={history.id} value={history.id}>
                    {history.historyName} ({new Date(history.savedAt).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* API Name Section */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold text-gray-800">
                {selectedItem ? selectedItem.name : 'No API Selected'}
              </h2>
            </div>
            {selectedItem && !isEditingDescription && (
              <button 
                onClick={handleEditDescription}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                Edit Description
              </button>
            )}
          </div>
          <div className="flex items-center">
            {/* Save 버튼만 여기에 */}
            <button 
              onClick={handleSaveApi}
              disabled={!selectedItem || saving}
              className={`px-4 py-1.5 text-white rounded flex items-center gap-2 transition-colors ${
                selectedItem && !saving 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
        
        {selectedItem ? (
          isEditingDescription ? (
            // 편집 모드 - 모바일에서도 표시
            <div>
              <div className="bg-gray-50 p-3 rounded border mb-3">
                <textarea 
                  className="w-full h-24 bg-transparent border-none outline-none resize-none text-sm text-gray-700 placeholder-gray-500"
                  placeholder="이 API의 목적과 사용 방법에 대해 설명해주세요..."
                  value={tempDescription}
                  onChange={(e) => setTempDescription(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveDescription}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  저장
                </button>
                <button
                  onClick={handleCancelDescription}
                  className="px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            // 표시 모드 - 모바일에서도 표시
            <div 
              className="bg-gray-50 p-4 rounded border min-h-16 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={handleEditDescription}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="hidden md:block text-xs text-gray-500 font-medium">API Description</span>
                <span className={`hidden md:block px-2 py-0.5 text-xs font-medium rounded ${
                  selectedItem.method === 'GET' ? 'bg-green-100 text-green-800' :
                  selectedItem.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                  selectedItem.method === 'PUT' ? 'bg-orange-100 text-orange-800' :
                  selectedItem.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                  selectedItem.method === 'PATCH' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {selectedItem.method}
                </span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {apiDescription || '이 API에 대한 설명을 추가하려면 클릭하세요...'}
              </p>
            </div>
          )
        ) : (
          // 선택된 API가 없을 때
          <div className="bg-gray-50 p-8 rounded border text-center">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">API를 선택하세요</h3>
            <p className="text-sm text-gray-500">
              좌측 사이드바에서 API를 선택하거나 새로운 API를 생성하여 시작하세요
            </p>
          </div>
        )}
      </div>

      {/* Request Section - Compact Insomnia Style */}
      <div className="bg-white border-b border-gray-200 px-3 py-2">
        <div className="flex items-center">
          {/* Method Selector - Compact */}
          <div className="relative">
            <select 
              className={`appearance-none border-0 px-3 py-2 pr-6 text-xs font-bold rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-400 ${getMethodColor(request.method)}`}
              value={request.method}
              onChange={(e) => handleMethodChange(e.target.value)}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
            </select>
            <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 ${getMethodColor(request.method).split(' ')[0]}`}>
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          
          {/* URL Input - Compact */}
          <input
            type="text"
            className="flex-1 mx-2 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
            value={request.url}
            onChange={(e) => setRequest({...request, url: e.target.value})}
            placeholder="https://api.example.com/endpoint"
          />
          
          {/* Send Button - Compact */}
          <button
            onClick={handleSend}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-400 min-w-[60px] justify-center"
          >
            {loading ? (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Send'
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area - Split into Request and Response */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Request Section - Left Side - 60% width on desktop, full width on tablet */}
        <div className="lg:flex-[3] flex flex-col lg:border-r border-b lg:border-b-0 border-gray-200">
          {/* Request Header - Compact */}
          <div className="bg-gray-50 border-b border-gray-200">
            <div className="flex justify-between items-center h-9">
              <h3 className="text-xs px-3 font-medium text-gray-700">Request</h3>
              <button
                onClick={handleReset}
                className="mx-3 px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Request Tabs - Compact */}
          <div className="bg-gray-50 border-b border-gray-200">
            <div className="flex justify-between items-center h-9">
              <div className="flex">
                {(['params', 'headers', 'body', 'curl', 'validation'] as const).map((tab) => (
                  <button
                    key={tab}
                    className={`px-3 py-1.5 text-xs font-medium border-b-2 max-h ${
                      activeTab === tab 
                        ? 'border-blue-500 text-blue-600 bg-white' 
                        : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    } transition-colors`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab === 'curl' ? 'cURL' : tab === 'validation' ? 'Response Validation' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className={`bg-white ${activeTab === 'params' ? 'p-0' : 'p-3'}`}>
            {activeTab === 'params' && (
              <div>
                {/* Desktop Table Layout */}
                <div className="hidden md:block overflow-y-auto" style={{maxHeight: 'calc(100vh - 480px)', minHeight: '250px'}}>
                  <table className="w-full border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-300 sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 border-r border-gray-300 w-12">
                          <span className="cursor-help" title="Required parameter">Must</span>
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 border-r border-gray-300" style={{width: '40%'}}>
                          Description
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 border-r border-gray-300" style={{width: '30%'}}>
                          Key
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 border-r border-gray-300" style={{width: '30%'}}>
                          Value
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 w-10">
                          Del
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {paramsList.map((param) => (
                        <tr key={param.id} className="hover:bg-gray-50 border-b border-gray-300">
                          <td className="px-3 py-2 border-r border-gray-300">
                            <div className="flex items-center justify-center h-full">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={param.required}
                                  onChange={(e) => updateParam(param.id, 'required', e.target.checked)}
                                />
                                <div className="relative w-4 h-4 bg-white border border-gray-300 rounded peer-checked:bg-blue-600 peer-checked:border-blue-600 peer-hover:border-blue-400 transition-colors duration-200">
                                  <svg
                                    className={`absolute inset-0 w-2.5 h-2.5 m-0.5 text-white transition-opacity duration-200 ${
                                      param.required ? 'opacity-100' : 'opacity-0'
                                    }`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                              </label>
                            </div>
                          </td>
                          <td className="px-3 py-2 border-r border-gray-300">
                            <input
                              className="w-full px-2 py-1 border-0 bg-transparent text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 rounded"
                              placeholder="description"
                              value={param.description}
                              onChange={(e) => updateParam(param.id, 'description', e.target.value)}
                              data-param-id={param.id}
                              data-field="description"
                            />
                          </td>
                          <td className="px-3 py-2 border-r border-gray-300">
                            <input
                              className="w-full px-2 py-1 border-0 bg-transparent text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 rounded"
                              placeholder="key"
                              value={param.key}
                              onChange={(e) => updateParam(param.id, 'key', e.target.value)}
                            />
                          </td>
                          <td className="px-3 py-2 border-r border-gray-300">
                            <input
                              className="w-full px-2 py-1 border-0 bg-transparent text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 rounded"
                              placeholder="value"
                              value={param.value}
                              onChange={(e) => updateParam(param.id, 'value', e.target.value)}
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              onClick={() => removeParam(param.id)}
                              className="text-gray-400 hover:text-red-600 transition-colors duration-200 text-sm w-6 h-6 flex items-center justify-center mx-auto rounded hover:bg-red-50"
                              title="Del"
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      ))}
                      {/* Add Parameter Row */}
                      <tr className="bg-gray-50">
                        <td colSpan={5} className="px-3 py-3 border-t border-gray-300">
                          <button
                            onClick={addParam}
                            className="bg-blue-600 bg-opacity-10 hover:bg-opacity-100 text-blue-700 hover:text-white text-xs font-medium px-3 py-1.5 rounded border border-blue-200 hover:border-blue-600 transition-all duration-200 flex items-center gap-1 w-full justify-center"
                            title="Add Parameter"
                            data-add-param-button
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Parameter
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Mobile Table Layout */}
                <div className="md:hidden overflow-y-auto" style={{maxHeight: 'calc(100vh - 480px)', minHeight: '250px'}}>
                  <div className="bg-gray-50 border-b border-gray-300 sticky top-0 z-10">
                    <div className="flex text-xs font-medium text-gray-600">
                      <div className="px-3 py-2 border-r border-gray-300" style={{width: '40%'}}>Description</div>
                      <div className="px-3 py-2 text-center border-r border-gray-300" style={{width: '30%'}}>Key</div>
                      <div className="px-3 py-2 text-center border-r border-gray-300" style={{width: '30%'}}>Value</div>
                      <div className="w-12 px-3 py-2 text-center">Del</div>
                    </div>
                  </div>
                  <div className="bg-white">
                    {paramsList.map((param) => (
                      <div key={param.id} className="flex items-center border-b border-gray-300">
                        <div className="px-3 py-2 border-r border-gray-300" style={{width: '40%'}}>
                          <input
                            className="w-full px-2 py-1 border-0 bg-transparent text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 rounded"
                            placeholder="Description"
                            value={param.description}
                            onChange={(e) => updateParam(param.id, 'description', e.target.value)}
                            data-param-id={param.id}
                            data-field="description"
                          />
                        </div>
                        <div className="px-3 py-2 border-r border-gray-300" style={{width: '30%'}}>
                          <input
                            className="w-full px-2 py-1 border-0 bg-transparent text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 rounded text-center"
                            placeholder="Key"
                            value={param.key}
                            onChange={(e) => updateParam(param.id, 'key', e.target.value)}
                          />
                        </div>
                        <div className="px-3 py-2 border-r border-gray-300" style={{width: '30%'}}>
                          <input
                            className="w-full px-2 py-1 border-0 bg-transparent text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 rounded text-center"
                            placeholder="Value"
                            value={param.value}
                            onChange={(e) => updateParam(param.id, 'value', e.target.value)}
                          />
                        </div>
                        <div className="w-12 px-3 py-2 flex justify-center">
                          <button
                            onClick={() => removeParam(param.id)}
                            className="text-gray-400 hover:text-red-600 text-sm transition-colors duration-200 w-6 h-6 flex items-center justify-center rounded hover:bg-red-50"
                            title="Del"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                    {/* Add Parameter Row for Mobile */}
                    <div className="bg-gray-50 px-3 py-3">
                      <button
                        onClick={addParam}
                        className="bg-blue-600 bg-opacity-10 hover:bg-opacity-100 text-blue-700 hover:text-white text-xs font-medium px-3 py-1.5 rounded border border-blue-200 hover:border-blue-600 transition-all duration-200 flex items-center gap-1 w-full justify-center"
                        title="Add Parameter"
                        data-add-param-button
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Parameter
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'headers' && (
              <div className="overflow-y-auto" style={{maxHeight: 'calc(100vh - 500px)', minHeight: '240px'}}>
                <div className="grid grid-cols-12 gap-2 mb-3 text-xs font-medium text-gray-600 sticky top-0 bg-white z-10 py-2">
                  <div className="col-span-5">Key</div>
                  <div className="col-span-6">Value</div>
                  <div className="col-span-1 text-center">Del</div>
                </div>
                <div className="space-y-1.5">
                  {headersList.map((header) => (
                    <div key={header.id} className="grid grid-cols-12 gap-2">
                      <input
                        className="col-span-5 px-2 py-1.5 border border-gray-300 rounded text-xs"
                        placeholder="key"
                        value={header.key}
                        onChange={(e) => updateHeader(header.id, 'key', e.target.value)}
                      />
                      <input
                        className="col-span-6 px-2 py-1.5 border border-gray-300 rounded text-xs"
                        placeholder="value"
                        value={header.value}
                        onChange={(e) => updateHeader(header.id, 'value', e.target.value)}
                      />
                      <button
                        onClick={() => setHeadersList(headersList.filter(h => h.id !== header.id))}
                        className="col-span-1 text-gray-400 hover:text-red-600 text-center text-sm"
                        title="Del"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => setHeadersList([...headersList, { key: '', value: '', id: Date.now().toString() }])}
                    className="bg-blue-600 bg-opacity-10 hover:bg-opacity-100 text-blue-700 hover:text-white text-xs font-medium px-3 py-1.5 rounded border border-blue-200 hover:border-blue-600 transition-all duration-200 flex items-center gap-1 w-full justify-center"
                    title="Add Header"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Header
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'body' && (
              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-700">Request Body</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={formatRequestBody}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        disabled={!request.body}
                      >
                        Format
                      </button>
                      <button
                        onClick={() => setShowBodyPreview(!showBodyPreview)}
                        className={`px-3 py-1 text-sm rounded transition-colors ${
                          showBodyPreview 
                            ? 'bg-green-600 text-white hover:bg-green-700' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                        disabled={!request.body}
                      >
                        {showBodyPreview ? 'Edit' : 'Preview'}
                      </button>
                    </div>
                  </div>
                </div>
                
                {showBodyPreview && request.body ? (
                  <div className="flex-1 overflow-auto">
                    {renderSyntaxHighlighter(request.body)}
                  </div>
                ) : (
                  <div className="flex-1 border border-gray-300 rounded overflow-hidden">
                    <Editor
                      height="300px"
                      language={getMonacoLanguage(request.body)}
                      value={request.body}
                      onChange={(value) => setRequest(prev => ({...prev, body: value || ''}))}
                      theme="light"
                      options={{
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        fontSize: 14,
                        lineNumbers: 'on',
                        wordWrap: 'on',
                        automaticLayout: true,
                        tabSize: 2,
                        insertSpaces: true,
                        folding: true,
                        lineDecorationsWidth: 10,
                        lineNumbersMinChars: 3,
                        glyphMargin: false,
                        contextmenu: true,
                        selectOnLineNumbers: true,
                        roundedSelection: false,
                        readOnly: false,
                        cursorStyle: 'line',
                        smoothScrolling: true,
                        padding: { top: 12, bottom: 12 }
                      }}
                      loading={<div className="p-4 text-gray-500">Loading editor...</div>}
                    />
                  </div>
                )}
              </div>
            )}

            {activeTab === 'curl' && (
              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-medium text-gray-700">Generated cURL Command</h4>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generateCurl());
                      setShowCopyAlert(true);
                      setTimeout(() => setShowCopyAlert(false), 3000);
                    }}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Copy cURL
                  </button>
                </div>
                <pre className="flex-1 p-4 bg-gray-50 border border-gray-300 rounded text-sm font-mono overflow-auto whitespace-pre-wrap">
                  {generateCurl()}
                </pre>
              </div>
            )}

            {activeTab === 'validation' && (
              <div className="overflow-y-auto" style={{maxHeight: 'calc(100vh - 500px)', minHeight: '240px'}}>
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id="validationEnabled"
                      checked={validationEnabled}
                      onChange={(e) => setValidationEnabled(e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="validationEnabled" className="text-sm font-medium text-gray-700">
                      Enable Response Validation
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 ml-6">
                    API 응답에서 지정한 키-값 쌍이 일치하는지 검증합니다
                  </p>
                </div>

                {validationEnabled && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Expected Values</h4>
                    <div className="grid grid-cols-12 gap-2 mb-3 text-xs font-medium text-gray-600">
                      <div className="col-span-5">Key (JSON path)</div>
                      <div className="col-span-6">Expected Value</div>
                      <div className="col-span-1 text-center">Del</div>
                    </div>
                    
                    <div className="space-y-2">
                      {expectedValuesList.map((expectedValue, index) => (
                        <div key={expectedValue.id} className="grid grid-cols-12 gap-2">
                          <input
                            type="text"
                            placeholder="e.g., status, data.code, result.success"
                            value={expectedValue.key}
                            onChange={(e) => {
                              const updated = [...expectedValuesList];
                              updated[index].key = e.target.value;
                              setExpectedValuesList(updated);
                            }}
                            className="col-span-5 px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            placeholder="Expected value"
                            value={expectedValue.value}
                            onChange={(e) => {
                              const updated = [...expectedValuesList];
                              updated[index].value = e.target.value;
                              setExpectedValuesList(updated);
                            }}
                            className="col-span-6 px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => {
                              if (expectedValuesList.length > 1) {
                                setExpectedValuesList(expectedValuesList.filter((_, i) => i !== index));
                              }
                            }}
                            disabled={expectedValuesList.length === 1}
                            className="col-span-1 text-center text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed text-sm"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => {
                          const newId = Math.max(...expectedValuesList.map(ev => parseInt(ev.id))) + 1;
                          setExpectedValuesList([...expectedValuesList, { key: '', value: '', id: newId.toString() }]);
                        }}
                        className="bg-blue-600 bg-opacity-10 hover:bg-opacity-100 text-blue-700 hover:text-white text-xs font-medium px-3 py-1.5 rounded border border-blue-200 hover:border-blue-600 transition-all duration-200 flex items-center gap-1 w-full justify-center"
                        title="Add Expected Value"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Expected Value
                      </button>
                    </div>

                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <div className="text-sm font-medium text-yellow-800 mb-1">사용법:</div>
                      <div className="text-xs text-yellow-700">
                        • <strong>성공 응답(200-299)에 대해서만</strong> 유효성 검증을 수행합니다<br/>
                        • Key에는 JSON 경로를 입력하세요 (예: "status", "data.code", "result.items.0.name")<br/>
                        • 중첩된 객체는 점(.)으로 구분하고, 배열 인덱스는 숫자로 표현하세요<br/>
                        • Expected Value에는 예상되는 값을 정확히 입력하세요<br/>
                        • 4xx, 5xx 에러 응답은 자동으로 실패 처리되므로 별도 검증하지 않습니다
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Response Section - Right Side - 40% width on desktop, full width on tablet */}
        <div className="h-1/2 lg:flex-[2] flex flex-col bg-white min-h-0 lg:h-auto lg:min-w-0 lg:max-w-full overflow-hidden">
          {/* Response Header - Compact */}
          <div className="bg-gray-50 border-b border-gray-200">
            <div className="flex justify-between items-center h-9">
              <h3 className="text-xs px-3 font-medium text-gray-700">Response</h3>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 mr-3 rounded text-xs font-semibold ${
                  !response 
                    ? 'bg-gray-100 text-gray-500' 
                    : response.status >= 200 && response.status < 300 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                }`}>
                  {response ? response.status : '-'}
                </span>
                {response && (
                  <>
                    <span className="text-gray-600 text-xs mr-3">Time: {response.time}ms</span>
                    <span className="text-gray-600 text-xs mr-3">Size: {response.size}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {response ? (
            <>

              <div className="bg-gray-50 border-b border-gray-200">
                <div className="flex h-9 items-center">
                  {(['body', 'headers', 'validation'] as const).map((tab) => (
                    <button
                      key={tab}
                      className={`px-3 py-1.5 text-xs font-medium border-b-2 ${
                        responseTab === tab 
                          ? 'border-blue-500 text-blue-600 bg-white' 
                          : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                      } transition-colors`}
                      onClick={() => setResponseTab(tab)}
                    >
                      {tab === 'validation' ? 'Validation' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 flex-1 overflow-hidden min-h-[200px] max-h-[500px] w-full">
                {responseTab === 'body' && (
                  <div className="h-full max-h-[450px] overflow-auto w-full">
                    <div className="w-0 min-w-full overflow-x-auto">
                      {renderSyntaxHighlighter(response.data)}
                    </div>
                  </div>
                )}
                
                {responseTab === 'headers' && (
                  <div className="text-sm h-full max-h-[450px] overflow-auto w-full">
                    <div className="w-0 min-w-full">
                      {Object.entries(response.headers).map(([key, value]) => (
                        <div key={key} className="mb-2 break-all">
                          <span className="font-medium text-gray-800">{key}:</span> <span className="break-words">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {responseTab === 'validation' && (
                  <div className="h-full max-h-[450px] overflow-auto w-full">
                    {validationEnabled ? (
                      lastValidationResult ? (
                        <div className="space-y-4">
                          {/* 전체 결과 요약 */}
                          <div className={`p-4 rounded-lg border ${
                            lastValidationResult.passed 
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-red-50 border-red-200'
                          }`}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`text-lg ${lastValidationResult.passed ? 'text-green-600' : 'text-red-600'}`}>
                                {lastValidationResult.passed ? '✅' : '❌'}
                              </span>
                              <h3 className={`text-md font-semibold ${lastValidationResult.passed ? 'text-green-800' : 'text-red-800'}`}>
                                Validation {lastValidationResult.passed ? 'Passed' : 'Failed'}
                              </h3>
                            </div>
                            <p className="text-sm text-gray-700">
                              {lastValidationResult.results.filter((r: any) => r.passed).length} / {lastValidationResult.results.length} tests passed
                            </p>
                          </div>

                          {/* 개별 테스트 결과 */}
                          <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-gray-700">Test Results:</h4>
                            {lastValidationResult.results.map((result: any, index: number) => (
                              <div key={index} className={`p-3 rounded border text-sm ${
                                result.passed 
                                  ? 'bg-green-100 border-green-300' 
                                  : 'bg-red-100 border-red-300'
                              }`}>
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className={`${result.passed ? 'text-green-700' : 'text-red-700'}`}>
                                      {result.passed ? '✅' : '❌'}
                                    </span>
                                    <span className="font-medium font-mono">{result.key}</span>
                                  </div>
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    result.passed 
                                      ? 'bg-green-200 text-green-800' 
                                      : 'bg-red-200 text-red-800'
                                  }`}>
                                    {result.passed ? 'PASS' : 'FAIL'}
                                  </span>
                                </div>
                                
                                <div className="space-y-1 text-xs text-gray-600">
                                  <div>
                                    <span className="font-medium">Expected:</span> 
                                    <span className="font-mono ml-1">{
                                      typeof result.expectedValue === 'string' 
                                        ? `"${result.expectedValue}"` 
                                        : JSON.stringify(result.expectedValue)
                                    }</span>
                                  </div>
                                  <div>
                                    <span className="font-medium">Actual:</span> 
                                    <span className="font-mono ml-1">{
                                      typeof result.actualValue === 'undefined' 
                                        ? 'undefined'
                                        : typeof result.actualValue === 'string' 
                                        ? `"${result.actualValue}"`
                                        : JSON.stringify(result.actualValue)
                                    }</span>
                                  </div>
                                  {result.error && (
                                    <div className="text-red-600 mt-1">
                                      <span className="font-medium">Error:</span> {result.error}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-32 text-gray-500">
                          <div className="text-center">
                            <div className="text-2xl mb-2">🔍</div>
                            <div className="text-sm">No validation results yet</div>
                            <div className="text-xs text-gray-400 mt-1">Send a request to see validation results</div>
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="flex items-center justify-center h-32 text-gray-500">
                        <div className="text-center">
                          <div className="text-2xl mb-2">⚙️</div>
                          <div className="text-sm">Response validation is disabled</div>
                          <div className="text-xs text-gray-400 mt-1">Enable it in the "Response Validation" tab to see validation results</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-4">🔍</div>
                <p className="text-lg font-medium mb-2">요청을 시작할 수 있습니다</p>
                <p className="text-sm">URL을 입력하고 Send 버튼을 눌러 API 테스트를 시작하세요</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Copy Success Toast */}
      {showCopyAlert && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg z-50">
          <div className="flex items-center">
            <span className="text-sm">✅ cURL command copied to clipboard!</span>
            <button
              onClick={() => setShowCopyAlert(false)}
              className="ml-3 text-green-700 hover:text-green-900"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Save History Modal */}
      <SaveHistoryModal
        isOpen={showSaveModal}
        onSave={handleSaveHistory}
        onCancel={() => setShowSaveModal(false)}
        defaultName={selectedItem?.name ? `${selectedItem.name} v${new Date().toISOString().slice(0, 10)}` : ''}
      />
    </div>
  );
};

export default MainContent;