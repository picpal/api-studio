import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { BaseUrl, ApiItem } from '../../types/api';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  rectIntersection,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { useSidebar } from '../../hooks/useSidebar';
import { getMethodBadgeColor } from '../../utils/methodColors';
import SearchBar from './SearchBar';
import FolderComponent from './FolderComponent';
import { FolderContextMenu, ItemContextMenu } from './ContextMenu';
import Modal from './Modal';
import Alert from './Alert';

interface SidebarProps {
  baseUrls: BaseUrl[];
  onAddBaseUrl: (baseUrl: Omit<BaseUrl, 'id'>) => void;
  onUpdateBaseUrl: (id: string, updatedBaseUrl: Omit<BaseUrl, 'id'>) => void;
  onDeleteBaseUrl: (id: string) => void;
  onSelectItem?: (item: any, folderId: string, folderName?: string) => void;
  onResetForm?: () => void;
  selectedItem?: ApiItem | null;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onFolderUpdate?: (folderId: string, folderName: string) => void;
  onItemUpdate?: (itemId: string, itemName: string) => void;
}

const SidebarRefactored: React.FC<SidebarProps> = ({ 
  baseUrls, 
  onAddBaseUrl, 
  onUpdateBaseUrl, 
  onDeleteBaseUrl, 
  onSelectItem, 
  onResetForm, 
  selectedItem,
  collapsed = false,
  onToggleCollapse,
  onFolderUpdate,
  onItemUpdate
}) => {
  const {
    folders,
    filteredFolders,
    loading,
    error,
    selectedFolderId,
    selectedItemId,
    searchTerm,
    setFolders,
    setError,
    setSelectedFolderId,
    setSelectedItemId,
    setSearchTerm,
    loadFolders,
    toggleFolder,
    createFolder,
    renameFolder,
    deleteFolder,
    createItem,
    renameItem,
    deleteItem,
    moveItemToFolder,
    reorderItemsInFolder,
  } = useSidebar();

  // Drag & Drop 관련 상태
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<any>(null);
  const [autoOpenTimeouts, setAutoOpenTimeouts] = useState<{ [key: string]: NodeJS.Timeout }>({});

  // 모달 상태
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameFolderName, setRenameFolderName] = useState('');
  const [showRenameItemModal, setShowRenameItemModal] = useState(false);
  const [renameItemName, setRenameItemName] = useState('');

  // 컨텍스트 메뉴 상태
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    x: number;
    y: number;
    folderId: string;
    folderName: string;
  } | null>(null);

  const [itemContextMenu, setItemContextMenu] = useState<{
    show: boolean;
    x: number;
    y: number;
    itemId: string;
    itemName: string;
    folderId: string;
  } | null>(null);

  // 현재 작업 중인 항목들
  const [renamingFolder, setRenamingFolder] = useState<{
    folderId: string;
    folderName: string;
  } | null>(null);

  const [renamingItem, setRenamingItem] = useState<{
    itemId: string;
    itemName: string;
    folderId: string;
  } | null>(null);

  // 알림
  const [showAlert, setShowAlert] = useState(false);

  // 스크롤 상태
  const [isScrollable, setIsScrollable] = useState(false);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // selectedItem이 변경될 때 해당 아이템 업데이트
  useEffect(() => {
    if (selectedItem) {
      setFolders(prevFolders => 
        prevFolders.map(folder => ({
          ...folder,
          items: folder.items.map(item => 
            item.id === selectedItem.id 
              ? { ...item, method: selectedItem.method }
              : item
          )
        }))
      );
    }
  }, [selectedItem?.id, selectedItem?.method, setFolders]);

  // 컨텍스트 메뉴 외부 클릭시 닫기
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null);
      setItemContextMenu(null);
    };

    if (contextMenu?.show || itemContextMenu?.show) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu, itemContextMenu]);

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
  }, [filteredFolders, loading, error]);

  // Drag & Drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 폴더 생성 핸들러
  const handleNewFolder = () => {
    setNewFolderName('');
    setShowCreateFolderModal(true);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      setError('폴더 이름을 입력해주세요.');
      return;
    }

    try {
      await createFolder(newFolderName);
      setShowCreateFolderModal(false);
      setNewFolderName('');
    } catch (error) {
      // 에러는 useSidebar에서 처리됨
    }
  };

  const cancelCreateFolder = () => {
    setShowCreateFolderModal(false);
    setNewFolderName('');
  };

  // 새 아이템 생성
  const handleNewItem = async (targetFolderId?: string) => {
    const folderId = targetFolderId || selectedFolderId || filteredFolders[0]?.id;
    
    if (!folderId) {
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }

    try {
      const newItem = await createItem(folderId);
      
      if (onResetForm) {
        onResetForm();
      }
      if (onSelectItem) {
        onSelectItem(newItem, folderId);
      }
    } catch (error) {
      // 에러는 useSidebar에서 처리됨
    }
  };

  // Expand/Collapse All handlers
  const handleExpandAll = () => {
    folders.forEach(folder => {
      if (!folder.isExpanded) {
        toggleFolder(folder.id);
      }
    });
  };

  const handleCollapseAll = () => {
    folders.forEach(folder => {
      if (folder.isExpanded) {
        toggleFolder(folder.id);
      }
    });
  };

  // 선택 핸들러
  const handleSelectFolder = (folderId: string) => {
    setSelectedFolderId(folderId);
    setSelectedItemId(null);
  };

  const handleSelectItem = (item: any, folderId: string) => {
    setSelectedItemId(item.id);
    setSelectedFolderId(folderId);
    if (onSelectItem) {
      // 폴더명을 찾아서 전달
      const folder = folders.find(f => f.id === folderId);
      onSelectItem(item, folderId, folder?.name);
    }
  };

  // 컨텍스트 메뉴 핸들러
  const handleContextMenu = (e: React.MouseEvent, folderId: string, folderName: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 아이템 컨텍스트 메뉴가 열려있다면 닫기
    if (itemContextMenu?.show) {
      setItemContextMenu(null);
    }
    
    // 메뉴 크기 예상치 (실제 렌더링 크기에 맞게 조정)
    const menuWidth = 150;
    const menuHeight = 140; // 3개 아이템 + 구분선 (약 140px)
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const clickX = e.clientX;
    const clickY = e.clientY;
    
    // 화면 하단에 공간이 충분하지 않으면 위로 표시
    // 최소한 클릭 지점과 가까운 위치에 메뉴를 표시
    const spaceBelow = windowHeight - clickY;
    const spaceAbove = clickY;
    const padding = 10; // 화면 가장자리 여백
    
    let adjustedY;
    if (spaceBelow >= menuHeight + padding) {
      // 아래 공간이 충분하면 그대로 표시
      adjustedY = clickY;
    } else if (spaceAbove >= menuHeight + padding) {
      // 위 공간이 충분하면 메뉴를 클릭 위치 바로 위에 표시
      // 클릭 위치에서 메뉴 높이만큼 위로 이동
      adjustedY = Math.max(padding, clickY - menuHeight);
    } else {
      // 둘 다 부족하면 화면 내에서 최적 위치 찾기
      adjustedY = Math.min(windowHeight - menuHeight - padding, Math.max(padding, clickY - menuHeight/2));
    }
    
    // 화면 우측에 공간이 충분하지 않으면 왼쪽으로 표시
    const adjustedX = (clickX + menuWidth > windowWidth - 20)
      ? Math.max(10, clickX - menuWidth)
      : clickX;
    
    setContextMenu({
      show: true,
      x: adjustedX,
      y: adjustedY,
      folderId,
      folderName
    });
  };

  const handleItemContextMenu = (e: React.MouseEvent, itemId: string, itemName: string, folderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 폴더 컨텍스트 메뉴가 열려있다면 닫기
    if (contextMenu?.show) {
      setContextMenu(null);
    }
    
    // 메뉴 크기 예상치 (실제 렌더링 크기에 맞게 조정)
    const menuWidth = 150;
    const menuHeight = 100; // 2개 아이템 + 구분선 (약 100px)
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const clickX = e.clientX;
    const clickY = e.clientY;
    
    // 화면 하단에 공간이 충분하지 않으면 위로 표시
    // 최소한 클릭 지점과 가까운 위치에 메뉴를 표시
    const spaceBelow = windowHeight - clickY;
    const spaceAbove = clickY;
    const padding = 10; // 화면 가장자리 여백
    
    let adjustedY;
    if (spaceBelow >= menuHeight + padding) {
      // 아래 공간이 충분하면 그대로 표시
      adjustedY = clickY;
    } else if (spaceAbove >= menuHeight + padding) {
      // 위 공간이 충분하면 메뉴를 클릭 위치 바로 위에 표시
      // 클릭 위치에서 메뉴 높이만큼 위로 이동
      adjustedY = Math.max(padding, clickY - menuHeight);
    } else {
      // 둘 다 부족하면 화면 내에서 최적 위치 찾기
      adjustedY = Math.min(windowHeight - menuHeight - padding, Math.max(padding, clickY - menuHeight/2));
    }
    
    // 화면 우측에 공간이 충분하지 않으면 왼쪽으로 표시
    const adjustedX = (clickX + menuWidth > windowWidth - 20)
      ? Math.max(10, clickX - menuWidth)
      : clickX;
    
    setItemContextMenu({
      show: true,
      x: adjustedX,
      y: adjustedY,
      itemId,
      itemName,
      folderId
    });
  };

  // 폴더 리네임
  const handleRename = () => {
    if (contextMenu) {
      setRenameFolderName(contextMenu.folderName);
      setShowRenameModal(true);
      setRenamingFolder({
        folderId: contextMenu.folderId,
        folderName: contextMenu.folderName
      });
      setContextMenu(null);
    }
  };

  const handleRenameFolderConfirm = async () => {
    if (!renameFolderName.trim()) {
      setError('폴더 이름을 입력해주세요.');
      return;
    }

    const folderId = renamingFolder?.folderId;
    if (!folderId) {
      setError('폴더 정보를 찾을 수 없습니다.');
      return;
    }

    try {
      await renameFolder(folderId, renameFolderName);
      setShowRenameModal(false);
      setRenameFolderName('');
      setRenamingFolder(null);
      
      // Layout 컴포넌트에 폴더 업데이트 알림
      if (onFolderUpdate) {
        onFolderUpdate(folderId, renameFolderName.trim());
      }
    } catch (error) {
      // 에러는 useSidebar에서 처리됨
    }
  };

  const cancelRename = () => {
    setShowRenameModal(false);
    setRenameFolderName('');
    setRenamingFolder(null);
  };

  // 아이템 리네임
  const handleItemRename = () => {
    if (itemContextMenu) {
      setRenameItemName(itemContextMenu.itemName);
      setShowRenameItemModal(true);
      setRenamingItem({
        itemId: itemContextMenu.itemId,
        itemName: itemContextMenu.itemName,
        folderId: itemContextMenu.folderId
      });
      setItemContextMenu(null);
    }
  };

  const handleRenameItemConfirm = async () => {
    if (!renameItemName.trim()) {
      setError('아이템 이름을 입력해주세요.');
      return;
    }

    const itemId = renamingItem?.itemId;
    if (!itemId) {
      setError('아이템 정보를 찾을 수 없습니다.');
      return;
    }

    try {
      await renameItem(itemId, renameItemName);
      setShowRenameItemModal(false);
      setRenameItemName('');
      setRenamingItem(null);
      
      // Layout 컴포넌트에 아이템 업데이트 알림
      if (onItemUpdate) {
        onItemUpdate(itemId, renameItemName.trim());
      }
    } catch (error) {
      // 에러는 useSidebar에서 처리됨
    }
  };

  const cancelRenameItem = () => {
    setShowRenameItemModal(false);
    setRenameItemName('');
    setRenamingItem(null);
  };

  // 삭제 핸들러
  const handleContextDelete = () => {
    if (contextMenu) {
      deleteFolder(contextMenu.folderId);
      setContextMenu(null);
    }
  };

  const handleItemDelete = () => {
    if (itemContextMenu) {
      deleteItem(itemContextMenu.folderId, itemContextMenu.itemId);
      setItemContextMenu(null);
    }
  };

  const handleContextAddItem = () => {
    if (contextMenu) {
      handleNewItem(contextMenu.folderId);
      setContextMenu(null);
    }
  };

  // Drag & Drop 핸들러
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeId = active.id as string;
    
    if (activeId.startsWith('item-')) {
      const [, itemId] = activeId.split('-');
      const item = filteredFolders.find(f => f.items.some(i => i.id === itemId))?.items.find(i => i.id === itemId);
      setActiveItem(item);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setDragOverFolderId(null);
      Object.values(autoOpenTimeouts).forEach(timeout => clearTimeout(timeout));
      setAutoOpenTimeouts({});
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId.startsWith('item-')) {
      if (overId.startsWith('droppable-folder-')) {
        const folderId = overId.replace('droppable-folder-', '');
        setDragOverFolderId(folderId);
        
        const targetFolder = filteredFolders.find(f => f.id === folderId);
        if (targetFolder && !targetFolder.isExpanded) {
          if (!autoOpenTimeouts[folderId]) {
            const timeout = setTimeout(() => {
              toggleFolder(folderId);
            }, 1000);
            setAutoOpenTimeouts(prev => ({ ...prev, [folderId]: timeout }));
          }
        }
      } else {
        setDragOverFolderId(null);
        Object.values(autoOpenTimeouts).forEach(timeout => clearTimeout(timeout));
        setAutoOpenTimeouts({});
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDragOverFolderId(null);
    setActiveItem(null);
    
    Object.values(autoOpenTimeouts).forEach(timeout => clearTimeout(timeout));
    setAutoOpenTimeouts({});

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId.startsWith('item-')) {
      const itemId = activeId.replace('item-', '');
      // 실제 folders에서 검색 (filteredFolders가 아닌)
      const sourceFolder = folders.find(f => f.items.some(i => i.id === itemId));
      const sourceFolderId = sourceFolder?.id;
      
      if (!sourceFolderId) return;

      if (overId.startsWith('droppable-folder-')) {
        // 아이템을 다른 폴더로 이동
        const targetFolderId = overId.replace('droppable-folder-', '');
        
        if (sourceFolderId !== targetFolderId) {
          moveItemToFolder(itemId, sourceFolderId, targetFolderId);
        }
      } else if (overId.startsWith('item-')) {
        // 같은 폴더 내 아이템 순서 변경
        const overItemId = overId.replace('item-', '');
        const targetFolder = filteredFolders.find(f => f.items.some(i => i.id === overItemId));
        
        if (targetFolder && targetFolder.id === sourceFolderId) {
          const activeIndex = targetFolder.items.findIndex(i => i.id === itemId);
          const overIndex = targetFolder.items.findIndex(i => i.id === overItemId);
          
          if (activeIndex !== overIndex) {
            const reorderedItems = arrayMove(targetFolder.items, activeIndex, overIndex);
            reorderItemsInFolder(targetFolder.id, activeIndex, overIndex, reorderedItems);
          }
        }
      }
    }
  };

  if (collapsed) {
    return (
      <div className="w-12 h-full border-r border-gray-200 bg-white flex flex-col items-center py-3">
        {/* Toggle Button - Collapsed State */}
        <div className="mb-3">
          <button 
            onClick={onToggleCollapse}
            className="w-8 h-8 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors flex items-center justify-center"
            title="Expand Sidebar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        {/* Create Folder - Collapsed State */}
        <div className="mb-4">
          <button 
            onClick={handleNewFolder}
            className="w-8 h-8 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors flex items-center justify-center"
            title="Create Folder"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
        
        {/* Collapsed folder indicators */}
        <div className="flex flex-col gap-1 items-center pb-4">
          {filteredFolders.slice(0, 5).map(folder => (
            <div 
              key={folder.id}
              className={`w-8 h-8 rounded flex items-center justify-center text-xs font-medium cursor-pointer transition-colors ${
                selectedFolderId === folder.id ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100 text-gray-600'
              }`}
              onClick={() => {
                handleSelectFolder(folder.id);
                
                // 폴더에 아이템이 있으면 첫 번째 아이템을 선택
                if (folder.items.length > 0) {
                  const firstItem = folder.items[0];
                  handleSelectItem(firstItem, folder.id);
                }
                
                // 사이드바를 자동으로 펼침
                if (onToggleCollapse) {
                  onToggleCollapse();
                }
                
                // 폴더가 접혀있으면 펼치기
                if (!folder.isExpanded) {
                  toggleFolder(folder.id);
                }
              }}
              title={`${folder.name} (${folder.items.length} items) - Click to expand and view`}
            >
              <div className="relative">
                {folder.name.charAt(0).toUpperCase()}
                {folder.items.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </div>
            </div>
          ))}
          {filteredFolders.length > 5 && (
            <button
              onClick={() => {
                // 더 많은 폴더가 있을 때 클릭하면 사이드바를 펼침
                if (onToggleCollapse) {
                  onToggleCollapse();
                }
              }}
              className="text-xs text-gray-400 hover:text-gray-600 mt-2 cursor-pointer transition-colors"
              title="View all folders"
            >
              +{filteredFolders.length - 5}
            </button>
          )}
        </div>
        
        {/* Modals rendered in portal to body - collapsed state */}
        {createPortal(
          <>
            <Modal
              isOpen={showCreateFolderModal}
              title="Create New Folder"
              value={newFolderName}
              placeholder="Enter folder name..."
              onValueChange={setNewFolderName}
              onConfirm={handleCreateFolder}
              onCancel={cancelCreateFolder}
              confirmText="Create"
              error={error}
            />

            <Modal
              isOpen={showRenameModal}
              title="Rename Folder"
              value={renameFolderName}
              placeholder="Enter new folder name..."
              onValueChange={setRenameFolderName}
              onConfirm={handleRenameFolderConfirm}
              onCancel={cancelRename}
              confirmText="Rename"
              error={error}
            />

            <Modal
              isOpen={showRenameItemModal}
              title="Rename Item"
              value={renameItemName}
              placeholder="Enter new item name..."
              onValueChange={setRenameItemName}
              onConfirm={handleRenameItemConfirm}
              onCancel={cancelRenameItem}
              confirmText="Rename"
              error={error}
            />

            {/* Context Menus */}
            <FolderContextMenu
              show={contextMenu?.show || false}
              x={contextMenu?.x || 0}
              y={contextMenu?.y || 0}
              onRename={handleRename}
              onAddItem={handleContextAddItem}
              onDelete={handleContextDelete}
            />

            <ItemContextMenu
              show={itemContextMenu?.show || false}
              x={itemContextMenu?.x || 0}
              y={itemContextMenu?.y || 0}
              onRename={handleItemRename}
              onDelete={handleItemDelete}
            />

            {/* Alert */}
            <Alert
              show={showAlert}
              message="Please select a folder first or create one."
              onClose={() => setShowAlert(false)}
            />
          </>,
          document.body
        )}
      </div>
    );
  }

  return (
    <div className="w-80 h-full border-r border-gray-200 bg-white flex flex-col overflow-hidden">
      {/* Header with Create Folder Button and Toggle */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          {/* Create Folder Button */}
          <button 
            onClick={handleNewFolder}
            className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors font-medium border border-blue-200 hover:border-blue-300"
          >
            + Create Folder
          </button>
          
          {/* Toggle Button */}
          <button 
            onClick={onToggleCollapse}
            className="w-8 h-8 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors flex items-center justify-center flex-shrink-0"
            title="Collapse Sidebar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="px-4 py-3 border-b border-gray-100">
        <SearchBar 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onExpandAll={handleExpandAll}
          onCollapseAll={handleCollapseAll}
        />
      </div>
      
      {/* Folders List */}
      <div className="flex-1 relative min-h-0">
        <div 
          ref={scrollContainerRef}
          className="overflow-y-auto h-full pb-4"
        >
        {loading ? (
          <div className="p-4 text-center text-gray-500">
            <div className="text-2xl mb-2">⏳</div>
            <div className="text-sm">Loading folders...</div>
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">
            <div className="text-2xl mb-2">❌</div>
            <div className="text-sm mb-2">{error}</div>
            <button 
              onClick={loadFolders}
              className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              Retry
            </button>
          </div>
        ) : (
          <DndContext 
            sensors={sensors}
            collisionDetection={rectIntersection}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={filteredFolders.flatMap(folder => folder.items.map(item => `item-${item.id}`))}
              strategy={verticalListSortingStrategy}
            >
              {filteredFolders.length === 0 && searchTerm ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  <div className="text-2xl mb-2">🔍</div>
                  No results found for "{searchTerm}"
                </div>
              ) : filteredFolders.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  <div className="text-2xl mb-2">📁</div>
                  <div className="mb-2">No folders yet</div>
                  <button 
                    onClick={handleNewFolder}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    Create First Folder
                  </button>
                </div>
              ) : (
                filteredFolders.map(folder => (
                  <FolderComponent
                    key={folder.id}
                    folder={folder}
                    selectedFolderId={selectedFolderId}
                    selectedItemId={selectedItemId}
                    onToggleFolder={toggleFolder}
                    onSelectFolder={handleSelectFolder}
                    onDeleteFolder={deleteFolder}
                    onSelectItem={handleSelectItem}
                    onDeleteItem={deleteItem}
                    onAddItem={handleNewItem}
                    getMethodColor={getMethodBadgeColor}
                    onContextMenu={handleContextMenu}
                    onItemContextMenu={handleItemContextMenu}
                    isDragOverFolder={dragOverFolderId === folder.id}
                  />
                ))
              )}
            </SortableContext>
            <DragOverlay>
              {activeItem ? (
                <div className="ml-8 px-2.5 py-1.5 flex items-center gap-2 bg-white shadow-lg rounded-md opacity-90">
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium text-white ${getMethodBadgeColor(activeItem.method)}`}>
                    {activeItem.method}
                  </span>
                  <span className="text-xs text-gray-800">{activeItem.name}</span>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
        </div>
        
        {/* 하단 그라이데이션 */}
        {isScrollable && (
          <div className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none bg-gradient-to-t from-white via-white/80 to-transparent" />
        )}
      </div>
      
      {/* Modals rendered in portal to body */}
      {createPortal(
        <>
          <Modal
            isOpen={showCreateFolderModal}
            title="Create New Folder"
            value={newFolderName}
            placeholder="Enter folder name..."
            onValueChange={setNewFolderName}
            onConfirm={handleCreateFolder}
            onCancel={cancelCreateFolder}
            confirmText="Create"
            error={error}
          />

          <Modal
            isOpen={showRenameModal}
            title="Rename Folder"
            value={renameFolderName}
            placeholder="Enter new folder name..."
            onValueChange={setRenameFolderName}
            onConfirm={handleRenameFolderConfirm}
            onCancel={cancelRename}
            confirmText="Rename"
            error={error}
          />

          <Modal
            isOpen={showRenameItemModal}
            title="Rename Item"
            value={renameItemName}
            placeholder="Enter new item name..."
            onValueChange={setRenameItemName}
            onConfirm={handleRenameItemConfirm}
            onCancel={cancelRenameItem}
            confirmText="Rename"
            error={error}
          />

          {/* Context Menus */}
          <FolderContextMenu
            show={contextMenu?.show || false}
            x={contextMenu?.x || 0}
            y={contextMenu?.y || 0}
            onRename={handleRename}
            onAddItem={handleContextAddItem}
            onDelete={handleContextDelete}
          />

          <ItemContextMenu
            show={itemContextMenu?.show || false}
            x={itemContextMenu?.x || 0}
            y={itemContextMenu?.y || 0}
            onRename={handleItemRename}
            onDelete={handleItemDelete}
          />

          {/* Alert */}
          <Alert
            show={showAlert}
            message="Please select a folder first or create one."
            onClose={() => setShowAlert(false)}
          />
        </>,
        document.body
      )}
    </div>
  );
};

export default SidebarRefactored;