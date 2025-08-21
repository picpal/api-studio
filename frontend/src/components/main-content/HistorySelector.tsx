import React from 'react';
import Select from '../ui/Select';
import { ApiItemHistory } from '../../types/api';

interface HistorySelectorProps {
  selectedHistoryId: string;
  handleHistorySelect: (historyId: string) => void;
  historyList: ApiItemHistory[];
  selectedItem: any;
}

const HistorySelector: React.FC<HistorySelectorProps> = ({ selectedHistoryId, handleHistorySelect, historyList, selectedItem }) => {
  if (!selectedItem) {
    return null;
  }
  
  return (
    <div className="px-4 py-2">
      <div className="flex justify-end">
        <div className="flex items-center gap-2">
          <Select
            value={selectedHistoryId}
            onChange={(e) => handleHistorySelect(e.target.value)}
            disabled={historyList.length === 0}
            className="min-w-48"
            options={[
              { 
                value: '', 
                label: historyList.length === 0 ? '히스토리 없음' : '히스토리 선택' 
              },
              ...historyList.map((history) => ({
                value: history.id,
                label: `${history.historyName} (${new Date(history.savedAt).toLocaleDateString()})`
              }))
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default HistorySelector;
