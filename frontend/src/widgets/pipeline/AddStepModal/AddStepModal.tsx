import React, { useState } from 'react';
import { ApiItem } from '@/entities/pipeline';

interface AddStepModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStep: (stepData: { apiItemId: number; stepName: string; description: string }) => void;
  apiItems: ApiItem[];
  loading?: boolean;
}

export const AddStepModal: React.FC<AddStepModalProps> = ({
  isOpen,
  onClose,
  onAddStep,
  apiItems,
  loading
}) => {
  const [selectedApiItem, setSelectedApiItem] = useState<number | null>(null);
  const [stepName, setStepName] = useState('');
  const [stepDescription, setStepDescription] = useState('');
  const [apiSearchTerm, setApiSearchTerm] = useState('');

  const handleClose = () => {
    setSelectedApiItem(null);
    setStepName('');
    setStepDescription('');
    setApiSearchTerm('');
    onClose();
  };

  const handleAddStep = () => {
    if (!selectedApiItem || !stepName.trim()) return;

    onAddStep({
      apiItemId: selectedApiItem,
      stepName: stepName.trim(),
      description: stepDescription.trim()
    });

    handleClose();
  };

  const filteredApiItems = apiItems.filter(item => 
    item.name.toLowerCase().includes(apiSearchTerm.toLowerCase()) ||
    item.method.toLowerCase().includes(apiSearchTerm.toLowerCase()) ||
    item.url.toLowerCase().includes(apiSearchTerm.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(apiSearchTerm.toLowerCase()))
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl m-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">새 단계 추가</h2>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              단계 이름 *
            </label>
            <input
              type="text"
              value={stepName}
              onChange={(e) => setStepName(e.target.value)}
              placeholder="예: 사용자 로그인, 프로필 조회 등"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              설명 (선택)
            </label>
            <textarea
              value={stepDescription}
              onChange={(e) => setStepDescription(e.target.value)}
              placeholder="단계에 대한 설명을 입력하세요"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API 아이템 선택 *
            </label>
            
            <div className="relative mb-3">
              <input
                type="text"
                placeholder="API 아이템 검색..."
                value={apiSearchTerm}
                onChange={(e) => setApiSearchTerm(e.target.value)}
                className="w-full px-3 py-2 pl-9 pr-3 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              <svg 
                className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {apiSearchTerm && (
                <button
                  onClick={() => setApiSearchTerm('')}
                  className="absolute right-2.5 top-2.5 h-4 w-4 text-gray-400 hover:text-gray-600"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            <div className="border border-gray-300 rounded-md max-h-60 overflow-y-auto">
              {filteredApiItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedApiItem(item.id)}
                  className={`p-3 border-b border-gray-200 last:border-b-0 cursor-pointer hover:bg-gray-50 ${
                    selectedApiItem === item.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      checked={selectedApiItem === item.id}
                      onChange={() => setSelectedApiItem(item.id)}
                      className="text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {item.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {item.method} {item.url}
                      </div>
                      {item.description && (
                        <div className="text-sm text-gray-500 mt-1">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {apiItems.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  사용 가능한 API 아이템이 없습니다.
                </div>
              ) : filteredApiItems.length === 0 && apiSearchTerm && (
                <div className="p-4 text-center text-gray-500">
                  <div className="text-2xl mb-2">🔍</div>
                  <div className="text-sm">
                    "{apiSearchTerm}"에 대한 검색 결과가 없습니다.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleAddStep}
            disabled={!selectedApiItem || !stepName.trim() || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '추가 중...' : '단계 추가'}
          </button>
        </div>
      </div>
    </div>
  );
};