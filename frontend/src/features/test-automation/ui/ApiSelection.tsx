import React, { useState, useEffect, useRef } from 'react';
import { ApiItem } from '../../../types/api';
import { pipelineApi, PipelineFolder, Pipeline } from '../../../services/pipelineApi';

interface Folder {
  id: number;
  name: string;
}

interface ApiSelectionProps {
  folders: Folder[];
  apiList: ApiItem[];
  selectedFolder: number | null;
  selectedApis: Set<string>;
  apiSectionCollapsed: boolean;
  onFolderSelect: (folderId: number | null) => void;
  onApiSelection: (apiId: string, selected: boolean) => void;
  onSelectAll: () => void;
  onToggleCollapse: () => void;
  // Pipeline selection callbacks
  onPipelineSelection?: (selectedPipelines: Set<string>, pipelineList: Pipeline[], activeTab: 'apis' | 'pipelines') => void;
}

export const ApiSelection: React.FC<ApiSelectionProps> = ({
  folders,
  apiList,
  selectedFolder,
  selectedApis,
  apiSectionCollapsed,
  onFolderSelect,
  onApiSelection,
  onSelectAll,
  onToggleCollapse,
  onPipelineSelection
}) => {
  // Tab state
  const [activeTab, setActiveTab] = useState<'apis' | 'pipelines'>('apis');
  
  // Pipeline state
  const [pipelineFolders, setPipelineFolders] = useState<PipelineFolder[]>([]);
  const [selectedPipelineFolder, setSelectedPipelineFolder] = useState<number | null>(null);
  const [selectedPipelines, setSelectedPipelines] = useState<Set<string>>(new Set());
  
  // 스크롤 상태
  const [isDesktopScrollable, setIsDesktopScrollable] = useState(false);
  const [isMobileScrollable, setIsMobileScrollable] = useState(false);
  const [isFolderScrollable, setIsFolderScrollable] = useState(false);
  const desktopScrollRef = useRef<HTMLDivElement>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const folderScrollRef = useRef<HTMLDivElement>(null);

  // 폴더별 필터링된 API 목록 - 첫 번째 폴더가 기본 선택
  const filteredApiList = selectedFolder 
    ? apiList.filter(api => (api as any).folderId === selectedFolder)
    : folders.length > 0 ? apiList.filter(api => (api as any).folderId === folders[0].id) : [];

  // 폴더별 필터링된 Pipeline 목록 - 첫 번째 폴더가 기본 선택
  const filteredPipelineList = selectedPipelineFolder
    ? pipelineFolders.find(folder => folder.id === selectedPipelineFolder)?.pipelines || []
    : pipelineFolders.length > 0 ? pipelineFolders[0].pipelines : [];

  // API 폴더가 로드되면 첫 번째 폴더를 자동 선택
  useEffect(() => {
    if (folders.length > 0 && selectedFolder === null) {
      onFolderSelect(folders[0].id);
    }
  }, [folders, selectedFolder, onFolderSelect]);

  // Pipeline 폴더가 로드되면 첫 번째 폴더를 자동 선택
  useEffect(() => {
    if (pipelineFolders.length > 0 && selectedPipelineFolder === null && activeTab === 'pipelines') {
      setSelectedPipelineFolder(pipelineFolders[0].id);
    }
  }, [pipelineFolders, selectedPipelineFolder, activeTab]);

  // Load pipeline folders
  useEffect(() => {
    const fetchPipelineFolders = async () => {
      try {
        const folders = await pipelineApi.getFolders();
        setPipelineFolders(folders);
      } catch (error) {
        console.error('Failed to fetch pipeline folders:', error);
      }
    };

    if (activeTab === 'pipelines') {
      fetchPipelineFolders();
    }
  }, [activeTab]);

  // Pipeline selection handlers
  const handlePipelineSelection = (pipelineId: string, selected: boolean) => {
    const newSelected = new Set(selectedPipelines);
    if (selected) {
      newSelected.add(pipelineId);
    } else {
      newSelected.delete(pipelineId);
    }
    setSelectedPipelines(newSelected);
  };

  // Notify parent of pipeline selection changes
  useEffect(() => {
    if (onPipelineSelection && activeTab === 'pipelines') {
      onPipelineSelection(selectedPipelines, pipelineFolders.flatMap(f => f.pipelines), activeTab);
    }
  }, [selectedPipelines, activeTab, pipelineFolders]);

  // Notify parent of tab changes
  useEffect(() => {
    if (onPipelineSelection) {
      onPipelineSelection(selectedPipelines, pipelineFolders.flatMap(f => f.pipelines), activeTab);
    }
  }, [activeTab]);

  const handlePipelineSelectAll = () => {
    if (selectedPipelines.size === filteredPipelineList.length) {
      setSelectedPipelines(new Set());
    } else {
      setSelectedPipelines(new Set(filteredPipelineList.map(pipeline => pipeline.id.toString())));
    }
  };

  const handlePipelineFolderSelect = (folderId: number | null) => {
    setSelectedPipelineFolder(folderId);
  };

  // 스크롤 가능 여부 체크
  useEffect(() => {
    const checkScrollable = () => {
      // 데스크톱 스크롤 체크
      if (desktopScrollRef.current) {
        const { scrollHeight, clientHeight } = desktopScrollRef.current;
        setIsDesktopScrollable(scrollHeight > clientHeight);
      }
      
      // 모바일 스크롤 체크
      if (mobileScrollRef.current) {
        const { scrollHeight, clientHeight } = mobileScrollRef.current;
        setIsMobileScrollable(scrollHeight > clientHeight);
      }
      
      // 폴더 스크롤 체크
      if (folderScrollRef.current) {
        const { scrollHeight, clientHeight } = folderScrollRef.current;
        setIsFolderScrollable(scrollHeight > clientHeight);
      }
    };

    checkScrollable();
    
    const resizeObserver = new ResizeObserver(checkScrollable);
    if (desktopScrollRef.current) {
      resizeObserver.observe(desktopScrollRef.current);
    }
    if (mobileScrollRef.current) {
      resizeObserver.observe(mobileScrollRef.current);
    }
    if (folderScrollRef.current) {
      resizeObserver.observe(folderScrollRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [filteredApiList, filteredPipelineList, apiSectionCollapsed, folders, pipelineFolders, activeTab]);

  return (
    <div className="w-full lg:w-80 bg-white border-r lg:border-r border-b lg:border-b-0 border-gray-200 flex flex-col lg:h-full">
      {/* Header with tabs */}
      <div className="border-b border-gray-200">
        <div className="p-4 pb-0">
          <div className="flex items-center justify-between min-h-[2rem] mb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-md font-semibold">Test & Report</h3>
              {apiSectionCollapsed && (activeTab === 'apis' ? selectedApis.size > 0 : selectedPipelines.size > 0) && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                  {activeTab === 'apis' ? selectedApis.size : selectedPipelines.size} selected
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* collapse 버튼 - 모든 화면 크기에서 표시 */}
              <button
                onClick={onToggleCollapse}
                className="p-1 text-gray-500 hover:text-gray-700 rounded"
                title={apiSectionCollapsed ? "Expand Selection" : "Collapse Selection"}
              >
                <svg className={`w-5 h-5 transition-transform ${apiSectionCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex">
            <button
              onClick={() => setActiveTab('apis')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'apis'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              APIs
            </button>
            <button
              onClick={() => setActiveTab('pipelines')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'pipelines'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Pipelines
            </button>
          </div>
        </div>
      </div>

      {/* 폴더 목록 */}
      <div className={`border-b lg:flex-shrink-0 relative ${apiSectionCollapsed ? '' : 'lg:max-h-60'}`}>
        {!apiSectionCollapsed && (
          <div 
            ref={folderScrollRef}
            className="px-4 pb-4 pt-4 overflow-y-auto max-h-56"
          >
            {activeTab === 'apis' ? (
              <div className="space-y-1">
                {folders.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <p className="text-sm text-gray-500">접근 가능한 API 폴더가 없습니다</p>
                    <p className="text-xs text-gray-400 mt-1">관리자에게 권한을 요청하세요</p>
                  </div>
                ) : (
                  folders.map(folder => (
                    <button
                      key={folder.id}
                      onClick={() => {
                        onFolderSelect(folder.id);
                      }}
                      className={`w-full text-left p-2 rounded text-sm flex items-center gap-2 ${
                        selectedFolder === folder.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                      }`}
                    >
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                      {folder.name} ({apiList.filter(api => (api as any).folderId === folder.id).length})
                    </button>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-1">
                {pipelineFolders.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <p className="text-sm text-gray-500">접근 가능한 Pipeline 폴더가 없습니다</p>
                    <p className="text-xs text-gray-400 mt-1">관리자에게 권한을 요청하세요</p>
                  </div>
                ) : (
                  pipelineFolders.map(folder => (
                  <button
                    key={folder.id}
                    onClick={() => {
                      handlePipelineFolderSelect(folder.id);
                    }}
                    className={`w-full text-left p-2 rounded text-sm flex items-center gap-2 ${
                      selectedPipelineFolder === folder.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    {folder.name} ({folder.pipelines.length})
                  </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
        
        {/* 하단 그라이데이션 - 폴더 목록 */}
        {!apiSectionCollapsed && isFolderScrollable && (
          <div className="absolute bottom-0 left-0 right-0 h-6 pointer-events-none bg-gradient-to-t from-white via-white/80 to-transparent lg:block hidden" />
        )}
      </div>

      {/* Content 목록 - 데스크톱에서만 폴더와 같은 영역에 표시 */}
      <div className={`hidden lg:flex lg:flex-col relative ${apiSectionCollapsed ? 'lg:flex-1' : 'lg:flex-1'} lg:min-h-0`}>
        <div className="p-4 pb-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-md font-semibold">{activeTab === 'apis' ? 'APIs' : 'Pipelines'}</h3>
          {/* 데스크톱에서만 Select All 버튼 표시 (모바일은 상단에 위치) */}
          {((activeTab === 'apis' && filteredApiList.length > 0) || (activeTab === 'pipelines' && filteredPipelineList.length > 0)) && (
            <button
              onClick={activeTab === 'apis' ? onSelectAll : handlePipelineSelectAll}
              className="hidden lg:block text-xs px-2 py-1 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded"
            >
              {activeTab === 'apis' 
                ? (selectedApis.size === filteredApiList.length ? 'Deselect All' : 'Select All')
                : (selectedPipelines.size === filteredPipelineList.length ? 'Deselect All' : 'Select All')
              }
            </button>
          )}
        </div>
        </div>
        
        <div 
          ref={desktopScrollRef}
          className="px-4 overflow-y-auto flex-1 min-h-0"
        >
          <div className="space-y-2 pb-4">
          {activeTab === 'apis' ? (
            filteredApiList.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm text-gray-500">이 폴더에 API가 없습니다</p>
              </div>
            ) : (
              filteredApiList.map(api => (
              <label key={api.id} className="flex items-start p-2 border rounded hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedApis.has(api.id)}
                  onChange={(e) => onApiSelection(api.id, e.target.checked)}
                  className="mt-1 mr-2"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                      api.method === 'GET' ? 'bg-green-100 text-green-800' :
                      api.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                      api.method === 'PUT' ? 'bg-orange-100 text-orange-800' :
                      api.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {api.method}
                    </span>
                    <span className="text-sm font-medium truncate">{api.name}</span>
                  </div>
                  {api.description && (
                    <div className="text-xs text-gray-400 truncate mt-1">{api.description}</div>
                  )}
                </div>
              </label>
            )))
          ) : (
            filteredPipelineList.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm text-gray-500">이 폴더에 Pipeline이 없습니다</p>
              </div>
            ) : (
              filteredPipelineList.map(pipeline => (
              <label key={pipeline.id} className="flex items-start p-2 border rounded hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedPipelines.has(pipeline.id.toString())}
                  onChange={(e) => handlePipelineSelection(pipeline.id.toString(), e.target.checked)}
                  className="mt-1 mr-2"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-800">
                      PIPELINE
                    </span>
                    <span className="text-sm font-medium truncate">{pipeline.name}</span>
                  </div>
                  {pipeline.description && (
                    <div className="text-xs text-gray-400 truncate mt-1">{pipeline.description}</div>
                  )}
                </div>
              </label>
            )))
          )}
          </div>
        </div>
        
        {/* 하단 그라이데이션 - 데스크톱 */}
        {isDesktopScrollable && (
          <div className="absolute bottom-0 left-0 right-0 h-6 pointer-events-none bg-gradient-to-t from-white via-white/80 to-transparent" />
        )}
      </div>

      {/* 모바일/태블릿 전용 Content 목록 */}
      <div className="lg:hidden bg-white border-b border-gray-200 relative">
        <div className="p-4 pb-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-md font-semibold">{activeTab === 'apis' ? 'APIs' : 'Pipelines'}</h3>
          {/* 모바일 Select All 버튼 */}
          {((activeTab === 'apis' && filteredApiList.length > 0) || (activeTab === 'pipelines' && filteredPipelineList.length > 0)) && (
            <button
              onClick={activeTab === 'apis' ? onSelectAll : handlePipelineSelectAll}
              className="text-xs px-2 py-1 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded"
            >
              {activeTab === 'apis' 
                ? (selectedApis.size === filteredApiList.length ? 'Deselect All' : 'Select All')
                : (selectedPipelines.size === filteredPipelineList.length ? 'Deselect All' : 'Select All')
              }
            </button>
          )}
        </div>
        </div>
        
        <div 
          ref={mobileScrollRef}
          className="px-4 pb-4 space-y-2 max-h-60 overflow-y-auto"
        >
          {activeTab === 'apis' ? (
            filteredApiList.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm text-gray-500">이 폴더에 API가 없습니다</p>
              </div>
            ) : (
              filteredApiList.map(api => (
              <label key={api.id} className="flex items-start p-2 border rounded hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedApis.has(api.id)}
                  onChange={(e) => onApiSelection(api.id, e.target.checked)}
                  className="mt-1 mr-2"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                      api.method === 'GET' ? 'bg-green-100 text-green-800' :
                      api.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                      api.method === 'PUT' ? 'bg-orange-100 text-orange-800' :
                      api.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {api.method}
                    </span>
                    <span className="text-sm font-medium truncate">{api.name}</span>
                  </div>
                  {api.description && (
                    <div className="text-xs text-gray-400 truncate mt-1">{api.description}</div>
                  )}
                </div>
              </label>
            )))
          ) : (
            filteredPipelineList.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm text-gray-500">이 폴더에 Pipeline이 없습니다</p>
              </div>
            ) : (
              filteredPipelineList.map(pipeline => (
              <label key={pipeline.id} className="flex items-start p-2 border rounded hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedPipelines.has(pipeline.id.toString())}
                  onChange={(e) => handlePipelineSelection(pipeline.id.toString(), e.target.checked)}
                  className="mt-1 mr-2"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-800">
                      PIPELINE
                    </span>
                    <span className="text-sm font-medium truncate">{pipeline.name}</span>
                  </div>
                  {pipeline.description && (
                    <div className="text-xs text-gray-400 truncate mt-1">{pipeline.description}</div>
                  )}
                </div>
              </label>
            )))
          )}
        </div>
        
        {/* 하단 그라이데이션 - 모바일 */}
        {isMobileScrollable && (
          <div className="absolute bottom-0 left-0 right-0 h-6 pointer-events-none bg-gradient-to-t from-white via-white/80 to-transparent" />
        )}
      </div>
    </div>
  );
};