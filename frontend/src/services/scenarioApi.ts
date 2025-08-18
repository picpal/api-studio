import { API_CONFIG } from '../config/api';

interface ScenarioFolder {
  id: number;
  name: string;
  description?: string;
  scenarios: Scenario[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Scenario {
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

interface CreateScenarioRequest {
  name: string;
  description: string;
  folderId: number;
}

const BASE_URL = `${API_CONFIG.API_URL}/scenarios`;

export const scenarioApi = {
  // Folder operations
  async getFolders(): Promise<ScenarioFolder[]> {
    console.log('scenarioApi.getFolders: Making request to', `${BASE_URL}/folders`);
    const response = await fetch(`${BASE_URL}/folders`, {
      credentials: 'include'
    });
    console.log('scenarioApi.getFolders: Response status:', response.status);
    console.log('scenarioApi.getFolders: Response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('scenarioApi.getFolders: Error response:', errorText);
      throw new Error('Failed to fetch folders');
    }
    const folders = await response.json();
    console.log('scenarioApi.getFolders: Raw folders from server:', folders);
    
    const processedFolders = folders.map((folder: any) => ({
      ...folder,
      createdAt: new Date(folder.createdAt),
      updatedAt: new Date(folder.updatedAt),
      scenarios: folder.scenarios || []
    }));
    
    console.log('scenarioApi.getFolders: Processed folders:', processedFolders);
    return processedFolders;
  },

  async createFolder(folderData: CreateFolderRequest): Promise<ScenarioFolder> {
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
      scenarios: []
    };
  },

  async updateFolder(id: number, folderData: CreateFolderRequest): Promise<ScenarioFolder> {
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
      scenarios: folder.scenarios || []
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

  // Scenario operations
  async getScenarios(): Promise<Scenario[]> {
    const response = await fetch(BASE_URL, {
      credentials: 'include'
    });
    if (!response.ok) {
      throw new Error('Failed to fetch scenarios');
    }
    const scenarios = await response.json();
    return scenarios.map((scenario: any) => ({
      ...scenario,
      createdAt: new Date(scenario.createdAt),
      updatedAt: new Date(scenario.updatedAt)
    }));
  },

  async getScenariosByFolder(folderId: number): Promise<Scenario[]> {
    const response = await fetch(`${BASE_URL}/folder/${folderId}`, {
      credentials: 'include'
    });
    if (!response.ok) {
      throw new Error('Failed to fetch scenarios by folder');
    }
    const scenarios = await response.json();
    return scenarios.map((scenario: any) => ({
      ...scenario,
      createdAt: new Date(scenario.createdAt),
      updatedAt: new Date(scenario.updatedAt)
    }));
  },

  async createScenario(scenarioData: CreateScenarioRequest): Promise<Scenario> {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(scenarioData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create scenario');
    }
    
    const scenario = await response.json();
    return {
      ...scenario,
      createdAt: new Date(scenario.createdAt),
      updatedAt: new Date(scenario.updatedAt)
    };
  },

  async updateScenario(id: string, scenarioData: Partial<CreateScenarioRequest>): Promise<Scenario> {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(scenarioData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update scenario');
    }
    
    const scenario = await response.json();
    return {
      ...scenario,
      createdAt: new Date(scenario.createdAt),
      updatedAt: new Date(scenario.updatedAt)
    };
  },

  async deleteScenario(id: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete scenario');
    }
  }
};

export type { ScenarioFolder, Scenario, CreateFolderRequest, CreateScenarioRequest };