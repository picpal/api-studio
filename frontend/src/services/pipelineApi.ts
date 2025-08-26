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
  description: string;
  folderId: number;
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

  async updatePipeline(id: string, pipelineData: Partial<CreatePipelineRequest>): Promise<Pipeline> {
    const response = await apiClient.put(`/pipelines/${id}`, pipelineData);
    const pipeline = response.data;
    return {
      ...pipeline,
      createdAt: new Date(pipeline.createdAt),
      updatedAt: new Date(pipeline.updatedAt)
    };
  },

  async deletePipeline(id: string): Promise<void> {
    await apiClient.delete(`/pipelines/${id}`);
  }
};

export type { PipelineFolder, Pipeline, CreateFolderRequest, CreatePipelineRequest };