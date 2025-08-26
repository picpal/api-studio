import React from 'react';
import { BaseUrl, ApiItem } from '../types/api';
import { 
  ApiSelection,
  TestExecution,
  TestHistory,
  ExecutionDetailModal,
  TestReportModal,
  useTestAutomation,
  useTestExecution,
  useTestHistory
} from '../features/test-automation';
import { VariableInputModal } from '../widgets/api-testing/VariableInputModal';

interface TestAutomationPageProps {
  baseUrls: BaseUrl[];
  selectedItem: ApiItem | null;
  onResetForm: () => void;
  onUpdateSelectedItem: (updatedItem: Partial<ApiItem>) => void;
}

const TestAutomationPage: React.FC<TestAutomationPageProps> = ({ 
  baseUrls, 
  selectedItem, 
  onResetForm, 
  onUpdateSelectedItem 
}) => {
  // Test Automation 상태 관리
  const {
    selectedApis,
    batchHistory,
    selectedBatch,
    apiSectionCollapsed,
    folders,
    apiList,
    selectedFolder,
    handleApiSelection,
    handleSelectAll,
    handleFolderSelect,
    handleToggleCollapse,
    handleSelectHistory,
    addBatchResult
  } = useTestAutomation();

  // Test Execution 상태 관리
  const {
    isRunning,
    currentExecution,
    executeBatch,
    setExecutionResults,
    // 템플릿 변수 관련
    showVariableModal,
    templateVariables,
    handleVariableConfirm,
    handleVariableModalClose
  } = useTestExecution();

  // 모달 상태 관리
  const {
    showDetailModal,
    selectedExecution,
    showReportModal,
    handleShowExecutionDetail,
    handleCloseDetailModal,
    handleShowReport,
    handleCloseReport
  } = useTestHistory();

  // 배치 실행 핸들러
  const handleExecuteBatch = () => {
    executeBatch(selectedApis, apiList, addBatchResult);
  };

  // 히스토리 선택 핸들러 (확장)
  const handleHistorySelect = async (batch: any) => {
    const executions = await handleSelectHistory(batch);
    setExecutionResults(executions);
  };

  return (
    <div className="lg:h-full bg-gray-100 flex flex-col">
      {/* 데스크톱: 기존 가로 분할, 태블릿: 세로 분할 */}
      <div className="lg:flex-1 flex flex-col lg:flex-row lg:overflow-hidden">
        {/* 좌측/상단: API Selection */}
        <ApiSelection
          folders={folders}
          apiList={apiList}
          selectedFolder={selectedFolder}
          selectedApis={selectedApis}
          apiSectionCollapsed={apiSectionCollapsed}
          onFolderSelect={handleFolderSelect}
          onApiSelection={handleApiSelection}
          onSelectAll={handleSelectAll}
          onToggleCollapse={handleToggleCollapse}
        />

        {/* 우측/하단: 실행 영역과 결과 */}
        <div className="lg:flex-1 flex flex-col lg:flex-row lg:min-h-0">
          {/* Test Execution */}
          <TestExecution
            selectedApis={selectedApis}
            isRunning={isRunning}
            currentExecution={currentExecution}
            onExecuteBatch={handleExecuteBatch}
            onShowExecutionDetail={handleShowExecutionDetail}
            onShowReport={handleShowReport}
          />

          {/* Test History */}
          <TestHistory
            batchHistory={batchHistory}
            selectedBatch={selectedBatch}
            onSelectHistory={handleHistorySelect}
          />
        </div>
      </div>

      {/* Execution Detail Modal */}
      <ExecutionDetailModal
        selectedExecution={selectedExecution}
        showModal={showDetailModal}
        onClose={handleCloseDetailModal}
      />

      {/* Test Report Modal */}
      <TestReportModal
        currentExecution={currentExecution}
        showModal={showReportModal}
        onClose={handleCloseReport}
      />

      {/* Template Variable Input Modal */}
      <VariableInputModal
        isOpen={showVariableModal}
        onClose={handleVariableModalClose}
        onConfirm={handleVariableConfirm}
        templateVariables={templateVariables}
        title="배치 테스트 변수 입력"
      />
    </div>
  );
};

export default TestAutomationPage;