import { useState, useEffect } from 'react';
import { ApiFolder, ApiItem } from '../types/api';
import { folderApi, itemApi, convertBackendToFrontendFolder } from '../services/api';

export const useSidebar = () => {
  const [folders, setFolders] = useState<ApiFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // 백엔드에서 데이터 로드
  const loadFolders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [backendFolders, backendItems] = await Promise.all([
        folderApi.getAll(),
        itemApi.getAll()
      ]);

      const convertedFolders = backendFolders.map(folder => 
        convertBackendToFrontendFolder(folder, backendItems)
      );

      setFolders(convertedFolders);
    } catch (error) {
      console.error('폴더 로드 중 오류:', error);
      setError('데이터를 로드하는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 초기 로드
  useEffect(() => {
    loadFolders();
  }, []);

  // 검색 필터링된 폴더들
  const filteredFolders = folders.map(folder => {
    if (!searchTerm) return folder;
    
    const matchingItems = folder.items.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.method.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const folderMatches = folder.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return {
      ...folder,
      items: folderMatches ? folder.items : matchingItems,
      isExpanded: searchTerm ? true : folder.isExpanded
    };
  }).filter(folder => {
    if (!searchTerm) return true;
    return folder.name.toLowerCase().includes(searchTerm.toLowerCase()) || folder.items.length > 0;
  });

  // 폴더 토글
  const toggleFolder = async (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    const newExpanded = !folder.isExpanded;
    
    setFolders(prev => prev.map(f => 
      f.id === folderId 
        ? { ...f, isExpanded: newExpanded }
        : f
    ));

    try {
      await folderApi.update(parseInt(folderId), { isExpanded: newExpanded });
    } catch (error) {
      console.error('폴더 상태 업데이트 중 오류:', error);
      setFolders(prev => prev.map(f => 
        f.id === folderId 
          ? { ...f, isExpanded: !newExpanded }
          : f
      ));
      setError('폴더 상태를 저장하는 중 오류가 발생했습니다.');
    }
  };

  // 폴더 생성
  const createFolder = async (name: string) => {
    try {
      const backendFolder = await folderApi.create({
        name: name.trim(),
        isExpanded: true
      });
      
      const newFolder = convertBackendToFrontendFolder(backendFolder, []);
      setFolders([...folders, newFolder]);
      setSelectedFolderId(newFolder.id);
      setSelectedItemId(null);
      
      return newFolder;
    } catch (error) {
      console.error('폴더 생성 중 오류:', error);
      setError('폴더를 생성하는 중 오류가 발생했습니다.');
      throw error;
    }
  };

  // 폴더 이름 변경
  const renameFolder = async (folderId: string, newName: string) => {
    try {
      await folderApi.update(parseInt(folderId), { 
        name: newName.trim() 
      });
      
      setFolders(prev => prev.map(folder => 
        folder.id === folderId 
          ? { ...folder, name: newName.trim() }
          : folder
      ));
      
      setError(null);
    } catch (error) {
      console.error('폴더 이름 변경 중 오류:', error);
      setError('폴더 이름을 변경하는 중 오류가 발생했습니다.');
      throw error;
    }
  };

  // 폴더 삭제
  const deleteFolder = async (folderId: string) => {
    try {
      await folderApi.delete(parseInt(folderId));
      
      setFolders(folders.filter(f => f.id !== folderId));
      if (selectedFolderId === folderId) {
        setSelectedFolderId(null);
        setSelectedItemId(null);
      }
    } catch (error) {
      console.error('폴더 삭제 중 오류:', error);
      setError('폴더를 삭제하는 중 오류가 발생했습니다.');
    }
  };

  // 아이템 생성
  const createItem = async (folderId: string) => {
    try {
      const backendItem = await itemApi.create({
        name: 'New Request',
        method: 'GET',
        url: '/api/endpoint',
        description: '',
        folderId: parseInt(folderId)
      });

      const newItem = {
        id: backendItem.id?.toString() || '',
        name: backendItem.name,
        method: backendItem.method,
        url: backendItem.url,
        description: backendItem.description || '',
        folder: folderId
      };

      setFolders(prev => prev.map(folder => 
        folder.id === folderId 
          ? { ...folder, items: [...folder.items, newItem], isExpanded: true }
          : folder
      ));

      setSelectedItemId(newItem.id);
      setSelectedFolderId(folderId);
      
      return newItem;
    } catch (error) {
      console.error('아이템 생성 중 오류:', error);
      setError('새로운 아이템을 생성하는 중 오류가 발생했습니다.');
      throw error;
    }
  };

  // 아이템 이름 변경
  const renameItem = async (itemId: string, newName: string) => {
    try {
      await itemApi.update(parseInt(itemId), { 
        name: newName.trim() 
      });
      
      setFolders(prev => prev.map(folder => ({
        ...folder,
        items: folder.items.map(item => 
          item.id === itemId 
            ? { ...item, name: newName.trim() }
            : item
        )
      })));
      
      setError(null);
    } catch (error) {
      console.error('아이템 이름 변경 중 오류:', error);
      setError('아이템 이름을 변경하는 중 오류가 발생했습니다.');
      throw error;
    }
  };

  // 아이템 삭제
  const deleteItem = async (folderId: string, itemId: string) => {
    try {
      await itemApi.delete(parseInt(itemId));
      
      setFolders(prev => prev.map(folder => 
        folder.id === folderId 
          ? { ...folder, items: folder.items.filter(item => item.id !== itemId) }
          : folder
      ));
      
      if (selectedItemId === itemId) {
        setSelectedItemId(null);
      }
    } catch (error) {
      console.error('아이템 삭제 중 오류:', error);
      setError('아이템을 삭제하는 중 오류가 발생했습니다.');
    }
  };

  // 아이템을 다른 폴더로 이동
  const moveItemToFolder = async (itemId: string, sourceFolderId: string, targetFolderId: string) => {
    const draggedItem = folders.find(f => f.id === sourceFolderId)?.items.find(i => i.id === itemId);
    
    if (!draggedItem) {
      return;
    }

    // UI 먼저 업데이트 (빠른 반응성)
    setFolders(prev => prev.map(folder => {
      if (folder.id === sourceFolderId) {
        return { ...folder, items: folder.items.filter(item => item.id !== itemId) };
      }
      if (folder.id === targetFolderId) {
        return { ...folder, items: [...folder.items, draggedItem], isExpanded: true };
      }
      return folder;
    }));

    // 백엔드에 저장
    try {
      await itemApi.update(parseInt(itemId), { 
        folderId: parseInt(targetFolderId)
      });
    } catch (error) {
      console.error('아이템 폴더 변경 중 오류:', error);
      // 실패 시 원래 상태로 되돌림
      setFolders(prev => prev.map(folder => {
        if (folder.id === targetFolderId) {
          return { ...folder, items: folder.items.filter(item => item.id !== itemId) };
        }
        if (folder.id === sourceFolderId) {
          return { ...folder, items: [...folder.items, draggedItem] };
        }
        return folder;
      }));
      setError('아이템을 이동하는 중 오류가 발생했습니다.');
    }
  };

  // 같은 폴더 내에서 아이템 순서 변경
  const reorderItemsInFolder = async (folderId: string, activeIndex: number, overIndex: number, reorderedItems: any[]) => {
    // UI 먼저 업데이트
    setFolders(prev => prev.map(folder => {
      if (folder.id === folderId) {
        return { ...folder, items: reorderedItems };
      }
      return folder;
    }));

    // 백엔드에는 순서 저장 로직이 없으므로 UI만 업데이트
    // 필요시 나중에 백엔드에 순서 필드를 추가할 수 있음
  };

  return {
    // State
    folders,
    filteredFolders,
    loading,
    error,
    selectedFolderId,
    selectedItemId,
    searchTerm,
    
    // Setters
    setFolders,
    setError,
    setSelectedFolderId,
    setSelectedItemId,
    setSearchTerm,
    
    // Actions
    loadFolders,
    toggleFolder,
    createFolder,
    renameFolder,
    deleteFolder,
    createItem,
    renameItem,
    deleteItem,
    moveItemToFolder,
    reorderItemsInFolder,
  };
};