import { useState, useCallback, useRef } from 'react';
import { pipelineApi } from '../api/pipelineApi';
import { PipelineExecution, StepExecution } from '@/entities/pipeline';

export const usePipelineExecution = () => {
  const [currentExecution, setCurrentExecution] = useState<PipelineExecution | null>(null);
  const [stepExecutions, setStepExecutions] = useState<StepExecution[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const startExecution = useCallback(async (pipelineId: number) => {
    try {
      setIsExecuting(true);
      setError(null);

      const execution = await pipelineApi.executePipeline(pipelineId);
      
      setCurrentExecution(execution);
      
      // Start polling for status updates
      startPolling(execution.id);
      
      return execution;
    } catch (err: any) {
      setError(err.message || 'Failed to start pipeline execution');
      setIsExecuting(false);
      throw err;
    }
  }, []);

  const startPolling = useCallback((executionId: number) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    pollingRef.current = setInterval(async () => {
      try {
        // Get execution status
        const execution = await pipelineApi.getExecutionStatus(executionId);
        setCurrentExecution(execution);

        // Get step executions
        const steps = await pipelineApi.getStepExecutions(executionId);
        setStepExecutions(steps);

        // Stop polling if execution is completed or failed
        if (execution.status === 'COMPLETED' || execution.status === 'FAILED') {
          setIsExecuting(false);
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to get execution status');
        setIsExecuting(false);
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      }
    }, 1000); // Poll every second
  }, []);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setIsExecuting(false);
  }, []);

  const resetExecution = useCallback(() => {
    stopPolling();
    setCurrentExecution(null);
    setStepExecutions([]);
    setError(null);
  }, [stopPolling]);

  // Cleanup polling on unmount
  const cleanup = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  return {
    currentExecution,
    stepExecutions,
    isExecuting,
    error,
    startExecution,
    stopPolling,
    resetExecution,
    cleanup
  };
};