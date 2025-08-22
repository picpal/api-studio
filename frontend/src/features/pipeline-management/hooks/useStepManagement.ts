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

  return {
    addStep,
    deleteStep,
    loading,
    error
  };
};