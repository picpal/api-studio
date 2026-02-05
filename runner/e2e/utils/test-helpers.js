/**
 * E2E Test Helpers
 *
 * E2E 테스트에서 공통으로 사용되는 헬퍼 함수들을 정의합니다.
 */

const { chromium } = require('@playwright/test');
const { LoginPage, ApiTestingPage, UiTestingPage } = require('../pages');
const { URLS, TEST_CREDENTIALS, TIMEOUTS, UI_TESTING_TIMEOUTS, UI_TEST_FILE_STATUS } = require('../fixtures/test-data');

/**
 * 브라우저 컨텍스트 생성 옵션
 * @typedef {Object} BrowserOptions
 * @property {boolean} [headless=true] - 헤드리스 모드 여부
 * @property {number} [slowMo=0] - 액션 사이 지연 시간 (밀리초)
 * @property {Object} [viewport] - 뷰포트 크기
 */

/**
 * 테스트용 브라우저 및 컨텍스트 생성
 * @param {BrowserOptions} [options={}] - 브라우저 옵션
 * @returns {Promise<{browser: import('@playwright/test').Browser, context: import('@playwright/test').BrowserContext, page: import('@playwright/test').Page}>}
 */
async function createBrowserContext(options = {}) {
  const { headless = true, slowMo = 0, viewport } = options;

  const browser = await chromium.launch({ headless, slowMo });
  const contextOptions = viewport ? { viewport } : {};
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();

  return { browser, context, page };
}

/**
 * 브라우저 컨텍스트 정리
 * @param {import('@playwright/test').BrowserContext} context - 브라우저 컨텍스트
 * @param {import('@playwright/test').Browser} browser - 브라우저 인스턴스
 */
async function closeBrowserContext(context, browser) {
  await context.close();
  await browser.close();
}

/**
 * 로그인 수행 (간편 함수)
 * @param {import('@playwright/test').Page} page - Playwright Page 객체
 * @param {Object} [credentials] - 로그인 자격 증명
 * @param {string} [credentials.email] - 이메일
 * @param {string} [credentials.password] - 비밀번호
 * @param {string} [baseUrl] - 기본 URL
 */
async function performLogin(page, credentials = {}, baseUrl = URLS.BASE_URL) {
  const email = credentials.email || TEST_CREDENTIALS.ADMIN.email;
  const password = credentials.password || TEST_CREDENTIALS.ADMIN.password;

  const loginPage = new LoginPage(page);
  await loginPage.performLogin(baseUrl, email, password);

  // 로그인 성공 확인 (API Testing 버튼이 보이는지)
  const apiTestingPage = new ApiTestingPage(page);
  await apiTestingPage.waitForPageLoad();
}

/**
 * 로그인 후 Page Object 반환
 * @param {import('@playwright/test').Page} page - Playwright Page 객체
 * @param {Object} [credentials] - 로그인 자격 증명
 * @param {string} [baseUrl] - 기본 URL
 * @returns {Promise<{loginPage: LoginPage, apiTestingPage: ApiTestingPage}>}
 */
async function loginAndGetPages(page, credentials = {}, baseUrl = URLS.BASE_URL) {
  await performLogin(page, credentials, baseUrl);

  const loginPage = new LoginPage(page);
  const apiTestingPage = new ApiTestingPage(page);

  return { loginPage, apiTestingPage };
}

/**
 * 테스트 설정: 브라우저 생성 및 로그인
 * @param {BrowserOptions} [browserOptions={}] - 브라우저 옵션
 * @param {Object} [credentials] - 로그인 자격 증명
 * @returns {Promise<{browser: Browser, context: BrowserContext, page: Page, loginPage: LoginPage, apiTestingPage: ApiTestingPage}>}
 */
async function setupTest(browserOptions = {}, credentials = {}) {
  const { browser, context, page } = await createBrowserContext(browserOptions);
  const { loginPage, apiTestingPage } = await loginAndGetPages(page, credentials);

  return { browser, context, page, loginPage, apiTestingPage };
}

/**
 * 테스트 정리: 브라우저 컨텍스트 종료
 * @param {import('@playwright/test').BrowserContext} context - 브라우저 컨텍스트
 * @param {import('@playwright/test').Browser} browser - 브라우저 인스턴스
 */
async function teardownTest(context, browser) {
  await closeBrowserContext(context, browser);
}

/**
 * 재시도 가능한 액션 실행
 * @param {Function} action - 실행할 액션 함수
 * @param {number} [maxRetries=3] - 최대 재시도 횟수
 * @param {number} [retryDelay=1000] - 재시도 간격 (밀리초)
 * @returns {Promise<any>} - 액션 결과
 */
async function retryAction(action, maxRetries = 3, retryDelay = 1000) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await action();
    } catch (error) {
      lastError = error;
      console.log(`Attempt ${attempt} failed: ${error.message}`);

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  throw lastError;
}

/**
 * 요소가 사라질 때까지 대기
 * @param {import('@playwright/test').Locator} locator - 대기할 요소 로케이터
 * @param {number} [timeout=TIMEOUTS.DEFAULT] - 최대 대기 시간 (밀리초)
 */
async function waitForElementToDisappear(locator, timeout = TIMEOUTS.DEFAULT) {
  await locator.waitFor({ state: 'hidden', timeout });
}

/**
 * 스크린샷 저장 (디버깅용)
 * @param {import('@playwright/test').Page} page - Playwright Page 객체
 * @param {string} name - 스크린샷 파일명 (확장자 제외)
 * @param {string} [directory='./screenshots'] - 저장 디렉토리
 */
async function takeScreenshot(page, name, directory = './screenshots') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const path = `${directory}/${name}-${timestamp}.png`;
  await page.screenshot({ path, fullPage: true });
  console.log(`Screenshot saved: ${path}`);
}

/**
 * 콘솔 로그 수집 시작
 * @param {import('@playwright/test').Page} page - Playwright Page 객체
 * @returns {Array<Object>} - 수집된 로그 배열
 */
function collectConsoleLogs(page) {
  const logs = [];

  page.on('console', (msg) => {
    logs.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString(),
    });
  });

  return logs;
}

/**
 * 네트워크 요청 대기
 * @param {import('@playwright/test').Page} page - Playwright Page 객체
 * @param {string} urlPattern - URL 패턴 (정규식 또는 문자열)
 * @param {number} [timeout=TIMEOUTS.API_RESPONSE] - 최대 대기 시간 (밀리초)
 * @returns {Promise<import('@playwright/test').Response>} - 응답 객체
 */
async function waitForNetworkRequest(page, urlPattern, timeout = TIMEOUTS.API_RESPONSE) {
  return page.waitForResponse(
    (response) => {
      const url = response.url();
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern);
      }
      return urlPattern.test(url);
    },
    { timeout }
  );
}

/**
 * 로그 메시지 출력 (테스트 진행 상황)
 * @param {string} emoji - 이모지 (성공, 실패 등)
 * @param {string} message - 메시지
 */
function logTestStep(emoji, message) {
  console.log(`${emoji} ${message}`);
}

/**
 * 성공 로그 출력
 * @param {string} message - 메시지
 */
function logSuccess(message) {
  logTestStep('[OK]', message);
}

/**
 * 실패 로그 출력
 * @param {string} message - 메시지
 */
function logFailure(message) {
  logTestStep('[FAIL]', message);
}

/**
 * 정보 로그 출력
 * @param {string} message - 메시지
 */
function logInfo(message) {
  logTestStep('[INFO]', message);
}

// ==================== UI Testing 헬퍼 함수 ====================

/**
 * UI Testing 테스트 설정: 브라우저 생성, 로그인, UI Testing 페이지 이동
 * @param {BrowserOptions} [browserOptions={}] - 브라우저 옵션
 * @param {Object} [credentials] - 로그인 자격 증명
 * @returns {Promise<{browser: Browser, context: BrowserContext, page: Page, loginPage: LoginPage, uiTestingPage: UiTestingPage}>}
 */
async function setupUiTestingTest(browserOptions = {}, credentials = {}) {
  const { browser, context, page } = await createBrowserContext(browserOptions);
  const { loginPage, apiTestingPage } = await loginAndGetPages(page, credentials);

  // UI Testing 페이지로 이동
  const uiTestingPage = new UiTestingPage(page);
  await uiTestingPage.navigateToUiTesting();

  return { browser, context, page, loginPage, uiTestingPage };
}

/**
 * 파일 상태가 특정 상태가 될 때까지 폴링 대기
 * @param {UiTestingPage} uiTestingPage - UI Testing 페이지 객체
 * @param {string} fileName - 파일 이름
 * @param {string} expectedStatus - 예상 상태 ('UPLOADED', 'RUNNING', 'COMPLETED', 'FAILED')
 * @param {number} [timeout=UI_TESTING_TIMEOUTS.TEST_EXECUTION] - 최대 대기 시간 (밀리초)
 * @param {number} [pollInterval=UI_TESTING_TIMEOUTS.STATUS_POLL_INTERVAL] - 폴링 간격 (밀리초)
 * @returns {Promise<boolean>} - 상태 도달 여부
 */
async function waitForFileStatus(
  uiTestingPage,
  fileName,
  expectedStatus,
  timeout = UI_TESTING_TIMEOUTS.TEST_EXECUTION,
  pollInterval = UI_TESTING_TIMEOUTS.STATUS_POLL_INTERVAL
) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      await uiTestingPage.verifyFileStatus(fileName, expectedStatus);
      logSuccess(`File "${fileName}" reached status: ${expectedStatus}`);
      return true;
    } catch {
      // 상태가 아직 변경되지 않음, 계속 폴링
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }

  logFailure(`File "${fileName}" did not reach status "${expectedStatus}" within ${timeout}ms`);
  return false;
}

/**
 * 파일 실행 완료 대기 (COMPLETED 또는 FAILED 상태)
 * @param {UiTestingPage} uiTestingPage - UI Testing 페이지 객체
 * @param {string} fileName - 파일 이름
 * @param {number} [timeout=UI_TESTING_TIMEOUTS.TEST_EXECUTION] - 최대 대기 시간 (밀리초)
 * @returns {Promise<string>} - 최종 상태 ('COMPLETED' | 'FAILED' | 'TIMEOUT')
 */
async function waitForFileExecutionComplete(
  uiTestingPage,
  fileName,
  timeout = UI_TESTING_TIMEOUTS.TEST_EXECUTION
) {
  const startTime = Date.now();
  const pollInterval = UI_TESTING_TIMEOUTS.STATUS_POLL_INTERVAL;

  while (Date.now() - startTime < timeout) {
    try {
      await uiTestingPage.verifyFileStatus(fileName, UI_TEST_FILE_STATUS.COMPLETED);
      logSuccess(`File "${fileName}" completed successfully`);
      return UI_TEST_FILE_STATUS.COMPLETED;
    } catch {
      // COMPLETED가 아님
    }

    try {
      await uiTestingPage.verifyFileStatus(fileName, UI_TEST_FILE_STATUS.FAILED);
      logInfo(`File "${fileName}" failed`);
      return UI_TEST_FILE_STATUS.FAILED;
    } catch {
      // FAILED도 아님, 계속 대기
    }

    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  logFailure(`File "${fileName}" execution timed out after ${timeout}ms`);
  return 'TIMEOUT';
}

/**
 * UI Testing 테스트 데이터 정리
 * @param {UiTestingPage} uiTestingPage - UI Testing 페이지 객체
 * @param {Object} options - 정리 옵션
 * @param {string[]} [options.folders] - 삭제할 폴더 이름 배열
 * @param {string[]} [options.scripts] - 삭제할 스크립트 이름 배열
 * @param {string[]} [options.files] - 삭제할 파일 이름 배열
 */
async function cleanupUiTestData(uiTestingPage, options = {}) {
  const { folders = [], scripts = [], files = [] } = options;

  // 파일 삭제
  for (const fileName of files) {
    try {
      await uiTestingPage.deleteFile(fileName);
      logInfo(`Cleaned up file: ${fileName}`);
    } catch (error) {
      logInfo(`Could not delete file "${fileName}": ${error.message}`);
    }
  }

  // 스크립트 삭제
  for (const scriptName of scripts) {
    try {
      await uiTestingPage.deleteScript(scriptName);
      logInfo(`Cleaned up script: ${scriptName}`);
    } catch (error) {
      logInfo(`Could not delete script "${scriptName}": ${error.message}`);
    }
  }

  // 폴더 삭제
  for (const folderName of folders) {
    try {
      await uiTestingPage.deleteFolder(folderName);
      logInfo(`Cleaned up folder: ${folderName}`);
    } catch (error) {
      logInfo(`Could not delete folder "${folderName}": ${error.message}`);
    }
  }
}

module.exports = {
  createBrowserContext,
  closeBrowserContext,
  performLogin,
  loginAndGetPages,
  setupTest,
  teardownTest,
  retryAction,
  waitForElementToDisappear,
  takeScreenshot,
  collectConsoleLogs,
  waitForNetworkRequest,
  logTestStep,
  logSuccess,
  logFailure,
  logInfo,
  // UI Testing helpers
  setupUiTestingTest,
  waitForFileStatus,
  waitForFileExecutionComplete,
  cleanupUiTestData,
};
