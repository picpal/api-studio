import React, { useState, useEffect } from 'react';
import { ApiItem } from '../entities/api-item';
import { useApiForm } from '../features/api-testing';
import { ApiRequestPanel } from '../widgets/api-request-panel';
import { ParamsTable } from '../features/api-testing';
import { Button } from '../shared/ui';

interface ApiTestingPageProps {
  selectedItem: ApiItem | null;
  onUpdateSelectedItem: (item: Partial<ApiItem>) => void;
}

export const ApiTestingPage: React.FC<ApiTestingPageProps> = ({
  selectedItem,
  onUpdateSelectedItem
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

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  const handleSend = async () => {
    setLoading(true);
    try {
      // API 호출 로직
      console.log('Sending request:', request);
      // 실제 API 호출은 여기에 구현
    } catch (error) {
      console.error('API request failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMethodChange = (method: string) => {
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
          
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-4">🔍</div>
              <p className="text-lg font-medium mb-2">요청을 시작할 수 있습니다</p>
              <p className="text-sm">URL을 입력하고 Send 버튼을 눌러 API 테스트를 시작하세요</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};