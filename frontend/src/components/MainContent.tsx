import React, { useState, useEffect } from 'react';
import { ApiItem, ApiItemHistory } from '../types/api';
import { itemApi, historyApi } from '../services/api';
import SaveHistoryModal from './SaveHistoryModal';
import ApiHeader from './api-test/ApiHeader';
import RequestForm from './api-test/RequestForm';
import RequestTabs from './api-test/RequestTabs';
import ResponseViewer from './api-test/ResponseViewer';
import { HistorySelector } from '../features/history-management';
import { useApiRequest } from '../hooks/useApiRequest';
import { ParamItem } from './api-test/ParamsTable';
import { HeaderItem } from './api-test/HeadersTable';
import { ExpectedValue } from './api-test/ValidationTab';
import { VariableInputModal } from '../widgets/api-testing/VariableInputModal';

interface MainContentProps {
  selectedItem: ApiItem | null;
  onResetForm: () => void;
  onUpdateSelectedItem: (updatedItem: Partial<ApiItem>) => void;
}

const MainContentRefactored: React.FC<MainContentProps> = ({
  selectedItem,
  onResetForm,
  onUpdateSelectedItem,
}) => {
  const {
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
    // 템플릿 변수 관련
    showVariableModal,
    templateVariables,
    handleVariableConfirm,
    handleVariableModalClose
  } = useApiRequest();

  // Local state
  const [paramsList, setParamsList] = useState<ParamItem[]>([
    { key: '', value: '', description: '', required: false, id: '1' }
  ]);
  const [headersList, setHeadersList] = useState<HeaderItem[]>([
    { key: '', value: '', id: '1' }
  ]);
  const [apiDescription, setApiDescription] = useState('이 API의 목적과 사용 방법에 대해 설명해주세요...');
  const [saving, setSaving] = useState(false);
  const [validationEnabled, setValidationEnabled] = useState(false);
  const [expectedValuesList, setExpectedValuesList] = useState<ExpectedValue[]>([
    { key: '', value: '', id: '1' }
  ]);

  // 히스토리 관련 상태
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string>('');
  const [isSavingHistory, setIsSavingHistory] = useState(false);

  // 선택된 아이템이 변경될 때 폼을 로드
  useEffect(() => {
    if (selectedItem) {
      loadSelectedItem(selectedItem);
      loadHistoryList();
      setSelectedHistoryId('');
    }
  }, [selectedItem]);

  const loadSelectedItem = (item: ApiItem) => {
    // 저장된 params 파싱
    let savedParams = {};
    let savedHeaders = {};
    let savedBody = '';

    try {
      if (item.requestParams) {
        if (typeof item.requestParams === 'string') {
          savedParams = JSON.parse(item.requestParams);
        } else if (typeof item.requestParams === 'object') {
          savedParams = item.requestParams;
        }
      }
    } catch (e) {
      console.warn('Failed to parse requestParams:', e);
    }

    try {
      if (item.requestHeaders) {
        if (typeof item.requestHeaders === 'string') {
          savedHeaders = JSON.parse(item.requestHeaders);
        } else if (typeof item.requestHeaders === 'object') {
          savedHeaders = item.requestHeaders;
        }
      }
    } catch (e) {
      console.warn('Failed to parse requestHeaders:', e);
    }

    if (item.requestBody) {
      savedBody = item.requestBody;
    }

    // Validation 관련 데이터 로드
    setValidationEnabled(item.validationEnabled || false);
    
    let savedExpectedValues = [];
    try {
      if (item.expectedValues) {
        if (typeof item.expectedValues === 'string') {
          savedExpectedValues = JSON.parse(item.expectedValues);
        } else if (Array.isArray(item.expectedValues)) {
          savedExpectedValues = item.expectedValues;
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
    const method = item.method || 'GET';
    setRequest({
      method: method,
      url: item.url || '',
      params: savedParams,
      headers: savedHeaders,
      body: savedBody
    });

    // API 설명 로드
    setApiDescription(item.description || '이 API의 목적과 사용 방법에 대해 설명해주세요...');

    // requestParams JSON에서 파라미터 로딩
    try {
      let parametersArray = [];
      if (item.requestParams && typeof item.requestParams === 'string') {
        parametersArray = JSON.parse(item.requestParams);
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
  };

  // Save API 기능
  const handleSaveApi = async () => {
    if (!selectedItem) {
      alert('저장할 아이템이 선택되지 않았습니다.');
      return;
    }

    setSaving(true);
    try {
      const itemId = parseInt(selectedItem.id);
      const filteredParams = paramsList.filter(p => p.key || p.value || p.description);
      const filteredExpectedValues = expectedValuesList.filter(ev => ev.key || ev.value);

      const updateData = {
        name: selectedItem.name,
        method: request.method,
        url: request.url,
        description: apiDescription,
        requestParams: JSON.stringify(filteredParams),
        requestHeaders: JSON.stringify(request.headers),
        requestBody: request.body,
        validationEnabled: validationEnabled,
        expectedValues: JSON.stringify(filteredExpectedValues),
        folderId: selectedItem.folder ? parseInt(selectedItem.folder) : undefined
      };

      await itemApi.update(itemId, updateData);

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
        folder: selectedItem.folder,
        folderName: selectedItem.folderName
      });

      setShowSaveModal(true);
    } catch (error: any) {
      console.error('Failed to save API:', error);
      alert(`API 저장 중 오류가 발생했습니다: ${error.response?.data?.message || error.message}`);
    }
    setSaving(false);
  };

  // 히스토리 저장
  const handleSaveHistory = async (historyName: string) => {
    if (!selectedItem || isSavingHistory) return;

    setIsSavingHistory(true);
    try {
      const itemId = parseInt(selectedItem.id);
      const savedHistory = await historyApi.save(itemId, historyName);

      await loadHistoryList();

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

  // Parameter management functions
  const addParam = () => {
    const newParamId = Date.now().toString();
    setParamsList([...paramsList, { key: '', value: '', description: '', required: false, id: newParamId }]);

    setTimeout(() => {
      const descInput = document.querySelector(`input[data-param-id="${newParamId}"][data-field="description"]`) as HTMLInputElement;
      const addButton = document.querySelector('[data-add-param-button]') as HTMLElement;

      if (descInput) {
        descInput.focus();
      }

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

    const paramToRemove = paramsList.find(p => p.id === id);
    if (paramToRemove && paramToRemove.key) {
      const updatedParams = { ...request.params };
      delete updatedParams[paramToRemove.key];

      if (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH') {
        const formData = convertParamsToFormData(updatedParams);
        const newHeaders = { ...request.headers };
        if (formData) {
          newHeaders['Content-Type'] = 'application/json';
          setRequest({
            ...request,
            params: updatedParams,
            body: formData,
            headers: newHeaders
          });
        } else {
          setRequest({
            ...request,
            params: updatedParams,
            body: '',
            headers: newHeaders
          });
        }
      } else {
        setRequest({ ...request, params: updatedParams });
      }
    }
  };

  const updateParam = (id: string, field: 'key' | 'value' | 'description' | 'required', value: string | boolean) => {
    const updatedParamsList = paramsList.map(p =>
      p.id === id ? { ...p, [field]: value } : p
    );
    setParamsList(updatedParamsList);

    if (field === 'description' || field === 'required') {
      return;
    }

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

    if (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH') {
      const formData = convertParamsToFormData(updatedParams);
      const newHeaders = { ...request.headers };

      if (formData) {
        newHeaders['Content-Type'] = 'application/json';
        setRequest({
          ...request,
          params: updatedParams,
          body: formData,
          headers: newHeaders
        });
      } else {
        setRequest({
          ...request,
          params: updatedParams,
          body: '',
          headers: newHeaders
        });
      }
    } else {
      setRequest({ ...request, params: updatedParams });
    }
  };

  // Header management functions
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
    setRequest({ ...request, headers: updatedHeaders });
  };

  const removeHeader = (id: string) => {
    setHeadersList(headersList.filter(h => h.id !== id));
  };

  const addHeader = () => {
    setHeadersList([...headersList, { key: '', value: '', id: Date.now().toString() }]);
  };

  // Validation management functions
  const updateExpectedValue = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...expectedValuesList];
    updated[index][field] = value;
    setExpectedValuesList(updated);
  };

  const removeExpectedValue = (index: number) => {
    if (expectedValuesList.length > 1) {
      setExpectedValuesList(expectedValuesList.filter((_, i) => i !== index));
    }
  };

  const addExpectedValue = () => {
    const newId = Math.max(...expectedValuesList.map(ev => parseInt(ev.id))) + 1;
    setExpectedValuesList([...expectedValuesList, { key: '', value: '', id: newId.toString() }]);
  };

  const handleReset = () => {
    resetRequest();
    setParamsList([{ key: '', value: '', description: '', required: false, id: '1' }]);
    setHeadersList([{ key: '', value: '', id: '1' }]);
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* History Selection Section */}
      <HistorySelector
        selectedItem={selectedItem}
        historyList={historyList}
        selectedHistoryId={selectedHistoryId}
        onHistorySelect={handleHistorySelect}
      />

      {/* API Header Section */}
      <ApiHeader
        selectedItem={selectedItem}
        apiDescription={apiDescription}
        saving={saving}
        onSaveApi={handleSaveApi}
        onUpdateDescription={setApiDescription}
      />

      {/* Request Form */}
      <RequestForm
        request={request}
        loading={loading}
        onRequestChange={setRequest}
        onMethodChange={(method) => handleMethodChange(method, paramsList, headersList, setParamsList, setHeadersList)}
        onSend={() => handleSend(paramsList, validationEnabled, expectedValuesList)}
      />

      {/* Main Content Area - Split into Request and Response */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Request Tabs */}
        <RequestTabs
          request={request}
          paramsList={paramsList}
          headersList={headersList}
          validationEnabled={validationEnabled}
          expectedValuesList={expectedValuesList}
          onRequestChange={setRequest}
          onUpdateParam={updateParam}
          onRemoveParam={removeParam}
          onAddParam={addParam}
          onUpdateHeader={updateHeader}
          onRemoveHeader={removeHeader}
          onAddHeader={addHeader}
          onToggleValidation={setValidationEnabled}
          onUpdateExpectedValue={updateExpectedValue}
          onRemoveExpectedValue={removeExpectedValue}
          onAddExpectedValue={addExpectedValue}
          onReset={handleReset}
          generateCurl={generateCurl}
        />

        {/* Response Viewer */}
        <ResponseViewer
          response={response}
          validationEnabled={validationEnabled}
          lastValidationResult={lastValidationResult}
        />
      </div>

      {/* Save History Modal */}
      <SaveHistoryModal
        isOpen={showSaveModal}
        onSave={handleSaveHistory}
        onCancel={() => setShowSaveModal(false)}
        defaultName={selectedItem?.name ? `${selectedItem.name} v${new Date().toISOString().slice(0, 10)}` : ''}
      />

      {/* Template Variable Input Modal */}
      <VariableInputModal
        isOpen={showVariableModal}
        onClose={handleVariableModalClose}
        onConfirm={handleVariableConfirm}
        templateVariables={templateVariables}
        title="API 테스트 변수 입력"
      />
    </div>
  );
};

export default MainContentRefactored;