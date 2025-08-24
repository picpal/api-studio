import React, { useEffect } from 'react';
import { PipelineExecution, StepExecution } from '@/entities/pipeline';

interface ExecutionStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  execution: PipelineExecution | null;
  stepExecutions: StepExecution[];
  isExecuting: boolean;
  error: string | null;
}

export const ExecutionStatusModal: React.FC<ExecutionStatusModalProps> = ({
  isOpen,
  onClose,
  execution,
  stepExecutions,
  isExecuting,
  error
}) => {
  if (!isOpen) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return 'text-blue-600 bg-blue-100';
      case 'COMPLETED':
        return 'text-green-600 bg-green-100';
      case 'FAILED':
        return 'text-red-600 bg-red-100';
      case 'SUCCESS':
        return 'text-green-600 bg-green-100';
      case 'PENDING':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return (
          <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
        );
      case 'SUCCESS':
        return (
          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'FAILED':
        return (
          <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        );
      case 'PENDING':
        return (
          <div className="w-4 h-4 border-2 border-gray-400 border-dashed rounded-full"></div>
        );
      default:
        return null;
    }
  };

  const formatDuration = (startTime: Date, endTime?: Date) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const duration = end.getTime() - start.getTime();
    
    if (duration < 1000) {
      return `${duration}ms`;
    } else {
      return `${(duration / 1000).toFixed(1)}s`;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900">파이프라인 실행 상태</h2>
            {execution && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(execution.status)}`}>
                {execution.status}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}

          {execution && (
            <div className="mb-6">
              {/* Execution Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{execution.totalSteps}</div>
                    <div className="text-sm text-gray-600">총 단계</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{execution.completedSteps}</div>
                    <div className="text-sm text-gray-600">완료된 단계</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{execution.successfulSteps}</div>
                    <div className="text-sm text-gray-600">성공</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{execution.failedSteps}</div>
                    <div className="text-sm text-gray-600">실패</div>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">진행률</span>
                  <span className="text-sm text-gray-600">
                    {execution.completedSteps}/{execution.totalSteps} 
                    ({execution.totalSteps > 0 ? Math.round((execution.completedSteps / execution.totalSteps) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      execution.status === 'FAILED' ? 'bg-red-500' : 
                      execution.status === 'COMPLETED' ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ 
                      width: `${execution.totalSteps > 0 ? (execution.completedSteps / execution.totalSteps) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
              </div>

              {/* Execution Time */}
              <div className="mb-6">
                <div className="text-sm text-gray-600">
                  실행 시간: {formatDuration(execution.startedAt, execution.completedAt)}
                  {isExecuting && ' (진행 중...)'}
                </div>
              </div>
            </div>
          )}

          {/* Steps List */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-gray-900 mb-3">단계별 실행 상태</h3>
            {stepExecutions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                단계 실행 정보를 불러오는 중...
              </div>
            ) : (
              stepExecutions.map((step, index) => (
                <div key={step.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-500">#{step.stepOrder}</span>
                      <h4 className="font-medium text-gray-900">{step.stepName}</h4>
                      <div className="flex items-center gap-2">
                        {getStepStatusIcon(step.status)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(step.status)}`}>
                          {step.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 flex items-center gap-4">
                      {step.httpStatus && (
                        <span className={`font-mono ${
                          step.httpStatus >= 200 && step.httpStatus < 300 ? 'text-green-600' :
                          step.httpStatus >= 400 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          HTTP {step.httpStatus}
                        </span>
                      )}
                      {step.responseTime && (
                        <span className="text-gray-500">
                          {step.responseTime}ms
                        </span>
                      )}
                    </div>
                  </div>

                  {step.errorMessage && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      {step.errorMessage}
                    </div>
                  )}

                  {step.extractedData && (
                    <div className="mt-2">
                      <details className="text-sm">
                        <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                          추출된 데이터
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                          {step.extractedData}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          {isExecuting && (
            <div className="flex items-center gap-2 text-blue-600">
              <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <span className="text-sm">실행 중...</span>
            </div>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};