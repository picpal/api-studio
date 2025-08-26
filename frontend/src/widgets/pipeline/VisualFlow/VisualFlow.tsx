import React from 'react';
import { PipelineStep } from '@/entities/pipeline';

interface VisualFlowProps {
  steps: PipelineStep[];
  onDeleteStep: (stepId: number) => void;
  onEditStep?: (step: PipelineStep) => void;
  loading?: boolean;
}

export const VisualFlow: React.FC<VisualFlowProps> = ({ 
  steps, 
  onDeleteStep, 
  onEditStep,
  loading 
}) => {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (steps.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🚀</div>
        <div className="text-lg font-medium text-gray-900 mb-2">
          첫 번째 단계를 추가해보세요
        </div>
        <div className="text-gray-500">
          API 테스트 시나리오의 첫 단계를 만들어 시작하세요
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* 연결선 배경 - 모바일에서는 숨김 */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-blue-300 to-blue-200 hidden md:block"></div>
      
      <div className="space-y-6 relative">
        {steps.map((step, index) => (
          <div key={step.id} className="relative">
            {/* 단계 카드 */}
            <div 
              className="md:ml-16 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 group cursor-pointer"
              onClick={() => onEditStep && onEditStep(step)}
            >
              {/* 카드 헤더 */}
              <div className="px-4 md:px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                    <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                      <span className="text-xs md:text-sm font-medium text-gray-500">STEP</span>
                      <span className="text-lg font-bold text-blue-600">{step.stepOrder}</span>
                    </div>
                    <div className="h-4 w-px bg-gray-300 hidden md:block"></div>
                    <h3 className="font-semibold text-gray-900 truncate text-sm md:text-base">{step.stepName}</h3>
                  </div>
                  
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <div className="text-xs text-gray-400 mr-2 hidden lg:block">클릭하여 편집</div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteStep(step.id);
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="단계 삭제"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {step.description && (
                  <p className="text-sm text-gray-600 mt-2">{step.description}</p>
                )}
              </div>
              
              {/* 카드 본문 */}
              <div className="px-4 md:px-6 py-4">
                {/* API 정보 */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-4">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${getMethodColor(step.apiItem.method)} self-start`}>
                    {step.apiItem.method}
                  </div>
                  <div className="font-mono text-xs sm:text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-md flex-1 overflow-hidden">
                    <div className="truncate" title={step.apiItem.url}>
                      {step.apiItem.url}
                    </div>
                  </div>
                </div>
                
                {/* 데이터 플로우 정보 */}
                <DataFlowInfo step={step} />
              </div>
            </div>
            
            {/* 플로우 노드 - 모바일에서는 간소화 */}
            <FlowNode 
              step={step} 
              isLast={index === steps.length - 1}
              hasDataFlow={!!(step.dataExtractions && step.dataExtractions !== '{}') || !!(step.dataInjections && step.dataInjections !== '{}')}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

interface FlowNodeProps {
  step: PipelineStep;
  isLast: boolean;
  hasDataFlow: boolean;
}

const FlowNode: React.FC<FlowNodeProps> = ({ step, isLast, hasDataFlow }) => {
  return (
    <div className="absolute left-0 top-6 hidden md:block">
      {/* 플로우 노드 */}
      <div className={`w-16 h-16 rounded-full border-4 ${
        hasDataFlow 
          ? 'bg-gradient-to-br from-blue-400 to-blue-600 border-blue-200 shadow-lg' 
          : 'bg-white border-gray-300 shadow-sm'
      } flex items-center justify-center z-10 relative`}>
        <div className={`text-lg font-bold ${hasDataFlow ? 'text-white' : 'text-gray-600'}`}>
          {step.stepOrder}
        </div>
        
        {/* 데이터 플로우 표시 */}
        {hasDataFlow && (
          <div className="absolute -right-2 -top-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
            <div className="text-xs">🔄</div>
          </div>
        )}
      </div>
      
      {/* 연결선 화살표 */}
      {!isLast && (
        <div className="absolute top-16 left-8 transform -translate-x-1/2">
          <div className="w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-blue-300"></div>
        </div>
      )}
    </div>
  );
};

interface DataFlowInfoProps {
  step: PipelineStep;
}

const DataFlowInfo: React.FC<DataFlowInfoProps> = ({ step }) => {
  const hasExtraction = step.dataExtractions && step.dataExtractions !== '{}';
  const hasInjection = step.dataInjections && step.dataInjections !== '{}';
  const hasDelay = step.delayAfter && step.delayAfter > 0;

  if (!hasExtraction && !hasInjection && !hasDelay) {
    return null;
  }

  const parseJson = (jsonString: string | undefined) => {
    try {
      return jsonString ? JSON.parse(jsonString) : {};
    } catch {
      return {};
    }
  };

  const extractionData = parseJson(step.dataExtractions);
  const injectionData = parseJson(step.dataInjections);

  return (
    <div className="border-t border-gray-100 pt-4 space-y-2">
      {hasExtraction && (
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span className="font-medium text-green-700">추출:</span>
          <div className="flex flex-wrap gap-1">
            {Object.keys(extractionData).map(key => (
              <span key={key} className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">
                {key}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {hasInjection && (
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
          <span className="font-medium text-blue-700">사용:</span>
          <div className="flex flex-wrap gap-1">
            {Object.keys(injectionData).map(key => (
              <span key={key} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">
                {key}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {hasDelay && (
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
          <span className="font-medium text-yellow-700">대기:</span>
          <span className="text-yellow-700 text-xs">{step.delayAfter}ms</span>
        </div>
      )}
    </div>
  );
};

const getMethodColor = (method: string) => {
  switch (method.toUpperCase()) {
    case 'GET':
      return 'bg-green-100 text-green-800';
    case 'POST':
      return 'bg-blue-100 text-blue-800';
    case 'PUT':
      return 'bg-orange-100 text-orange-800';
    case 'DELETE':
      return 'bg-red-100 text-red-800';
    case 'PATCH':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};