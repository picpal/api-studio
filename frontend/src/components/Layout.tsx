import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from './Header';
import Sidebar from './sidebar/SidebarRefactored';
import PipelineSidebar from './pipeline/PipelineSidebar';
import MainContent from './MainContent';
import AdminPage from '../pages/AdminPage';
import TestAutomationPage from '../pages/TestAutomationPage';
import { PipelineManagementPage } from '../pages/pipeline';
import { BaseUrl, ApiItem } from '../types/api';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [baseUrls, setBaseUrls] = useState<BaseUrl[]>([
    { id: '1', name: 'Development', url: 'https://dev-api.blue.com' },
    { id: '2', name: 'Staging', url: 'https://staging-api.blue.com' },
    { id: '3', name: 'Production', url: 'https://api.blue.com' },
    { id: '4', name: 'Local', url: 'http://localhost:8080' }
  ]);

  const [selectedItem, setSelectedItem] = useState<ApiItem | null>(null);
  const [selectedPipeline, setSelectedPipeline] = useState<any>(null);
  const [showAdminPage, setShowAdminPage] = useState(false);
  const [currentPage, setCurrentPage] = useState<'api-testing' | 'test-automation' | 'pipeline-management'>('api-testing');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // 데스크톱에서는 열린 상태, 모바일에서는 닫힌 상태로 시작
    return window.innerWidth < 768;
  });

  // URL 기반으로 현재 페이지 결정
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/pipeline-management')) {
      setCurrentPage('pipeline-management');
      // 파이프라인 ID가 URL에 있으면 해당 파이프라인 선택
      const match = path.match(/\/pipeline-management\/(\d+)/);
      if (match) {
        const pipelineId = parseInt(match[1]);
        // 파이프라인 정보를 가져와서 설정
        fetchPipelineById(pipelineId);
      } else {
        setSelectedPipeline(null);
      }
    } else if (path.startsWith('/test-automation')) {
      setCurrentPage('test-automation');
    } else {
      setCurrentPage('api-testing');
    }
  }, [location.pathname]);

  const fetchPipelineById = async (pipelineId: number) => {
    try {
      // 모든 폴더를 가져와서 해당 파이프라인 찾기
      const response = await fetch('http://localhost:8080/api/pipelines/folders', {
        credentials: 'include'
      });
      if (response.ok) {
        const folders = await response.json();
        for (const folder of folders) {
          const pipeline = folder.pipelines?.find((p: any) => p.id === pipelineId);
          if (pipeline) {
            setSelectedPipeline({
              ...pipeline,
              id: pipelineId,
              stepCount: folder.pipelines?.length || 0,
              createdAt: new Date(pipeline.createdAt),
              updatedAt: new Date(pipeline.updatedAt)
            });
            break;
          }
        }
      }
    } catch (error) {
      // Error fetching pipeline
    }
  };

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

  const handleSelectItem = async (item: ApiItem, folderId: string, folderName?: string) => {
    try {
      // 개별 아이템 상세 정보 (파라미터 포함) 조회
      const { itemApi, convertBackendToFrontendItem } = await import('../services/api');
      const detailedItem = await itemApi.getById(parseInt(item.id));
      const convertedItem = convertBackendToFrontendItem(detailedItem);
      
      setSelectedItem({ 
        ...convertedItem, 
        folder: folderId,
        folderName: folderName 
      });
    } catch (error) {
      // 에러 시 기본 아이템 정보만 사용
      setSelectedItem({ 
        ...item, 
        folder: folderId,
        folderName: folderName 
      });
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

  const handleFolderUpdate = (folderId: string, folderName: string) => {
    // 선택된 아이템이 해당 폴더에 속해 있으면 폴더 정보 업데이트
    if (selectedItem && selectedItem.folder === folderId) {
      setSelectedItem({ 
        ...selectedItem, 
        folderName: folderName  // 폴더명 정보 추가/업데이트
      });
    }
  };

  const handleItemUpdate = (itemId: string, itemName: string) => {
    // 선택된 아이템이 해당 아이템이면 이름 정보 업데이트
    if (selectedItem && selectedItem.id === itemId) {
      setSelectedItem({ 
        ...selectedItem, 
        name: itemName  // 아이템명 정보 업데이트
      });
    }
  };

  const handleNavigate = (page: 'api-testing' | 'test-automation' | 'pipeline-management') => {
    setCurrentPage(page);
    // URL 업데이트
    if (page === 'api-testing') {
      navigate('/');
    } else if (page === 'test-automation') {
      navigate('/test-automation');
    } else if (page === 'pipeline-management') {
      navigate('/pipeline-management');
    }
  };

  const handleSelectPipeline = (pipeline: any) => {
    setSelectedPipeline(pipeline);
    navigate(`/pipeline-management/${pipeline.id}`);
  };

  const handlePipelineUpdate = async () => {
    // 서버에서 최신 Pipeline 데이터를 가져와서 상태 업데이트
    if (selectedPipeline) {
      try {
        const response = await fetch(`http://localhost:8080/api/pipelines/${selectedPipeline.id}`, {
          credentials: 'include'
        });
        if (response.ok) {
          const updatedPipeline = await response.json();
          setSelectedPipeline(updatedPipeline); // 서버에서 가져온 최신 데이터로 업데이트
        }
      } catch (error) {
        // Error refreshing pipeline data
      }
    }
  };

  return (
    <div className="h-screen bg-white flex flex-col">
      <Header 
        onOpenAdmin={() => setShowAdminPage(true)}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        sidebarCollapsed={sidebarCollapsed}
        currentPage={currentPage}
        onNavigate={handleNavigate}
      />
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar - Only show for API Testing page */}
        {currentPage === 'api-testing' && (
          <>
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
                onFolderUpdate={handleFolderUpdate}
                onItemUpdate={handleItemUpdate}
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
                  onFolderUpdate={handleFolderUpdate}
                  onItemUpdate={handleItemUpdate}
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
          </>
        )}

        {/* Pipeline Sidebar - Only show for Pipeline Management page */}
        {currentPage === 'pipeline-management' && (
          <>
            {/* Desktop Pipeline Sidebar */}
            <div className={`hidden md:block flex-shrink-0 border-r border-gray-200 transition-all duration-300 ${sidebarCollapsed ? 'w-12' : 'w-80'}`}>
              <PipelineSidebar
                collapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                onSelectPipeline={handleSelectPipeline}
                selectedPipeline={selectedPipeline}
              />
            </div>

            {/* Mobile Pipeline Sidebar */}
            <div className={`md:hidden fixed inset-y-0 left-0 z-30 transition-transform duration-300 ease-in-out ${
              sidebarCollapsed ? '-translate-x-full' : 'translate-x-0'
            }`} style={{ top: '64px' }}>
              <PipelineSidebar
                collapsed={false}
                onToggleCollapse={() => setSidebarCollapsed(true)}
                onSelectPipeline={handleSelectPipeline}
                selectedPipeline={selectedPipeline}
              />
            </div>

            {/* Mobile Overlay */}
            {!sidebarCollapsed && (
              <div 
                className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
                style={{ top: '64px' }}
                onClick={() => setSidebarCollapsed(true)}
              />
            )}
          </>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-y-auto md:ml-0">
          {currentPage === 'api-testing' ? (
            <MainContent
              baseUrls={baseUrls}
              selectedItem={selectedItem}
              onResetForm={handleResetForm}
              onUpdateSelectedItem={handleUpdateSelectedItem}
            />
          ) : currentPage === 'test-automation' ? (
            <TestAutomationPage
              baseUrls={baseUrls}
              selectedItem={selectedItem}
              onResetForm={handleResetForm}
              onUpdateSelectedItem={handleUpdateSelectedItem}
            />
          ) : (
            <PipelineManagementPage 
              selectedPipeline={selectedPipeline}
              onPipelineUpdate={handlePipelineUpdate}
            />
          )}
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