import { useState, useCallback } from 'react';
import { ApiItem } from '../../../entities/api-item';
import { historyApi } from '../../../shared/api/api';

interface HistoryItem {
  id: string;
  historyName: string;
  savedAt: string;
}

export const useApiHistory = (selectedItem: ApiItem | null) => {
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string>('');
  const [isSavingHistory, setIsSavingHistory] = useState(false);

  const loadHistoryList = useCallback(async () => {
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
  }, [selectedItem]);

  const saveHistory = async (historyName: string): Promise<void> => {
    if (!selectedItem || isSavingHistory) return;

    setIsSavingHistory(true);
    try {
      const itemId = parseInt(selectedItem.id);
      const savedHistory = await historyApi.save(itemId, historyName);
      
      await loadHistoryList();
      
      if (savedHistory && savedHistory.id) {
        setSelectedHistoryId(savedHistory.id.toString());
      }
      
    } catch (error: any) {
      console.error('Failed to save history:', error);
      throw new Error(`히스토리 저장 중 오류가 발생했습니다: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsSavingHistory(false);
    }
  };

  const loadHistoryDetail = async (historyId: string) => {
    if (!selectedItem || !historyId) {
      setSelectedHistoryId('');
      return null;
    }

    try {
      const itemId = parseInt(selectedItem.id);
      const historyDetail = await historyApi.getDetail(itemId, parseInt(historyId));
      setSelectedHistoryId(historyId);
      return historyDetail;
    } catch (error: any) {
      console.error('Failed to load history detail:', error);
      throw new Error('히스토리를 불러오는 중 오류가 발생했습니다.');
    }
  };

  return {
    historyList,
    selectedHistoryId,
    isSavingHistory,
    loadHistoryList,
    saveHistory,
    loadHistoryDetail,
    setSelectedHistoryId
  };
};