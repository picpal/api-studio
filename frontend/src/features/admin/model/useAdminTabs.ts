import { useState } from 'react';

export type AdminTab = 'users' | 'permissions' | 'activities';

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