import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from './Header';
import Sidebar from './sidebar/SidebarRefactored';
import { PipelineSidebar } from '../widgets/pipeline';
import MainContent from './MainContent';
import { BaseUrl, ApiItem } from '../types/api';
import { createApiUrl, createFetchOptions } from '../config/api';

// 페이지 컴포넌트들을 동적 임포트
const AdminPage = lazy(() => import('../pages/AdminPage'));
const TestAutomationPage = lazy(() => import('../pages/TestAutomationPage'));
const PipelineManagementPage = lazy(() => import('../pages/pipeline').then(module => ({ default: module.PipelineManagementPage })));
const MeetingPage = lazy(() => import('../pages/MeetingPage').then(module => ({ default: module.MeetingPage })));
const DocumentPage = lazy(() => import('../pages/DocumentPage'));
const UiTestingPage = lazy(() => import('../pages/UiTestingPageNew'));

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
    { id: '4', name: 'Local', url: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080' }
  ]);

  const [selectedItem, setSelectedItem] = useState<ApiItem | null>(null);
  const [selectedPipeline, setSelectedPipeline] = useState<any>(null);
  const [showAdminPage, setShowAdminPage] = useState(false);
  const [currentPage, setCurrentPage] = useState<'api-testing' | 'test-automation' | 'pipeline-management' | 'meeting' | 'documentation' | 'ui-testing'>('api-testing');
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
    } else if (path.startsWith('/meeting')) {
      setCurrentPage('meeting');
    } else if (path.startsWith('/documentation')) {
      setCurrentPage('documentation');
    } else if (path.startsWith('/ui-testing')) {
      setCurrentPage('ui-testing');
    } else {
      setCurrentPage('api-testing');
    }
  }, [location.pathname]);

  // 인증 에러 이벤트 리스너 설정
  useEffect(() => {
    const handleAuthError = () => {
      // 로그인 페이지로 리디렉션
      window.location.href = '/login';
    };

    window.addEventListener('auth-error', handleAuthError);
    
    return () => {
      window.removeEventListener('auth-error', handleAuthError);
    };
  }, []);

  const fetchPipelineById = async (pipelineId: number) => {
    try {
      // 모든 폴더를 가져와서 해당 파이프라인 찾기
      const response = await fetch(createApiUrl('/pipelines/folders'), {
        ...createFetchOptions({
          credentials: 'include'
        })
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

  const handleNavigate = (page: 'api-testing' | 'test-automation' | 'pipeline-management' | 'meeting' | 'documentation' | 'ui-testing') => {
    setCurrentPage(page);
    // URL 업데이트
    if (page === 'api-testing') {
      navigate('/');
    } else if (page === 'test-automation') {
      navigate('/test-automation');
    } else if (page === 'pipeline-management') {
      navigate('/pipeline-management');
    } else if (page === 'meeting') {
      navigate('/meeting');
    } else if (page === 'documentation') {
      navigate('/documentation');
    } else if (page === 'ui-testing') {
      navigate('/ui-testing');
    }
  };

  const handleSelectPipeline = (pipeline: any) => {
    setSelectedPipeline(pipeline);
    navigate(`/pipeline-management/${pipeline.id}`);
  };

  const handlePipelineUpdate = async () => {
    // 파이프라인 업데이트 후 전체 데이터 새로고침
    if (selectedPipeline) {
      try {
        // 1. 메인 화면용 selectedPipeline 업데이트
        const response = await fetch(createApiUrl(`/pipelines/${selectedPipeline.id}`), {
          ...createFetchOptions({
            credentials: 'include'
          })
        });
        if (response.ok) {
          const updatedPipeline = await response.json();
          setSelectedPipeline(updatedPipeline);
        }
      } catch (error) {
        // Error refreshing pipeline data
      }
    }
    
    // 2. 사이드바 파이프라인 목록도 새로고침 (전역 이벤트로 알림)
    console.log('Dispatching pipeline-updated event');
    window.dispatchEvent(new CustomEvent('pipeline-updated'));
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
            <div className={`hidden md:block flex-shrink-0 border-r border-gray-200 transition-all duration-300 overflow-hidden ${sidebarCollapsed ? 'w-12' : 'w-80'}`}>
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
              <div className="w-80 h-full border-r border-gray-200 bg-white shadow-lg">
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
            <div className={`hidden md:block flex-shrink-0 border-r border-gray-200 transition-all duration-300 overflow-hidden ${sidebarCollapsed ? 'w-12' : 'w-80'}`}>
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
          <Suspense fallback={
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading...</p>
              </div>
            </div>
          }>
            {currentPage === 'api-testing' ? (
              <MainContent
                selectedItem={selectedItem}
                onResetForm={handleResetForm}
                onUpdateSelectedItem={handleUpdateSelectedItem}
              />
            ) : currentPage === 'test-automation' ? (
              <TestAutomationPage />
            ) : currentPage === 'pipeline-management' ? (
              <PipelineManagementPage 
                selectedPipeline={selectedPipeline}
                onPipelineUpdate={handlePipelineUpdate}
              />
            ) : currentPage === 'documentation' ? (
              <DocumentPage />
            ) : currentPage === 'ui-testing' ? (
              <UiTestingPage
                sidebarCollapsed={sidebarCollapsed}
                onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
              />
            ) : (
              <MeetingPage />
            )}
          </Suspense>
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
                <Suspense fallback={
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                }>
                  <AdminPage />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;