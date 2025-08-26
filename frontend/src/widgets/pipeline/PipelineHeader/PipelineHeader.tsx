import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pipeline } from '@/entities/pipeline';
import { usePipelineExecution } from '@/features/pipeline-management/hooks/usePipelineExecution';
import { ExecutionStatusModal } from '../ExecutionStatusModal';

interface PipelineHeaderProps {
  pipeline: Pipeline;
  actualStepCount?: number;
  stepsLoading?: boolean;
  onEditPipeline?: () => void;
}

export const PipelineHeader: React.FC<PipelineHeaderProps> = ({ pipeline, actualStepCount, stepsLoading, onEditPipeline }) => {
  const navigate = useNavigate();
  const [isExecutionModalOpen, setIsExecutionModalOpen] = useState(false);
  const {
    currentExecution,
    stepExecutions,
    isExecuting,
    error,
    startExecution,
    stopPolling,
    resetExecution,
    cleanup
  } = usePipelineExecution();

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const handleExecute = async () => {
    try {
      console.log('Execute button clicked for pipeline:', pipeline.id);
      await startExecution(pipeline.id);
      setIsExecutionModalOpen(true);
    } catch (err: any) {
      console.error('Failed to start execution:', err);
      // Error is already handled in the hook, just open modal to show the error
      setIsExecutionModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsExecutionModalOpen(false);
    if (!isExecuting) {
      resetExecution();
    }
  };

  return (
    <div className="border-b border-gray-200 pb-6 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">{pipeline.name}</h1>
          </div>
          <p className="text-gray-600 mb-4">{pipeline.description}</p>
          {/* Desktop: Show step count with dates */}
          <div className="hidden md:flex items-center gap-4 text-sm text-gray-500">
            <span>
              {stepsLoading ? (
                <span className="flex items-center gap-1">
                  <div className="animate-spin w-3 h-3 border border-gray-400 border-t-transparent rounded-full"></div>
                  로딩 중...
                </span>
              ) : (
                `${actualStepCount ?? pipeline.stepCount}개 단계`
              )}
            </span>
            <span>•</span>
            <span>생성일: {new Date(pipeline.createdAt).toLocaleDateString()}</span>
            <span>•</span>
            <span>수정일: {new Date(pipeline.updatedAt).toLocaleDateString()}</span>
          </div>

          {/* Mobile: Show only step count prominently */}
          <div className="md:hidden">
            {stepsLoading ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                <span className="text-sm text-gray-600">로딩 중...</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg font-semibold">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-base">{actualStepCount ?? pipeline.stepCount}개 단계</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onEditPipeline}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            편집
          </button>
          <button 
            onClick={handleExecute}
            disabled={isExecuting}
            className={`px-4 py-2 text-white rounded-md transition-colors flex items-center gap-2 ${
              isExecuting 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isExecuting && (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
            )}
            {isExecuting ? '실행 중...' : '실행'}
          </button>
        </div>
      </div>

      {/* Execution Status Modal */}
      <ExecutionStatusModal
        isOpen={isExecutionModalOpen}
        onClose={handleCloseModal}
        execution={currentExecution}
        stepExecutions={stepExecutions}
        isExecuting={isExecuting}
        error={error}
      />
    </div>
  );
};