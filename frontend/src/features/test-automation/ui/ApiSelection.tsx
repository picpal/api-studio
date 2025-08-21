import React from 'react';
import { ApiItem } from '../../../types/api';

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
  onToggleCollapse
}) => {
  // 폴더별 필터링된 API 목록
  const filteredApiList = selectedFolder 
    ? apiList.filter(api => (api as any).folderId === selectedFolder)
    : apiList;

  return (
    <div className="w-full lg:w-64 bg-white border-r lg:border-r border-b lg:border-b-0 border-gray-200 flex flex-col lg:h-full lg:max-h-none">
      {/* 폴더 목록 */}
      <div className={`border-b lg:flex-shrink-0 ${apiSectionCollapsed ? '' : 'lg:h-2/5 lg:overflow-y-auto'}`}>
        <div className="p-4">
          <div className="flex items-center justify-between min-h-[2rem]">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">API Selection</h3>
              {apiSectionCollapsed && selectedApis.size > 0 && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                  {selectedApis.size} selected
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* 데스크톱에서만 collapse 버튼 표시 */}
              <button
                onClick={onToggleCollapse}
                className="hidden lg:block p-1 text-gray-500 hover:text-gray-700 rounded"
                title={apiSectionCollapsed ? "Expand API Selection" : "Collapse API Selection"}
              >
                <svg className={`w-5 h-5 transition-transform ${apiSectionCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        {!apiSectionCollapsed && (
          <div className="px-4 pb-4">
            <div className="space-y-1">
              <button
                onClick={() => {
                  onFolderSelect(null);
                  // 모바일/태블릿에서 All APIs 선택 시 API 목록이 보이도록 자동으로 펼치기
                  const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
                  if (!isDesktop) {
                    onToggleCollapse();
                  }
                }}
                className={`w-full text-left p-2 rounded text-sm flex items-center gap-2 ${
                  selectedFolder === null ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                }`}
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                All APIs ({apiList.length})
              </button>
              {folders.map(folder => (
                <button
                  key={folder.id}
                  onClick={() => {
                    onFolderSelect(folder.id);
                    // 모바일/태블릿에서 폴더 선택 시 API 목록이 보이도록 자동으로 펼치기
                    const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
                    if (!isDesktop) {
                      onToggleCollapse();
                    }
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
              ))}
            </div>
          </div>
        )}
      </div>

      {/* API 목록 - 데스크톱에서만 폴더와 같은 영역에 표시 */}
      <div className={`hidden lg:flex lg:flex-col p-4 overflow-y-auto ${apiSectionCollapsed ? 'lg:h-full' : 'lg:h-3/5'}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-md font-semibold">APIs</h3>
          {/* 데스크톱에서만 Select All 버튼 표시 (모바일은 상단에 위치) */}
          <button
            onClick={onSelectAll}
            className="hidden lg:block text-xs text-blue-600 hover:text-blue-800"
          >
            {selectedApis.size === filteredApiList.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>
        
        <div className="space-y-2">
          {filteredApiList.map(api => (
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
          ))}
        </div>
      </div>

      {/* 모바일/태블릿 전용 API 목록 */}
      <div className="lg:hidden bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-md font-semibold">APIs</h3>
          {/* 모바일 Select All 버튼 */}
          {filteredApiList.length > 0 && (
            <button
              onClick={onSelectAll}
              className="text-xs px-2 py-1 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded"
            >
              {selectedApis.size === filteredApiList.length ? 'Deselect All' : 'Select All'}
            </button>
          )}
        </div>
        
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {filteredApiList.map(api => (
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
          ))}
        </div>
      </div>
    </div>
  );
};