/**
 * E2E Test Data
 *
 * 테스트에서 사용되는 상수 데이터를 정의합니다.
 * 환경별 설정, 기본 계정 정보, 테스트용 데이터 등을 포함합니다.
 */

/**
 * 기본 URL 설정
 * @constant {Object}
 */
const URLS = {
  /** 프론트엔드 기본 URL */
  BASE_URL: 'http://localhost:3001',
  /** 백엔드 API 기본 URL */
  API_BASE_URL: 'http://localhost:8080/api',
  /** 테스트용 외부 API URL */
  EXTERNAL_API: {
    JSON_PLACEHOLDER: 'https://jsonplaceholder.typicode.com',
    HTTP_BIN: 'https://httpbin.org',
  },
};

/**
 * 테스트 계정 정보
 * @constant {Object}
 */
const TEST_CREDENTIALS = {
  /** 관리자 계정 */
  ADMIN: {
    email: 'admin@blue.com',
    password: 'Admin!2024@Blue',
  },
};

/**
 * HTTP 메서드 목록
 * @constant {Array<string>}
 */
const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

/**
 * Request 탭 목록
 * @constant {Array<string>}
 */
const REQUEST_TABS = ['Params', 'Headers', 'Body', 'cURL', 'Response Validation'];

/**
 * 타임아웃 설정 (밀리초)
 * @constant {Object}
 */
const TIMEOUTS = {
  /** 기본 액션 타임아웃 */
  DEFAULT: 5000,
  /** 로그인 완료 대기 */
  LOGIN: 10000,
  /** API 응답 대기 */
  API_RESPONSE: 30000,
  /** 짧은 대기 (UI 업데이트 등) */
  SHORT: 500,
  /** 페이지 로드 대기 */
  PAGE_LOAD: 15000,
};

/**
 * 테스트용 API 엔드포인트
 * @constant {Object}
 */
const TEST_ENDPOINTS = {
  /** 단일 사용자 조회 */
  GET_USER: '/users/1',
  /** 사용자 목록 조회 */
  GET_USERS: '/users',
  /** 단일 포스트 조회 */
  GET_POST: '/posts/1',
  /** 포스트 목록 조회 */
  GET_POSTS: '/posts',
  /** 댓글 목록 조회 */
  GET_COMMENTS: '/comments',
};

/**
 * 테스트용 요청 바디 데이터
 * @constant {Object}
 */
const TEST_REQUEST_BODY = {
  /** 포스트 생성용 데이터 */
  CREATE_POST: {
    title: 'E2E Test Post',
    body: 'This is a test post created by E2E test',
    userId: 1,
  },
  /** 사용자 생성용 데이터 */
  CREATE_USER: {
    name: 'E2E Test User',
    email: 'e2e-test@example.com',
    username: 'e2euser',
  },
};

/**
 * 폴더 생성용 접두사
 * @constant {string}
 */
const FOLDER_PREFIX = 'E2E-Test';

/**
 * 고유한 폴더 이름 생성
 * @returns {string} 타임스탬프가 포함된 폴더 이름
 */
function generateFolderName() {
  return `${FOLDER_PREFIX}-${Date.now()}`;
}

/**
 * 고유한 API 이름 생성
 * @returns {string} 타임스탬프가 포함된 API 이름
 */
function generateApiName() {
  return `E2E-API-${Date.now()}`;
}

// ==================== UI Testing 관련 상수 ====================

/**
 * UI Testing 페이지 URL
 * @constant {Object}
 */
const UI_TESTING_URLS = {
  /** UI Testing 페이지 경로 */
  PAGE_PATH: '/ui-testing',
};

/**
 * UI Testing 파일 상태
 * @constant {Object}
 */
const UI_TEST_FILE_STATUS = {
  /** 업로드됨 */
  UPLOADED: 'UPLOADED',
  /** 실행 중 */
  RUNNING: 'RUNNING',
  /** 완료 */
  COMPLETED: 'COMPLETED',
  /** 실패 */
  FAILED: 'FAILED',
};

/**
 * UI Testing 타임아웃 설정 (밀리초)
 * @constant {Object}
 */
const UI_TESTING_TIMEOUTS = {
  /** 파일 업로드 대기 */
  FILE_UPLOAD: 10000,
  /** 테스트 실행 대기 */
  TEST_EXECUTION: 120000,
  /** 상태 변경 폴링 간격 */
  STATUS_POLL_INTERVAL: 500,
};

/**
 * 샘플 테스트 파일 경로
 * @constant {Object}
 */
const SAMPLE_TEST_FILES = {
  /** example.com 테스트 파일 */
  PLAYWRIGHT_EXAMPLE: 'e2e/fixtures/sample-test-files/playwright-example.spec.js',
  /** playwright.dev 테스트 파일 */
  PLAYWRIGHT_SIMPLE: 'e2e/fixtures/sample-test-files/playwright-simple.spec.js',
};

/**
 * UI Testing 폴더 이름 접두사
 * @constant {string}
 */
const UI_TEST_FOLDER_PREFIX = 'E2E-UI-Folder';

/**
 * UI Testing 스크립트 이름 접두사
 * @constant {string}
 */
const UI_TEST_SCRIPT_PREFIX = 'E2E-UI-Script';

/**
 * 고유한 UI Testing 폴더 이름 생성
 * @returns {string} 타임스탬프가 포함된 폴더 이름
 */
function generateUiTestFolderName() {
  return `${UI_TEST_FOLDER_PREFIX}-${Date.now()}`;
}

/**
 * 고유한 UI Testing 스크립트 이름 생성
 * @returns {string} 타임스탬프가 포함된 스크립트 이름
 */
function generateUiTestScriptName() {
  return `${UI_TEST_SCRIPT_PREFIX}-${Date.now()}`;
}

module.exports = {
  URLS,
  TEST_CREDENTIALS,
  HTTP_METHODS,
  REQUEST_TABS,
  TIMEOUTS,
  TEST_ENDPOINTS,
  TEST_REQUEST_BODY,
  FOLDER_PREFIX,
  generateFolderName,
  generateApiName,
  // UI Testing exports
  UI_TESTING_URLS,
  UI_TEST_FILE_STATUS,
  UI_TESTING_TIMEOUTS,
  SAMPLE_TEST_FILES,
  UI_TEST_FOLDER_PREFIX,
  UI_TEST_SCRIPT_PREFIX,
  generateUiTestFolderName,
  generateUiTestScriptName,
};
