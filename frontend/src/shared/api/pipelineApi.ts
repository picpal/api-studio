import { API_CONFIG } from '../config/api';
import { api } from './api';

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

const BASE_URL = `${API_CONFIG.API_URL}/pipelines`;

export const pipelineApi = {
  // Folder operations
  async getFolders(): Promise<PipelineFolder[]> {
    const response = await api.get('/pipelines/folders');
    const folders = response.data;
    
    const processedFolders = folders.map((folder: any) => ({
      ...folder,
      createdAt: new Date(folder.createdAt),
      updatedAt: new Date(folder.updatedAt),
      pipelines: folder.pipelines || []
    }));
    
    return processedFolders;
  },

  async createFolder(folderData: CreateFolderRequest): Promise<PipelineFolder> {
    const response = await api.post('/pipelines/folders', folderData);
    const folder = response.data;
    
    return {
      ...folder,
      createdAt: new Date(folder.createdAt),
      updatedAt: new Date(folder.updatedAt),
      pipelines: []
    };
  },

  async updateFolder(id: number, folderData: CreateFolderRequest): Promise<PipelineFolder> {
    const response = await api.put(`/pipelines/folders/${id}`, folderData);
    const folder = response.data;
    
    return {
      ...folder,
      createdAt: new Date(folder.createdAt),
      updatedAt: new Date(folder.updatedAt),
      pipelines: folder.pipelines || []
    };
  },

  async deleteFolder(id: number): Promise<void> {
    await api.delete(`/pipelines/folders/${id}`);
  },

  // Pipeline operations
  async getPipelines(): Promise<Pipeline[]> {
    const response = await api.get('/pipelines');
    const pipelines = response.data;
    
    return pipelines.map((pipeline: any) => ({
      ...pipeline,
      createdAt: new Date(pipeline.createdAt),
      updatedAt: new Date(pipeline.updatedAt)
    }));
  },

  async getPipelinesByFolder(folderId: number): Promise<Pipeline[]> {
    const response = await api.get(`/pipelines/folder/${folderId}`);
    const pipelines = response.data;
    
    return pipelines.map((pipeline: any) => ({
      ...pipeline,
      createdAt: new Date(pipeline.createdAt),
      updatedAt: new Date(pipeline.updatedAt)
    }));
  },

  async createPipeline(pipelineData: CreatePipelineRequest): Promise<Pipeline> {
    const response = await api.post('/pipelines', pipelineData);
    const pipeline = response.data;
    
    return {
      ...pipeline,
      createdAt: new Date(pipeline.createdAt),
      updatedAt: new Date(pipeline.updatedAt)
    };
  },

  async updatePipeline(id: string, pipelineData: Partial<CreatePipelineRequest>): Promise<Pipeline> {
    const response = await api.put(`/pipelines/${id}`, pipelineData);
    const pipeline = response.data;
    
    return {
      ...pipeline,
      createdAt: new Date(pipeline.createdAt),
      updatedAt: new Date(pipeline.updatedAt)
    };
  },

  async deletePipeline(id: string): Promise<void> {
    await api.delete(`/pipelines/${id}`);
  }
};

export type { PipelineFolder, Pipeline, CreateFolderRequest, CreatePipelineRequest };