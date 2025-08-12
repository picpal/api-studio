import React, { useState, useEffect } from 'react';
import { ApiRequest, ApiResponse, BaseUrl, ApiItem } from '../types/api';
import { itemApi } from '../services/api';
import axios from 'axios';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Editor from '@monaco-editor/react';

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
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body' | 'curl'>('params');
  const [responseTab, setResponseTab] = useState<'body' | 'headers'>('body');

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

  // 선택된 아이템이 변경될 때 폼을 로드
  useEffect(() => {
    if (selectedItem) {
      console.log('Loading item data:', selectedItem);
      
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
      
      // paramsList 로드
      const loadedParams = Object.entries(savedParams).map(([key, value], index) => ({
        key,
        value: String(value),
        description: '',
        required: false,
        id: (index + 1).toString()
      }));
      if (loadedParams.length === 0) {
        setParamsList([{ key: '', value: '', description: '', required: false, id: '1' }]);
      } else {
        setParamsList([...loadedParams, { key: '', value: '', description: '', required: false, id: (loadedParams.length + 1).toString() }]);
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
      setActiveTab('params');
    }
  }, [selectedItem]);

  // Save API 기능
  const handleSaveApi = async () => {
    if (!selectedItem) {
      alert('저장할 아이템이 선택되지 않았습니다.');
      return;
    }

    setSaving(true);
    try {
      const itemId = parseInt(selectedItem.id);
      const updateData = {
        name: selectedItem.name, // 이름은 변경하지 않음
        method: request.method,
        url: request.url,
        description: apiDescription,
        requestParams: JSON.stringify(request.params),
        requestHeaders: JSON.stringify(request.headers),
        requestBody: request.body
      };

      console.log('Saving item:', itemId, updateData);
      
      await itemApi.update(itemId, updateData);
      
      alert('API 정보가 성공적으로 저장되었습니다!');
      
    } catch (error) {
      console.error('Failed to save API:', error);
      alert('API 저장 중 오류가 발생했습니다.');
    }
    setSaving(false);
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
          lineHeight: '1.4'
        }}
        showLineNumbers={stringContent.split('\n').length > 10}
      >
        {stringContent}
      </SyntaxHighlighter>
    );
  };

  // 파라미터와 바디 동기화를 위한 헬퍼 함수들
  const convertParamsToFormData = (params: { [key: string]: string }): string => {
    const validParams = Object.entries(params).filter(([key, value]) => key && value);
    if (validParams.length === 0) return '';
    
    const formData = validParams.reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {} as { [key: string]: string });
    
    return JSON.stringify(formData, null, 2);
  };



  // HTTP Method 변경 시 body 동기화
  const handleMethodChange = (method: string) => {
    // selectedItem의 method도 업데이트
    onUpdateSelectedItem({ method: method as any });
    
    // POST, PUT, PATCH일 때는 params를 body로 동기화
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      const formData = convertParamsToFormData(request.params);
      const newHeaders = {...request.headers};
      if (formData) {
        newHeaders['Content-Type'] = 'application/json';
        setRequest({
          ...request, 
          method: method as any,
          body: formData, 
          headers: newHeaders
        });
      } else {
        setRequest({
          ...request, 
          method: method as any,
          body: ''
        });
      }
    }
    // GET, DELETE일 때는 body를 비움
    else {
      setRequest({
        ...request, 
        method: method as any,
        body: ''
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
    setLoading(true);
    const startTime = Date.now();
    
    try {
      const fullUrl = request.url;
      
      const axiosConfig: any = {
        method: request.method.toLowerCase(),
        url: fullUrl,
        params: request.params,
        headers: request.headers,
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

      setResponse({
        status: result.status,
        statusText: result.statusText,
        headers: result.headers as any,
        data: result.data,
        time: endTime - startTime,
        size: JSON.stringify(result.data).length + ' bytes'
      });
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
    }
    
    setLoading(false);
  };

  const addParam = () => {
    setParamsList([...paramsList, { key: '', value: '', description: '', required: false, id: Date.now().toString() }]);
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
    
    // 업데이트된 paramsList에서 현재 파라미터 정보 가져오기
    const updatedParam = updatedParamsList.find(p => p.id === id);
    const oldParam = paramsList.find(p => p.id === id);
    
    // Update request params
    const updatedParams = { ...request.params };
    
    if (updatedParam && oldParam) {
      if (field === 'key') {
        // 기존 키 제거 (있다면)
        if (oldParam.key) delete updatedParams[oldParam.key];
        // 새 키로 값 설정 (키와 값이 모두 있다면)
        if (value && updatedParam.value) updatedParams[value as string] = updatedParam.value;
      } else {
        // value 필드 업데이트
        if (updatedParam.key) updatedParams[updatedParam.key] = value as string;
      }
    }
    
    console.log('Updated params:', updatedParams); // 디버깅용
    
    // 한 번에 모든 상태를 업데이트
    if (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH') {
      const formData = convertParamsToFormData(updatedParams);
      const newHeaders = {...request.headers};
      console.log('Generated formData:', formData); // 디버깅용
      
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
    setActiveTab('params');
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* API Name Section */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {selectedItem ? selectedItem.name : 'No API Selected'}
            </h2>
            {selectedItem && !isEditingDescription && (
              <button 
                onClick={handleEditDescription}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                Edit Description
              </button>
            )}
          </div>
          <button 
            onClick={handleSaveApi}
            disabled={!selectedItem || saving}
            className={`px-4 py-1.5
             text-white rounded flex items-center gap-2 transition-colors ${
              selectedItem && !saving 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
        
        {selectedItem ? (
          isEditingDescription ? (
            // 편집 모드
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
            // 표시 모드
            <div 
              className="bg-gray-50 p-4 rounded border min-h-16 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={handleEditDescription}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 font-medium">API Description</span>
                <span className={`px-2 py-0.5 text-xs font-medium rounded ${
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
              {selectedItem.url && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <span className="text-xs text-gray-500">Endpoint: </span>
                  <code className="text-xs text-gray-700 bg-gray-100 px-1 py-0.5 rounded">{selectedItem.url}</code>
                </div>
              )}
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
      <div className="flex-1 flex">
        {/* Request Section - Left Side */}
        <div className="flex-1 flex flex-col border-r border-gray-200">
          {/* Request Tabs - Compact */}
          <div className="bg-gray-50 border-b border-gray-200">
            <div className="flex justify-between items-center h-9">
              <div className="flex">
                {(['params', 'headers', 'body', 'curl'] as const).map((tab) => (
                  <button
                    key={tab}
                    className={`px-3 py-1.5 text-xs font-medium border-b-2 ${
                      activeTab === tab 
                        ? 'border-blue-500 text-blue-600 bg-white' 
                        : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    } transition-colors`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab === 'curl' ? 'cURL' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
              <button
                onClick={handleReset}
                className="mx-3 px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white p-3 flex-1 overflow-auto max-h-96">
            {activeTab === 'params' && (
              <div className="h-full overflow-y-auto">
                <div className="grid grid-cols-12 gap-2 mb-4 text-sm font-medium text-gray-600">
                  <div className="col-span-1 text-center">
                    <span className="text-xs cursor-help" title="Required">*</span>
                  </div>
                  <div className="col-span-3">Key</div>
                  <div className="col-span-3">Value</div>
                  <div className="col-span-4">Description</div>
                  <div className="col-span-1"></div>
                </div>
                {paramsList.map((param) => (
                  <div key={param.id} className="grid grid-cols-12 gap-2 mb-2 items-center">
                    <div className="col-span-1 flex justify-center items-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={param.required}
                          onChange={(e) => updateParam(param.id, 'required', e.target.checked)}
                        />
                        <div className="relative w-5 h-5 bg-white border-2 border-gray-300 rounded peer-checked:bg-blue-600 peer-checked:border-blue-600 peer-hover:border-blue-400 transition-colors duration-200">
                          <svg
                            className={`absolute inset-0 w-3 h-3 m-0.5 text-white transition-opacity duration-200 ${
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
                    <input
                      className="col-span-3 px-3 py-2 border border-gray-300 rounded text-sm"
                      placeholder="key"
                      value={param.key}
                      onChange={(e) => updateParam(param.id, 'key', e.target.value)}
                    />
                    <input
                      className="col-span-3 px-3 py-2 border border-gray-300 rounded text-sm"
                      placeholder="value"
                      value={param.value}
                      onChange={(e) => updateParam(param.id, 'value', e.target.value)}
                    />
                    <input
                      className="col-span-4 px-3 py-2 border border-gray-300 rounded text-sm"
                      placeholder="description"
                      value={param.description}
                      onChange={(e) => updateParam(param.id, 'description', e.target.value)}
                    />
                    <button
                      onClick={() => removeParam(param.id)}
                      className="col-span-1 text-gray-400 hover:text-red-600 text-center transition-colors duration-200"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={addParam}
                  className="text-sm text-blue-600 hover:text-blue-800 mt-2"
                >
                  + Add Parameter
                </button>
              </div>
            )}

            {activeTab === 'headers' && (
              <div className="h-full overflow-y-auto">
                <div className="grid grid-cols-12 gap-2 mb-2 text-sm font-medium text-gray-600">
                  <div className="col-span-5">Key</div>
                  <div className="col-span-6">Value</div>
                  <div className="col-span-1"></div>
                </div>
                {headersList.map((header) => (
                  <div key={header.id} className="grid grid-cols-12 gap-2 mb-2">
                    <input
                      className="col-span-5 px-3 py-2 border border-gray-300 rounded text-sm"
                      placeholder="key"
                      value={header.key}
                      onChange={(e) => updateHeader(header.id, 'key', e.target.value)}
                    />
                    <input
                      className="col-span-6 px-3 py-2 border border-gray-300 rounded text-sm"
                      placeholder="value"
                      value={header.value}
                      onChange={(e) => updateHeader(header.id, 'value', e.target.value)}
                    />
                    <button
                      onClick={() => setHeadersList(headersList.filter(h => h.id !== header.id))}
                      className="col-span-1 text-gray-400 hover:text-red-600 text-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setHeadersList([...headersList, { key: '', value: '', id: Date.now().toString() }])}
                  className="text-sm text-blue-600 hover:text-blue-800 mt-2"
                >
                  + Add Header
                </button>
              </div>
            )}

            {activeTab === 'body' && (
              <div className="h-full flex flex-col">
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
                      onChange={(value) => setRequest({...request, body: value || ''})}
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
              <div className="h-full flex flex-col">
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
          </div>
        </div>

        {/* Response Section - Right Side */}
        <div className="flex-1 flex flex-col bg-white">
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
                    <span className="text-gray-600 text-xs">Time: {response.time}ms</span>
                    <span className="text-gray-600 text-xs">Size: {response.size}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {response ? (
            <>

              <div className="bg-gray-50 border-b border-gray-200">
                <div className="flex h-9 items-center">
                  {(['body', 'headers'] as const).map((tab) => (
                    <button
                      key={tab}
                      className={`px-3 py-1.5 text-xs font-medium border-b-2 ${
                        responseTab === tab 
                          ? 'border-blue-500 text-blue-600 bg-white' 
                          : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                      } transition-colors`}
                      onClick={() => setResponseTab(tab)}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 flex-1 overflow-auto">
                {responseTab === 'body' && (
                  <div className="h-full">
                    {renderSyntaxHighlighter(response.data)}
                  </div>
                )}
                
                {responseTab === 'headers' && (
                  <div className="text-sm">
                    {Object.entries(response.headers).map(([key, value]) => (
                      <div key={key} className="mb-2">
                        <span className="font-medium text-gray-800">{key}:</span> {value}
                      </div>
                    ))}
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
    </div>
  );
};

export default MainContent;