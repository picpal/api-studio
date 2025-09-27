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
  toggleFolder: (id: number) => void;
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

  // Load folders from API
  const loadFolders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await uiTestFolderApi.getStructure();
      setFolders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load folders');
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
      setError(err instanceof Error ? err.message : 'Failed to load scripts');
    }
  }, [selectedFolderId]);

  // Create folder
  const createFolder = useCallback(async (name: string, description?: string, parentId?: number) => {
    try {
      setError(null);
      await uiTestFolderApi.create({ name, description, parentId });
      await loadFolders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create folder');
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
      setError(err instanceof Error ? err.message : 'Failed to create script');
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
      setError(err instanceof Error ? err.message : 'Failed to update folder');
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
      setError(err instanceof Error ? err.message : 'Failed to update script');
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
      setError(err instanceof Error ? err.message : 'Failed to delete folder');
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
      setError(err instanceof Error ? err.message : 'Failed to delete script');
      throw err;
    }
  }, [selectedScriptId, loadScripts]);

  // Toggle folder expansion
  const toggleFolder = useCallback((id: number) => {
    setFolders(prev => prev.map(folder =>
      folder.id === id
        ? { ...folder, isExpanded: !folder.isExpanded }
        : folder
    ));
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

  // Load scripts when folder selection changes
  useEffect(() => {
    loadScripts();
  }, [selectedFolderId, loadScripts]);

  return {
    // State
    folders,
    scripts,
    loading,
    error,
    selectedFolderId,
    selectedScriptId,
    searchTerm,

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
    toggleFolder,
    resetSelection,
  };
};