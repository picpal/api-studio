// UI Testing API 서비스

import {
  UiTestFolder,
  UiTestScript,
  UiTestExecution,
  CreateUiTestFolderRequest,
  UpdateUiTestFolderRequest,
  CreateUiTestScriptRequest,
  UpdateUiTestScriptRequest,
  ExecuteUiTestScriptRequest,
  UiTestExecutionResult
} from '../../entities/ui-testing/types';

const BASE_URL = '/api/ui-tests';

const createFetchOptions = (options: RequestInit = {}) => ({
  credentials: 'include' as RequestCredentials,
  headers: {
    'Content-Type': 'application/json',
    ...options.headers,
  },
  ...options,
});

// Folder API
export const uiTestFolderApi = {
  async getAll(): Promise<UiTestFolder[]> {
    const response = await fetch(`${BASE_URL}/folders`, createFetchOptions());
    if (!response.ok) throw new Error('Failed to fetch folders');
    return response.json();
  },

  async getStructure(): Promise<UiTestFolder[]> {
    const response = await fetch(`${BASE_URL}/folders/structure`, createFetchOptions());
    if (!response.ok) throw new Error('Failed to fetch folder structure');
    return response.json();
  },

  async getById(id: number): Promise<UiTestFolder> {
    const response = await fetch(`${BASE_URL}/folders/${id}`, createFetchOptions());
    if (!response.ok) throw new Error('Failed to fetch folder');
    return response.json();
  },

  async create(data: CreateUiTestFolderRequest): Promise<UiTestFolder> {
    const response = await fetch(`${BASE_URL}/folders`, createFetchOptions({
      method: 'POST',
      body: JSON.stringify(data),
    }));
    if (!response.ok) throw new Error('Failed to create folder');
    return response.json();
  },

  async update(id: number, data: UpdateUiTestFolderRequest): Promise<UiTestFolder> {
    const response = await fetch(`${BASE_URL}/folders/${id}`, createFetchOptions({
      method: 'PUT',
      body: JSON.stringify(data),
    }));
    if (!response.ok) throw new Error('Failed to update folder');
    return response.json();
  },

  async delete(id: number): Promise<void> {
    const response = await fetch(`${BASE_URL}/folders/${id}`, createFetchOptions({
      method: 'DELETE',
    }));
    if (!response.ok) throw new Error('Failed to delete folder');
  },

  async getScripts(folderId: number): Promise<UiTestScript[]> {
    const response = await fetch(`${BASE_URL}/folders/${folderId}/scripts`, createFetchOptions());
    if (!response.ok) throw new Error('Failed to fetch folder scripts');
    return response.json();
  }
};

// Script API
export const uiTestScriptApi = {
  async getAll(): Promise<UiTestScript[]> {
    const response = await fetch(`${BASE_URL}/scripts`, createFetchOptions());
    if (!response.ok) throw new Error('Failed to fetch scripts');
    return response.json();
  },

  async getById(id: number): Promise<UiTestScript> {
    const response = await fetch(`${BASE_URL}/scripts/${id}`, createFetchOptions());
    if (!response.ok) throw new Error('Failed to fetch script');
    return response.json();
  },

  async create(data: CreateUiTestScriptRequest): Promise<UiTestScript> {
    const response = await fetch(`${BASE_URL}/scripts`, createFetchOptions({
      method: 'POST',
      body: JSON.stringify(data),
    }));
    if (!response.ok) throw new Error('Failed to create script');
    return response.json();
  },

  async update(id: number, data: UpdateUiTestScriptRequest): Promise<UiTestScript> {
    const response = await fetch(`${BASE_URL}/scripts/${id}`, createFetchOptions({
      method: 'PUT',
      body: JSON.stringify(data),
    }));
    if (!response.ok) throw new Error('Failed to update script');
    return response.json();
  },

  async delete(id: number): Promise<void> {
    const response = await fetch(`${BASE_URL}/scripts/${id}`, createFetchOptions({
      method: 'DELETE',
    }));
    if (!response.ok) throw new Error('Failed to delete script');
  },

  async execute(id: number): Promise<UiTestExecutionResult> {
    const response = await fetch(`${BASE_URL}/scripts/${id}/execute`, createFetchOptions({
      method: 'POST',
    }));
    if (!response.ok) throw new Error('Failed to execute script');
    return response.json();
  },

  async uploadScript(file: File, folderId?: number): Promise<UiTestScript> {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) {
      formData.append('folderId', folderId.toString());
    }

    const response = await fetch(`${BASE_URL}/scripts/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    if (!response.ok) {
      // Try to extract meaningful error from server
      const contentType = response.headers.get('content-type') || '';
      let errorDetail = '';
      try {
        if (contentType.includes('application/json')) {
          const data = await response.json();
          errorDetail = typeof data === 'string' ? data : (data.error || data.message || JSON.stringify(data));
        } else {
          errorDetail = await response.text();
        }
      } catch (_) {
        // ignore parse errors
      }

      const statusInfo = `${response.status}${response.statusText ? ' ' + response.statusText : ''}`;
      const message = errorDetail
        ? `Upload failed [${statusInfo}]: ${errorDetail}`
        : `Upload failed [${statusInfo}]`;
      throw new Error(message);
    }
    return response.json();
  }
};

// Execution API
export const uiTestExecutionApi = {
  async getAll(): Promise<UiTestExecution[]> {
    const response = await fetch(`${BASE_URL}/executions`, createFetchOptions());
    if (!response.ok) throw new Error('Failed to fetch executions');
    return response.json();
  },

  async getById(id: number): Promise<UiTestExecution> {
    const response = await fetch(`${BASE_URL}/executions/${id}`, createFetchOptions());
    if (!response.ok) throw new Error('Failed to fetch execution');
    return response.json();
  },

  async getByScript(scriptId: number): Promise<UiTestExecution[]> {
    const response = await fetch(`${BASE_URL}/scripts/${scriptId}/executions`, createFetchOptions());
    if (!response.ok) throw new Error('Failed to fetch script executions');
    return response.json();
  },

  async getStats(): Promise<any> {
    const response = await fetch(`${BASE_URL}/executions/stats`, createFetchOptions());
    if (!response.ok) throw new Error('Failed to fetch execution stats');
    return response.json();
  },

  async cancel(id: number): Promise<void> {
    const response = await fetch(`${BASE_URL}/executions/${id}/cancel`, createFetchOptions({
      method: 'POST',
    }));
    if (!response.ok) throw new Error('Failed to cancel execution');
  }
};
