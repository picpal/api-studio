import React, { useState, useEffect } from 'react';
import { pipelineApi, PipelineFolder, Pipeline } from '../../services/pipelineApi';

interface PipelineSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onSelectPipeline?: (pipeline: Pipeline) => void;
  selectedPipeline?: Pipeline | null;
}

const PipelineSidebar: React.FC<PipelineSidebarProps> = ({
  collapsed = false,
  onToggleCollapse,
  onSelectPipeline,
  selectedPipeline
}) => {
  const [folders, setFolders] = useState<PipelineFolder[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [showNewPipelineModal, setShowNewPipelineModal] = useState(false);
  const [newPipelineName, setNewPipelineName] = useState('');
  const [newPipelineDescription, setNewPipelineDescription] = useState('');
  const [selectedFolderForPipeline, setSelectedFolderForPipeline] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    x: number;
    y: number;
    folderId: number | null;
    folderName: string;
  }>({
    show: false,
    x: 0,
    y: 0,
    folderId: null,
    folderName: ''
  });

  // Load folders from API
  useEffect(() => {
    let isMounted = true;
    const fetchFolders = async () => {
      console.log('PipelineSidebar: Starting to fetch folders...');
      try {
        const foldersData = await pipelineApi.getFolders();
        console.log('PipelineSidebar: Fetched folders data:', foldersData);
        if (isMounted) {
          setFolders(foldersData);
          // 기본적으로 모든 폴더 확장
          setExpandedFolders(new Set(foldersData.map(f => f.id)));
          console.log('PipelineSidebar: Set folders and expanded state');
        }
      } catch (error) {
        console.error('PipelineSidebar: Failed to load folders:', error);
        if (isMounted) {
          setFolders([]);
        }
      }
    };
    
    fetchFolders();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleFolder = (folderId: number) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const expandAll = () => {
    setExpandedFolders(new Set(folders.map(f => f.id)));
  };

  const collapseAll = () => {
    setExpandedFolders(new Set());
  };

  const handleCreateFolder = async () => {
    if (newFolderName.trim() && !isCreatingFolder) {
      setIsCreatingFolder(true);
      try {
        const newFolder = await pipelineApi.createFolder({
          name: newFolderName.trim(),
          description: ''
        });
        setFolders([...folders, newFolder]);
        setNewFolderName('');
        setShowNewFolderModal(false);
        // 새로 생성된 폴더를 확장
        setExpandedFolders(prev => new Set([...prev, newFolder.id]));
      } catch (error) {
        console.error('Failed to create folder:', error);
        alert('폴더 생성에 실패했습니다.');
      } finally {
        setIsCreatingFolder(false);
      }
    }
  };

  const handleFolderRightClick = (e: React.MouseEvent, folderId: number, folderName: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      folderId,
      folderName
    });
  };

  const handleContextMenuClose = () => {
    setContextMenu({
      show: false,
      x: 0,
      y: 0,
      folderId: null,
      folderName: ''
    });
  };

  const handleAddPipeline = () => {
    setSelectedFolderForPipeline(contextMenu.folderId);
    setShowNewPipelineModal(true);
    handleContextMenuClose();
  };

  const handleCreatePipeline = async () => {
    if (newPipelineName.trim() && selectedFolderForPipeline) {
      try {
        const newPipeline = await pipelineApi.createPipeline({
          name: newPipelineName.trim(),
          description: newPipelineDescription.trim(),
          folderId: selectedFolderForPipeline
        });
        
        // 폴더 목록에서 해당 폴더를 찾아 파이프라인 추가
        setFolders(prevFolders => 
          prevFolders.map(folder => 
            folder.id === selectedFolderForPipeline 
              ? { ...folder, pipelines: [...folder.pipelines, newPipeline] }
              : folder
          )
        );
        
        // 모달 닫기 및 입력값 초기화
        setNewPipelineName('');
        setNewPipelineDescription('');
        setSelectedFolderForPipeline(null);
        setShowNewPipelineModal(false);
      } catch (error) {
        console.error('Failed to create pipeline:', error);
        alert('파이프라인 생성에 실패했습니다.');
      }
    }
  };

  const handleCancelCreatePipeline = () => {
    setNewPipelineName('');
    setNewPipelineDescription('');
    setSelectedFolderForPipeline(null);
    setShowNewPipelineModal(false);
  };

  const handleRemoveFolder = async () => {
    if (contextMenu.folderId && confirm(`"${contextMenu.folderName}" 폴더를 삭제하시겠습니까?`)) {
      try {
        await pipelineApi.deleteFolder(contextMenu.folderId);
        setFolders(folders.filter(f => f.id !== contextMenu.folderId));
        setExpandedFolders(prev => {
          const newExpanded = new Set(prev);
          newExpanded.delete(contextMenu.folderId!);
          return newExpanded;
        });
      } catch (error) {
        console.error('Failed to delete folder:', error);
        alert('폴더 삭제에 실패했습니다.');
      }
    }
    handleContextMenuClose();
  };

  // Close context menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.show) {
        handleContextMenuClose();
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu.show]);

  const handleCancelCreateFolder = () => {
    setNewFolderName('');
    setShowNewFolderModal(false);
  };

  const filteredFolders = folders.map(folder => ({
    ...folder,
    pipelines: folder.pipelines.filter(pipeline =>
      pipeline.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pipeline.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(folder => 
    searchTerm === '' || 
    folder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    folder.pipelines.length > 0
  );

  if (collapsed) {
    return (
      <div className="w-12 h-screen border-r border-gray-200 bg-white flex flex-col items-center py-3">
        <div className="mb-3">
          <button
            onClick={onToggleCollapse}
            className="w-8 h-8 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors flex items-center justify-center"
            title="사이드바 펼치기"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 h-screen border-r border-gray-200 bg-white flex flex-col">
      {/* Header with Create Folder Button and Toggle */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          {/* Create Folder Button */}
          <button 
            onClick={() => setShowNewFolderModal(true)}
            className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors font-medium border border-blue-200 hover:border-blue-300"
          >
            + Create Folder
          </button>
          
          {/* Toggle Button */}
          <button 
            onClick={onToggleCollapse}
            className="w-8 h-8 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors flex items-center justify-center flex-shrink-0"
            title="사이드바 접기"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="px-4 py-3 border-b border-gray-100">

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search Pipelines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 pl-9 pr-8 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            <svg 
              className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Expand/Collapse All Buttons */}
          <div className="flex gap-1">
            <button
              onClick={expandAll}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title="모든 폴더 펼치기"
            >
              <img src="/icon/ArrowsOutLineVertical.svg" alt="Expand All" className="w-4 h-4" />
            </button>
            <button
              onClick={collapseAll}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title="모든 폴더 접기"
            >
              <img src="/icon/ArrowsInLineVertical.svg" alt="Collapse All" className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">

        {/* Folders and Pipelines */}
        <div className="space-y-2">
          {filteredFolders.map(folder => (
            <div key={folder.id} className="space-y-1">
              {/* Folder Header */}
              <button
                onClick={() => toggleFolder(folder.id)}
                onContextMenu={(e) => handleFolderRightClick(e, folder.id, folder.name)}
                className="w-full flex items-center gap-2 p-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors"
              >
                <svg 
                  className={`w-4 h-4 text-gray-500 transition-transform ${
                    expandedFolders.has(folder.id) ? 'rotate-90' : ''
                  }`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span>{folder.name}</span>
                <span className="ml-auto text-xs text-gray-500">({folder.pipelines.length})</span>
              </button>

              {/* Pipelines */}
              {expandedFolders.has(folder.id) && (
                <div className="ml-6 space-y-1">
                  {folder.pipelines.map(pipeline => (
                    <button
                      key={pipeline.id}
                      onClick={() => onSelectPipeline?.(pipeline)}
                      className={`w-full text-left p-2 rounded text-sm transition-colors ${
                        selectedPipeline?.id === pipeline.id
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span className="font-medium">{pipeline.name}</span>
                        <span className="ml-auto text-xs text-gray-500">단계</span>
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {pipeline.description}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredFolders.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-8">
            {searchTerm ? '검색 결과가 없습니다.' : '파이프라인이 없습니다.'}
          </div>
        )}
      </div>


      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">새 폴더 만들기</h3>
            </div>
            <div className="p-4">
              <label htmlFor="folderName" className="block text-sm font-medium text-gray-700 mb-2">
                폴더 이름
              </label>
              <input
                type="text"
                id="folderName"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateFolder();
                  } else if (e.key === 'Escape') {
                    handleCancelCreateFolder();
                  }
                }}
                placeholder="폴더 이름을 입력하세요..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={handleCancelCreateFolder}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                생성
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Pipeline Modal */}
      {showNewPipelineModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">새 파이프라인 생성</h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label htmlFor="pipelineName" className="block text-sm font-medium text-gray-700 mb-2">
                  파이프라인 이름 *
                </label>
                <input
                  type="text"
                  id="pipelineName"
                  value={newPipelineName}
                  onChange={(e) => setNewPipelineName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      handleCreatePipeline();
                    } else if (e.key === 'Escape') {
                      handleCancelCreatePipeline();
                    }
                  }}
                  placeholder="파이프라인 이름을 입력하세요..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="pipelineDescription" className="block text-sm font-medium text-gray-700 mb-2">
                  설명
                </label>
                <textarea
                  id="pipelineDescription"
                  value={newPipelineDescription}
                  onChange={(e) => setNewPipelineDescription(e.target.value)}
                  placeholder="파이프라인 설명을 입력하세요..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
              <div className="text-xs text-gray-500">
                * Ctrl + Enter로 생성, Escape로 취소
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={handleCancelCreatePipeline}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleCreatePipeline}
                disabled={!newPipelineName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                생성
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu.show && (
        <div 
          className="fixed bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50 min-w-[140px]"
          style={{ 
            left: `${contextMenu.x}px`, 
            top: `${contextMenu.y}px` 
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleAddPipeline}
            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            파이프라인 추가
          </button>
          <button
            onClick={handleRemoveFolder}
            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            폴더 삭제
          </button>
        </div>
      )}
    </div>
  );
};

export default PipelineSidebar;