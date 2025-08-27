import React from 'react';

export type AdminTab = 'users' | 'permissions' | 'activities' | 'api-keys';

interface AdminTabsProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
}

export const AdminTabs: React.FC<AdminTabsProps> = ({
  activeTab,
  onTabChange
}) => {
  return (
    <div className="mb-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => onTabChange('users')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            사용자 관리
          </button>
          <button
            onClick={() => onTabChange('permissions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'permissions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            폴더 권한 관리
          </button>
          <button
            onClick={() => onTabChange('activities')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'activities'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            사용자 활동 로그
          </button>
          <button
            onClick={() => onTabChange('api-keys')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'api-keys'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            API 키 관리
          </button>
        </nav>
      </div>
    </div>
  );
};