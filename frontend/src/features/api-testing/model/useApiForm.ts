import { useState, useEffect } from 'react';
import { ApiRequest, ApiItem } from '../../../types/api';

interface ParamItem {
  key: string;
  value: string;
  description: string;
  required: boolean;
  id: string;
}

interface HeaderItem {
  key: string;
  value: string;
  id: string;
}

export const useApiForm = (selectedItem: ApiItem | null) => {
  const [request, setRequest] = useState<ApiRequest>({
    method: 'GET',
    url: '',
    params: {},
    headers: {},
    body: ''
  });

  const [paramsList, setParamsList] = useState<ParamItem[]>([
    { key: '', value: '', description: '', required: false, id: '1' }
  ]);

  const [headersList, setHeadersList] = useState<HeaderItem[]>([
    { key: '', value: '', id: '1' }
  ]);

  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body' | 'curl' | 'validation'>('params');

  // selectedItem이 변경될 때 폼 데이터 로드
  useEffect(() => {
    if (!selectedItem) return;

    // 저장된 데이터 파싱
    let savedParams = {};
    let savedHeaders = {};
    let savedBody = '';

    try {
      if (selectedItem.requestParams) {
        if (typeof selectedItem.requestParams === 'string') {
          savedParams = JSON.parse(selectedItem.requestParams);
        } else {
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
        } else {
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
    setRequest({
      method: selectedItem.method || 'GET',
      url: selectedItem.url || '',
      params: savedParams,
      headers: savedHeaders,
      body: savedBody
    });

    // 파라미터 리스트 로드
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
        setParamsList([...paramsWithIds, { key: '', value: '', description: '', required: false, id: (Date.now() + paramsWithIds.length + 1).toString() }]);
      } else {
        setParamsList([{ key: '', value: '', description: '', required: false, id: '1' }]);
      }
    } catch (error) {
      setParamsList([{ key: '', value: '', description: '', required: false, id: '1' }]);
    }

    // 헤더 리스트 로드
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

    setActiveTab('params');
  }, [selectedItem]);

  // 파라미터 관리 함수들
  const addParam = () => {
    const newParamId = Date.now().toString();
    setParamsList([...paramsList, { key: '', value: '', description: '', required: false, id: newParamId }]);
  };

  const removeParam = (id: string) => {
    const updatedParamsList = paramsList.filter(p => p.id !== id);
    setParamsList(updatedParamsList);
    
    const paramToRemove = paramsList.find(p => p.id === id);
    if (paramToRemove && paramToRemove.key) {
      const updatedParams = { ...request.params };
      delete updatedParams[paramToRemove.key];
      setRequest(prev => ({ ...prev, params: updatedParams }));
    }
  };

  const updateParam = (id: string, field: keyof ParamItem, value: string | boolean) => {
    const updatedParamsList = paramsList.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    );
    setParamsList(updatedParamsList);
    
    if (field === 'description' || field === 'required') return;
    
    const updatedParam = updatedParamsList.find(p => p.id === id);
    const oldParam = paramsList.find(p => p.id === id);
    
    const updatedParams = { ...request.params };
    
    if (updatedParam && oldParam) {
      if (field === 'key') {
        if (oldParam.key) delete updatedParams[oldParam.key];
        if (value && updatedParam.value) updatedParams[value as string] = updatedParam.value;
      } else if (field === 'value') {
        if (updatedParam.key) updatedParams[updatedParam.key] = value as string;
      }
    }
    
    setRequest(prev => ({ ...prev, params: updatedParams }));
  };

  // 헤더 관리 함수들
  const addHeader = () => {
    setHeadersList([...headersList, { key: '', value: '', id: Date.now().toString() }]);
  };

  const removeHeader = (id: string) => {
    setHeadersList(headersList.filter(h => h.id !== id));
  };

  const updateHeader = (id: string, field: 'key' | 'value', value: string) => {
    setHeadersList(headersList.map(h => 
      h.id === id ? { ...h, [field]: value } : h
    ));
    
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
    setRequest(prev => ({ ...prev, headers: updatedHeaders }));
  };

  const resetForm = () => {
    setRequest({
      method: 'GET',
      url: '',
      params: {},
      headers: {},
      body: ''
    });
    setParamsList([{ key: '', value: '', description: '', required: false, id: '1' }]);
    setHeadersList([{ key: '', value: '', id: '1' }]);
    setActiveTab('params');
  };

  return {
    request,
    setRequest,
    paramsList,
    headersList,
    activeTab,
    setActiveTab,
    addParam,
    removeParam,
    updateParam,
    addHeader,
    removeHeader,
    updateHeader,
    resetForm
  };
};