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
  validationEnabled?: boolean; // 응답 검증 사용 여부
  expectedValues?: string; // JSON 형태로 키-값 쌍 저장
  createdAt?: string;
  updatedAt?: string;
  folder?: BackendApiFolder;
  folderId?: number;
  parameters?: ApiParameterItem[]; // API 파라미터 배열
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
  validationEnabled?: boolean; // 응답 검증 사용 여부
  expectedValues?: string; // JSON 형태로 키-값 쌍 저장
  folder?: string;
  parameters?: ApiParameterItem[]; // API 파라미터 배열
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

// API 파라미터 타입 정의
export interface ApiParameterItem {
  key: string;
  value: string;
  description: string;
  required: boolean;
}

// 히스토리 저장 타입 정의
export interface ApiItemHistory {
  id: string;
  name: string; // 사용자가 입력한 히스토리 이름
  itemId: string; // 원본 API 아이템 ID
  itemName: string; // 원본 API 아이템 이름
  savedAt: string; // 저장 시간
  createdByUserId: string; // 생성한 사용자 ID
  createdByUserEmail: string; // 생성한 사용자 이메일
  snapshot: {
    method: string;
    url: string;
    description: string;
    requestParams: string;
    requestHeaders: string;
    requestBody: string;
    parameters: ApiParameterItem[];
  };
}