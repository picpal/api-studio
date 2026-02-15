// UI Testing 사이드바 관련 비즈니스 로직

import { useState, useEffect, useCallback } from 'react';
import { UiTestFolder, UiTestScript } from '../../../entities/ui-testing/types';
import { uiTestFolderApi, uiTestScriptApi } from '../../../shared/api/ui-testing';

interface UseUiTestingSidebarReturn {
  // State
  folders: UiTestFolder[];
  scripts: UiTestScript[];
  loading: boolean;
  error: string | null;
  selectedFolderId: number | null;
  selectedScriptId: number | null;
  searchTerm: string;
  expandedFolders: Set<number>;

  // Actions
  setSearchTerm: (term: string) => void;
  setSelectedFolderId: (id: number | null) => void;
  setSelectedScriptId: (id: number | null) => void;
  loadFolders: () => Promise<void>;
  loadScripts: (folderId?: number | null) => Promise<void>;
  createFolder: (name: string, description?: string, parentId?: number) => Promise<void>;
  createScript: (data: any) => Promise<void>;
  updateFolder: (id: number, name: string, description?: string) => Promise<void>;
  updateScript: (id: number, data: any) => Promise<void>;
  deleteFolder: (id: number) => Promise<void>;
  deleteScript: (id: number) => Promise<void>;
  moveScriptToFolder: (scriptId: number, targetFolderId: number) => Promise<void>;
  toggleFolder: (id: number) => void;
  expandAll: () => void;
  collapseAll: () => void;
  resetSelection: () => void;
}

export const useUiTestingSidebar = (): UseUiTestingSidebarReturn => {
  const [folders, setFolders] = useState<UiTestFolder[]>([]);
  const [scripts, setScripts] = useState<UiTestScript[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [selectedScriptId, setSelectedScriptId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());

  // Load folders from API
  const loadFolders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await uiTestFolderApi.getStructure();
      setFolders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '폴더 목록을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load scripts from API
  const loadScripts = useCallback(async (folderId: number | null = selectedFolderId) => {
    try {
      setError(null);
      let data: UiTestScript[];

      if (folderId === null) {
        data = await uiTestScriptApi.getAll();
      } else {
        data = await uiTestFolderApi.getScripts(folderId);
      }

      setScripts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '스크립트 목록을 불러오는데 실패했습니다');
    }
  }, [selectedFolderId]);

  // Create folder
  const createFolder = useCallback(async (name: string, description?: string, parentId?: number) => {
    try {
      setError(null);
      await uiTestFolderApi.create({ name, description, parentId });
      await loadFolders();
    } catch (err) {
      setError(err instanceof Error ? err.message : '폴더 생성에 실패했습니다');
      throw err;
    }
  }, [loadFolders]);

  // Create script
  const createScript = useCallback(async (data: any) => {
    try {
      setError(null);
      await uiTestScriptApi.create(data);
      await loadScripts();
    } catch (err) {
      setError(err instanceof Error ? err.message : '스크립트 생성에 실패했습니다');
      throw err;
    }
  }, [loadScripts]);

  // Update folder
  const updateFolder = useCallback(async (id: number, name: string, description?: string) => {
    try {
      setError(null);
      await uiTestFolderApi.update(id, { name, description });
      await loadFolders();
    } catch (err) {
      setError(err instanceof Error ? err.message : '폴더 수정에 실패했습니다');
      throw err;
    }
  }, [loadFolders]);

  // Update script
  const updateScript = useCallback(async (id: number, data: any) => {
    try {
      setError(null);
      await uiTestScriptApi.update(id, data);
      await loadScripts();
    } catch (err) {
      setError(err instanceof Error ? err.message : '스크립트 수정에 실패했습니다');
      throw err;
    }
  }, [loadScripts]);

  // Delete folder
  const deleteFolder = useCallback(async (id: number) => {
    try {
      setError(null);
      await uiTestFolderApi.delete(id);
      if (selectedFolderId === id) {
        setSelectedFolderId(null);
      }
      await loadFolders();
      await loadScripts(null); // Reload all scripts
    } catch (err) {
      setError(err instanceof Error ? err.message : '폴더 삭제에 실패했습니다');
      throw err;
    }
  }, [selectedFolderId, loadFolders, loadScripts]);

  // Delete script
  const deleteScript = useCallback(async (id: number) => {
    try {
      setError(null);
      await uiTestScriptApi.delete(id);
      if (selectedScriptId === id) {
        setSelectedScriptId(null);
      }
      await loadScripts();
    } catch (err) {
      setError(err instanceof Error ? err.message : '스크립트 삭제에 실패했습니다');
      throw err;
    }
  }, [selectedScriptId, loadScripts]);

  // Move script to folder
  const moveScriptToFolder = useCallback(async (scriptId: number, targetFolderId: number) => {
    // 1. 현재 스크립트 찾기
    const script = scripts.find(s => s.id === scriptId);
    if (!script || script.folderId === targetFolderId) return;

    const originalFolderId = script.folderId;

    // 2. UI 먼저 업데이트 (낙관적 업데이트)
    setScripts(prev => prev.map(s =>
      s.id === scriptId ? { ...s, folderId: targetFolderId } : s
    ));

    // 3. 백엔드 API 호출
    try {
      await uiTestScriptApi.update(scriptId, { folderId: targetFolderId });
    } catch (err) {
      // 실패 시 원래 상태로 롤백
      setScripts(prev => prev.map(s =>
        s.id === scriptId ? { ...s, folderId: originalFolderId } : s
      ));
      setError('스크립트 이동에 실패했습니다');
    }
  }, [scripts]);

  // Toggle folder expansion
  const toggleFolder = useCallback((id: number) => {
    setExpandedFolders(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(id)) {
        newExpanded.delete(id);
      } else {
        newExpanded.add(id);
      }
      return newExpanded;
    });
  }, []);

  // Expand all folders
  const expandAll = useCallback(() => {
    setExpandedFolders(new Set(folders.map(f => f.id)));
  }, [folders]);

  // Collapse all folders
  const collapseAll = useCallback(() => {
    setExpandedFolders(new Set());
  }, []);

  // Reset selection
  const resetSelection = useCallback(() => {
    setSelectedFolderId(null);
    setSelectedScriptId(null);
  }, []);

  // Initial load
  useEffect(() => {
    loadFolders();
    loadScripts(null);
  }, [loadFolders]);

  return {
    // State
    folders,
    scripts,
    loading,
    error,
    selectedFolderId,
    selectedScriptId,
    searchTerm,
    expandedFolders,

    // Actions
    setSearchTerm,
    setSelectedFolderId,
    setSelectedScriptId,
    loadFolders,
    loadScripts,
    createFolder,
    createScript,
    updateFolder,
    updateScript,
    deleteFolder,
    deleteScript,
    moveScriptToFolder,
    toggleFolder,
    expandAll,
    collapseAll,
    resetSelection,
  };
};