import { useState, useEffect } from 'react';
import { Folder, FolderPermission } from '../ui/FolderPermissions';

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
      const response = await fetch('http://localhost:8080/api/admin/folders', {
        credentials: 'include',
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
      const response = await fetch(`http://localhost:8080/api/admin/folders/${folderId}/permissions`, {
        credentials: 'include',
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
      const response = await fetch(`http://localhost:8080/api/admin/folders/${selectedFolder}/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ userId, permission }),
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
      const response = await fetch(`http://localhost:8080/api/admin/folders/${selectedFolder}/permissions/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
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