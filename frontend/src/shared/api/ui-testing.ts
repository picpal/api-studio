// UI Testing API 서비스

import {
  UiTestFolder,
  UiTestScript,
  UiTestFile,
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
    if (!response.ok) throw new Error('폴더 목록을 불러오는데 실패했습니다');
    return response.json();
  },

  async getStructure(): Promise<UiTestFolder[]> {
    const response = await fetch(`${BASE_URL}/folders/structure`, createFetchOptions());
    if (!response.ok) throw new Error('폴더 구조를 불러오는데 실패했습니다');
    return response.json();
  },

  async getById(id: number): Promise<UiTestFolder> {
    const response = await fetch(`${BASE_URL}/folders/${id}`, createFetchOptions());
    if (!response.ok) throw new Error('폴더 정보를 불러오는데 실패했습니다');
    return response.json();
  },

  async create(data: CreateUiTestFolderRequest): Promise<UiTestFolder> {
    const response = await fetch(`${BASE_URL}/folders`, createFetchOptions({
      method: 'POST',
      body: JSON.stringify(data),
    }));
    if (!response.ok) throw new Error('폴더 생성에 실패했습니다');
    return response.json();
  },

  async update(id: number, data: UpdateUiTestFolderRequest): Promise<UiTestFolder> {
    const response = await fetch(`${BASE_URL}/folders/${id}`, createFetchOptions({
      method: 'PUT',
      body: JSON.stringify(data),
    }));
    if (!response.ok) throw new Error('폴더 수정에 실패했습니다');
    return response.json();
  },

  async delete(id: number): Promise<void> {
    const response = await fetch(`${BASE_URL}/folders/${id}`, createFetchOptions({
      method: 'DELETE',
    }));
    if (!response.ok) throw new Error('폴더 삭제에 실패했습니다');
  },

  async getScripts(folderId: number): Promise<UiTestScript[]> {
    const response = await fetch(`${BASE_URL}/folders/${folderId}/scripts`, createFetchOptions());
    if (!response.ok) throw new Error('폴더의 스크립트 목록을 불러오는데 실패했습니다');
    return response.json();
  }
};

// Script API
export const uiTestScriptApi = {
  async getAll(): Promise<UiTestScript[]> {
    const response = await fetch(`${BASE_URL}/scripts`, createFetchOptions());
    if (!response.ok) throw new Error('스크립트 목록을 불러오는데 실패했습니다');
    return response.json();
  },

  async getById(id: number): Promise<UiTestScript> {
    const response = await fetch(`${BASE_URL}/scripts/${id}`, createFetchOptions());
    if (!response.ok) throw new Error('스크립트 정보를 불러오는데 실패했습니다');
    return response.json();
  },

  async create(data: CreateUiTestScriptRequest): Promise<UiTestScript> {
    const response = await fetch(`${BASE_URL}/scripts`, createFetchOptions({
      method: 'POST',
      body: JSON.stringify(data),
    }));
    if (!response.ok) throw new Error('스크립트 생성에 실패했습니다');
    return response.json();
  },

  async update(id: number, data: UpdateUiTestScriptRequest): Promise<UiTestScript> {
    const response = await fetch(`${BASE_URL}/scripts/${id}`, createFetchOptions({
      method: 'PUT',
      body: JSON.stringify(data),
    }));
    if (!response.ok) throw new Error('스크립트 수정에 실패했습니다');
    return response.json();
  },

  async delete(id: number): Promise<void> {
    const response = await fetch(`${BASE_URL}/scripts/${id}`, createFetchOptions({
      method: 'DELETE',
    }));
    if (!response.ok) throw new Error('스크립트 삭제에 실패했습니다');
  },

  async execute(id: number): Promise<UiTestExecutionResult> {
    const response = await fetch(`${BASE_URL}/scripts/${id}/execute`, createFetchOptions({
      method: 'POST',
    }));
    if (!response.ok) throw new Error('스크립트 실행에 실패했습니다');
    return response.json();
  },

}

// File API
export const uiTestFileApi = {
  async getFilesByScript(scriptId: number): Promise<UiTestFile[]> {
    const response = await fetch(`${BASE_URL}/scripts/${scriptId}/files`, createFetchOptions());
    if (!response.ok) throw new Error('파일 목록을 불러오는데 실패했습니다');
    return response.json();
  },

  async getById(fileId: number): Promise<UiTestFile> {
    const response = await fetch(`${BASE_URL}/files/${fileId}`, createFetchOptions());
    if (!response.ok) throw new Error('파일 정보를 불러오는데 실패했습니다');
    return response.json();
  },

  async uploadFile(scriptId: number, file: File): Promise<UiTestFile> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${BASE_URL}/scripts/${scriptId}/files/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    if (!response.ok) {
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
        ? `업로드 실패 [${statusInfo}]: ${errorDetail}`
        : `업로드 실패 [${statusInfo}]`;
      throw new Error(message);
    }
    return response.json();
  },

  async delete(fileId: number): Promise<void> {
    const response = await fetch(`${BASE_URL}/files/${fileId}`, createFetchOptions({
      method: 'DELETE',
    }));
    if (!response.ok) throw new Error('파일 삭제에 실패했습니다');
  },

  async execute(fileId: number): Promise<any> {
    const response = await fetch(`${BASE_URL}/files/${fileId}/execute`, createFetchOptions({
      method: 'POST',
    }));
    if (!response.ok) throw new Error('파일 실행에 실패했습니다');
    return response.json();
  },

  async stop(fileId: number): Promise<any> {
    const response = await fetch(`${BASE_URL}/files/${fileId}/stop`, createFetchOptions({
      method: 'POST',
    }));
    if (!response.ok) throw new Error('파일 실행 중지에 실패했습니다');
    return response.json();
  },

  async stopAll(scriptId: number): Promise<any> {
    const response = await fetch(`${BASE_URL}/scripts/${scriptId}/files/stop-all`, createFetchOptions({
      method: 'POST',
    }));
    if (!response.ok) throw new Error('모든 파일 실행 중지에 실패했습니다');
    return response.json();
  }
};

// Execution API
export const uiTestExecutionApi = {
  async getAll(): Promise<UiTestExecution[]> {
    const response = await fetch(`${BASE_URL}/executions`, createFetchOptions());
    if (!response.ok) throw new Error('실행 목록을 불러오는데 실패했습니다');
    return response.json();
  },

  async getById(id: number): Promise<UiTestExecution> {
    const response = await fetch(`${BASE_URL}/executions/${id}`, createFetchOptions());
    if (!response.ok) throw new Error('실행 정보를 불러오는데 실패했습니다');
    return response.json();
  },

  async getByScript(scriptId: number): Promise<UiTestExecution[]> {
    const response = await fetch(`${BASE_URL}/scripts/${scriptId}/executions`, createFetchOptions());
    if (!response.ok) throw new Error('스크립트 실행 이력을 불러오는데 실패했습니다');
    return response.json();
  },

  async getStats(): Promise<any> {
    const response = await fetch(`${BASE_URL}/executions/stats`, createFetchOptions());
    if (!response.ok) throw new Error('실행 통계를 불러오는데 실패했습니다');
    return response.json();
  },

  async cancel(id: number): Promise<void> {
    const response = await fetch(`${BASE_URL}/executions/${id}/cancel`, createFetchOptions({
      method: 'POST',
    }));
    if (!response.ok) throw new Error('실행 취소에 실패했습니다');
  }
};
