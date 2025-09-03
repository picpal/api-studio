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
    } catch (err: any) {
      console.error('Failed to fetch steps:', err);
      // 403 에러는 인증 문제일 수 있으므로 별도 처리하지 않음 (인터셉터에서 처리됨)
      if (err.response?.status === 403) {
        setLoading(false);
        return;
      }
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

  const updateStep = (updatedStep: PipelineStep) => {
    setSteps(currentSteps => 
      currentSteps.map(step => 
        step.id === updatedStep.id ? updatedStep : step
      )
    );
  };

  return {
    steps,
    loading,
    error,
    refetchSteps,
    updateStep
  };
};