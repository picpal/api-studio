import { useState } from 'react';

export type AdminTab = 'users' | 'permissions' | 'activities' | 'api-keys';

export const useAdminTabs = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
  };

  return {
    activeTab,
    handleTabChange
  };
};