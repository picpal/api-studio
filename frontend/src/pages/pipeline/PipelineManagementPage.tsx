import React, { useState } from 'react';
import { Pipeline } from '@/entities/pipeline';
import { usePipelineSteps, useApiItems, useStepManagement } from '@/features/pipeline-management';
import { PipelineHeader, AddStepModal, EditStepModal, EditPipelineModal, PipelineEmpty, VisualFlow } from '@/widgets/pipeline';

interface PipelineManagementPageProps {
  selectedPipeline?: Pipeline | null;
  onPipelineUpdate?: () => void;
}

const PipelineManagementPage: React.FC<PipelineManagementPageProps> = ({ 
  selectedPipeline,
  onPipelineUpdate
}) => {
  const [showAddStepModal, setShowAddStepModal] = useState(false);
  const [showEditStepModal, setShowEditStepModal] = useState(false);
  const [showEditPipelineModal, setShowEditPipelineModal] = useState(false);
  const [editingStep, setEditingStep] = useState<any>(null);
  
  const { steps, loading: stepsLoading, refetchSteps, updateStep: updateStepInList } = usePipelineSteps(selectedPipeline?.id);
  const { apiItems, loading: apiItemsLoading } = useApiItems();
  const { addStep, deleteStep, updateStep, updatePipeline, toggleStepSkip, loading: stepManagementLoading } = useStepManagement(
    selectedPipeline?.id, 
    () => {
      refetchSteps();
      setShowAddStepModal(false);
      setShowEditStepModal(false);
      setShowEditPipelineModal(false);
    },
    (updatedStep) => {
      updateStepInList(updatedStep);
    }
  );

  const handleAddStep = async (stepData: { apiItemId: number; stepName: string; description: string }): Promise<void> => {
    try {
      await addStep(stepData);
      // addStep이 성공하면 콜백에서 refetchSteps()와 setShowAddStepModal(false)가 자동으로 호출됨
    } catch (error) {
      // 에러가 발생해도 모달은 열어둠
      throw error; // 에러를 다시 throw해서 AddStepModal에서 처리할 수 있도록 함
    }
  };

  const handleDeleteStep = async (stepId: number) => {
    await deleteStep(stepId, refetchSteps);
  };

  const handleEditStep = (step: any) => {
    setEditingStep(step);
    setShowEditStepModal(true);
  };

  const handleUpdateStep = async (stepId: number, stepData: any) => {
    if (updateStep) {
      await updateStep(stepId, stepData);
    }
  };

  const handleEditPipeline = () => {
    setShowEditPipelineModal(true);
  };

  const handleUpdatePipeline = async (pipelineId: number, data: { name: string; description: string }) => {
    if (updatePipeline) {
      await updatePipeline(pipelineId, data);
      // Pipeline 업데이트 후 부모 컴포넌트에서 서버 데이터 새로고침 요청
      onPipelineUpdate?.();
    }
  };

  const handleToggleSkip = async (stepId: number, isSkip: boolean) => {
    await toggleStepSkip(stepId, isSkip);
  };

  const handleReorderSteps = async (reorderedSteps: any[]) => {
    if (!selectedPipeline) return;
    
    console.log('handleReorderSteps called with:', reorderedSteps);
    
    try {
      const requestData = {
        steps: reorderedSteps.map(step => ({
          stepId: step.id,
          newOrder: step.stepOrder
        }))
      };
      
      console.log('Sending batch reorder request:', requestData);
      
      // batch API를 사용해서 step 순서를 한번에 업데이트
      const response = await fetch(`/api/pipelines/${selectedPipeline.id}/steps/batch-reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error('Failed to reorder steps: ' + errorText);
      }
      
      const result = await response.json();
      console.log('Reorder result:', result);
      
      // 성공 후 데이터 새로고침
      refetchSteps();
    } catch (error) {
      console.error('Failed to reorder steps:', error);
      // 에러 발생 시 원래 데이터로 되돌림
      refetchSteps();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">테스트 시나리오</h1>
            <p className="text-sm text-gray-600 mt-1">
              의존성이 있는 API 테스트 시나리오를 생성하고 관리합니다
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        {selectedPipeline ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <PipelineHeader 
              pipeline={selectedPipeline} 
              actualStepCount={steps?.length}
              stepsLoading={stepsLoading}
              onEditPipeline={handleEditPipeline}
            />
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-6">시나리오 단계</h3>
              
              <VisualFlow 
                steps={steps} 
                onDeleteStep={handleDeleteStep}
                onEditStep={handleEditStep}
                onReorderSteps={handleReorderSteps}
                onToggleSkip={handleToggleSkip}
                loading={stepsLoading}
              />

              <button 
                onClick={() => setShowAddStepModal(true)}
                className="mt-4 w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
              >
                + 새 단계 추가
              </button>
            </div>
          </div>
        ) : (
          <PipelineEmpty />
        )}
      </div>

      <AddStepModal
        isOpen={showAddStepModal}
        onClose={() => setShowAddStepModal(false)}
        onAddStep={handleAddStep}
        apiItems={apiItems}
        loading={stepManagementLoading || apiItemsLoading}
        stepCount={steps?.length || 0}
      />
      
      <EditStepModal
        isOpen={showEditStepModal}
        onClose={() => {
          setShowEditStepModal(false);
          setEditingStep(null);
        }}
        onUpdateStep={handleUpdateStep}
        step={editingStep}
        apiItems={apiItems}
        loading={stepManagementLoading}
        totalSteps={steps?.length || 0}
      />
      
      <EditPipelineModal
        isOpen={showEditPipelineModal}
        onClose={() => setShowEditPipelineModal(false)}
        onUpdatePipeline={handleUpdatePipeline}
        pipeline={selectedPipeline || null}
        loading={stepManagementLoading}
      />
    </div>
  );
};

export default PipelineManagementPage;