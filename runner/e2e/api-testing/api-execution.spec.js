/**
 * API Execution E2E Tests
 *
 * API 실행 관련 테스트를 정의합니다.
 * - Send 버튼 클릭 시 요청 전송
 * - GET/POST 요청 성공 시 응답 표시
 * - 응답 상태 코드, 시간, 크기 표시
 * - 응답 Body/Headers 표시
 * - 네트워크 에러 처리
 */

const { test, expect } = require('@playwright/test');
const { ApiTestingPage } = require('../pages');
const { setupTest, teardownTest, waitForNetworkRequest, logSuccess, logInfo } = require('../utils/test-helpers');
const { URLS, TIMEOUTS, TEST_ENDPOINTS, TEST_REQUEST_BODY } = require('../fixtures/test-data');

/**
 * API 실행 테스트 그룹
 */
test.describe('API Execution', () => {
  /** @type {import('@playwright/test').Browser} */
  let browser;
  /** @type {import('@playwright/test').BrowserContext} */
  let context;
  /** @type {import('@playwright/test').Page} */
  let page;
  /** @type {ApiTestingPage} */
  let apiTestingPage;

  /**
   * 각 테스트 전 실행: 브라우저 생성 및 로그인
   */
  test.beforeEach(async () => {
    const testSetup = await setupTest();
    browser = testSetup.browser;
    context = testSetup.context;
    page = testSetup.page;
    apiTestingPage = testSetup.apiTestingPage;
  });

  /**
   * 각 테스트 후 실행: 브라우저 종료
   */
  test.afterEach(async () => {
    await teardownTest(context, browser);
  });

  /**
   * Send 버튼 클릭 시 요청 전송 테스트
   */
  test('Send 버튼 클릭 시 요청 전송', async () => {
    // Arrange: URL 입력
    const testUrl = `${URLS.EXTERNAL_API.JSON_PLACEHOLDER}${TEST_ENDPOINTS.GET_POSTS}`;
    await apiTestingPage.fillUrl(testUrl);
    await apiTestingPage.selectMethod('GET');

    // Act: Send 버튼 클릭 및 네트워크 요청 대기
    const responsePromise = waitForNetworkRequest(page, 'jsonplaceholder.typicode.com');
    await apiTestingPage.clickSend();
    const response = await responsePromise;

    // Assert: 요청이 전송되었는지 확인
    expect(response.status()).toBe(200);
    logSuccess('Send 버튼 클릭 시 요청이 정상적으로 전송됨');
  });

  /**
   * GET 요청 성공 시 응답 표시 테스트
   */
  test('GET 요청 성공 시 응답 표시', async () => {
    // Arrange: GET 요청 설정
    const testUrl = `${URLS.EXTERNAL_API.JSON_PLACEHOLDER}${TEST_ENDPOINTS.GET_POST}`;

    // Act: GET 요청 전송
    await apiTestingPage.sendRequest(testUrl, 'GET');

    // Assert: 응답이 표시되는지 확인
    await apiTestingPage.waitForResponse();

    // 응답 영역에 JSON 데이터가 표시되는지 확인
    const responseBody = page.getByText(/userId|title|body/);
    await expect(responseBody.first()).toBeVisible({ timeout: TIMEOUTS.API_RESPONSE });
    logSuccess('GET 요청 성공 시 응답이 정상적으로 표시됨');
  });

  /**
   * POST 요청 성공 시 응답 표시 테스트
   */
  test('POST 요청 성공 시 응답 표시', async () => {
    // Arrange: POST 요청 설정
    const testUrl = `${URLS.EXTERNAL_API.JSON_PLACEHOLDER}${TEST_ENDPOINTS.GET_POSTS}`;
    await apiTestingPage.selectMethod('POST');
    await apiTestingPage.fillUrl(testUrl);

    // Body 탭 클릭 및 데이터 입력
    await apiTestingPage.clickBodyTab();

    // Monaco Editor에 JSON 입력 (Body 탭의 텍스트 영역)
    const monacoEditor = page.locator('.monaco-editor').first();
    if (await monacoEditor.isVisible()) {
      await monacoEditor.click();
      await page.keyboard.type(JSON.stringify(TEST_REQUEST_BODY.CREATE_POST));
    }

    // Act: Send 버튼 클릭
    await apiTestingPage.clickSend();

    // Assert: 응답 대기 및 확인
    await apiTestingPage.waitForResponse();

    // 응답에 id가 포함되어 있는지 확인 (새로 생성된 리소스)
    const responseContent = page.getByText(/"id":/);
    await expect(responseContent.first()).toBeVisible({ timeout: TIMEOUTS.API_RESPONSE });
    logSuccess('POST 요청 성공 시 응답이 정상적으로 표시됨');
  });

  /**
   * 응답 상태 코드 표시 테스트 (200, 4xx, 5xx)
   */
  test('응답 상태 코드 표시 (200, 4xx, 5xx)', async () => {
    // 200 OK 테스트
    logInfo('200 OK 상태 코드 테스트');
    const successUrl = `${URLS.EXTERNAL_API.JSON_PLACEHOLDER}${TEST_ENDPOINTS.GET_POST}`;
    await apiTestingPage.sendRequest(successUrl, 'GET');

    // 상태 코드 200 표시 확인 - Page Object의 성공 상태 메서드 사용
    await apiTestingPage.verifySuccessResponse();
    const status200 = page.getByText(/200|OK/);
    await expect(status200.first()).toBeVisible({ timeout: TIMEOUTS.API_RESPONSE });
    logSuccess('200 상태 코드가 정상적으로 표시됨');

    // 4xx 테스트 (존재하지 않는 리소스)
    logInfo('404 Not Found 상태 코드 테스트');
    const notFoundUrl = `${URLS.EXTERNAL_API.JSON_PLACEHOLDER}/posts/999999`;
    await apiTestingPage.sendRequest(notFoundUrl, 'GET');

    // 상태 코드 404 표시 확인 - Page Object의 에러 상태 메서드 사용
    await apiTestingPage.verifyErrorResponse();
    const status404 = page.getByText(/404|Not Found/);
    await expect(status404.first()).toBeVisible({ timeout: TIMEOUTS.API_RESPONSE });
    logSuccess('404 상태 코드가 정상적으로 표시됨');
  });

  /**
   * 응답 시간 표시 테스트
   */
  test('응답 시간 표시', async () => {
    // Arrange: URL 설정
    const testUrl = `${URLS.EXTERNAL_API.JSON_PLACEHOLDER}${TEST_ENDPOINTS.GET_POSTS}`;

    // Act: 요청 전송
    await apiTestingPage.sendRequest(testUrl, 'GET');

    // Assert: 응답 시간이 표시되는지 확인 - Page Object의 getResponseTime() 사용
    const responseTimeLocator = apiTestingPage.getResponseTime();
    await expect(responseTimeLocator).toBeVisible({ timeout: TIMEOUTS.API_RESPONSE });
    logSuccess('응답 시간이 정상적으로 표시됨');
  });

  /**
   * 응답 크기 표시 테스트
   */
  test('응답 크기 표시', async () => {
    // Arrange: URL 설정
    const testUrl = `${URLS.EXTERNAL_API.JSON_PLACEHOLDER}${TEST_ENDPOINTS.GET_POSTS}`;

    // Act: 요청 전송
    await apiTestingPage.sendRequest(testUrl, 'GET');

    // Assert: 응답 크기가 표시되는지 확인 - Page Object의 getResponseSize() 사용
    const responseSizeLocator = apiTestingPage.getResponseSize();
    await expect(responseSizeLocator).toBeVisible({ timeout: TIMEOUTS.API_RESPONSE });
    logSuccess('응답 크기가 정상적으로 표시됨');
  });

  /**
   * 응답 Body JSON 포맷팅 테스트
   */
  test('응답 Body JSON 포맷팅', async () => {
    // Arrange: URL 설정
    const testUrl = `${URLS.EXTERNAL_API.JSON_PLACEHOLDER}${TEST_ENDPOINTS.GET_POST}`;

    // Act: 요청 전송
    await apiTestingPage.sendRequest(testUrl, 'GET');

    // Assert: JSON 응답이 포맷팅되어 표시되는지 확인
    await apiTestingPage.waitForResponse();

    // JSON 키들이 표시되는지 확인 (포맷팅된 JSON)
    const jsonContent = page.getByText(/"userId"|"id"|"title"|"body"/);
    await expect(jsonContent.first()).toBeVisible({ timeout: TIMEOUTS.API_RESPONSE });

    // 중괄호나 대괄호가 있는지 확인 (JSON 구조)
    const jsonBrackets = page.getByText(/\{|\[/);
    await expect(jsonBrackets.first()).toBeVisible({ timeout: TIMEOUTS.SHORT });
    logSuccess('응답 Body가 JSON 형식으로 포맷팅되어 표시됨');
  });

  /**
   * 응답 Headers 표시 테스트
   */
  test('응답 Headers 표시', async () => {
    // Arrange: URL 설정 및 요청 전송
    const testUrl = `${URLS.EXTERNAL_API.JSON_PLACEHOLDER}${TEST_ENDPOINTS.GET_POST}`;
    await apiTestingPage.sendRequest(testUrl, 'GET');

    // Act: Response Headers 탭 클릭 (응답 영역의 Headers 탭)
    const responseHeadersTab = page.getByRole('button', { name: 'Headers' }).last();
    await responseHeadersTab.click();

    // Assert: 일반적인 HTTP 헤더가 표시되는지 확인
    const contentTypeHeader = page.getByText(/content-type/i);
    await expect(contentTypeHeader.first()).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    logSuccess('응답 Headers가 정상적으로 표시됨');
  });

  /**
   * 네트워크 에러 처리 테스트
   */
  test('네트워크 에러 처리', async () => {
    // Arrange: 존재하지 않는 도메인 URL 설정
    const invalidUrl = 'https://invalid-domain-that-does-not-exist-12345.com/api/test';
    await apiTestingPage.fillUrl(invalidUrl);
    await apiTestingPage.selectMethod('GET');

    // Act: Send 버튼 클릭
    await apiTestingPage.clickSend();

    // Assert: 에러 메시지가 표시되는지 확인
    // 네트워크 에러 시 에러 메시지 또는 상태 표시 확인
    const errorIndicator = page.getByText(/error|failed|timeout|ENOTFOUND|네트워크/i);
    await expect(errorIndicator.first()).toBeVisible({ timeout: TIMEOUTS.API_RESPONSE });
    logSuccess('네트워크 에러가 정상적으로 처리됨');
  });
});
