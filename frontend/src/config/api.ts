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
};

// 앱 전체 설정
export const APP_CONFIG = {
  APP_NAME: getEnvVar('VITE_APP_NAME', 'API Test Tool'),
  VERSION: getEnvVar('VITE_APP_VERSION', '1.0.0'),
  ENVIRONMENT: getEnvVar('NODE_ENV', 'development'),
  DEBUG: getEnvVar('VITE_APP_DEBUG', 'false') === 'true',
};

// 기능별 설정
export const FEATURE_FLAGS = {
  ENABLE_TEST_AUTOMATION: getEnvVar('VITE_ENABLE_TEST_AUTOMATION', 'true') !== 'false',
  ENABLE_SCENARIO_MANAGEMENT: getEnvVar('VITE_ENABLE_SCENARIO_MANAGEMENT', 'true') !== 'false',
  ENABLE_ADMIN_FEATURES: getEnvVar('VITE_ENABLE_ADMIN_FEATURES', 'true') !== 'false',
};

export default API_CONFIG;