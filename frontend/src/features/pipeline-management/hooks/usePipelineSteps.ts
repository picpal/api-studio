import { useState, useEffect } from 'react';
import { PipelineStep } from '@/entities/pipeline';
import { pipelineApi } from '../api/pipelineApi';

export const usePipelineSteps = (pipelineId?: number) => {
  const [steps, setSteps] = useState<PipelineStep[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSteps = async (id: number) => {
    console.log('usePipelineSteps.fetchSteps: Starting to fetch steps for pipeline:', id);
    setLoading(true);
    setError(null);
    
    try {
      const data = await pipelineApi.fetchSteps(id);
      console.log('usePipelineSteps.fetchSteps: Received steps data:', data);
      setSteps(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch steps');
      console.error('Error fetching steps:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pipelineId) {
      fetchSteps(pipelineId);
    } else {
      setSteps([]);
    }
  }, [pipelineId]);

  const refetchSteps = () => {
    console.log('usePipelineSteps.refetchSteps: Called for pipeline:', pipelineId);
    if (pipelineId) {
      fetchSteps(pipelineId);
    } else {
      console.log('usePipelineSteps.refetchSteps: No pipelineId available');
    }
  };

  return {
    steps,
    loading,
    error,
    refetchSteps
  };
};