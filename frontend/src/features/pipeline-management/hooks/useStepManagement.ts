import { useState } from 'react';
import { CreateStepRequest } from '@/entities/pipeline';
import { pipelineApi } from '../api/pipelineApi';

export const useStepManagement = (pipelineId?: number, onStepAdded?: () => void) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addStep = async (stepData: CreateStepRequest) => {
    if (!pipelineId) {
      setError('Pipeline ID is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await pipelineApi.addStep(pipelineId, stepData);
      onStepAdded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add step');
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