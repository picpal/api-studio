// 환경 변수 타입 정의 및 검증
interface EnvironmentConfig {
  API_BASE_URL: string;
  API_TIMEOUT: number;
  APP_NAME: string;
  VERSION: string;
  ENVIRONMENT: string;
  DEBUG: boolean;
}

// 환경 변수 검증 함수
function validateEnv(): EnvironmentConfig {
  const requiredVars = ['REACT_APP_API_BASE_URL'];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      throw new Error(`Required environment variable ${varName} is missing`);
    }
  }

  return {
    API_BASE_URL: process.env.REACT_APP_API_BASE_URL!,
    API_TIMEOUT: parseInt(process.env.REACT_APP_API_TIMEOUT || '10000', 10),
    APP_NAME: process.env.REACT_APP_NAME || 'API Test Tool',
    VERSION: process.env.REACT_APP_VERSION || '1.0.0',
    ENVIRONMENT: process.env.NODE_ENV || 'development',
    DEBUG: process.env.REACT_APP_DEBUG === 'true',
  };
}

export const ENV = validateEnv();