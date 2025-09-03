import { useState, useEffect } from 'react';
import { PipelineFolder, Pipeline } from '../../../entities/pipeline';
import { pipelineApi } from '../../../services/pipelineApi';
import { useAuth } from '../../../contexts/AuthContext';

export const usePipelineFolder = () => {
  const { isAuthenticated, isLoading: authLoading, authReady } = useAuth();
  const [folders, setFolders] = useState<PipelineFolder[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Load folders from API
  const loadFolders = async () => {
    setLoading(true);
    try {
      const foldersData = await pipelineApi.getFolders();
      setFolders(foldersData);
      // 기본적으로 모든 폴더 확장
      setExpandedFolders(new Set(foldersData.map(f => f.id)));
    } catch (error: any) {
      console.error('Failed to load folders:', error);
      // 403 에러는 인증 문제일 수 있으므로 별도 처리하지 않음 (인터셉터에서 처리됨)
      if (error.response?.status === 403) {
        setLoading(false);
        return;
      }
      setFolders([]);
    } finally {
      setLoading(false);
    }
  };

  // 인증 상태에 따른 데이터 로드/정리
  useEffect(() => {
    if (isAuthenticated && !authLoading && authReady) {
      loadFolders();
    } else if (!isAuthenticated && !authLoading) {
      // 로그아웃 시 데이터 정리
      setFolders([]);
      setExpandedFolders(new Set());
      setLoading(false);
    }
  }, [isAuthenticated, authLoading, authReady]);

  // auth-error 이벤트 리스너
  useEffect(() => {
    const handleAuthError = () => {
      setFolders([]);
      setExpandedFolders(new Set());
      setLoading(false);
    };

    window.addEventListener('auth-error', handleAuthError);

    return () => {
      window.removeEventListener('auth-error', handleAuthError);
    };
  }, []);

  const toggleFolder = (folderId: number) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const expandAll = () => {
    setExpandedFolders(new Set(folders.map(f => f.id)));
  };

  const collapseAll = () => {
    setExpandedFolders(new Set());
  };

  const createFolder = async (folderData: { name: string; description?: string }) => {
    try {
      const newFolder = await pipelineApi.createFolder(folderData);
      setFolders(prev => [...prev, newFolder]);
      // 새로 생성된 폴더를 확장
      setExpandedFolders(prev => new Set([...prev, newFolder.id]));
      return newFolder;
    } catch (error) {
      console.error('Failed to create folder:', error);
      throw error;
    }
  };

  const deleteFolder = async (folderId: number) => {
    try {
      await pipelineApi.deleteFolder(folderId);
      setFolders(prev => prev.filter(f => f.id !== folderId));
      setExpandedFolders(prev => {
        const newExpanded = new Set(prev);
        newExpanded.delete(folderId);
        return newExpanded;
      });
    } catch (error) {
      console.error('Failed to delete folder:', error);
      throw error;
    }
  };

  const updateFolder = async (folderId: number, updates: { name?: string; description?: string }) => {
    try {
      if (!updates.name) {
        throw new Error('Name is required for updating folder');
      }
      const updatedFolder = await pipelineApi.updateFolder(folderId, { name: updates.name, description: updates.description });
      setFolders(prev => 
        prev.map(folder => 
          folder.id === folderId 
            ? { ...folder, ...updatedFolder }
            : folder
        )
      );
      return updatedFolder;
    } catch (error) {
      console.error('Failed to update folder:', error);
      throw error;
    }
  };

  const createPipeline = async (pipelineData: { name: string; description?: string; folderId: number }) => {
    try {
      const newPipeline = await pipelineApi.createPipeline(pipelineData);
      
      // 폴더 목록에서 해당 폴더를 찾아 파이프라인 추가
      setFolders(prevFolders => 
        prevFolders.map(folder => 
          folder.id === pipelineData.folderId
            ? { ...folder, pipelines: [...folder.pipelines, newPipeline] }
            : folder
        )
      );
      
      return newPipeline;
    } catch (error) {
      console.error('Failed to create pipeline:', error);
      throw error;
    }
  };

  const deletePipeline = async (pipelineId: number, folderId: number) => {
    try {
      await pipelineApi.deletePipeline(pipelineId.toString());
      
      // Update the folders state to remove the pipeline
      setFolders(prevFolders => 
        prevFolders.map(folder => 
          folder.id === folderId
            ? { ...folder, pipelines: folder.pipelines.filter(p => p.id !== pipelineId) }
            : folder
        )
      );
    } catch (error) {
      console.error('Failed to delete pipeline:', error);
      throw error;
    }
  };

  // 필터링된 폴더 목록
  const filteredFolders = folders.map(folder => ({
    ...folder,
    pipelines: folder.pipelines.filter(pipeline =>
      pipeline.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pipeline.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(folder => 
    searchTerm === '' || 
    folder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    folder.pipelines.length > 0
  );

  return {
    folders,
    filteredFolders,
    expandedFolders,
    searchTerm,
    loading,
    setSearchTerm,
    toggleFolder,
    expandAll,
    collapseAll,
    createFolder,
    deleteFolder,
    updateFolder,
    createPipeline,
    deletePipeline,
    reload: loadFolders
  };
};