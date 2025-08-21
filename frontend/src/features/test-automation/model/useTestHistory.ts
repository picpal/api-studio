import { useState } from 'react';
import { TestExecution } from '../ui/TestExecution';

export const useTestHistory = () => {
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedExecution, setSelectedExecution] = useState<TestExecution | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);

  // 상세보기 핸들러
  const handleShowExecutionDetail = (execution: TestExecution) => {
    setSelectedExecution(execution);
    setShowDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedExecution(null);
  };

  const handleShowReport = () => {
    setShowReportModal(true);
  };

  const handleCloseReport = () => {
    setShowReportModal(false);
  };

  return {
    showDetailModal,
    selectedExecution,
    showReportModal,
    handleShowExecutionDetail,
    handleCloseDetailModal,
    handleShowReport,
    handleCloseReport
  };
};