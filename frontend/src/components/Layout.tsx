import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  const handleSelectItem = (item: ApiItem, folderId: string) => {
    console.log('Selected item:', item);
    setSelectedItem({ ...item, folder: folderId });
  };

  const handleResetForm = () => {
    console.log('Reset form');
    setSelectedItem(null);
  };

  const handleUpdateSelectedItem = (updatedItem: Partial<ApiItem>) => {
    if (selectedItem) {
      setSelectedItem({ ...selectedItem, ...updatedItem });
    }
  };

  return (
    <div className="h-screen bg-white flex flex-col">
      <Header onOpenAdmin={() => setShowAdminPage(true)} />
      <div className="flex flex-1 overflow-hidden">
        <div className={`flex-shrink-0 border-r border-gray-400 transition-all duration-300 ${sidebarCollapsed ? 'w-12' : 'w-80'}`}>
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
        <div className="flex-1 flex flex-col overflow-y-auto">
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