import { ApiItem } from '../model/types';

// API 아이템 관련 API 호출 함수들
const API_BASE_URL = '/api';

export const apiItemApi = {
  // API 아이템 목록 조회
  getList: async (): Promise<ApiItem[]> => {
    const response = await fetch(`${API_BASE_URL}/items`);
    if (!response.ok) throw new Error('Failed to fetch API items');
    return response.json();
  },

  // API 아이템 생성
  create: async (data: Partial<ApiItem>): Promise<ApiItem> => {
    const response = await fetch(`${API_BASE_URL}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create API item');
    return response.json();
  },

  // API 아이템 수정
  update: async (id: number, data: Partial<ApiItem>): Promise<ApiItem> => {
    const response = await fetch(`${API_BASE_URL}/items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update API item');
    return response.json();
  },

  // API 아이템 삭제
  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/items/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete API item');
  },

  // API 아이템 상세 조회
  getById: async (id: number): Promise<ApiItem> => {
    const response = await fetch(`${API_BASE_URL}/items/${id}`);
    if (!response.ok) throw new Error('Failed to fetch API item');
    return response.json();
  },
};