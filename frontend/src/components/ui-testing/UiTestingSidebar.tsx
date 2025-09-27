import React, { useState, useEffect } from 'react';
import {
  FolderIcon,
  DocumentTextIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { PlayIcon } from '@heroicons/react/24/solid';

interface UiTestFolder {
  id: number;
  name: string;
  description?: string;
  children?: UiTestFolder[];
  scriptCount: number;
  subFolderCount: number;
  isExpanded?: boolean;
}

interface UiTestScript {
  id: number;
  name: string;
  description?: string;
  scriptType: string;
  browserType: string;
  folderId?: number;
  createdAt: string;
}

interface UiTestingSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onSelectScript?: (script: UiTestScript, folderId: number | null, folderName?: string) => void;
  onResetForm?: () => void;
  selectedScript?: UiTestScript | null;
  onFolderUpdate?: (folderId: number, folderName: string) => void;
  onScriptUpdate?: (scriptId: number, scriptName: string) => void;
}

const UiTestingSidebar: React.FC<UiTestingSidebarProps> = ({
  collapsed = false,
  onToggleCollapse,
  onSelectScript,
  onResetForm,
  selectedScript,
  onFolderUpdate,
  onScriptUpdate
}) => {
  const [folders, setFolders] = useState<UiTestFolder[]>([]);
  const [scripts, setScripts] = useState<UiTestScript[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [selectedScriptId, setSelectedScriptId] = useState<number | null>(null);

  // 모달 상태
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showCreateScriptModal, setShowCreateScriptModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newScriptName, setNewScriptName] = useState('');

  useEffect(() => {
    loadFolders();
    loadAllScripts();
  }, []);

  const loadFolders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ui-tests/folders/structure', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setFolders(data);
      } else {
        setError('Failed to load folders');
      }
    } catch (error) {
      setError('Failed to load folders');
      console.error('Failed to load folders:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllScripts = async () => {
    try {
      const response = await fetch('/api/ui-tests/scripts', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setScripts(data);
      }
    } catch (error) {
      console.error('Failed to load scripts:', error);
    }
  };

  const loadScriptsByFolder = async (folderId: number) => {
    try {
      const response = await fetch(`/api/ui-tests/folders/${folderId}/scripts`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setScripts(data);
      }
    } catch (error) {
      console.error('Failed to load scripts:', error);
    }
  };

  const handleFolderToggle = (folderId: number) => {
    const updatedFolders = folders.map(folder =>
      folder.id === folderId
        ? { ...folder, isExpanded: !folder.isExpanded }
        : folder
    );
    setFolders(updatedFolders);
  };

  const handleFolderSelect = (folderId: number | null) => {
    setSelectedFolderId(folderId);
    setSelectedScriptId(null);
    if (folderId) {
      loadScriptsByFolder(folderId);
    } else {
      loadAllScripts();
    }
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

  const createFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const response = await fetch('/api/ui-tests/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: newFolderName,
          description: '',
          parentId: null
        })
      });

      if (response.ok) {
        await loadFolders();
        setNewFolderName('');
        setShowCreateFolderModal(false);
      }
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  const createScript = async () => {
    if (!newScriptName.trim()) return;

    try {
      const response = await fetch('/api/ui-tests/scripts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: newScriptName,
          description: '',
          scriptContent: '// Your Playwright test script here\n',
          scriptType: 'PLAYWRIGHT',
          browserType: 'CHROMIUM',
          timeoutSeconds: 30,
          headlessMode: true,
          screenshotOnFailure: true,
          folderId: selectedFolderId
        })
      });

      if (response.ok) {
        await loadAllScripts();
        if (selectedFolderId) {
          await loadScriptsByFolder(selectedFolderId);
        }
        setNewScriptName('');
        setShowCreateScriptModal(false);
      }
    } catch (error) {
      console.error('Failed to create script:', error);
    }
  };

  const getScriptTypeIcon = (scriptType: string) => {
    switch (scriptType) {
      case 'PLAYWRIGHT':
        return <PlayIcon className="w-3 h-3 text-blue-500" />;
      default:
        return <DocumentTextIcon className="w-3 h-3 text-gray-500" />;
    }
  };

  const getScriptsByFolder = (folderId: number | null) => {
    return scripts.filter(script => script.folderId === folderId);
  };

  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredScripts = scripts.filter(script =>
    script.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">UI Testing</h1>
          <button
            onClick={onToggleCollapse}
            className="p-1 hover:bg-gray-100 rounded"
            title="Collapse Sidebar"
          >
            <ChevronDownIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search folders and scripts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Folders</span>
          <button
            onClick={() => setShowCreateFolderModal(true)}
            className="p-1 text-blue-600 hover:text-blue-800"
            title="Create Folder"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Scripts</span>
          <button
            onClick={() => setShowCreateScriptModal(true)}
            className="p-1 text-blue-600 hover:text-blue-800"
            title="Create Script"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500">Loading...</div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">{error}</div>
        ) : (
          <div className="p-4">
            {/* All Scripts option */}
            <div
              className={`flex items-center p-2 cursor-pointer hover:bg-gray-100 rounded mb-2 ${
                selectedFolderId === null ? 'bg-blue-100' : ''
              }`}
              onClick={() => handleFolderSelect(null)}
            >
              <DocumentTextIcon className="w-4 h-4 mr-2 text-gray-500" />
              <span className="text-sm">All Scripts ({scripts.length})</span>
            </div>

            {/* Folders */}
            {filteredFolders.map(folder => (
              <div key={folder.id} className="mb-1">
                <div
                  className={`flex items-center p-2 cursor-pointer hover:bg-gray-100 rounded ${
                    selectedFolderId === folder.id ? 'bg-blue-100' : ''
                  }`}
                  onClick={() => handleFolderSelect(folder.id)}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFolderToggle(folder.id);
                    }}
                    className="mr-1"
                  >
                    {folder.isExpanded ? (
                      <ChevronDownIcon className="w-3 h-3" />
                    ) : (
                      <ChevronRightIcon className="w-3 h-3" />
                    )}
                  </button>
                  <FolderIcon className="w-4 h-4 mr-2 text-blue-500" />
                  <span className="text-sm flex-1">{folder.name}</span>
                  <span className="text-xs text-gray-500">{folder.scriptCount}</span>
                </div>

                {/* Scripts in folder */}
                {folder.isExpanded && (
                  <div className="ml-6">
                    {getScriptsByFolder(folder.id).map(script => (
                      <div
                        key={script.id}
                        className={`flex items-center p-2 cursor-pointer hover:bg-gray-100 rounded ${
                          selectedScriptId === script.id ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => handleScriptSelect(script)}
                      >
                        {getScriptTypeIcon(script.scriptType)}
                        <span className="text-sm ml-2 flex-1 truncate">{script.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Scripts without folder (if showing all scripts) */}
            {selectedFolderId === null && (
              <div className="mt-4">
                <div className="text-xs font-medium text-gray-500 mb-2">Uncategorized Scripts</div>
                {getScriptsByFolder(null).map(script => (
                  <div
                    key={script.id}
                    className={`flex items-center p-2 cursor-pointer hover:bg-gray-100 rounded ${
                      selectedScriptId === script.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleScriptSelect(script)}
                  >
                    {getScriptTypeIcon(script.scriptType)}
                    <span className="text-sm ml-2 flex-1 truncate">{script.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Folder Modal */}
      {showCreateFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium mb-4">Create New Folder</h3>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="w-full p-2 border border-gray-300 rounded mb-4"
              onKeyPress={(e) => e.key === 'Enter' && createFolder()}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowCreateFolderModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={createFolder}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Script Modal */}
      {showCreateScriptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium mb-4">Create New Script</h3>
            <input
              type="text"
              value={newScriptName}
              onChange={(e) => setNewScriptName(e.target.value)}
              placeholder="Script name"
              className="w-full p-2 border border-gray-300 rounded mb-4"
              onKeyPress={(e) => e.key === 'Enter' && createScript()}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowCreateScriptModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={createScript}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UiTestingSidebar;