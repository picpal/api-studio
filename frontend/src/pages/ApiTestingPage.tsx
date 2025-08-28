import React, { useState, useEffect } from 'react';
import { ApiItem } from '../types/api';
import { useApiForm } from '../features/api-testing';
import { useApiRequest } from '../hooks/useApiRequest';
import { ApiRequestPanel } from '../widgets/api-request-panel';
import { ParamsTable } from '../features/api-testing';
import { Button } from '../shared/ui';
import { VariableInputModal } from '../widgets/api-testing/VariableInputModal';

interface ApiTestingPageProps {
  selectedItem: ApiItem | null;
}

export const ApiTestingPage: React.FC<ApiTestingPageProps> = ({
  selectedItem
}) => {
  const {
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
  } = useApiForm(selectedItem);

  const {
    request: apiRequest,
    setRequest: setApiRequest,
    response,
    loading,
    handleSend: handleApiSend,
    showVariableModal,
    templateVariables,
    handleVariableConfirm,
    handleVariableModalClose
  } = useApiRequest();

  // useApiForm의 request 변경을 useApiRequest에 동기화
  useEffect(() => {
    setApiRequest(request);
  }, [request, setApiRequest]);

  const handleSend = async () => {
    // paramsList는 빈 배열로 전달 (API Testing 페이지에서는 사용하지 않음)
    const paramsList: any[] = [];
    const validationEnabled = false;
    const expectedValuesList: any[] = [];
    
    await handleApiSend(paramsList, validationEnabled, expectedValuesList);
  };

  const handleMethodChange = (method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH') => {
    setRequest(prev => ({ ...prev, method }));
  };

  if (!selectedItem) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">API를 선택하세요</h3>
          <p className="text-sm text-gray-500">
            좌측 사이드바에서 API를 선택하거나 새로운 API를 생성하여 시작하세요
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="flex-1 flex flex-col bg-white">
      {/* API Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            {selectedItem.name}
          </h2>
          <Button variant="primary">
            Save
          </Button>
        </div>
        
        <div className="bg-gray-50 p-4 rounded border">
          <p className="text-sm text-gray-700">
            {selectedItem.description || '이 API에 대한 설명을 추가하려면 클릭하세요...'}
          </p>
        </div>
      </div>

      {/* Request Panel */}
      <ApiRequestPanel
        request={request}
        loading={loading}
        onRequestChange={setRequest}
        onMethodChange={handleMethodChange}
        onSend={handleSend}
      />

      {/* Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Request Section */}
        <div className="lg:flex-[3] flex flex-col lg:border-r border-gray-200">
          {/* Tabs */}
          <div className="bg-gray-50 border-b border-gray-200">
            <div className="flex h-9 items-center">
              {(['params', 'headers', 'body', 'curl'] as const).map((tab) => (
                <button
                  key={tab}
                  className={`px-3 py-1.5 text-xs font-medium border-b-2 ${
                    activeTab === tab 
                      ? 'border-blue-500 text-blue-600 bg-white' 
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white p-0">
            {activeTab === 'params' && (
              <ParamsTable
                paramsList={paramsList}
                onUpdateParam={updateParam}
                onRemoveParam={removeParam}
                onAddParam={addParam}
              />
            )}

            {activeTab === 'headers' && (
              <div className="p-4">
                <p>Headers 탭 내용 (미구현)</p>
              </div>
            )}

            {activeTab === 'body' && (
              <div className="p-4">
                <textarea
                  className="w-full h-64 p-3 border border-gray-300 rounded"
                  value={request.body}
                  onChange={(e) => setRequest(prev => ({ ...prev, body: e.target.value }))}
                  placeholder="Request body..."
                />
              </div>
            )}

            {activeTab === 'curl' && (
              <div className="p-4">
                <pre className="bg-gray-100 p-4 rounded text-sm">
                  curl -X {request.method} "{request.url}"
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Response Section */}
        <div className="lg:flex-[2] flex flex-col bg-white">
          <div className="bg-gray-50 border-b border-gray-200 p-3">
            <h3 className="text-sm font-medium text-gray-700">Response</h3>
          </div>
          
          {response ? (
            <div className="flex-1 p-4 overflow-auto">
              <div className="mb-4">
                <div className="flex items-center gap-4 mb-2">
                  <span className={`px-2 py-1 text-xs rounded ${
                    response.status >= 200 && response.status < 300 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {response.status} {response.statusText}
                  </span>
                  <span className="text-xs text-gray-500">
                    {response.time}ms • {response.size}
                  </span>
                </div>
                
                <h4 className="text-sm font-medium text-gray-700 mb-2">Response Body</h4>
                <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-96">
                  {typeof response.data === 'object' 
                    ? JSON.stringify(response.data, null, 2)
                    : response.data}
                </pre>
                
                {response.headers && Object.keys(response.headers).length > 0 && (
                  <>
                    <h4 className="text-sm font-medium text-gray-700 mt-4 mb-2">Response Headers</h4>
                    <pre className="bg-gray-50 p-3 rounded text-xs">
                      {JSON.stringify(response.headers, null, 2)}
                    </pre>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              {loading ? (
                <div className="text-center text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-lg font-medium mb-2">요청 처리 중...</p>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <div className="text-4xl mb-4">🔍</div>
                  <p className="text-lg font-medium mb-2">요청을 시작할 수 있습니다</p>
                  <p className="text-sm w-3/4 m-auto">URL을 입력하고 Send 버튼을 눌러 API 테스트를 시작하세요</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Template Variable Input Modal */}
    <VariableInputModal
      isOpen={showVariableModal}
      onClose={handleVariableModalClose}
      onConfirm={handleVariableConfirm}
      templateVariables={templateVariables}
      title="API 테스트 변수 입력"
    />
    </>
  );
};