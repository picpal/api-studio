import React, { useState, useEffect } from 'react';
import { Pipeline } from '../../../entities/pipeline';
import { usePipelineFolder } from '../../../features/pipeline-management/hooks/usePipelineFolder';

interface PipelineSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onSelectPipeline?: (pipeline: Pipeline | null) => void;
  selectedPipeline?: Pipeline | null;
}

export const PipelineSidebar: React.FC<PipelineSidebarProps> = ({
  collapsed = false,
  onToggleCollapse,
  onSelectPipeline,
  selectedPipeline
}) => {
  const {
    filteredFolders,
    expandedFolders,
    searchTerm,
    loading,
    setSearchTerm,
    toggleFolder,
    expandAll,
    collapseAll,
    createFolder,
    deleteFolder,
    updateFolder,
    createPipeline,
    deletePipeline
  } = usePipelineFolder();

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

  const [pipelineContextMenu, setPipelineContextMenu] = useState<{
    show: boolean;
    x: number;
    y: number;
    pipelineId: number | null;
    pipelineName: string;
    folderId: number;
  }>({
    show: false,
    x: 0,
    y: 0,
    pipelineId: null,
    pipelineName: '',
    folderId: 0
  });

  const [renamingFolder, setRenamingFolder] = useState<{
    id: number | null;
    newName: string;
  }>({
    id: null,
    newName: ''
  });

  // 스크롤 상태
  const [isScrollable, setIsScrollable] = useState(false);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const handleCreateFolder = async () => {
    if (newFolderName.trim() && !isCreatingFolder) {
      setIsCreatingFolder(true);
      try {
        await createFolder({
          name: newFolderName.trim(),
          description: ''
        });
        setNewFolderName('');
        setShowNewFolderModal(false);
      } catch (error) {
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

  const handlePipelineRightClick = (e: React.MouseEvent, pipelineId: number, pipelineName: string, folderId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setPipelineContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      pipelineId,
      pipelineName,
      folderId
    });
  };

  const handlePipelineContextMenuClose = () => {
    setPipelineContextMenu({
      show: false,
      x: 0,
      y: 0,
      pipelineId: null,
      pipelineName: '',
      folderId: 0
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
        await createPipeline({
          name: newPipelineName.trim(),
          description: newPipelineDescription.trim(),
          folderId: selectedFolderForPipeline
        });
        
        // 모달 닫기 및 입력값 초기화
        setNewPipelineName('');
        setNewPipelineDescription('');
        setSelectedFolderForPipeline(null);
        setShowNewPipelineModal(false);
      } catch (error) {
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
        await deleteFolder(contextMenu.folderId);
      } catch (error) {
        alert('폴더 삭제에 실패했습니다.');
      }
    }
    handleContextMenuClose();
  };

  const handleRemovePipeline = async () => {
    if (pipelineContextMenu.pipelineId && confirm(`"${pipelineContextMenu.pipelineName}" 파이프라인을 삭제하시겠습니까?`)) {
      try {
        await deletePipeline(pipelineContextMenu.pipelineId, pipelineContextMenu.folderId);
        
        // If the deleted pipeline was selected, clear selection
        if (selectedPipeline?.id === pipelineContextMenu.pipelineId) {
          onSelectPipeline?.(null);
        }
      } catch (error) {
        alert('파이프라인 삭제에 실패했습니다.');
      }
    }
    handlePipelineContextMenuClose();
  };

  const handleStartRenameFolder = () => {
    if (contextMenu.folderId && contextMenu.folderName) {
      setRenamingFolder({
        id: contextMenu.folderId,
        newName: contextMenu.folderName
      });
    }
    handleContextMenuClose();
  };

  const handleCancelRename = () => {
    setRenamingFolder({
      id: null,
      newName: ''
    });
  };

  const handleConfirmRename = async () => {
    if (renamingFolder.id && renamingFolder.newName.trim()) {
      try {
        await updateFolder(renamingFolder.id, {
          name: renamingFolder.newName.trim()
        });
        
        handleCancelRename();
      } catch (error) {
        alert('폴더 이름 변경에 실패했습니다.');
      }
    }
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirmRename();
    } else if (e.key === 'Escape') {
      handleCancelRename();
    }
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.show) {
        handleContextMenuClose();
      }
      if (pipelineContextMenu.show) {
        handlePipelineContextMenuClose();
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu.show, pipelineContextMenu.show]);

  // 스크롤 가능 여부 체크
  useEffect(() => {
    const checkScrollable = () => {
      if (scrollContainerRef.current) {
        const { scrollHeight, clientHeight } = scrollContainerRef.current;
        setIsScrollable(scrollHeight > clientHeight);
      }
    };

    checkScrollable();
    
    const resizeObserver = new ResizeObserver(checkScrollable);
    if (scrollContainerRef.current) {
      resizeObserver.observe(scrollContainerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [filteredFolders, expandedFolders, searchTerm]);

  const handleCancelCreateFolder = () => {
    setNewFolderName('');
    setShowNewFolderModal(false);
  };

  if (collapsed) {
    return (
      <div className="w-12 h-full border-r border-gray-200 bg-white flex flex-col items-center py-3">
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
    <div className="w-80 h-full border-r border-gray-200 bg-white flex flex-col">
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
      <div className="flex-1 relative min-h-0">
        <div 
          ref={scrollContainerRef}
          className="overflow-y-auto h-full p-4"
        >
          {loading ? (
            <div className="text-center text-gray-500 text-sm py-8">
              Loading...
            </div>
          ) : (
            <>
              {/* Folders and Pipelines */}
              <div className="space-y-2">
                {filteredFolders.map(folder => (
                  <div key={folder.id} className="space-y-1">
                    {/* Folder Header */}
                    {renamingFolder.id === folder.id ? (
                      <div className="flex items-center gap-2 p-2">
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
                        <input
                          type="text"
                          value={renamingFolder.newName}
                          onChange={(e) => setRenamingFolder(prev => ({ ...prev, newName: e.target.value }))}
                          onKeyDown={handleRenameKeyDown}
                          onBlur={(e) => {
                            // Don't cancel if clicking on the save/cancel buttons
                            if (!e.relatedTarget || (!e.relatedTarget.closest('[data-rename-buttons]'))) {
                              handleCancelRename();
                            }
                          }}
                          className="flex-1 px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                          autoFocus
                        />
                        <div className="flex gap-1" data-rename-buttons>
                          <button
                            onMouseDown={(e) => e.preventDefault()} // Prevent blur
                            onClick={handleConfirmRename}
                            className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                            title="저장"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onMouseDown={(e) => e.preventDefault()} // Prevent blur
                            onClick={handleCancelRename}
                            className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                            title="취소"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <span className="text-xs text-gray-500">({folder.pipelines.length})</span>
                      </div>
                    ) : (
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
                    )}

                    {/* Pipelines */}
                    {expandedFolders.has(folder.id) && (
                      <div className="ml-6 space-y-1">
                        {folder.pipelines.map(pipeline => (
                          <button
                            key={pipeline.id}
                            onClick={() => onSelectPipeline?.(pipeline)}
                            onContextMenu={(e) => handlePipelineRightClick(e, pipeline.id, pipeline.name, folder.id)}
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
                              <span className="ml-auto text-xs text-gray-500">ID: {pipeline.id}</span>
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
            </>
          )}
        </div>
        
        {/* 하단 그라이데이션 */}
        {isScrollable && (
          <div className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none bg-gradient-to-t from-white via-white/80 to-transparent" />
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

      {/* Folder Context Menu */}
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
            onClick={handleStartRenameFolder}
            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            폴더 이름 변경
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

      {/* Pipeline Context Menu */}
      {pipelineContextMenu.show && (
        <div 
          className="fixed bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50 min-w-[140px]"
          style={{ 
            left: `${pipelineContextMenu.x}px`, 
            top: `${pipelineContextMenu.y}px` 
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleRemovePipeline}
            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            파이프라인 삭제
          </button>
        </div>
      )}
    </div>
  );
};