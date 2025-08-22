import React, { useState } from 'react';
import { Pipeline } from '@/entities/pipeline';
import { usePipelineSteps, useApiItems, useStepManagement } from '@/features/pipeline-management';
import { PipelineHeader, StepsList, AddStepModal, PipelineEmpty } from '@/widgets/pipeline';

interface PipelineManagementPageProps {
  selectedPipeline?: Pipeline | null;
}

const PipelineManagementPage: React.FC<PipelineManagementPageProps> = ({ 
  selectedPipeline
}) => {
  const [showAddStepModal, setShowAddStepModal] = useState(false);
  
  const { steps, loading: stepsLoading, refetchSteps } = usePipelineSteps(selectedPipeline?.id);
  const { apiItems, loading: apiItemsLoading } = useApiItems();
  const { addStep, deleteStep, loading: stepManagementLoading } = useStepManagement(
    selectedPipeline?.id, 
    () => {
      refetchSteps();
      setShowAddStepModal(false);
    }
  );

  const handleAddStep = async (stepData: { apiItemId: number; stepName: string; description: string }) => {
    await addStep(stepData);
  };

  const handleDeleteStep = async (stepId: number) => {
    await deleteStep(stepId, refetchSteps);
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
            <PipelineHeader pipeline={selectedPipeline} />
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">시나리오 단계</h3>
              
              <StepsList 
                steps={steps} 
                onDeleteStep={handleDeleteStep}
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
      />
    </div>
  );
};

export default PipelineManagementPage;