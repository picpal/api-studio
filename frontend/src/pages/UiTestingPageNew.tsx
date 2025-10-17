// 새로운 UI Testing 페이지 (FSD 구조)

import React, { useState, useEffect } from 'react';
import { UiTestScript } from '../entities/ui-testing/types';
import UiTestingSidebar from '../widgets/ui-testing/UiTestingSidebar';
import UiTestingMainContent from '../widgets/ui-testing/UiTestingMainContent';

interface UiTestingPageNewProps {
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

const UiTestingPageNew: React.FC<UiTestingPageNewProps> = ({
  sidebarCollapsed: externalSidebarCollapsed,
  onToggleSidebar
}) => {
  const [selectedScript, setSelectedScript] = useState<UiTestScript | null>(null);
  const [internalSidebarCollapsed, setInternalSidebarCollapsed] = useState(() => {
    // 모바일에서는 닫힌 상태로 시작
    return window.innerWidth < 768;
  });

  // Use external state if provided, otherwise use internal state
  const sidebarCollapsed = externalSidebarCollapsed !== undefined
    ? externalSidebarCollapsed
    : internalSidebarCollapsed;

  const handleToggleSidebar = () => {
    if (onToggleSidebar) {
      onToggleSidebar();
    } else {
      setInternalSidebarCollapsed(!internalSidebarCollapsed);
    }
  };

  const handleSelectScript = (script: UiTestScript, folderId: number | null, folderName?: string) => {
    setSelectedScript({
      ...script,
      folderId: folderId || undefined,
      folderName: folderName
    });
  };

  const handleResetForm = () => {
    setSelectedScript(null);
  };

  const handleUpdateSelectedScript = (updatedScript: Partial<UiTestScript>) => {
    if (selectedScript) {
      setSelectedScript({ ...selectedScript, ...updatedScript });
    }
  };

  const handleFolderUpdate = (folderId: number, folderName: string) => {
    // 선택된 스크립트가 해당 폴더에 속해 있으면 폴더 정보 업데이트
    if (selectedScript && selectedScript.folderId === folderId) {
      setSelectedScript({
        ...selectedScript,
        folderName: folderName
      });
    }
  };

  const handleScriptUpdate = (scriptId: number, scriptName: string) => {
    // 선택된 스크립트가 해당 스크립트이면 이름 정보 업데이트
    if (selectedScript && selectedScript.id === scriptId) {
      setSelectedScript({
        ...selectedScript,
        name: scriptName
      });
    }
  };

  return (
    <div className="h-screen bg-white flex flex-col">
      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop Sidebar */}
        <div className={`hidden md:block flex-shrink-0 border-r border-gray-200 transition-all duration-300 ${
          sidebarCollapsed ? 'w-12' : 'w-80'
        }`}>
          <UiTestingSidebar
            collapsed={sidebarCollapsed}
            onToggleCollapse={handleToggleSidebar}
            onSelectScript={handleSelectScript}
            onResetForm={handleResetForm}
            selectedScript={selectedScript}
            onFolderUpdate={handleFolderUpdate}
            onScriptUpdate={handleScriptUpdate}
          />
        </div>

        {/* Mobile Sidebar Overlay */}
        <div className={`md:hidden fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out ${
          sidebarCollapsed ? '-translate-x-full' : 'translate-x-0'
        }`} style={{ top: '64px' }}>
          <div className="w-80 h-full border-r border-gray-200 bg-white shadow-lg">
            <UiTestingSidebar
              collapsed={false}
              onToggleCollapse={handleToggleSidebar}
              onSelectScript={handleSelectScript}
              onResetForm={handleResetForm}
              selectedScript={selectedScript}
              onFolderUpdate={handleFolderUpdate}
              onScriptUpdate={handleScriptUpdate}
            />
          </div>
        </div>

        {/* Mobile Backdrop */}
        {!sidebarCollapsed && (
          <div
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
            style={{ top: '64px' }}
            onClick={handleToggleSidebar}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <UiTestingMainContent
            selectedScript={selectedScript}
            onResetForm={handleResetForm}
            onUpdateSelectedScript={handleUpdateSelectedScript}
          />
        </div>
      </div>
    </div>
  );
};

export default UiTestingPageNew;