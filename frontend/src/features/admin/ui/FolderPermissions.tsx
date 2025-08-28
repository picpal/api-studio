import React from 'react';
import { User } from './UserManagement';

export interface Folder {
  id: number;
  name: string;
}

export interface FolderPermission {
  id: number;
  userId: number;
  userEmail: string;
  permission: string;
  createdAt: string;
}

interface FolderPermissionsProps {
  folders: Folder[];
  selectedFolder: number | null;
  folderPermissions: FolderPermission[];
  users: User[];
  onSelectFolder: (folderId: number) => void;
  onGrantPermission: (userId: number, permission: string) => void;
  onRevokePermission: (userId: number) => void;
}

export const FolderPermissions: React.FC<FolderPermissionsProps> = ({
  folders,
  selectedFolder,
  folderPermissions,
  users,
  onSelectFolder,
  onGrantPermission,
  onRevokePermission
}) => {
  const getPermissionColor = (permission: string) => {
    switch (permission) {
      case 'ADMIN': return 'text-purple-600 bg-purple-50';
      case 'WRITE': return 'text-blue-600 bg-blue-50';
      case 'read': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const handleGrantPermission = () => {
    const userSelect = document.getElementById('userId') as HTMLSelectElement;
    const permissionSelect = document.getElementById('permission') as HTMLSelectElement;
    
    if (!userSelect.value) {
      alert('사용자를 선택해주세요.');
      return;
    }
    
    if (!permissionSelect.value) {
      alert('권한을 선택해주세요.');
      return;
    }
    
    onGrantPermission(parseInt(userSelect.value), permissionSelect.value);
    userSelect.value = '';
    permissionSelect.value = '';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Folder List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">폴더 목록</h2>
        </div>
        <div className="p-4">
          {folders.length === 0 ? (
            <p className="text-gray-500 text-center py-4">폴더가 없습니다.</p>
          ) : (
            folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => onSelectFolder(folder.id)}
                className={`w-full text-left p-3 rounded mb-2 transition-colors ${
                  selectedFolder === folder.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {folder.name}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Folder Permissions */}
      {selectedFolder && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">폴더 권한</h2>
          </div>
          <div className="p-4">
            {/* Add Permission Form */}
            <div className="mb-5">
              <h3 className="text-sm font-medium text-gray-700 mb-3">권한 추가</h3>
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <select
                    id="userId"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">사용자 선택</option>
                    {users.filter(u => u.status === 'APPROVED').map(user => (
                      <option key={user.id} value={user.id}>
                        {user.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <select
                    id="permission"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">권한 선택</option>
                    <option value="read">읽기</option>
                    <option value="WRITE">쓰기</option>
                    <option value="ADMIN">관리</option>
                  </select>
                </div>
                <button
                  onClick={handleGrantPermission}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 whitespace-nowrap"
                >
                  권한 추가
                </button>
              </div>
            </div>

            {/* Permission List */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">현재 권한</h3>
              {folderPermissions.map((permission) => (
                <div key={permission.id} className="flex items-center justify-between p-2 border rounded mb-2">
                  <div>
                    <span className="text-sm font-medium">{permission.userEmail}</span>
                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPermissionColor(permission.permission)}`}>
                      {permission.permission}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      {new Date(permission.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => onRevokePermission(permission.userId)}
                      className="text-red-600 hover:text-red-900 text-xs"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};