import React, { useState } from 'react';

interface SaveHistoryModalProps {
  isOpen: boolean;
  onSave: (historyName: string) => void;
  onCancel: () => void;
  defaultName?: string;
}

const SaveHistoryModal: React.FC<SaveHistoryModalProps> = ({
  isOpen,
  onSave,
  onCancel,
  defaultName = ''
}) => {
  const [historyName, setHistoryName] = useState(defaultName);

  const handleSave = () => {
    if (historyName.trim()) {
      onSave(historyName.trim());
      setHistoryName('');
    }
  };

  const handleCancel = () => {
    onCancel();
    setHistoryName(defaultName);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-90vw shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          히스토리 저장
        </h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            저장할 이름을 입력하세요
          </label>
          <input
            type="text"
            value={historyName}
            onChange={(e) => setHistoryName(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="예: 거래 상태 조회 v1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
            maxLength={50}
          />
          <div className="text-xs text-gray-500 mt-1">
            {historyName.length}/50
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={!historyName.trim()}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
              historyName.trim()
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveHistoryModal;