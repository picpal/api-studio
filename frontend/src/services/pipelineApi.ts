import axios from 'axios';
import { API_CONFIG } from '../config/api';

// 기존 apiClient 재사용
const apiClient = axios.create({
  baseURL: API_CONFIG.API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// 응답 인터셉터 설정 - 401 에러 시 인증 실패 처리
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 401 에러 시 로그아웃 이벤트 발생
      window.dispatchEvent(new CustomEvent('auth-error'));
    }
    return Promise.reject(error);
  }
);

interface PipelineFolder {
  id: number;
  name: string;
  description?: string;
  pipelines: Pipeline[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Pipeline {
  id: number;
  name: string;
  description: string;
  folderId: number | null;
  stepCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateFolderRequest {
  name: string;
  description?: string;
}

interface CreatePipelineRequest {
  name: string;
  description?: string;
  folderId: number;
}

interface PipelineExecutionResponse {
  id: number;
  pipelineId: number;
  pipelineName: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
  totalSteps: number;
  completedSteps: number;
  successfulSteps: number;
  failedSteps: number;
  sessionCookies?: string;
}

interface PipelineExecutionResult extends PipelineExecutionResponse {
  stepResults: PipelineStepResult[];
}

interface PipelineStepResult {
  id: string;
  stepName: string;
  stepOrder: number;
  status: string;
  method: string;
  url: string;
  statusCode?: number;
  responseTime?: number;
  errorMessage?: string;
  responseBody?: string;
  responseHeaders?: string;
}

export const pipelineApi = {
  // Folder operations
  async getFolders(): Promise<PipelineFolder[]> {
    try {
      const response = await apiClient.get('/pipelines/folders');
      
      const processedFolders = response.data.map((folder: any) => ({
        ...folder,
        createdAt: new Date(folder.createdAt),
        updatedAt: new Date(folder.updatedAt),
        pipelines: folder.pipelines || []
      }));
      
      return processedFolders;
    } catch (error) {
      throw error;
    }
  },

  async createFolder(folderData: CreateFolderRequest): Promise<PipelineFolder> {
    const response = await apiClient.post('/pipelines/folders', folderData);
    const folder = response.data;
    return {
      ...folder,
      createdAt: new Date(folder.createdAt),
      updatedAt: new Date(folder.updatedAt),
      pipelines: []
    };
  },

  async updateFolder(id: number, folderData: CreateFolderRequest): Promise<PipelineFolder> {
    const response = await apiClient.put(`/pipelines/folders/${id}`, folderData);
    const folder = response.data;
    return {
      ...folder,
      createdAt: new Date(folder.createdAt),
      updatedAt: new Date(folder.updatedAt),
      pipelines: folder.pipelines || []
    };
  },

  async deleteFolder(id: number): Promise<void> {
    await apiClient.delete(`/pipelines/folders/${id}`);
  },

  // Pipeline operations
  async getPipelines(): Promise<Pipeline[]> {
    const response = await apiClient.get('/pipelines');
    return response.data.map((pipeline: any) => ({
      ...pipeline,
      createdAt: new Date(pipeline.createdAt),
      updatedAt: new Date(pipeline.updatedAt)
    }));
  },

  async getPipelinesByFolder(folderId: number): Promise<Pipeline[]> {
    const response = await apiClient.get(`/pipelines/folder/${folderId}`);
    return response.data.map((pipeline: any) => ({
      ...pipeline,
      createdAt: new Date(pipeline.createdAt),
      updatedAt: new Date(pipeline.updatedAt)
    }));
  },

  async createPipeline(pipelineData: CreatePipelineRequest): Promise<Pipeline> {
    const response = await apiClient.post('/pipelines', pipelineData);
    const pipeline = response.data;
    return {
      ...pipeline,
      createdAt: new Date(pipeline.createdAt),
      updatedAt: new Date(pipeline.updatedAt)
    };
  },

  async updatePipeline(id: number, pipelineData: Partial<CreatePipelineRequest>): Promise<Pipeline> {
    // 백엔드에서 folderId는 받지 않으므로 제외하고 전송
    const updateData = {
      name: pipelineData.name,
      description: pipelineData.description
    };
    const response = await apiClient.put(`/pipelines/${id}`, updateData);
    const pipeline = response.data;
    return {
      ...pipeline,
      createdAt: new Date(pipeline.createdAt),
      updatedAt: new Date(pipeline.updatedAt)
    };
  },

  async deletePipeline(id: string): Promise<void> {
    await apiClient.delete(`/pipelines/${id}`);
  },

  // Pipeline execution operations
  async executePipeline(pipelineId: string): Promise<PipelineExecutionResponse> {
    const response = await apiClient.post(`/pipelines/${pipelineId}/execute`);
    return response.data;
  },

  async getExecutionResults(executionId: string): Promise<PipelineExecutionResult> {
    // 실행 상태 조회 (백엔드의 getExecutionStatus API)
    const executionResponse = await apiClient.get(`/pipelines/executions/${executionId}`);
    
    // Step 실행 결과 조회
    const stepsResponse = await apiClient.get(`/pipelines/executions/${executionId}/steps`);
    
    return {
      ...executionResponse.data,
      stepResults: stepsResponse.data || []
    };
  },

  async getExecutionStatus(executionId: string): Promise<{status: string; completed: boolean}> {
    const response = await apiClient.get(`/pipelines/executions/${executionId}`);
    const data = response.data;
    return {
      status: data.status,
      completed: data.status === 'SUCCESS' || data.status === 'FAILED' || data.status === 'CANCELLED'
    };
  },

  async movePipelineToFolder(pipelineId: number, folderId: number): Promise<Pipeline> {
    const response = await apiClient.put(`/pipelines/${pipelineId}`, { folderId });
    const pipeline = response.data;
    return {
      ...pipeline,
      createdAt: new Date(pipeline.createdAt),
      updatedAt: new Date(pipeline.updatedAt)
    };
  },

  async reorderPipelines(folderId: number, pipelines: { pipelineId: number; orderIndex: number }[]): Promise<void> {
    await apiClient.put('/pipelines/reorder', { folderId, pipelines });
  }
};

export type { 
  PipelineFolder, 
  Pipeline, 
  CreateFolderRequest, 
  CreatePipelineRequest,
  PipelineExecutionResponse,
  PipelineExecutionResult,
  PipelineStepResult
};