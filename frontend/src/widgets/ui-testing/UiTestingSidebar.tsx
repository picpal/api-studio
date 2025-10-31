// UI Testing 사이드바 위젯 (API Testing 사이드바와 동일한 구조)

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  FolderIcon,
  DocumentTextIcon,
  PlusIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  MagnifyingGlassIcon,
  CodeBracketIcon,
  PlayIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';
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
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useUiTestingSidebar } from '../../features/ui-testing/hooks/useUiTestingSidebar';
import { UiTestScript } from '../../entities/ui-testing/types';
import ScriptUpload from '../../features/ui-testing/components/ScriptUpload';

interface UiTestingSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onSelectScript?: (script: UiTestScript, folderId: number | null, folderName?: string) => void;
  onResetForm?: () => void;
  selectedScript?: UiTestScript | null;
  onFolderUpdate?: (folderId: number, folderName: string) => void;
  onScriptUpdate?: (scriptId: number, scriptName: string) => void;
}

// 컨텍스트 메뉴 컴포넌트들
const FolderContextMenu: React.FC<{
  show: boolean;
  x: number;
  y: number;
  onRename: () => void;
  onAddScript: () => void;
  onDelete: () => void;
}> = ({ show, x, y, onRename, onAddScript, onDelete }) => {
  if (!show) return null;

  return (
    <div
      className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[150px]"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={onRename}
        className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 flex items-center gap-2"
      >
        Rename Folder
      </button>
      <hr className="my-1 border-gray-100" />
      <button
        onClick={onAddScript}
        className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 flex items-center gap-2"
      >
        Add Script
      </button>
      <hr className="my-1 border-gray-100" />
      <button
        onClick={onDelete}
        className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 text-red-600 flex items-center gap-2"
      >
        Delete Folder
      </button>
    </div>
  );
};

const ScriptContextMenu: React.FC<{
  show: boolean;
  x: number;
  y: number;
  onRename: () => void;
  onDelete: () => void;
}> = ({ show, x, y, onRename, onDelete }) => {
  if (!show) return null;

  return (
    <div
      className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[150px]"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={onRename}
        className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 flex items-center gap-2"
      >
        Rename Script
      </button>
      <hr className="my-1 border-gray-100" />
      <button
        onClick={onDelete}
        className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 text-red-600 flex items-center gap-2"
      >
        Delete Script
      </button>
    </div>
  );
};

// 모달 컴포넌트
const Modal: React.FC<{
  isOpen: boolean;
  title: string;
  value: string;
  placeholder: string;
  onValueChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText: string;
  error?: string | null;
}> = ({ isOpen, title, value, placeholder, onValueChange, onConfirm, onCancel, confirmText, error }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
        <h3 className="text-lg font-medium mb-4">{title}</h3>
        <input
          type="text"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={placeholder}
          className="w-full p-2 border border-gray-300 rounded mb-4"
          onKeyPress={(e) => e.key === 'Enter' && onConfirm()}
          autoFocus
        />
        {error && (
          <div className="text-red-500 text-sm mb-4">{error}</div>
        )}
        <div className="flex justify-end space-x-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// 드래그 가능한 스크립트 아이템 컴포넌트
const SortableScriptItem: React.FC<{
  script: UiTestScript;
  folderId: number;
  isSelected: boolean;
  onSelect: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}> = ({ script, folderId, isSelected, onSelect, onContextMenu }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `script-${script.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getScriptTypeIcon = (scriptType: string) => {
    switch (scriptType) {
      case 'PLAYWRIGHT':
        return <PlayIcon className="w-3 h-3 text-blue-500" />;
      case 'CYPRESS':
        return <CodeBracketIcon className="w-3 h-3 text-green-500" />;
      case 'SELENIUM':
        return <DocumentTextIcon className="w-3 h-3 text-orange-500" />;
      default:
        return <DocumentTextIcon className="w-3 h-3 text-gray-500" />;
    }
  };

  const getScriptTypeBadge = (scriptType: string) => {
    switch (scriptType) {
      case 'PLAYWRIGHT':
        return 'bg-blue-500';
      case 'CYPRESS':
        return 'bg-green-500';
      case 'SELENIUM':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  // 클릭 핸들러 (드래그와 구분)
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`ml-8 px-2.5 py-1.5 flex items-center gap-2 cursor-pointer hover:bg-gray-100 rounded-sm ${
        isSelected ? 'bg-blue-50 border-l-2 border-blue-500' : ''
      }`}
      onClick={handleClick}
      onContextMenu={onContextMenu}
    >
      {/* 드래그 핸들 영역 (좌측 작은 영역) */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 -ml-1 hover:bg-gray-200 rounded"
        title="Drag to move"
      >
        <EllipsisVerticalIcon className="w-3 h-3 text-gray-400" />
      </div>

      <span className={`px-1.5 py-0.5 rounded text-xs font-medium text-white ${getScriptTypeBadge(script.scriptType)}`}>
        {script.scriptType.substring(0, 3)}
      </span>
      <span className="text-xs text-gray-800 flex-1 truncate">{script.name}</span>
    </div>
  );
};

// 드래그 가능한 폴더 컴포넌트
const FolderComponent: React.FC<{
  folder: any;
  scripts: UiTestScript[];
  isSelected: boolean;
  selectedScriptId?: number | null;
  onToggle: () => void;
  onSelect: () => void;
  onSelectScript: (script: UiTestScript) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onScriptContextMenu: (e: React.MouseEvent, script: UiTestScript) => void;
  isDragOverFolder: boolean;
}> = ({
  folder,
  scripts,
  isSelected,
  selectedScriptId,
  onToggle,
  onSelect,
  onSelectScript,
  onContextMenu,
  onScriptContextMenu,
  isDragOverFolder
}) => {
  const {
    setNodeRef,
  } = useSortable({ id: `droppable-folder-${folder.id}` });

  const folderScripts = scripts.filter(s => s.folderId === folder.id);

  return (
    <div ref={setNodeRef}>
      <div
        className={`px-2.5 py-1.5 flex items-center gap-2 cursor-pointer hover:bg-gray-100 rounded-sm ${
          isSelected ? 'bg-blue-50' : ''
        } ${isDragOverFolder ? 'bg-blue-100 border-2 border-blue-300 border-dashed' : ''}`}
        onClick={(e) => {
          onSelect();
          onToggle();
        }}
        onContextMenu={onContextMenu}
      >
        <div className="p-0.5 pointer-events-none">
          {folder.isExpanded ? (
            <ChevronDownIcon className="w-3 h-3 text-gray-600" />
          ) : (
            <ChevronRightIcon className="w-3 h-3 text-gray-600" />
          )}
        </div>
        <FolderIcon className="w-4 h-4 text-blue-500" />
        <span className="text-sm text-gray-800 flex-1">{folder.name}</span>
        <span className="text-xs text-gray-500">{folderScripts.length}</span>
      </div>

      {folder.isExpanded && (
        <div>
          {folderScripts.map(script => (
            <SortableScriptItem
              key={script.id}
              script={script}
              folderId={folder.id}
              isSelected={selectedScriptId === script.id}
              onSelect={() => onSelectScript(script)}
              onContextMenu={(e) => onScriptContextMenu(e, script)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const UiTestingSidebar: React.FC<UiTestingSidebarProps> = ({
  collapsed = false,
  onToggleCollapse,
  onSelectScript,
  onResetForm,
  selectedScript,
  onFolderUpdate,
  onScriptUpdate
}) => {
  const {
    folders,
    scripts,
    loading,
    error,
    selectedFolderId,
    selectedScriptId,
    searchTerm,
    setSearchTerm,
    setSelectedFolderId,
    setSelectedScriptId,
    loadFolders,
    loadScripts,
    createFolder,
    createScript,
    updateFolder,
    updateScript,
    deleteFolder,
    deleteScript,
    toggleFolder,
    expandAll,
    collapseAll,
    resetSelection
  } = useUiTestingSidebar();

  // 드래그 앤 드롭 상태
  const [dragOverFolderId, setDragOverFolderId] = useState<number | null>(null);
  const [activeScript, setActiveScript] = useState<UiTestScript | null>(null);

  // 모달 상태
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showCreateScriptModal, setShowCreateScriptModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showRenameFolderModal, setShowRenameFolderModal] = useState(false);
  const [showRenameScriptModal, setShowRenameScriptModal] = useState(false);

  const [newFolderName, setNewFolderName] = useState('');
  const [newScriptName, setNewScriptName] = useState('');
  const [renameFolderName, setRenameFolderName] = useState('');
  const [renameScriptName, setRenameScriptName] = useState('');

  const [createFolderError, setCreateFolderError] = useState<string | null>(null);
  const [createScriptError, setCreateScriptError] = useState<string | null>(null);
  const [renameFolderError, setRenameFolderError] = useState<string | null>(null);
  const [renameScriptError, setRenameScriptError] = useState<string | null>(null);

  // 컨텍스트 메뉴 상태
  const [folderContextMenu, setFolderContextMenu] = useState<{
    show: boolean;
    x: number;
    y: number;
    folderId: number;
    folderName: string;
  } | null>(null);

  const [scriptContextMenu, setScriptContextMenu] = useState<{
    show: boolean;
    x: number;
    y: number;
    scriptId: number;
    scriptName: string;
    folderId: number;
  } | null>(null);

  const [renamingFolder, setRenamingFolder] = useState<{ id: number; name: string } | null>(null);
  const [renamingScript, setRenamingScript] = useState<{ id: number; name: string; folderId: number } | null>(null);

  // 드래그 앤 드롭 센서 (클릭과 드래그 구분을 위한 설정)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px 이상 움직여야 드래그 시작
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 컨텍스트 메뉴 외부 클릭 닫기
  useEffect(() => {
    const handleClickOutside = () => {
      setFolderContextMenu(null);
      setScriptContextMenu(null);
    };

    if (folderContextMenu?.show || scriptContextMenu?.show) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [folderContextMenu, scriptContextMenu]);

  // 검색 필터링
  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredScripts = scripts.filter(script =>
    script.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 이벤트 핸들러들
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      setCreateFolderError('폴더 이름을 입력해주세요.');
      return;
    }

    try {
      await createFolder(newFolderName, '', undefined);
      setNewFolderName('');
      setShowCreateFolderModal(false);
      setCreateFolderError(null);
    } catch (error) {
      setCreateFolderError('폴더 생성에 실패했습니다.');
    }
  };

  const handleCreateScript = async () => {
    if (!newScriptName.trim()) {
      setCreateScriptError('스크립트 이름을 입력해주세요.');
      return;
    }

    try {
      await createScript({
        name: newScriptName,
        description: '',
        scriptContent: `// Your Playwright test script here
const { test, expect } = require('@playwright/test');

test('example test', async ({ page }) => {
  // Your test code here
});`,
        scriptType: 'PLAYWRIGHT',
        browserType: 'CHROMIUM',
        timeoutSeconds: 30,
        headlessMode: true,
        screenshotOnFailure: true,
        folderId: selectedFolderId
      });
      setNewScriptName('');
      setShowCreateScriptModal(false);
      setCreateScriptError(null);
    } catch (error) {
      setCreateScriptError('스크립트 생성에 실패했습니다.');
    }
  };

  const handleFolderSelect = (folderId: number) => {
    setSelectedFolderId(folderId);
    setSelectedScriptId(null);
    if (onResetForm) {
      onResetForm();
    }
  };

  const handleScriptSelect = (script: UiTestScript) => {
    setSelectedScriptId(script.id);
    const folder = folders.find(f => f.id === script.folderId);
    if (onSelectScript) {
      onSelectScript(script, script.folderId || null, folder?.name);
    }
  };

  const handleFolderContextMenu = (e: React.MouseEvent, folderId: number, folderName: string) => {
    e.preventDefault();
    e.stopPropagation();

    const menuWidth = 150;
    const menuHeight = 140;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const clickX = e.clientX;
    const clickY = e.clientY;

    const adjustedX = (clickX + menuWidth > windowWidth - 20)
      ? Math.max(10, clickX - menuWidth)
      : clickX;

    const adjustedY = (clickY + menuHeight > windowHeight - 20)
      ? Math.max(10, clickY - menuHeight)
      : clickY;

    setFolderContextMenu({
      show: true,
      x: adjustedX,
      y: adjustedY,
      folderId,
      folderName
    });
  };

  const handleScriptContextMenu = (e: React.MouseEvent, script: UiTestScript) => {
    e.preventDefault();
    e.stopPropagation();

    const menuWidth = 150;
    const menuHeight = 100;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const clickX = e.clientX;
    const clickY = e.clientY;

    const adjustedX = (clickX + menuWidth > windowWidth - 20)
      ? Math.max(10, clickX - menuWidth)
      : clickX;

    const adjustedY = (clickY + menuHeight > windowHeight - 20)
      ? Math.max(10, clickY - menuHeight)
      : clickY;

    setScriptContextMenu({
      show: true,
      x: adjustedX,
      y: adjustedY,
      scriptId: script.id,
      scriptName: script.name,
      folderId: script.folderId || 0
    });
  };

  // 드래그 앤 드롭 핸들러
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeId = active.id as string;

    if (activeId.startsWith('script-')) {
      const scriptId = parseInt(activeId.replace('script-', ''));
      const script = scripts.find(s => s.id === scriptId);
      setActiveScript(script || null);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) {
      setDragOverFolderId(null);
      return;
    }

    const overId = over.id as string;

    if (overId.startsWith('droppable-folder-')) {
      const folderId = parseInt(overId.replace('droppable-folder-', ''));
      setDragOverFolderId(folderId);
    } else {
      setDragOverFolderId(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDragOverFolderId(null);
    setActiveScript(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId.startsWith('script-') && overId.startsWith('droppable-folder-')) {
      const scriptId = parseInt(activeId.replace('script-', ''));
      const targetFolderId = parseInt(overId.replace('droppable-folder-', ''));

      // TODO: 스크립트를 다른 폴더로 이동하는 API 호출
      console.log(`Moving script ${scriptId} to folder ${targetFolderId}`);
    }
  };

  const handleUploadSuccess = () => {
    loadScripts();
    setShowUploadModal(false);
  };

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error);
    alert(error);
  };

  if (collapsed) {
    return (
      <div className="w-12 bg-white border-r border-gray-200 flex flex-col items-center py-4">
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-gray-100 rounded"
          title="Expand Sidebar"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-80 h-full border-r border-gray-200 bg-white flex flex-col overflow-hidden">
      {/* Header with Create Folder Button */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowCreateFolderModal(true)}
            className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors font-medium border border-blue-200 hover:border-blue-300"
          >
            + Create Folder
          </button>

          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="w-8 h-8 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors flex items-center justify-center flex-shrink-0"
              title="Collapse Sidebar"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
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

      {/* Folders List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500">Loading...</div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">{error}</div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={rectIntersection}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={scripts.map(script => `script-${script.id}`)}
              strategy={verticalListSortingStrategy}
            >
              <div className="p-2">
                {filteredFolders.length === 0 && searchTerm ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No results found for "{searchTerm}"
                  </div>
                ) : filteredFolders.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    <div className="mb-2">No folders yet</div>
                    <button
                      onClick={() => setShowCreateFolderModal(true)}
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
                      scripts={filteredScripts}
                      isSelected={selectedFolderId === folder.id}
                      selectedScriptId={selectedScriptId}
                      onToggle={() => toggleFolder(folder.id)}
                      onSelect={() => handleFolderSelect(folder.id)}
                      onSelectScript={handleScriptSelect}
                      onContextMenu={(e) => handleFolderContextMenu(e, folder.id, folder.name)}
                      onScriptContextMenu={handleScriptContextMenu}
                      isDragOverFolder={dragOverFolderId === folder.id}
                    />
                  ))
                )}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeScript ? (
                <div className="ml-8 px-2.5 py-1.5 flex items-center gap-2 bg-white shadow-lg rounded-md opacity-90">
                  <span className="px-1.5 py-0.5 rounded text-xs font-medium text-white bg-blue-500">
                    {activeScript.scriptType.substring(0, 3)}
                  </span>
                  <span className="text-xs text-gray-800">{activeScript.name}</span>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
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
            onCancel={() => {
              setShowCreateFolderModal(false);
              setNewFolderName('');
              setCreateFolderError(null);
            }}
            confirmText="Create"
            error={createFolderError}
          />

          <Modal
            isOpen={showCreateScriptModal}
            title="Create New Script"
            value={newScriptName}
            placeholder="Enter script name..."
            onValueChange={setNewScriptName}
            onConfirm={handleCreateScript}
            onCancel={() => {
              setShowCreateScriptModal(false);
              setNewScriptName('');
              setCreateScriptError(null);
            }}
            confirmText="Create"
            error={createScriptError}
          />

          <Modal
            isOpen={showRenameFolderModal}
            title="Rename Folder"
            value={renameFolderName}
            placeholder="Enter new folder name..."
            onValueChange={setRenameFolderName}
            onConfirm={async () => {
              if (!renameFolderName.trim()) {
                setRenameFolderError('폴더 이름을 입력해주세요.');
                return;
              }
              if (renamingFolder) {
                try {
                  await updateFolder(renamingFolder.id, renameFolderName);
                  if (onFolderUpdate) {
                    onFolderUpdate(renamingFolder.id, renameFolderName);
                  }
                  setShowRenameFolderModal(false);
                  setRenamingFolder(null);
                  setRenameFolderName('');
                  setRenameFolderError(null);
                } catch (error) {
                  setRenameFolderError('폴더 이름 변경에 실패했습니다.');
                }
              }
            }}
            onCancel={() => {
              setShowRenameFolderModal(false);
              setRenamingFolder(null);
              setRenameFolderName('');
              setRenameFolderError(null);
            }}
            confirmText="Rename"
            error={renameFolderError}
          />

          <Modal
            isOpen={showRenameScriptModal}
            title="Rename Script"
            value={renameScriptName}
            placeholder="Enter new script name..."
            onValueChange={setRenameScriptName}
            onConfirm={async () => {
              if (!renameScriptName.trim()) {
                setRenameScriptError('스크립트 이름을 입력해주세요.');
                return;
              }
              if (renamingScript) {
                try {
                  await updateScript(renamingScript.id, { name: renameScriptName });
                  if (onScriptUpdate) {
                    onScriptUpdate(renamingScript.id, renameScriptName);
                  }
                  setShowRenameScriptModal(false);
                  setRenamingScript(null);
                  setRenameScriptName('');
                  setRenameScriptError(null);
                } catch (error) {
                  setRenameScriptError('스크립트 이름 변경에 실패했습니다.');
                }
              }
            }}
            onCancel={() => {
              setShowRenameScriptModal(false);
              setRenamingScript(null);
              setRenameScriptName('');
              setRenameScriptError(null);
            }}
            confirmText="Rename"
            error={renameScriptError}
          />

          {/* Upload Modal */}
          {showUploadModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-96">
                <h3 className="text-lg font-medium mb-4">Upload Test Script</h3>
                <ScriptUpload
                  folderId={selectedFolderId || undefined}
                  onUploadSuccess={handleUploadSuccess}
                  onUploadError={handleUploadError}
                />
                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Context Menus */}
          <FolderContextMenu
            show={folderContextMenu?.show || false}
            x={folderContextMenu?.x || 0}
            y={folderContextMenu?.y || 0}
            onRename={() => {
              if (folderContextMenu) {
                setRenamingFolder({ id: folderContextMenu.folderId, name: folderContextMenu.folderName });
                setRenameFolderName(folderContextMenu.folderName);
                setShowRenameFolderModal(true);
                setFolderContextMenu(null);
              }
            }}
            onAddScript={() => {
              if (folderContextMenu) {
                setSelectedFolderId(folderContextMenu.folderId);
                setShowCreateScriptModal(true);
                setFolderContextMenu(null);
              }
            }}
            onDelete={() => {
              if (folderContextMenu) {
                deleteFolder(folderContextMenu.folderId);
                setFolderContextMenu(null);
              }
            }}
          />

          <ScriptContextMenu
            show={scriptContextMenu?.show || false}
            x={scriptContextMenu?.x || 0}
            y={scriptContextMenu?.y || 0}
            onRename={() => {
              if (scriptContextMenu) {
                setRenamingScript({
                  id: scriptContextMenu.scriptId,
                  name: scriptContextMenu.scriptName,
                  folderId: scriptContextMenu.folderId
                });
                setRenameScriptName(scriptContextMenu.scriptName);
                setShowRenameScriptModal(true);
                setScriptContextMenu(null);
              }
            }}
            onDelete={() => {
              if (scriptContextMenu) {
                deleteScript(scriptContextMenu.scriptId);
                setScriptContextMenu(null);
              }
            }}
          />
        </>,
        document.body
      )}
    </div>
  );
};

export default UiTestingSidebar;