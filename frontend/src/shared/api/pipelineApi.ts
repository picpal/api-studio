import { API_CONFIG } from '../config/api';

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
    const response = await fetch(`${BASE_URL}/folders`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error('Failed to fetch folders');
    }
    const folders = await response.json();
    
    const processedFolders = folders.map((folder: any) => ({
      ...folder,
      createdAt: new Date(folder.createdAt),
      updatedAt: new Date(folder.updatedAt),
      pipelines: folder.pipelines || []
    }));
    
    return processedFolders;
  },

  async createFolder(folderData: CreateFolderRequest): Promise<PipelineFolder> {
    const response = await fetch(`${BASE_URL}/folders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(folderData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create folder');
    }
    
    const folder = await response.json();
    return {
      ...folder,
      createdAt: new Date(folder.createdAt),
      updatedAt: new Date(folder.updatedAt),
      pipelines: []
    };
  },

  async updateFolder(id: number, folderData: CreateFolderRequest): Promise<PipelineFolder> {
    const response = await fetch(`${BASE_URL}/folders/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(folderData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update folder');
    }
    
    const folder = await response.json();
    return {
      ...folder,
      createdAt: new Date(folder.createdAt),
      updatedAt: new Date(folder.updatedAt),
      pipelines: folder.pipelines || []
    };
  },

  async deleteFolder(id: number): Promise<void> {
    const response = await fetch(`${BASE_URL}/folders/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete folder');
    }
  },

  // Pipeline operations
  async getPipelines(): Promise<Pipeline[]> {
    const response = await fetch(BASE_URL, {
      credentials: 'include'
    });
    if (!response.ok) {
      throw new Error('Failed to fetch pipelines');
    }
    const pipelines = await response.json();
    return pipelines.map((pipeline: any) => ({
      ...pipeline,
      createdAt: new Date(pipeline.createdAt),
      updatedAt: new Date(pipeline.updatedAt)
    }));
  },

  async getPipelinesByFolder(folderId: number): Promise<Pipeline[]> {
    const response = await fetch(`${BASE_URL}/folder/${folderId}`, {
      credentials: 'include'
    });
    if (!response.ok) {
      throw new Error('Failed to fetch pipelines by folder');
    }
    const pipelines = await response.json();
    return pipelines.map((pipeline: any) => ({
      ...pipeline,
      createdAt: new Date(pipeline.createdAt),
      updatedAt: new Date(pipeline.updatedAt)
    }));
  },

  async createPipeline(pipelineData: CreatePipelineRequest): Promise<Pipeline> {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(pipelineData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create pipeline');
    }
    
    const pipeline = await response.json();
    return {
      ...pipeline,
      createdAt: new Date(pipeline.createdAt),
      updatedAt: new Date(pipeline.updatedAt)
    };
  },

  async updatePipeline(id: string, pipelineData: Partial<CreatePipelineRequest>): Promise<Pipeline> {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(pipelineData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update pipeline');
    }
    
    const pipeline = await response.json();
    return {
      ...pipeline,
      createdAt: new Date(pipeline.createdAt),
      updatedAt: new Date(pipeline.updatedAt)
    };
  },

  async deletePipeline(id: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete pipeline');
    }
  }
};

export type { PipelineFolder, Pipeline, CreateFolderRequest, CreatePipelineRequest };