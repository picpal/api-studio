import React, { useState, useEffect } from 'react';
import ActivityLogs from './ActivityLogs';

interface User {
  id: number;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

interface Folder {
  id: number;
  name: string;
}

interface FolderPermission {
  id: number;
  userId: number;
  userEmail: string;
  permission: string;
  createdAt: string;
}

const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null);
  const [folderPermissions, setFolderPermissions] = useState<FolderPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'permissions' | 'activities'>('users');

  useEffect(() => {
    loadUsers();
    loadFolders();
  }, []);

  useEffect(() => {
    if (selectedFolder) {
      loadFolderPermissions(selectedFolder);
    }
  }, [selectedFolder]);

  const loadUsers = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/admin/users', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadFolders = async () => {
    try {
      console.log('Loading folders...');
      const response = await fetch('http://localhost:8080/api/admin/folders', {
        credentials: 'include',
      });
      console.log('Folders response:', response.status, response.statusText);
      if (response.ok) {
        const data = await response.json();
        console.log('Folders data:', data);
        setFolders(data);
      } else {
        console.error('Failed to load folders:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to load folders:', error);
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
      console.error('Failed to load folder permissions:', error);
    }
  };

  const updateUserStatus = async (userId: number, status: string) => {
    try {
      const response = await fetch(`http://localhost:8080/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      
      if (response.ok) {
        loadUsers();
        alert('사용자 상태가 업데이트되었습니다.');
      } else {
        const error = await response.json();
        alert(error.error || '오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Failed to update user status:', error);
      alert('서버 오류가 발생했습니다.');
    }
  };

  const updateUserRole = async (userId: number, role: string) => {
    try {
      const response = await fetch(`http://localhost:8080/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ role }),
      });
      
      if (response.ok) {
        loadUsers();
        alert('사용자 역할이 업데이트되었습니다.');
      } else {
        const error = await response.json();
        alert(error.error || '오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Failed to update user role:', error);
      alert('서버 오류가 발생했습니다.');
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
      console.error('Failed to grant folder permission:', error);
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
      console.error('Failed to revoke folder permission:', error);
      alert('서버 오류가 발생했습니다.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'text-green-600 bg-green-50';
      case 'PENDING': return 'text-yellow-600 bg-yellow-50';
      case 'REJECTED': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'text-purple-600 bg-purple-50';
      case 'USER': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return '관리자';
      case 'USER': return '일반 사용자';
      default: return role;
    }
  };

  const getPermissionColor = (permission: string) => {
    switch (permission) {
      case 'ADMIN': return 'text-purple-600 bg-purple-50';
      case 'WRITE': return 'text-blue-600 bg-blue-50';
      case 'READ': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">관리자 페이지</h1>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('users')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                사용자 관리
              </button>
              <button
                onClick={() => setActiveTab('permissions')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'permissions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                폴더 권한 관리
              </button>
              <button
                onClick={() => setActiveTab('activities')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'activities'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                사용자 활동 로그
              </button>
            </nav>
          </div>
        </div>

        {/* Users Management Tab */}
        {activeTab === 'users' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">사용자 목록</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      이메일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      역할
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      가입일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-col space-y-1">
                          {/* 상태 변경 버튼 */}
                          <div className="flex space-x-2">
                            {user.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => updateUserStatus(user.id, 'APPROVED')}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  승인
                                </button>
                                <button
                                  onClick={() => updateUserStatus(user.id, 'REJECTED')}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  거부
                                </button>
                              </>
                            )}
                            {user.status === 'APPROVED' && (
                              <button
                                onClick={() => updateUserStatus(user.id, 'REJECTED')}
                                className="text-red-600 hover:text-red-900"
                              >
                                차단
                              </button>
                            )}
                            {user.status === 'REJECTED' && (
                              <button
                                onClick={() => updateUserStatus(user.id, 'APPROVED')}
                                className="text-green-600 hover:text-green-900"
                              >
                                재승인
                              </button>
                            )}
                          </div>
                          
                          {/* 역할 변경 버튼 */}
                          {user.status === 'APPROVED' && (
                            <div className="flex space-x-2">
                              {user.role === 'USER' && (
                                <button
                                  onClick={() => updateUserRole(user.id, 'ADMIN')}
                                  className="text-purple-600 hover:text-purple-900 text-xs"
                                >
                                  관리자로 승격
                                </button>
                              )}
                              {user.role === 'ADMIN' && (
                                <button
                                  onClick={() => updateUserRole(user.id, 'USER')}
                                  className="text-blue-600 hover:text-blue-900 text-xs"
                                >
                                  일반 사용자로 변경
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Activity Logs Tab */}
        {activeTab === 'activities' && <ActivityLogs />}

        {/* Folder Permissions Tab */}
        {activeTab === 'permissions' && (
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
                      onClick={() => setSelectedFolder(folder.id)}
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
                  <div className="mb-4 p-4 bg-gray-50 rounded">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">권한 추가</h3>
                    <div className="grid grid-cols-2 gap-2">
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
                      <select
                        id="permission"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="">권한 선택</option>
                        <option value="READ">읽기</option>
                        <option value="WRITE">쓰기</option>
                        <option value="ADMIN">관리</option>
                      </select>
                    </div>
                    <button
                      onClick={() => {
                        const userSelect = document.getElementById('userId') as HTMLSelectElement;
                        const permissionSelect = document.getElementById('permission') as HTMLSelectElement;
                        if (userSelect.value && permissionSelect.value) {
                          grantFolderPermission(parseInt(userSelect.value), permissionSelect.value);
                          userSelect.value = '';
                          permissionSelect.value = '';
                        }
                      }}
                      className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      권한 추가
                    </button>
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
                            onClick={() => revokeFolderPermission(permission.userId)}
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
        )}
      </div>
    </div>
  );
};

export default AdminPage;