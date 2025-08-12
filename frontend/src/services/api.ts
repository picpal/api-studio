import axios from 'axios';
import { BackendApiFolder, BackendApiItem, ApiFolder, ApiItem } from '../types/api';

const API_BASE_URL = 'http://localhost:8080/api';

// Axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// 백엔드 <-> 프론트엔드 타입 변환 함수들
export const convertBackendToFrontendItem = (backendItem: BackendApiItem): ApiItem => ({
  id: backendItem.id?.toString() || '',
  name: backendItem.name,
  method: backendItem.method,
  url: backendItem.url,
  description: backendItem.description,
  requestParams: backendItem.requestParams,
  requestHeaders: backendItem.requestHeaders,
  requestBody: backendItem.requestBody,
  folder: backendItem.folderId?.toString()
});

export const convertBackendToFrontendFolder = (backendFolder: BackendApiFolder, items: BackendApiItem[] = []): ApiFolder => ({
  id: backendFolder.id?.toString() || '',
  name: backendFolder.name,
  isExpanded: backendFolder.isExpanded,
  items: items.filter(item => item.folderId === backendFolder.id).map(convertBackendToFrontendItem)
});

export const convertFrontendToBackendFolder = (frontendFolder: Partial<ApiFolder>): Partial<BackendApiFolder> => ({
  name: frontendFolder.name,
  isExpanded: frontendFolder.isExpanded
});

export const convertFrontendToBackendItem = (frontendItem: Partial<ApiItem>, folderId?: number): Partial<BackendApiItem> => ({
  name: frontendItem.name,
  method: frontendItem.method,
  url: frontendItem.url,
  description: frontendItem.description,
  folderId: folderId
});

// Folder API 함수들
export const folderApi = {
  // 모든 폴더 조회
  getAll: async (): Promise<BackendApiFolder[]> => {
    const response = await apiClient.get('/folders');
    return response.data;
  },

  // 폴더 생성
  create: async (folder: Omit<BackendApiFolder, 'id'>): Promise<BackendApiFolder> => {
    const response = await apiClient.post('/folders', folder);
    return response.data;
  },

  // 폴더 수정
  update: async (id: number, folder: Partial<BackendApiFolder>): Promise<BackendApiFolder> => {
    const response = await apiClient.put(`/folders/${id}`, folder);
    return response.data;
  },

  // 폴더 삭제
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/folders/${id}`);
  }
};

// Item API 함수들  
export const itemApi = {
  // 모든 아이템 조회
  getAll: async (): Promise<BackendApiItem[]> => {
    const response = await apiClient.get('/items');
    return response.data;
  },

  // 특정 폴더의 아이템들 조회
  getByFolder: async (folderId: number): Promise<BackendApiItem[]> => {
    const response = await apiClient.get(`/items/folder/${folderId}`);
    return response.data;
  },

  // 아이템 생성
  create: async (item: Omit<BackendApiItem, 'id'>): Promise<BackendApiItem> => {
    const response = await apiClient.post('/items', item);
    return response.data;
  },

  // 아이템 수정
  update: async (id: number, item: Partial<BackendApiItem>): Promise<BackendApiItem> => {
    const response = await apiClient.put(`/items/${id}`, item);
    return response.data;
  },

  // 아이템 삭제
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/items/${id}`);
  }
};

// Auth API 함수들
export const authApi = {
  // 로그인
  login: async (email: string, password: string): Promise<{message: string, user: any}> => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  // 회원가입
  register: async (email: string, password: string): Promise<{message: string}> => {
    const response = await apiClient.post('/auth/register', { email, password });
    return response.data;
  },

  // 현재 사용자 정보 확인
  me: async (): Promise<{user: any}> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  // 로그아웃
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  }
};

// Default export는 apiClient로, named export는 api로
export default apiClient;
export const api = apiClient;