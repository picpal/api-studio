// Vite 환경 변수 접근 방식
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // Vite 방식
    return import.meta.env[key] || defaultValue;
  } else if (typeof process !== 'undefined' && process.env) {
    // Create React App 방식
    return process.env[key] || defaultValue;
  }
  return defaultValue;
};

// API 관련 설정
const BASE_URL = getEnvVar('VITE_API_BASE_URL', 'http://localhost:8080');

export const API_CONFIG = {
  BASE_URL,
  API_URL: `${BASE_URL}/api`,
  TIMEOUT: parseInt(getEnvVar('VITE_API_TIMEOUT', '10000'), 10),
  RETRY_COUNT: parseInt(getEnvVar('VITE_API_RETRY_COUNT', '3'), 10),
  DEBUG: getEnvVar('VITE_APP_DEBUG', 'false') === 'true',
};

// API 요청을 위한 헬퍼 함수
export const createApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.API_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
};

// fetch 요청을 위한 기본 옵션
export const createFetchOptions = (options: RequestInit = {}): RequestInit => {
  const token = localStorage.getItem('token');
  
  return {
    timeout: API_CONFIG.TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };
};

export default API_CONFIG;