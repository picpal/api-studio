import React, { useState } from 'react';
import { TestExecution, PipelineStepExecution } from '../../../entities/test-execution';

interface TestExecutionProps {
  selectedApis: Set<string>;
  selectedPipelines: Set<string>;
  activeTab: 'apis' | 'pipelines';
  isRunning: boolean;
  currentExecution: TestExecution[];
  onExecuteBatch: () => void;
  onShowExecutionDetail: (execution: TestExecution) => void;
  onShowReport: () => void;
}

export const TestExecutionPanel: React.FC<TestExecutionProps> = ({
  selectedApis,
  selectedPipelines,
  activeTab,
  isRunning,
  currentExecution,
  onExecuteBatch,
  onShowExecutionDetail,
  onShowReport
}) => {
  const getStatusIcon = (status: TestExecution['status']) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'running':
        return '🔄';
      case 'success':
        return '✅';
      case 'failed':
        return '❌';
    }
  };

  const getStatusColor = (status: TestExecution['status']) => {
    switch (status) {
      case 'pending':
        return 'text-gray-500';
      case 'running':
        return 'text-blue-500';
      case 'success':
        return 'text-green-500';
      case 'failed':
        return 'text-red-500';
    }
  };

  return (
    <div className="lg:flex-1 flex flex-col lg:min-h-0">
      {/* 선택된 항목 및 실행 */}
      <div className="bg-white border-b p-4 lg:flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-lg font-semibold">Current Execution</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onExecuteBatch}
              disabled={isRunning || (activeTab === 'apis' ? selectedApis.size === 0 : selectedPipelines.size === 0)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              {isRunning ? 'Running...' : activeTab === 'apis' 
                ? `Run Tests (${selectedApis.size})` 
                : `Run Pipelines (${selectedPipelines.size})`
              }
            </button>
          </div>
        </div>
      </div>

      {/* 실행 결과 영역 */}
      <div className="bg-white p-4 lg:flex-1 flex flex-col lg:min-h-0">
        {currentExecution.length > 0 ? (
          <div className="space-y-2 lg:flex-1 lg:overflow-y-auto lg:min-h-0 max-h-96 lg:max-h-none overflow-y-auto">
            {currentExecution.map(execution => (
              <div key={execution.id} className="bg-gray-50 rounded border">
                <div 
                  className={`flex items-center justify-between p-3 transition-colors ${
                    (execution.status === 'success' || execution.status === 'failed') 
                      ? 'hover:bg-gray-100 cursor-pointer' 
                      : ''
                  }`}
                  onClick={() => {
                    if (execution.status === 'success' || execution.status === 'failed') {
                      onShowExecutionDetail(execution);
                    }
                  }}
                >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{getStatusIcon(execution.status)}</span>
                  <div>
                    <div className="font-medium text-sm flex items-center gap-2">
                      {execution.type === 'pipeline' && (
                        <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-800">
                          PIPELINE
                        </span>
                      )}
                      {execution.apiName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {execution.type === 'pipeline' 
                        ? `${execution.stepExecutions?.length || 0} steps`
                        : `${execution.method} • ${execution.url}`
                      }
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <div className={`text-sm font-medium ${getStatusColor(execution.status)}`}>
                      {execution.status.toUpperCase()}
                    </div>
                    {execution.validationEnabled && (
                      <div className="text-xs px-2 py-1 rounded border">
                        {execution.validationResult ? (
                          <span className={execution.validationResult.passed ? 'text-green-600 bg-green-50 border-green-200' : 'text-red-600 bg-red-50 border-red-200'}>
                            {execution.validationResult.passed ? '✅' : '❌'}
                          </span>
                        ) : (
                          <span className="text-gray-500 bg-gray-50 border-gray-200">⏳</span>
                        )}
                      </div>
                    )}
                  </div>
                  {execution.responseTime && (
                    <div className="text-xs text-gray-500">{execution.responseTime}ms</div>
                  )}
                  {execution.statusCode && (
                    <div className={`text-xs ${execution.statusCode >= 200 && execution.statusCode < 300 ? 'text-green-600' : 'text-red-600'}`}>
                      Status: {execution.statusCode}
                    </div>
                  )}
                  {execution.error && (
                    <div className="text-xs text-red-500 truncate max-w-32">{execution.error}</div>
                  )}
                  {(execution.status === 'success' || execution.status === 'failed') && (
                    <div className="text-xs text-blue-500 mt-1 hidden sm:block">Click to view details</div>
                  )}
                </div>
              </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            Select {activeTab === 'apis' ? 'APIs' : 'Pipelines'} and click "Run Tests" to start
          </div>
        )}
      </div>

      {/* 우측 하단 고정 리포트 버튼 */}
      {currentExecution.length > 0 && (
        <button
          onClick={onShowReport}
          className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-10"
          title="View Test Report"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>
      )}
    </div>
  );
};