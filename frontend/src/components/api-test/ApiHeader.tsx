import React, { useState } from 'react';
import { ApiItem } from '../../types/api';

interface ApiHeaderProps {
  selectedItem: ApiItem | null;
  apiDescription: string;
  saving: boolean;
  onSaveApi: () => void;
  onUpdateDescription: (description: string) => void;
}

const ApiHeader: React.FC<ApiHeaderProps> = ({
  selectedItem,
  apiDescription,
  saving,
  onSaveApi,
  onUpdateDescription,
}) => {
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempDescription, setTempDescription] = useState('');

  const handleEditDescription = () => {
    setTempDescription(apiDescription);
    setIsEditingDescription(true);
  };

  const handleSaveDescription = () => {
    onUpdateDescription(tempDescription);
    setIsEditingDescription(false);
  };

  const handleCancelDescription = () => {
    setTempDescription('');
    setIsEditingDescription(false);
  };

  return (
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
          <button 
            onClick={onSaveApi}
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
        <div className="bg-gray-50 p-8 rounded border text-center">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">API를 선택하세요</h3>
          <p className="text-sm text-gray-500">
            좌측 사이드바에서 API를 선택하거나 새로운 API를 생성하여 시작하세요
          </p>
        </div>
      )}
    </div>
  );
};

export default ApiHeader;