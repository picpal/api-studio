import axios from 'axios';
import { API_CONFIG } from '../../../config/api';
import { PipelineStep, ApiItem, CreateStepRequest, PipelineExecution, StepExecution } from '@/entities/pipeline';

// 기존 apiClient 재사용 - pipeline 전용
const pipelineApiClient = axios.create({
  baseURL: API_CONFIG.API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// 응답 인터셉터 설정 - 401 에러 시 인증 실패 처리
pipelineApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 401 에러 시 로그아웃 이벤트 발생
      window.dispatchEvent(new CustomEvent('auth-error'));
    }
    return Promise.reject(error);
  }
);

export const pipelineApi = {
  async fetchSteps(pipelineId: number): Promise<PipelineStep[]> {
    try {
      const response = await pipelineApiClient.get(`/pipelines/${pipelineId}/steps`);
      return response.data;
    } catch (error) {
      console.error('Error fetching steps:', error);
      throw error;
    }
  },

  async fetchApiItems(): Promise<ApiItem[]> {
    try {
      const response = await pipelineApiClient.get('/items');
      return response.data;
    } catch (error) {
      console.error('Error fetching API items:', error);
      throw error;
    }
  },

  async addStep(pipelineId: number, stepData: CreateStepRequest): Promise<PipelineStep> {
    try {
      const response = await pipelineApiClient.post(`/pipelines/${pipelineId}/steps`, stepData);
      return response.data;
    } catch (error) {
      console.error('Error adding step:', error);
      throw error;
    }
  },

  async deleteStep(stepId: number): Promise<void> {
    try {
      await pipelineApiClient.delete(`/pipelines/steps/${stepId}`);
    } catch (error) {
      console.error('Error deleting step:', error);
      throw error;
    }
  },

  async updateStep(stepId: number, stepData: Partial<CreateStepRequest>): Promise<PipelineStep> {
    try {
      const response = await pipelineApiClient.put(`/pipelines/steps/${stepId}`, stepData);
      return response.data;
    } catch (error) {
      console.error('Error updating step:', error);
      throw error;
    }
  },

  async executePipeline(pipelineId: number): Promise<PipelineExecution> {
    try {
      const response = await pipelineApiClient.post(`/pipelines/${pipelineId}/execute`);
      return response.data;
    } catch (error) {
      console.error('Error executing pipeline:', error);
      throw error;
    }
  },

  async getExecutionStatus(executionId: number): Promise<PipelineExecution> {
    try {
      const response = await pipelineApiClient.get(`/pipelines/executions/${executionId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting execution status:', error);
      throw error;
    }
  },

  async getStepExecutions(executionId: number): Promise<StepExecution[]> {
    try {
      const response = await pipelineApiClient.get(`/pipelines/executions/${executionId}/steps`);
      return response.data;
    } catch (error) {
      console.error('Error getting step executions:', error);
      throw error;
    }
  },

  async getExecutionHistory(pipelineId: number): Promise<PipelineExecution[]> {
    try {
      const response = await pipelineApiClient.get(`/pipelines/${pipelineId}/executions/history`);
      return response.data;
    } catch (error) {
      console.error('Error getting execution history:', error);
      throw error;
    }
  },

  async updatePipeline(pipelineId: number, data: { name: string; description: string }): Promise<any> {
    try {
      const response = await pipelineApiClient.put(`/pipelines/${pipelineId}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating pipeline:', error);
      throw error;
    }
  }
};