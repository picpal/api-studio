import React, { useState, useEffect } from 'react';
import { ApiFolder, BaseUrl, ApiItem } from '../types/api';
import { folderApi, itemApi, convertBackendToFrontendFolder } from '../services/api';
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
import {
  useSortable,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

// Sortable Folder 컴포넌트
interface SortableFolderProps {
  folder: ApiFolder;
  selectedFolderId: string | null;
  selectedItemId: string | null;
  onToggleFolder: (folderId: string) => void;
  onSelectFolder: (folderId: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onSelectItem: (item: any, folderId: string) => void;
  onDeleteItem: (folderId: string, itemId: string) => void;
  onAddItem: (folderId: string) => void;
  getMethodColor: (method: string) => string;
  onContextMenu: (e: React.MouseEvent, folderId: string, folderName: string) => void;
  onItemContextMenu: (e: React.MouseEvent, itemId: string, itemName: string, folderId: string) => void;
}


const FolderComponent: React.FC<SortableFolderProps & { isDragOverFolder: boolean }> = ({
  folder,
  selectedFolderId,
  selectedItemId,
  onToggleFolder,
  onSelectFolder,
  onDeleteFolder,
  onSelectItem,
  onDeleteItem,
  onAddItem,
  getMethodColor,
  onContextMenu,
  onItemContextMenu,
  isDragOverFolder
}) => {
  const { setNodeRef: setDroppableRef } = useDroppable({
    id: `droppable-folder-${folder.id}`,
  });

  return (
    <div>
      <div 
        ref={setDroppableRef}
        className={`min-h-[44px] ${isDragOverFolder ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
      >
        <div 
          className={`p-2 px-4 cursor-pointer select-none hover:bg-gray-50 group flex items-center justify-between ${
            selectedFolderId === folder.id && !selectedItemId ? 'bg-blue-50 border-r-2 border-blue-500' : ''
          }`}
          onClick={() => {
            onToggleFolder(folder.id);
            onSelectFolder(folder.id);
          }}
          onContextMenu={(e) => onContextMenu(e, folder.id, folder.name)}
        >
          <div className="flex items-center gap-1.5 font-medium text-gray-800">
            <span 
              className={`text-xs transition-transform duration-200 ${
                folder.isExpanded ? 'rotate-90' : ''
              }`}
            >
              ▶
            </span>
            {folder.name}
          </div>
        </div>
        
        <div className={`${folder.isExpanded ? 'pb-2' : ''}`}>
          {folder.isExpanded && folder.items.map(item => (
            <SortableItem
              key={item.id}
              item={item}
              folderId={folder.id}
              isSelected={selectedItemId === item.id}
              onSelectItem={onSelectItem}
              onDeleteItem={onDeleteItem}
              getMethodColor={getMethodColor}
              onItemContextMenu={onItemContextMenu}
            />
          ))}
          {folder.isExpanded && folder.items.length === 0 && (
            <div className="ml-8 py-2 text-xs text-gray-400 italic">
              Drop items here or click "New Item" to add
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Sortable Item 컴포넌트
interface SortableItemProps {
  item: any;
  folderId: string;
  isSelected: boolean;
  onSelectItem: (item: any, folderId: string) => void;
  onDeleteItem: (folderId: string, itemId: string) => void;
  getMethodColor: (method: string) => string;
  onItemContextMenu: (e: React.MouseEvent, itemId: string, itemName: string, folderId: string) => void;
}

const SortableItem: React.FC<SortableItemProps> = ({
  item,
  folderId,
  isSelected,
  onSelectItem,
  onDeleteItem,
  getMethodColor,
  onItemContextMenu
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `item-${item.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`ml-5 p-1 px-2 flex items-center justify-between cursor-pointer hover:bg-gray-100 group ${
        isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : ''
      }`}
      onClick={() => onSelectItem(item, folderId)}
      onContextMenu={(e) => onItemContextMenu(e, item.id, item.name, folderId)}
    >
      <div className="flex items-center gap-2">
        <span 
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 text-xs"
        >
          ⋮⋮
        </span>
        <span className={`px-1.5 py-0.5 rounded text-xs font-semibold text-white ${getMethodColor(item.method)}`}>
          {item.method}
        </span>
        <span className="text-xs text-gray-800">{item.name}</span>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDeleteItem(folderId, item.id);
        }}
        className="ml-2 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        ×
      </button>
    </div>
  );
};

const getMethodColor = (method: string) => {
  switch (method) {
    case 'GET': return 'bg-green-600';
    case 'POST': return 'bg-blue-600';
    case 'PUT': return 'bg-orange-600';
    case 'DELETE': return 'bg-red-600';
    case 'PATCH': return 'bg-purple-600';
    default: return 'bg-gray-600';
  }
};

interface SidebarProps {
  baseUrls: BaseUrl[];
  onAddBaseUrl: (baseUrl: Omit<BaseUrl, 'id'>) => void;
  onUpdateBaseUrl: (id: string, updatedBaseUrl: Omit<BaseUrl, 'id'>) => void;
  onDeleteBaseUrl: (id: string) => void;
  onSelectItem?: (item: any, folderId: string) => void;
  onResetForm?: () => void;
  selectedItem?: ApiItem | null;
}

const Sidebar: React.FC<SidebarProps> = ({ baseUrls, onAddBaseUrl, onUpdateBaseUrl, onDeleteBaseUrl, onSelectItem, onResetForm, selectedItem }) => {
  const [folders, setFolders] = useState<ApiFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<any>(null);
  const [autoOpenTimeouts, setAutoOpenTimeouts] = useState<{ [key: string]: NodeJS.Timeout }>({});
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // 폴더 생성 모달 관련 상태
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  // 폴더 컨텍스트 메뉴 관련 상태
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    x: number;
    y: number;
    folderId: string;
    folderName: string;
  } | null>(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameFolderName, setRenameFolderName] = useState('');
  
  // 리네임 중인 폴더 정보를 별도로 저장
  const [renamingFolder, setRenamingFolder] = useState<{
    folderId: string;
    folderName: string;
  } | null>(null);

  // 아이템 컨텍스트 메뉴 관련 상태
  const [itemContextMenu, setItemContextMenu] = useState<{
    show: boolean;
    x: number;
    y: number;
    itemId: string;
    itemName: string;
    folderId: string;
  } | null>(null);
  const [showRenameItemModal, setShowRenameItemModal] = useState(false);
  const [renameItemName, setRenameItemName] = useState('');
  
  // 리네임 중인 아이템 정보를 별도로 저장
  const [renamingItem, setRenamingItem] = useState<{
    itemId: string;
    itemName: string;
    folderId: string;
  } | null>(null);

  // 백엔드에서 데이터 로드
  useEffect(() => {
    loadFolders();
  }, []);

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
  }, [selectedItem?.id, selectedItem?.method]);

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

  const loadFolders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [backendFolders, backendItems] = await Promise.all([
        folderApi.getAll(),
        itemApi.getAll()
      ]);

      // 백엔드 데이터를 프론트엔드 형식으로 변환
      const convertedFolders = backendFolders.map(folder => 
        convertBackendToFrontendFolder(folder, backendItems)
      );

      setFolders(convertedFolders);
    } catch (error) {
      console.error('폴더 로드 중 오류:', error);
      setError('데이터를 로드하는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };


  // 검색 필터링된 폴더들
  const filteredFolders = folders.map(folder => {
    if (!searchTerm) return folder;
    
    const matchingItems = folder.items.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.method.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const folderMatches = folder.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 폴더 이름이 매치되면 모든 아이템 표시, 아니면 매치되는 아이템만
    return {
      ...folder,
      items: folderMatches ? folder.items : matchingItems,
      isExpanded: searchTerm ? true : folder.isExpanded // 검색 중일 때 폴더 자동 확장
    };
  }).filter(folder => {
    if (!searchTerm) return true;
    // 폴더 이름이 매치되거나, 폴더 내에 매치되는 아이템이 있는 경우만 표시
    return folder.name.toLowerCase().includes(searchTerm.toLowerCase()) || folder.items.length > 0;
  });

  const toggleFolder = async (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    const newExpanded = !folder.isExpanded;
    
    // UI 먼저 업데이트 (빠른 반응성)
    setFolders(prev => prev.map(f => 
      f.id === folderId 
        ? { ...f, isExpanded: newExpanded }
        : f
    ));

    // 백엔드에 상태 저장 (비동기적으로 실행하되, 에러시에만 되돌림)
    try {
      await folderApi.update(parseInt(folderId), { isExpanded: newExpanded });
    } catch (error) {
      console.error('폴더 상태 업데이트 중 오류:', error);
      // 실패 시에만 원래 상태로 되돌림
      setFolders(prev => prev.map(f => 
        f.id === folderId 
          ? { ...f, isExpanded: !newExpanded }
          : f
      ));
      setError('폴더 상태를 저장하는 중 오류가 발생했습니다.');
    }
  };

  const handleNewFolder = () => {
    setNewFolderName('');
    setShowCreateFolderModal(true);
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) {
      setError('폴더 이름을 입력해주세요.');
      return;
    }

    try {
      const backendFolder = await folderApi.create({
        name: newFolderName.trim(),
        isExpanded: true
      });
      
      const newFolder = convertBackendToFrontendFolder(backendFolder, []);
      setFolders([...folders, newFolder]);
      setSelectedFolderId(newFolder.id);
      setSelectedItemId(null);
      
      // 모달 닫기
      setShowCreateFolderModal(false);
      setNewFolderName('');
    } catch (error) {
      console.error('폴더 생성 중 오류:', error);
      setError('폴더를 생성하는 중 오류가 발생했습니다.');
    }
  };

  const cancelCreateFolder = () => {
    setShowCreateFolderModal(false);
    setNewFolderName('');
  };

  // 컨텍스트 메뉴 관련 함수들
  const handleContextMenu = (e: React.MouseEvent, folderId: string, folderName: string) => {
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

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  // 아이템 컨텍스트 메뉴 관련 함수들
  const handleItemContextMenu = (e: React.MouseEvent, itemId: string, itemName: string, folderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    setItemContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      itemId,
      itemName,
      folderId
    });
  };

  const closeItemContextMenu = () => {
    setItemContextMenu(null);
  };

  const handleItemRename = () => {
    console.log('handleItemRename called, itemContextMenu:', itemContextMenu);
    if (itemContextMenu) {
      setRenameItemName(itemContextMenu.itemName);
      setShowRenameItemModal(true);
      
      // 리네임 중인 아이템 정보를 별도 상태로 저장
      setRenamingItem({
        itemId: itemContextMenu.itemId,
        itemName: itemContextMenu.itemName,
        folderId: itemContextMenu.folderId
      });
      console.log('Setting renamingItem:', itemContextMenu.itemId, itemContextMenu.itemName);
      
      closeItemContextMenu();
    } else {
      console.log('itemContextMenu is null in handleItemRename');
    }
  };

  const handleItemDelete = () => {
    if (itemContextMenu) {
      handleDeleteItem(itemContextMenu.folderId, itemContextMenu.itemId);
      closeItemContextMenu();
    }
  };

  const renameItem = async () => {
    console.log('renameItem called');
    console.log('renameItemName:', renameItemName);
    console.log('renamingItem:', renamingItem);
    
    if (!renameItemName.trim()) {
      setError('아이템 이름을 입력해주세요.');
      return;
    }

    const itemId = renamingItem?.itemId;
    if (!itemId) {
      console.log('No itemId found in renamingItem');
      setError('아이템 정보를 찾을 수 없습니다.');
      return;
    }

    try {
      console.log('Updating item:', itemId, 'with name:', renameItemName.trim());
      
      await itemApi.update(parseInt(itemId), { 
        name: renameItemName.trim() 
      });
      
      console.log('Item updated successfully');
      
      // UI 업데이트
      setFolders(prev => prev.map(folder => ({
        ...folder,
        items: folder.items.map(item => 
          item.id === itemId 
            ? { ...item, name: renameItemName.trim() }
            : item
        )
      })));
      
      // 모달 닫기
      setShowRenameItemModal(false);
      setRenameItemName('');
      setRenamingItem(null);
      setError(null);
      
      console.log('Item rename completed');
    } catch (error) {
      console.error('아이템 이름 변경 중 오류:', error);
      setError('아이템 이름을 변경하는 중 오류가 발생했습니다.');
    }
  };

  const cancelRenameItem = () => {
    setShowRenameItemModal(false);
    setRenameItemName('');
    setRenamingItem(null);
  };

  const handleRename = () => {
    console.log('handleRename called, contextMenu:', contextMenu);
    if (contextMenu) {
      setRenameFolderName(contextMenu.folderName);
      setShowRenameModal(true);
      
      // 리네임 중인 폴더 정보를 별도 상태로 저장
      setRenamingFolder({
        folderId: contextMenu.folderId,
        folderName: contextMenu.folderName
      });
      console.log('Setting renamingFolder:', contextMenu.folderId, contextMenu.folderName);
      
      closeContextMenu();
    } else {
      console.log('contextMenu is null in handleRename');
    }
  };

  const handleContextDelete = () => {
    if (contextMenu) {
      handleDeleteFolder(contextMenu.folderId);
      closeContextMenu();
    }
  };

  const handleContextAddItem = () => {
    if (contextMenu) {
      handleNewItem(contextMenu.folderId);
      closeContextMenu();
    }
  };

  const renameFolder = async () => {
    console.log('renameFolder called');
    console.log('renameFolderName:', renameFolderName);
    console.log('renamingFolder:', renamingFolder);
    
    if (!renameFolderName.trim()) {
      setError('폴더 이름을 입력해주세요.');
      return;
    }

    const folderId = renamingFolder?.folderId;
    if (!folderId) {
      console.log('No folderId found in renamingFolder');
      setError('폴더 정보를 찾을 수 없습니다.');
      return;
    }

    try {
      console.log('Updating folder:', folderId, 'with name:', renameFolderName.trim());
      
      await folderApi.update(parseInt(folderId), { 
        name: renameFolderName.trim() 
      });
      
      console.log('Folder updated successfully');
      
      setFolders(prev => prev.map(folder => 
        folder.id === folderId 
          ? { ...folder, name: renameFolderName.trim() }
          : folder
      ));
      
      setShowRenameModal(false);
      setRenameFolderName('');
      setRenamingFolder(null); // cleanup
      setError(null); // 성공 시 에러 메시지 클리어
    } catch (error) {
      console.error('폴더 이름 변경 중 오류:', error);
      setError('폴더 이름을 변경하는 중 오류가 발생했습니다.');
    }
  };

  const cancelRename = () => {
    setShowRenameModal(false);
    setRenameFolderName('');
    setRenamingFolder(null); // cleanup
  };

  const handleNewItem = async (targetFolderId?: string) => {
    const folderId = targetFolderId || selectedFolderId || folders[0]?.id;
    
    console.log('handleNewItem called with:', { targetFolderId, selectedFolderId, folderId });
    
    if (!folderId) {
      console.log('No folder ID available');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }

    try {
      console.log('Creating item for folder:', folderId);
      
      // 백엔드에 아이템 생성
      const backendItem = await itemApi.create({
        name: 'New Request',
        method: 'GET',
        url: '/api/endpoint',
        description: '',
        folderId: parseInt(folderId)
      });

      console.log('Backend item created:', backendItem);

      // 프론트엔드 형식으로 변환
      const newItem = {
        id: backendItem.id?.toString() || '',
        name: backendItem.name,
        method: backendItem.method,
        url: backendItem.url,
        description: backendItem.description || '',
        folder: folderId
      };

      console.log('Frontend item:', newItem);

      // UI 업데이트
      setFolders(prev => prev.map(folder => 
        folder.id === folderId 
          ? { ...folder, items: [...folder.items, newItem], isExpanded: true }
          : folder
      ));

      setSelectedItemId(newItem.id);
      setSelectedFolderId(folderId);
      
      if (onResetForm) {
        onResetForm();
      }
      if (onSelectItem) {
        onSelectItem(newItem, folderId);
      }
      
      console.log('Item creation completed successfully');
    } catch (error) {
      console.error('아이템 생성 중 오류:', error);
      setError('새로운 아이템을 생성하는 중 오류가 발생했습니다.');
    }
  };

  const handleSelectFolder = (folderId: string) => {
    setSelectedFolderId(folderId);
    setSelectedItemId(null);
  };

  const handleSelectItem = (item: any, folderId: string) => {
    setSelectedItemId(item.id);
    setSelectedFolderId(folderId);
    if (onSelectItem) {
      onSelectItem(item, folderId);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      await folderApi.delete(parseInt(folderId));
      
      setFolders(folders.filter(f => f.id !== folderId));
      if (selectedFolderId === folderId) {
        setSelectedFolderId(null);
        setSelectedItemId(null);
      }
    } catch (error) {
      console.error('폴더 삭제 중 오류:', error);
      setError('폴더를 삭제하는 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteItem = async (folderId: string, itemId: string) => {
    try {
      // 백엔드에서 아이템 삭제
      await itemApi.delete(parseInt(itemId));
      
      // UI 업데이트
      setFolders(prev => prev.map(folder => 
        folder.id === folderId 
          ? { ...folder, items: folder.items.filter(item => item.id !== itemId) }
          : folder
      ));
      
      if (selectedItemId === itemId) {
        setSelectedItemId(null);
      }
    } catch (error) {
      console.error('아이템 삭제 중 오류:', error);
      setError('아이템을 삭제하는 중 오류가 발생했습니다.');
    }
  };

  // Drag & Drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeId = active.id as string;
    
    if (activeId.startsWith('item-')) {
      const [, itemId] = activeId.split('-');
      const item = folders.find(f => f.items.some(i => i.id === itemId))?.items.find(i => i.id === itemId);
      setActiveItem(item);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setDragOverFolderId(null);
      // 모든 자동 열기 타이머 클리어
      Object.values(autoOpenTimeouts).forEach(timeout => clearTimeout(timeout));
      setAutoOpenTimeouts({});
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // 아이템을 드래그 중일 때만 폴더 하이라이트
    if (activeId.startsWith('item-')) {
      if (overId.startsWith('droppable-folder-')) {
        const folderId = overId.replace('droppable-folder-', '');
        setDragOverFolderId(folderId);
        
        // 폴더가 닫혀있으면 1초 후 자동으로 열기
        const targetFolder = folders.find(f => f.id === folderId);
        if (targetFolder && !targetFolder.isExpanded) {
          if (!autoOpenTimeouts[folderId]) {
            const timeout = setTimeout(() => {
              setFolders(prev => prev.map(folder => 
                folder.id === folderId 
                  ? { ...folder, isExpanded: true }
                  : folder
              ));
            }, 1000);
            setAutoOpenTimeouts(prev => ({ ...prev, [folderId]: timeout }));
          }
        }
      } else {
        setDragOverFolderId(null);
        // 다른 영역으로 벗어나면 타이머 클리어
        Object.values(autoOpenTimeouts).forEach(timeout => clearTimeout(timeout));
        setAutoOpenTimeouts({});
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDragOverFolderId(null);
    setActiveItem(null);
    
    // 모든 자동 열기 타이머 클리어
    Object.values(autoOpenTimeouts).forEach(timeout => clearTimeout(timeout));
    setAutoOpenTimeouts({});

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    console.log('Drag End:', { activeId, overId });


    // 아이템을 다른 폴더로 이동 또는 순서 변경
    if (activeId.startsWith('item-')) {
      const itemId = activeId.replace('item-', '');
      const sourceFolderId = folders.find(f => f.items.some(i => i.id === itemId))?.id;
      
      console.log('Item drag:', { itemId, sourceFolderId });
      
      if (!sourceFolderId) return;

      // 드롭존이 폴더인 경우
      if (overId.startsWith('droppable-folder-')) {
        const targetFolderId = overId.replace('droppable-folder-', '');
        console.log('Drop on folder:', { targetFolderId, sourceFolderId });
        
        if (sourceFolderId !== targetFolderId) {
          const draggedItem = folders.find(f => f.id === sourceFolderId)?.items.find(i => i.id === itemId);
          console.log('Moving item:', { draggedItem });
          
          if (draggedItem) {
            setFolders(prev => {
              const newFolders = prev.map(folder => {
                if (folder.id === sourceFolderId) {
                  return { ...folder, items: folder.items.filter(item => item.id !== itemId) };
                }
                if (folder.id === targetFolderId) {
                  return { ...folder, items: [...folder.items, draggedItem], isExpanded: true };
                }
                return folder;
              });
              console.log('Updated folders:', newFolders);
              return newFolders;
            });
          }
        }
      } else if (overId.startsWith('item-')) {
        // 같은 폴더 내 아이템 순서 변경
        const overItemId = overId.replace('item-', '');
        const targetFolder = folders.find(f => f.items.some(i => i.id === overItemId));
        
        if (targetFolder && targetFolder.id === sourceFolderId) {
          const activeIndex = targetFolder.items.findIndex(i => i.id === itemId);
          const overIndex = targetFolder.items.findIndex(i => i.id === overItemId);
          
          if (activeIndex !== overIndex) {
            setFolders(prev => prev.map(folder => {
              if (folder.id === targetFolder.id) {
                return { ...folder, items: arrayMove(folder.items, activeIndex, overIndex) };
              }
              return folder;
            }));
          }
        }
      }
    }
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-primary rounded flex items-center justify-content-center text-white text-xs font-bold">
            📘
          </div>
          <h1 className="text-base font-semibold text-gray-800 m-0">blue API Tester</h1>
        </div>
        <button 
          onClick={handleNewFolder}
          className="px-3 py-1.5 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded border border-blue-300 transition-colors"
        >
          + Create Folder
        </button>
      </div>
      
      
      {/* Search Section */}
      <div className="p-3 border-b border-gray-200">
        <div className="relative">
          <input
            type="text"
            placeholder="Search folders and items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 pl-8 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
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
                    onDeleteFolder={handleDeleteFolder}
                    onSelectItem={handleSelectItem}
                    onDeleteItem={handleDeleteItem}
                    onAddItem={handleNewItem}
                    getMethodColor={getMethodColor}
                    onContextMenu={handleContextMenu}
                    onItemContextMenu={handleItemContextMenu}
                    isDragOverFolder={dragOverFolderId === folder.id}
                  />
                ))
              )}
            </SortableContext>
            <DragOverlay>
              {activeItem ? (
                <div className="ml-5 p-1 px-2 flex items-center gap-2 bg-white shadow-lg border border-gray-200 rounded opacity-90">
                  <span className={`px-1.5 py-0.5 rounded text-xs font-semibold text-white ${getMethodColor(activeItem.method)}`}>
                    {activeItem.method}
                  </span>
                  <span className="text-xs text-gray-800">{activeItem.name}</span>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
      
      {/* Create Folder Modal */}
      {showCreateFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-80">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Create New Folder</h3>
            <input
              type="text"
              placeholder="Enter folder name..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  createFolder();
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={cancelCreateFolder}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createFolder}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors"
                disabled={!newFolderName.trim()}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu?.show && (
        <div 
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50"
          style={{ 
            left: contextMenu.x, 
            top: contextMenu.y,
            minWidth: '120px'
          }}
        >
          <button
            onClick={handleRename}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            ✏️ Rename
          </button>
          <button
            onClick={handleContextAddItem}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            ➕ Add Item
          </button>
          <hr className="my-1 border-gray-200" />
          <button
            onClick={handleContextDelete}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            🗑️ Delete
          </button>
        </div>
      )}

      {/* Item Context Menu */}
      {itemContextMenu?.show && (
        <div 
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50"
          style={{ 
            left: itemContextMenu.x, 
            top: itemContextMenu.y,
            minWidth: '120px'
          }}
        >
          <button
            onClick={handleItemRename}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            ✏️ Rename
          </button>
          <hr className="my-1 border-gray-200" />
          <button
            onClick={handleItemDelete}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            🗑️ Delete
          </button>
        </div>
      )}

      {/* Rename Folder Modal */}
      {showRenameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-80">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Rename Folder</h3>
            <input
              type="text"
              placeholder="Enter new folder name..."
              value={renameFolderName}
              onChange={(e) => setRenameFolderName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  renameFolder();
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={cancelRename}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={renameFolder}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors"
                disabled={!renameFolderName.trim()}
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Item Modal */}
      {showRenameItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-80">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Rename Item</h3>
            <input
              type="text"
              placeholder="Enter new item name..."
              value={renameItemName}
              onChange={(e) => setRenameItemName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  renameItem();
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
            {error && (
              <div className="mt-2 text-sm text-red-600">
                {error}
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <button
                onClick={renameItem}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Rename
              </button>
              <button
                onClick={cancelRenameItem}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert for New Item */}
      {showAlert && (
        <div className="fixed top-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded shadow-lg z-50">
          <div className="flex items-center">
            <span className="text-sm">⚠️ Please select a folder first or create one.</span>
            <button
              onClick={() => setShowAlert(false)}
              className="ml-3 text-yellow-700 hover:text-yellow-900"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;