import React, { useState, useEffect } from 'react';
import {
  FolderIcon,
  DocumentTextIcon,
  PlayIcon,
  StopIcon,
  EyeIcon,
  TrashIcon,
  PencilIcon,
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

interface UiTestFolder {
  id: number;
  name: string;
  description?: string;
  children?: UiTestFolder[];
  scriptCount: number;
  subFolderCount: number;
}

interface UiTestScript {
  id: number;
  name: string;
  description?: string;
  scriptContent: string;
  scriptType: string;
  browserType: string;
  timeoutSeconds: number;
  headlessMode: boolean;
  screenshotOnFailure: boolean;
  folderId?: number;
  folderName?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface UiTestExecution {
  id: number;
  executionId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'TIMEOUT';
  scriptId: number;
  scriptName: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  errorMessage?: string;
  executedBy: string;
  createdAt: string;
}

const UiTestingPage: React.FC = () => {
  const [folders, setFolders] = useState<UiTestFolder[]>([]);
  const [scripts, setScripts] = useState<UiTestScript[]>([]);
  const [executions, setExecutions] = useState<UiTestExecution[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null);
  const [selectedScript, setSelectedScript] = useState<UiTestScript | null>(null);
  const [activeTab, setActiveTab] = useState<'scripts' | 'executions'>('scripts');
  const [isLoading, setIsLoading] = useState(false);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [editingScript, setEditingScript] = useState<UiTestScript | null>(null);

  useEffect(() => {
    loadFolders();
    loadExecutions();
  }, []);

  useEffect(() => {
    if (selectedFolder !== null) {
      loadScriptsByFolder(selectedFolder);
    } else {
      loadAllScripts();
    }
  }, [selectedFolder]);

  const loadFolders = async () => {
    try {
      const response = await fetch('/api/ui-tests/folders/structure', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setFolders(data);
      }
    } catch (error) {
      console.error('Failed to load folders:', error);
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

  const loadExecutions = async () => {
    try {
      const response = await fetch('/api/ui-tests/executions', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setExecutions(data);
      }
    } catch (error) {
      console.error('Failed to load executions:', error);
    }
  };

  const executeScript = async (scriptId: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/ui-tests/scripts/${scriptId}/execute`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Script execution started:', data);
        // Reload executions to show the new execution
        setTimeout(() => {
          loadExecutions();
        }, 1000);
      } else {
        console.error('Failed to execute script');
      }
    } catch (error) {
      console.error('Error executing script:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateScript = () => {
    setEditingScript(null);
    setShowScriptModal(true);
  };

  const handleEditScript = (script: UiTestScript) => {
    setEditingScript(script);
    setShowScriptModal(true);
  };

  const handleDeleteScript = async (scriptId: number) => {
    if (!confirm('이 스크립트를 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/ui-tests/scripts/${scriptId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        loadAllScripts();
      }
    } catch (error) {
      console.error('Failed to delete script:', error);
    }
  };

  const getStatusIcon = (status: UiTestExecution['status']) => {
    switch (status) {
      case 'RUNNING':
      case 'PENDING':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      case 'COMPLETED':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'FAILED':
      case 'TIMEOUT':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'CANCELLED':
        return <StopIcon className="w-5 h-5 text-gray-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: UiTestExecution['status']) => {
    switch (status) {
      case 'RUNNING':
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-100';
      case 'COMPLETED':
        return 'text-green-600 bg-green-100';
      case 'FAILED':
      case 'TIMEOUT':
        return 'text-red-600 bg-red-100';
      case 'CANCELLED':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const renderFolder = (folder: UiTestFolder, level: number = 0) => (
    <div key={folder.id} className={`ml-${level * 4}`}>
      <div
        className={`flex items-center p-2 cursor-pointer hover:bg-gray-100 rounded ${
          selectedFolder === folder.id ? 'bg-blue-100' : ''
        }`}
        onClick={() => setSelectedFolder(folder.id)}
      >
        <FolderIcon className="w-4 h-4 mr-2 text-blue-500" />
        <span className="text-sm">{folder.name}</span>
        <span className="ml-auto text-xs text-gray-500">
          {folder.scriptCount} scripts
        </span>
      </div>
      {folder.children?.map(child => renderFolder(child, level + 1))}
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">UI Testing</h1>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-gray-700">Test Scripts</h2>
              <button
                onClick={handleCreateScript}
                className="p-1 text-blue-600 hover:text-blue-800"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>

            {/* All Scripts option */}
            <div
              className={`flex items-center p-2 cursor-pointer hover:bg-gray-100 rounded mb-2 ${
                selectedFolder === null ? 'bg-blue-100' : ''
              }`}
              onClick={() => setSelectedFolder(null)}
            >
              <DocumentTextIcon className="w-4 h-4 mr-2 text-gray-500" />
              <span className="text-sm">All Scripts</span>
            </div>

            {/* Folders */}
            {folders.map(folder => renderFolder(folder))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Tabs */}
        <div className="bg-white border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('scripts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'scripts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Scripts ({scripts.length})
            </button>
            <button
              onClick={() => setActiveTab('executions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'executions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Executions ({executions.length})
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'scripts' ? (
            /* Scripts Tab */
            <div className="space-y-4">
              {scripts.length === 0 ? (
                <div className="text-center py-12">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No scripts</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by creating a new UI test script.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={handleCreateScript}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                      New Script
                    </button>
                  </div>
                </div>
              ) : (
                scripts.map(script => (
                  <div key={script.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">{script.name}</h3>
                        {script.description && (
                          <p className="mt-1 text-sm text-gray-500">{script.description}</p>
                        )}
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                          <span>Type: {script.scriptType}</span>
                          <span>Browser: {script.browserType}</span>
                          <span>Timeout: {script.timeoutSeconds}s</span>
                        </div>
                        <div className="mt-1 text-xs text-gray-400">
                          Created by {script.createdBy} • {new Date(script.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => executeScript(script.id)}
                          disabled={isLoading}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                        >
                          <PlayIcon className="w-4 h-4 mr-1" />
                          Run
                        </button>
                        <button
                          onClick={() => handleEditScript(script)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <PencilIcon className="w-4 h-4 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteScript(script.id)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-red-600 bg-white hover:bg-red-50"
                        >
                          <TrashIcon className="w-4 h-4 mr-1" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Executions Tab */
            <div className="space-y-4">
              {executions.length === 0 ? (
                <div className="text-center py-12">
                  <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No executions</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Script executions will appear here.
                  </p>
                </div>
              ) : (
                executions.map(execution => (
                  <div key={execution.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          {getStatusIcon(execution.status)}
                          <h3 className="ml-2 text-lg font-medium text-gray-900">
                            {execution.scriptName}
                          </h3>
                          <span className={`ml-3 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(execution.status)}`}>
                            {execution.status}
                          </span>
                        </div>

                        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Started:</span>
                            <div className="font-medium">
                              {execution.startedAt ? new Date(execution.startedAt).toLocaleString() : 'N/A'}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Duration:</span>
                            <div className="font-medium">
                              {execution.durationMs ? `${(execution.durationMs / 1000).toFixed(1)}s` : 'N/A'}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Passed:</span>
                            <div className="font-medium text-green-600">{execution.passedTests}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Failed:</span>
                            <div className="font-medium text-red-600">{execution.failedTests}</div>
                          </div>
                        </div>

                        {execution.errorMessage && (
                          <div className="mt-3 p-3 bg-red-50 rounded-md">
                            <p className="text-sm text-red-700">{execution.errorMessage}</p>
                          </div>
                        )}

                        <div className="mt-2 text-xs text-gray-400">
                          Executed by {execution.executedBy} • {new Date(execution.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50">
                          <EyeIcon className="w-4 h-4 mr-1" />
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UiTestingPage;