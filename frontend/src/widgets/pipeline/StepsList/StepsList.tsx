import React from 'react';
import { PipelineStep } from '@/entities/pipeline';

interface StepsListProps {
  steps: PipelineStep[];
  onDeleteStep: (stepId: number) => void;
  loading?: boolean;
}

export const StepsList: React.FC<StepsListProps> = ({ steps, onDeleteStep, loading }) => {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (steps.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        아직 추가된 단계가 없습니다. 첫 번째 단계를 추가해보세요.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {steps.map((step) => (
        <div key={step.id} className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
              {step.stepOrder}
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">
                {step.stepName}
              </div>
              <div className="text-sm text-gray-500 mb-1">
                {step.apiItem.method} {step.apiItem.url}
              </div>
              {step.description && (
                <div className="text-sm text-gray-600">
                  {step.description}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {step.stepOrder > 1 && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                  데이터 의존성
                </span>
              )}
              <button 
                onClick={() => onDeleteStep(step.id)}
                className="text-red-400 hover:text-red-600"
                title="단계 삭제"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* 데이터 전달 정보 표시 */}
          {(step.dataExtractions || step.dataInjections || step.delayAfter) && (
            <div className="ml-11 mt-2 space-y-1">
              {step.dataExtractions && step.dataExtractions !== '{}' && (
                <div className="text-xs bg-green-50 text-green-700 rounded px-2 py-1 border border-green-200">
                  <span className="font-medium">📤 데이터 추출:</span> {
                    (() => {
                      try {
                        return Object.keys(JSON.parse(step.dataExtractions)).join(', ');
                      } catch {
                        return '설정됨';
                      }
                    })()
                  }
                </div>
              )}
              {step.dataInjections && step.dataInjections !== '{}' && (
                <div className="text-xs bg-blue-50 text-blue-700 rounded px-2 py-1 border border-blue-200">
                  <span className="font-medium">📥 데이터 사용:</span> {
                    (() => {
                      try {
                        return Object.keys(JSON.parse(step.dataInjections)).join(', ');
                      } catch {
                        return '설정됨';
                      }
                    })()
                  }
                </div>
              )}
              {step.delayAfter && (
                <div className="text-xs bg-yellow-50 text-yellow-700 rounded px-2 py-1 border border-yellow-200">
                  <span className="font-medium">⏱️ 대기시간:</span> {step.delayAfter}ms
                </div>
              )}
            </div>
          )}
          
          {step.stepOrder > 1 && !step.dataExtractions && !step.dataInjections && (
            <div className="ml-11 text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">
              이전 단계에서 추출된 데이터를 사용할 수 있습니다
            </div>
          )}
        </div>
      ))}
    </div>
  );
};