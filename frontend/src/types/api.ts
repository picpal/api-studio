// 백엔드 API 타입들 (실제 데이터)
export interface BackendApiFolder {
  id?: number;
  name: string;
  isExpanded: boolean;
  createdAt?: string;
  updatedAt?: string;
  items?: BackendApiItem[];
}

export interface BackendApiItem {
  id?: number;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  description?: string;
  requestParams?: string; // JSON string
  requestHeaders?: string; // JSON string
  requestBody?: string;
  createdAt?: string;
  updatedAt?: string;
  folder?: BackendApiFolder;
  folderId?: number;
}

// 프론트엔드 UI 타입들 (기존 호환성 유지)
export interface ApiItem {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  description?: string;
  requestParams?: string | object; // JSON string or object
  requestHeaders?: string | object; // JSON string or object
  requestBody?: string;
  folder?: string;
}

export interface ApiFolder {
  id: string;
  name: string;
  items: ApiItem[];
  isExpanded: boolean;
}

export interface ApiRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  params: { [key: string]: string };
  headers: { [key: string]: string };
  body: string;
}

export interface ApiResponse {
  status: number;
  statusText: string;
  headers: { [key: string]: string };
  data: any;
  time: number;
  size: string;
}

export interface BaseUrl {
  id: string;
  name: string;
  url: string;
}