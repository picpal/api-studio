import React, { useState } from 'react';
import Sidebar from './Sidebar';
import MainContent from './MainContent';
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
    <div className="flex h-screen bg-gray-100">
      <Sidebar 
        baseUrls={baseUrls} 
        onAddBaseUrl={handleAddBaseUrl}
        onUpdateBaseUrl={handleUpdateBaseUrl}
        onDeleteBaseUrl={handleDeleteBaseUrl}
        onSelectItem={handleSelectItem}
        onResetForm={handleResetForm}
        selectedItem={selectedItem}
      />
      <MainContent 
        baseUrls={baseUrls} 
        selectedItem={selectedItem}
        onResetForm={handleResetForm}
        onUpdateSelectedItem={handleUpdateSelectedItem}
      />
    </div>
  );
};

export default Layout;