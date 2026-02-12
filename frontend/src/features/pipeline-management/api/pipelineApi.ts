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

// 응답 인터셉터 설정 - 401, 403 에러 시 인증 실패 처리
pipelineApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // 401, 403 에러 시 로그아웃 이벤트 발생
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
      throw error;
    }
  },

  async fetchApiItems(): Promise<ApiItem[]> {
    try {
      const response = await pipelineApiClient.get('/items');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async addStep(pipelineId: number, stepData: CreateStepRequest): Promise<PipelineStep> {
    try {
      const response = await pipelineApiClient.post(`/pipelines/${pipelineId}/steps`, stepData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async deleteStep(stepId: number): Promise<void> {
    try {
      await pipelineApiClient.delete(`/pipelines/steps/${stepId}`);
    } catch (error) {
      throw error;
    }
  },

  async updateStep(stepId: number, stepData: Partial<CreateStepRequest>): Promise<PipelineStep> {
    try {
      const response = await pipelineApiClient.put(`/pipelines/steps/${stepId}`, stepData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async executePipeline(pipelineId: number): Promise<PipelineExecution> {
    try {
      const response = await pipelineApiClient.post(`/pipelines/${pipelineId}/execute`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getExecutionStatus(executionId: number): Promise<PipelineExecution> {
    try {
      const response = await pipelineApiClient.get(`/pipelines/executions/${executionId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getStepExecutions(executionId: number): Promise<StepExecution[]> {
    try {
      const response = await pipelineApiClient.get(`/pipelines/executions/${executionId}/steps`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getExecutionHistory(pipelineId: number): Promise<PipelineExecution[]> {
    try {
      const response = await pipelineApiClient.get(`/pipelines/${pipelineId}/executions/history`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async updatePipeline(pipelineId: number, data: {
    name?: string;
    description?: string;
    folderId?: number;
    orderIndex?: number
  }): Promise<any> {
    try {
      const response = await pipelineApiClient.put(`/pipelines/${pipelineId}`, data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  async reorderPipelines(folderId: number, pipelines: { pipelineId: number; orderIndex: number }[]): Promise<void> {
    try {
      await pipelineApiClient.put('/pipelines/reorder', { folderId, pipelines });
    } catch (error: any) {
      throw error;
    }
  },

  async updateStepSkip(stepId: number, isSkip: boolean): Promise<PipelineStep> {
    try {
      const response = await pipelineApiClient.put(`/pipelines/steps/${stepId}/skip`, { skip: isSkip });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};