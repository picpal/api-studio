import { useState, useEffect } from 'react';
import { PipelineStep } from '@/entities/pipeline';
import { pipelineApi } from '../api/pipelineApi';

export const usePipelineSteps = (pipelineId?: number) => {
  const [steps, setSteps] = useState<PipelineStep[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSteps = async (id: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await pipelineApi.fetchSteps(id);
      setSteps(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch steps');
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
    if (pipelineId) {
      fetchSteps(pipelineId);
    }
  };

  return {
    steps,
    loading,
    error,
    refetchSteps
  };
};