import { useState } from 'react';
import { CreateStepRequest } from '@/entities/pipeline';
import { pipelineApi } from '../api/pipelineApi';

export const useStepManagement = (pipelineId?: number, onStepAdded?: () => void) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addStep = async (stepData: CreateStepRequest) => {
    console.log('useStepManagement.addStep: Called with data:', stepData, 'for pipeline:', pipelineId);
    if (!pipelineId) {
      setError('Pipeline ID is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('useStepManagement.addStep: Calling pipelineApi.addStep...');
      await pipelineApi.addStep(pipelineId, stepData);
      console.log('useStepManagement.addStep: Successfully added step, calling onStepAdded callback');
      onStepAdded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add step');
      console.error('Error adding step:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteStep = async (stepId: number, onStepDeleted?: () => void) => {
    setLoading(true);
    setError(null);

    try {
      await pipelineApi.deleteStep(stepId);
      onStepDeleted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete step');
      console.error('Error deleting step:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStep = async (stepId: number, stepData: Partial<CreateStepRequest>) => {
    setLoading(true);
    setError(null);

    try {
      await pipelineApi.updateStep(stepId, stepData);
      onStepAdded?.(); // 동일한 콜백 사용 (리프레시용)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update step');
      console.error('Error updating step:', err);
    } finally {
      setLoading(false);
    }
  };

  const updatePipeline = async (pipelineId: number, data: { name: string; description: string }) => {
    setLoading(true);
    setError(null);

    try {
      await pipelineApi.updatePipeline(pipelineId, data);
      onStepAdded?.(); // 동일한 콜백 사용 (리프레시용)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update pipeline');
      console.error('Error updating pipeline:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    addStep,
    deleteStep,
    updateStep,
    updatePipeline,
    loading,
    error
  };
};