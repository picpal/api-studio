import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './sidebar/SidebarRefactored';
import MainContent from './MainContent';
import AdminPage from './AdminPage';
import { BaseUrl, ApiItem } from '../types/api';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = () => {
  const [baseUrls, setBaseUrls] = useState<BaseUrl[]>([
    { id: '1', name: 'Development', url: 'https://dev-api.blue.com' },
    { id: '2', name: 'Staging', url: 'https://staging-api.blue.com' },
    { id: '3', name: 'Production', url: 'https://api.blue.com' },
    { id: '4', name: 'Local', url: 'http://localhost:8080' }
  ]);

  const [selectedItem, setSelectedItem] = useState<ApiItem | null>(null);
  const [showAdminPage, setShowAdminPage] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // 데스크톱에서는 열린 상태, 모바일에서는 닫힌 상태로 시작
    return window.innerWidth < 768;
  });

  const handleAddBaseUrl = (newBaseUrl: Omit<BaseUrl, 'id'>) => {
    const id = (baseUrls.length + 1).toString();
    setBaseUrls([...baseUrls, { ...newBaseUrl, id }]);
  };

  const handleUpdateBaseUrl = (id: string, updatedBaseUrl: Omit<BaseUrl, 'id'>) => {
    setBaseUrls(baseUrls.map(url => 
      url.id === id ? { ...updatedBaseUrl, id } : url
    ));
  };

  const handleDeleteBaseUrl = (id: string) => {
    setBaseUrls(baseUrls.filter(url => url.id !== id));
  };

  const handleSelectItem = async (item: ApiItem, folderId: string) => {
    try {
      // 개별 아이템 상세 정보 (파라미터 포함) 조회
      const { itemApi, convertBackendToFrontendItem } = await import('../services/api');
      const detailedItem = await itemApi.getById(parseInt(item.id));
      const convertedItem = convertBackendToFrontendItem(detailedItem);
      
      setSelectedItem({ ...convertedItem, folder: folderId });
    } catch (error) {
      console.error('Failed to fetch item details:', error);
      // 에러 시 기본 아이템 정보만 사용
      setSelectedItem({ ...item, folder: folderId });
    }
  };

  const handleResetForm = () => {
    setSelectedItem(null);
  };

  const handleUpdateSelectedItem = (updatedItem: Partial<ApiItem>) => {
    if (selectedItem) {
      setSelectedItem({ ...selectedItem, ...updatedItem });
    }
  };

  return (
    <div className="h-screen bg-white flex flex-col">
      <Header 
        onOpenAdmin={() => setShowAdminPage(true)}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        sidebarCollapsed={sidebarCollapsed}
      />
      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop Sidebar */}
        <div className={`hidden md:block flex-shrink-0 border-r border-gray-400 transition-all duration-300 ${sidebarCollapsed ? 'w-12' : 'w-80'}`}>
          <Sidebar
            baseUrls={baseUrls}
            onAddBaseUrl={handleAddBaseUrl}
            onUpdateBaseUrl={handleUpdateBaseUrl}
            onDeleteBaseUrl={handleDeleteBaseUrl}
            onSelectItem={handleSelectItem}
            onResetForm={handleResetForm}
            selectedItem={selectedItem}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>

        {/* Mobile Sidebar Overlay */}
        <div className={`md:hidden fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out ${
          sidebarCollapsed ? '-translate-x-full' : 'translate-x-0'
        }`} style={{ top: '64px' }}>
          <div className="w-80 h-full border-r border-gray-400 bg-white shadow-lg">
            <Sidebar
              baseUrls={baseUrls}
              onAddBaseUrl={handleAddBaseUrl}
              onUpdateBaseUrl={handleUpdateBaseUrl}
              onDeleteBaseUrl={handleDeleteBaseUrl}
              onSelectItem={handleSelectItem}
              onResetForm={handleResetForm}
              selectedItem={selectedItem}
              collapsed={false}
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
          </div>
        </div>

        {/* Mobile Backdrop */}
        {!sidebarCollapsed && (
          <div 
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
            style={{ top: '64px' }}
            onClick={() => setSidebarCollapsed(true)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-y-auto md:ml-0">
          <MainContent
            baseUrls={baseUrls}
            selectedItem={selectedItem}
            onResetForm={handleResetForm}
            onUpdateSelectedItem={handleUpdateSelectedItem}
          />
        </div>
      </div>

      {/* Admin Modal */}
      {showAdminPage && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowAdminPage(false)}></div>

            <div className="inline-block w-full max-w-6xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-medium">관리자 설정</h2>
                <button
                  onClick={() => setShowAdminPage(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="max-h-[80vh] overflow-y-auto">
                <AdminPage />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;