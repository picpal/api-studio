import React from 'react';
import { PipelineStep } from '@/entities/pipeline';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface VisualFlowProps {
  steps: PipelineStep[];
  onDeleteStep: (stepId: number) => void;
  onEditStep?: (step: PipelineStep) => void;
  onReorderSteps?: (steps: PipelineStep[]) => void;
  onToggleSkip?: (stepId: number, isSkip: boolean) => void;
  loading?: boolean;
}

export const VisualFlow: React.FC<VisualFlowProps> = ({ 
  steps, 
  onDeleteStep, 
  onEditStep,
  onReorderSteps,
  onToggleSkip,
  loading 
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && onReorderSteps) {
      const oldIndex = steps.findIndex(step => step.id.toString() === active.id);
      const newIndex = steps.findIndex(step => step.id.toString() === over?.id);
      
      const reorderedSteps = arrayMove(steps, oldIndex, newIndex).map((step, index) => ({
        ...step,
        stepOrder: index + 1
      }));
      
      onReorderSteps(reorderedSteps);
    }
  };
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
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="relative">
        <SortableContext 
          items={steps.map(step => step.id.toString())}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-6 relative">
            {steps.map((step, index) => (
              <SortableStepCard
                key={step.id}
                step={step}
                onDeleteStep={onDeleteStep}
                onEditStep={onEditStep}
                onToggleSkip={onToggleSkip}
              />
            ))}
          </div>
        </SortableContext>
      </div>
    </DndContext>
  );
};

interface SortableStepCardProps {
  step: PipelineStep;
  onDeleteStep: (stepId: number) => void;
  onEditStep?: (step: PipelineStep) => void;
  onToggleSkip?: (stepId: number, isSkip: boolean) => void;
}

const SortableStepCard: React.FC<SortableStepCardProps> = ({
  step,
  onDeleteStep,
  onEditStep,
  onToggleSkip
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${isDragging ? 'z-50' : ''}`}
    >
      {/* 단계 카드 */}
      <div 
        className={`rounded-xl shadow-sm border transition-all duration-200 group cursor-pointer ${
          isDragging ? 'opacity-50' : ''
        } ${
          step.isSkip 
            ? 'bg-gray-50 border-gray-300 text-gray-500 hover:shadow-sm' 
            : 'bg-white border-gray-200 hover:shadow-md'
        }`}
        onClick={() => onEditStep && onEditStep(step)}
      >
        {/* 카드 헤더 */}
        <div className="px-4 md:px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
              {/* 드래그 핸들 */}
              <div 
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 6h2v2H8zm0 4h2v2H8zm0 4h2v2H8zm6-8h2v2h-2zm0 4h2v2h-2zm0 4h2v2h-2z"/>
                </svg>
              </div>
              
              <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                <span className={`text-xs md:text-sm font-medium ${
                  step.isSkip ? 'text-gray-400' : 'text-gray-500'
                }`}>STEP</span>
                <span className={`text-lg font-bold ${
                  step.isSkip ? 'text-gray-400' : 'text-blue-600'
                }`}>{step.stepOrder}</span>
                {step.isSkip && (
                  <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-medium">
                    SKIPPED
                  </span>
                )}
              </div>
              <div className="h-4 w-px bg-gray-300 hidden md:block"></div>
              <h3 className={`font-semibold truncate text-sm md:text-base ${
                step.isSkip ? 'text-gray-500 line-through' : 'text-gray-900'
              }`}>{step.stepName}</h3>
            </div>
            
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Skip Toggle Switch - Always visible when skip is ON, hover visible when OFF */}
              <div className={`flex items-center gap-2 transition-opacity ${
                step.isSkip ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}>
                <span className={`text-xs font-medium ${
                  step.isSkip ? 'text-orange-600' : 'text-gray-500'
                }`}>SKIP</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onToggleSkip && onToggleSkip(step.id, !step.isSkip);
                  }}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                    step.isSkip ? 'bg-orange-500' : 'bg-gray-200'
                  }`}
                  title={step.isSkip ? "단계 건너뛰기 비활성화" : "단계 건너뛰기 활성화"}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                      step.isSkip ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="text-xs text-gray-400 mr-1 hidden lg:block opacity-0 group-hover:opacity-100 transition-opacity">클릭하여 편집</div>
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onDeleteStep(step.id);
                }}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
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