import React from 'react';
import Select from '../ui/Select';

interface HistoryItem {
  id: string;
  historyName: string;
  savedAt: string;
}

interface HistorySelectorProps {
  selectedHistoryId: string;
  historyList: HistoryItem[];
  onHistorySelect: (historyId: string) => void;
}

const HistorySelector: React.FC<HistorySelectorProps> = ({
  selectedHistoryId,
  historyList,
  onHistorySelect
}) => {
  const historyOptions = [
    { 
      value: '', 
      label: historyList.length === 0 ? '히스토리 없음' : '히스토리 선택' 
    },
    ...historyList.map(history => ({
      value: history.id,
      label: `${history.historyName} (${new Date(history.savedAt).toLocaleDateString()})`
    }))
  ];

  return (
    <div className="px-4 py-2">
      <div className="flex justify-end">
        <div className="flex items-center gap-2">
          <Select
            value={selectedHistoryId}
            onChange={(e) => onHistorySelect(e.target.value)}
            options={historyOptions}
            disabled={historyList.length === 0}
            className="min-w-48"
          />
        </div>
      </div>
    </div>
  );
};

export default HistorySelector;