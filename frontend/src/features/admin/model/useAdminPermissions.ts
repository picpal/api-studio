import { useState, useEffect } from 'react';
import { Folder, FolderPermission } from '../ui/FolderPermissions';
import { createApiUrl, createFetchOptions } from '../../../config/api';

export const useAdminPermissions = () => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null);
  const [folderPermissions, setFolderPermissions] = useState<FolderPermission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFolders();
  }, []);

  useEffect(() => {
    if (selectedFolder) {
      loadFolderPermissions(selectedFolder);
    }
  }, [selectedFolder]);

  const loadFolders = async () => {
    try {
      const response = await fetch(createApiUrl('/admin/folders'), {
        ...createFetchOptions({
          credentials: 'include'
        })
      });
      if (response.ok) {
        const data = await response.json();
        setFolders(data);
      }
    } catch (error) {
      // Failed to load folders
    } finally {
      setLoading(false);
    }
  };

  const loadFolderPermissions = async (folderId: number) => {
    try {
      const response = await fetch(createApiUrl(`/admin/folders/${folderId}/permissions`), {
        ...createFetchOptions({
          credentials: 'include'
        })
      });
      if (response.ok) {
        const data = await response.json();
        setFolderPermissions(data);
      }
    } catch (error) {
      // Failed to load folder permissions
    }
  };

  const grantFolderPermission = async (userId: number, permission: string) => {
    if (!selectedFolder) return;
    
    try {
      const response = await fetch(createApiUrl(`/admin/folders/${selectedFolder}/permissions`), {
        ...createFetchOptions({
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify({ userId, permission })
        })
      });
      
      if (response.ok) {
        loadFolderPermissions(selectedFolder);
        alert('폴더 권한이 설정되었습니다.');
      } else {
        const error = await response.json();
        alert(error.error || '오류가 발생했습니다.');
      }
    } catch (error) {
      alert('서버 오류가 발생했습니다.');
    }
  };

  const revokeFolderPermission = async (userId: number) => {
    if (!selectedFolder) return;
    
    try {
      const response = await fetch(createApiUrl(`/admin/folders/${selectedFolder}/permissions/${userId}`), {
        ...createFetchOptions({
          method: 'DELETE',
          credentials: 'include'
        })
      });
      
      if (response.ok) {
        loadFolderPermissions(selectedFolder);
        alert('폴더 권한이 삭제되었습니다.');
      } else {
        const error = await response.json();
        alert(error.error || '오류가 발생했습니다.');
      }
    } catch (error) {
      alert('서버 오류가 발생했습니다.');
    }
  };

  const handleSelectFolder = (folderId: number) => {
    setSelectedFolder(folderId);
  };

  return {
    folders,
    selectedFolder,
    folderPermissions,
    loading,
    handleSelectFolder,
    grantFolderPermission,
    revokeFolderPermission
  };
};