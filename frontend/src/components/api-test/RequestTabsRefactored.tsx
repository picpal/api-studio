import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import ParamsTable, { ParamItem } from './ParamsTable';
import HeadersTable, { HeaderItem } from './HeadersTable';
import ValidationTab, { ExpectedValue } from './ValidationTab';
import BodyEditor from './BodyEditor';
import CurlViewer from './CurlViewer';
import TabNavigation from '../ui/TabNavigation';
import Toast from '../ui/Toast';
import Button from '../ui/Button';
import { ApiRequest } from '../../types/api';

interface RequestTabsRefactoredProps {
  request: ApiRequest;
  paramsList: ParamItem[];
  headersList: HeaderItem[];
  validationEnabled: boolean;
  expectedValuesList: ExpectedValue[];
  onRequestChange: (request: ApiRequest) => void;
  onUpdateParam: (id: string, field: 'key' | 'value' | 'description' | 'required', value: string | boolean) => void;
  onRemoveParam: (id: string) => void;
  onAddParam: () => void;
  onUpdateHeader: (id: string, field: 'key' | 'value', value: string) => void;
  onRemoveHeader: (id: string) => void;
  onAddHeader: () => void;
  onToggleValidation: (enabled: boolean) => void;
  onUpdateExpectedValue: (index: number, field: 'key' | 'value', value: string) => void;
  onRemoveExpectedValue: (index: number) => void;
  onAddExpectedValue: () => void;
  onReset: () => void;
  generateCurl: () => string;
}

const RequestTabsRefactored: React.FC<RequestTabsRefactoredProps> = ({
  request,
  paramsList,
  headersList,
  validationEnabled,
  expectedValuesList,
  onRequestChange,
  onUpdateParam,
  onRemoveParam,
  onAddParam,
  onUpdateHeader,
  onRemoveHeader,
  onAddHeader,
  onToggleValidation,
  onUpdateExpectedValue,
  onRemoveExpectedValue,
  onAddExpectedValue,
  onReset,
  generateCurl,
}) => {
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body' | 'curl' | 'validation'>('params');
  const [showCopyToast, setShowCopyToast] = useState(false);

  const tabs = [
    { id: 'params', label: 'Params', icon: '📝' },
    { id: 'headers', label: 'Headers', icon: '🏷️' },
    { id: 'body', label: 'Body', icon: '📄' },
    { id: 'curl', label: 'cURL', icon: '🔧' },
    { id: 'validation', label: 'Response Validation', icon: '✅' },
  ];

  const handleBodyChange = (value: string) => {
    onRequestChange({ ...request, body: value });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'params':
        return (
          <ParamsTable
            paramsList={paramsList}
            onUpdateParam={onUpdateParam}
            onRemoveParam={onRemoveParam}
            onAddParam={onAddParam}
          />
        );

      case 'headers':
        return (
          <HeadersTable
            headersList={headersList}
            onUpdateHeader={onUpdateHeader}
            onRemoveHeader={onRemoveHeader}
            onAddHeader={onAddHeader}
          />
        );

      case 'body':
        return (
          <BodyEditor
            value={request.body}
            onChange={handleBodyChange}
            placeholder="요청 본문을 입력하세요..."
          />
        );

      case 'curl':
        return (
          <CurlViewer
            curlCommand={generateCurl()}
            onReset={onReset}
          />
        );

      case 'validation':
        return (
          <ValidationTab
            validationEnabled={validationEnabled}
            expectedValuesList={expectedValuesList}
            onToggleValidation={onToggleValidation}
            onUpdateExpectedValue={onUpdateExpectedValue}
            onRemoveExpectedValue={onRemoveExpectedValue}
            onAddExpectedValue={onAddExpectedValue}
          />
        );

      default:
        return null;
    }
  };

  const RequestHeader = () => (
    <div className="bg-gray-50 border-b border-gray-200">
      <div className="flex justify-between items-center h-9">
        <h3 className="text-xs px-3 font-medium text-gray-700">Request</h3>
        <div className="mx-3">
          <Button
            variant="ghost"
            size="xs"
            onClick={onReset}
            className="text-red-600 hover:text-red-800 hover:bg-red-50"
          >
            Reset
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="lg:flex-[3] flex flex-col lg:border-r border-b lg:border-b-0 border-gray-200">
      <RequestHeader />
      
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as any)}
      />

      <div className={`flex-1 bg-white ${
        (activeTab === 'params' || activeTab === 'headers') ? 'p-0' : ''
      }`}>
        {renderTabContent()}
      </div>

      <Toast
        type="success"
        message="cURL command copied to clipboard!"
        isVisible={showCopyToast}
        onClose={() => setShowCopyToast(false)}
        duration={3000}
      />
    </div>
  );
};

export default RequestTabsRefactored;