// API 아이템 관련 타입 정의
export interface ApiItem {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  description?: string;
  requestParams?: string | object;
  requestHeaders?: string | object;
  requestBody?: string;
  validationEnabled?: boolean;
  expectedValues?: string | any[];
  folder?: string;
  folderName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiRequest {
  method: string;
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

export interface ApiItemHistory {
  id: number;
  historyName: string;
  savedAt: string;
  snapshot: {
    method: string;
    url: string;
    description: string;
    requestParams: string;
    requestHeaders: string;
    requestBody: string;
    validationEnabled: boolean;
    expectedValues: string;
    parameters?: any[];
  };
}