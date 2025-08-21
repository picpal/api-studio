import React from 'react';
import { ApiItem } from '../../../entities/api-item';

interface HistoryItem {
  id: string;
  historyName: string;
  savedAt: string;
}

interface HistorySelectorProps {
  selectedItem: ApiItem | null;
  historyList: HistoryItem[];
  selectedHistoryId: string;
  onHistorySelect: (historyId: string) => void;
}

export const HistorySelector: React.FC<HistorySelectorProps> = ({
  selectedItem,
  historyList,
  selectedHistoryId,
  onHistorySelect
}) => {
  if (!selectedItem) {
    return null;
  }

  return (
    <div className="px-4 py-2">
      <div className="flex justify-end">
        <div className="flex items-center gap-2">
          <select
            value={selectedHistoryId}
            onChange={(e) => onHistorySelect(e.target.value)}
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
  );
};