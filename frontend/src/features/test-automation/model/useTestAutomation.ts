import { useState, useEffect } from 'react';
import { ApiItem } from '../../../types/api';
import { API_CONFIG } from '../../../config/api';
import { testHistoryApi } from '../../../services/api';
import { TestBatchResult } from '../ui/TestHistory';

interface Folder {
  id: number;
  name: string;
}

export const useTestAutomation = () => {
  const [selectedApis, setSelectedApis] = useState<Set<string>>(new Set());
  const [batchHistory, setBatchHistory] = useState<TestBatchResult[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<TestBatchResult | null>(null);
  
  // 모바일에서는 API 섹션을 기본적으로 펼친 상태로 시작
  const [apiSectionCollapsed, setApiSectionCollapsed] = useState(() => {
    // 서버사이드 렌더링 시 window 객체가 없을 수 있으므로 체크
    if (typeof window === 'undefined') return false;
    // 데스크탑에서는 기본적으로 펼침, 모바일에서도 펼침으로 시작
    return false;
  });

  // 폴더와 API 목록
  const [folders, setFolders] = useState<Folder[]>([]);
  const [apiList, setApiList] = useState<ApiItem[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null);

  useEffect(() => {
    loadFoldersAndApis();
    loadTestHistory();
  }, []);

  // 테스트 히스토리 로드
  const loadTestHistory = async () => {
    try {
      const histories = await testHistoryApi.getList();
      // 백엔드에서 받은 히스토리를 프론트엔드 형식으로 변환
      const convertedHistories = histories.map(history => ({
        id: `saved-${history.id}`,
        totalTests: history.totalTests,
        successCount: history.successCount,
        failureCount: history.failureCount,
        totalTime: history.totalTime,
        executions: JSON.parse(history.executionResults || '[]'),
        createdAt: new Date(history.createdAt),
        savedId: history.id,
        name: history.name,
        createdBy: history.createdBy
      }));
      setBatchHistory(convertedHistories);
    } catch (error: any) {
      // 인증 관련 에러는 조용히 처리 (로그인하지 않은 상태일 수 있음)
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        console.warn('Authentication required to load test history. User needs to login first.');
        setBatchHistory([]); // 빈 배열로 설정
      } else {
        console.error('Failed to load test history:', error);
        setBatchHistory([]); // 빈 배열로 설정
      }
    }
  };

  const loadFoldersAndApis = async () => {
    try {
      // 실제 API 호출
      const [foldersResponse, apisResponse] = await Promise.all([
        fetch(`${API_CONFIG.API_URL}/folders`, { credentials: 'include' }),
        fetch(`${API_CONFIG.API_URL}/items`, { credentials: 'include' })
      ]);

      if (foldersResponse.ok && apisResponse.ok) {
        const foldersData = await foldersResponse.json();
        const apisData = await apisResponse.json();
        
        setFolders(foldersData);
        setApiList(apisData);
      }
    } catch (error) {
      console.error('Failed to load folders and APIs:', error);
    }
  };

  const handleApiSelection = (apiId: string, selected: boolean) => {
    const newSelection = new Set(selectedApis);
    if (selected) {
      newSelection.add(apiId);
    } else {
      newSelection.delete(apiId);
    }
    setSelectedApis(newSelection);
  };

  const handleSelectAll = () => {
    const currentList = selectedFolder 
      ? apiList.filter(api => (api as any).folderId === selectedFolder)
      : apiList;
      
    const currentIds = new Set(currentList.map(api => api.id));
    const isAllSelected = currentIds.size > 0 && [...currentIds].every(id => selectedApis.has(id));
    
    if (isAllSelected) {
      // 현재 목록의 모든 항목을 선택 해제
      const newSelection = new Set(selectedApis);
      currentIds.forEach(id => newSelection.delete(id));
      setSelectedApis(newSelection);
    } else {
      // 현재 목록의 모든 항목을 선택
      const newSelection = new Set(selectedApis);
      currentIds.forEach(id => newSelection.add(id));
      setSelectedApis(newSelection);
    }
  };

  const handleFolderSelect = (folderId: number | null) => {
    setSelectedFolder(folderId);
    setSelectedApis(new Set()); // 폴더 변경 시 선택된 API 목록 초기화
  };

  const handleToggleCollapse = () => {
    setApiSectionCollapsed(!apiSectionCollapsed);
  };

  // 히스토리 선택 핸들러
  const handleSelectHistory = async (batch: TestBatchResult) => {
    setSelectedBatch(batch);
    
    // 저장된 히스토리인 경우 백엔드에서 상세 데이터 조회
    if (batch.savedId) {
      try {
        const historyDetail = await testHistoryApi.getDetail(batch.savedId);
        const executions = JSON.parse(historyDetail.executionResults || '[]');
        
        console.log('Loaded history detail:', historyDetail);
        return executions;
      } catch (error) {
        console.error('Failed to load history detail:', error);
        // 실패 시 메모리에 있는 데이터 사용
        return batch.executions || [];
      }
    } else {
      // 메모리에만 있는 히스토리 (아직 저장되지 않은)
      return batch.executions || [];
    }
  };

  const addBatchResult = (batchResult: TestBatchResult) => {
    setBatchHistory([batchResult, ...batchHistory]);
    setSelectedBatch(batchResult);
  };

  return {
    // State
    selectedApis,
    batchHistory,
    selectedBatch,
    apiSectionCollapsed,
    folders,
    apiList,
    selectedFolder,

    // Handlers
    handleApiSelection,
    handleSelectAll,
    handleFolderSelect,
    handleToggleCollapse,
    handleSelectHistory,
    addBatchResult,
    loadTestHistory
  };
};