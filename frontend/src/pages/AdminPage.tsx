import React from 'react';
import {
  AdminTabs,
  UserManagement,
  FolderPermissions,
  ApiKeyManagement,
  ActivityLogs,
  useAdminTabs,
  useAdminUsers,
  useAdminPermissions
} from '../features/admin';

const AdminPage: React.FC = () => {
  // Tab 상태 관리
  const { activeTab, handleTabChange }: {
    activeTab: 'users' | 'permissions' | 'activities' | 'api-keys';
    handleTabChange: (tab: 'users' | 'permissions' | 'activities' | 'api-keys') => void;
  } = useAdminTabs();

  // Users 상태 관리
  const {
    users,
    loading: usersLoading,
    updateUserStatus,
    updateUserRole
  } = useAdminUsers();

  // Permissions 상태 관리
  const {
    folders,
    selectedFolder,
    folderPermissions,
    loading: permissionsLoading,
    handleSelectFolder,
    grantFolderPermission,
    revokeFolderPermission
  } = useAdminPermissions();

  // 전체 로딩 상태
  const loading = usersLoading || permissionsLoading;

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
        <AdminTabs activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Users Management Tab */}
        {activeTab === 'users' && (
          <UserManagement
            users={users}
            onUpdateUserStatus={updateUserStatus}
            onUpdateUserRole={updateUserRole}
          />
        )}

        {/* Activity Logs Tab */}
        {activeTab === 'activities' && <ActivityLogs />}

        {/* Folder Permissions Tab */}
        {activeTab === 'permissions' && (
          <FolderPermissions
            folders={folders}
            selectedFolder={selectedFolder}
            folderPermissions={folderPermissions}
            users={users}
            onSelectFolder={handleSelectFolder}
            onGrantPermission={grantFolderPermission}
            onRevokePermission={revokeFolderPermission}
          />
        )}

        {/* API Key Management Tab */}
        {activeTab === 'api-keys' && (
          <ApiKeyManagement
            users={users}
            folders={folders}
          />
        )}
      </div>
    </div>
  );
};

export default AdminPage;