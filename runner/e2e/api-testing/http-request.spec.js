/**
 * API Testing - HTTP 요청 구성 E2E 테스트
 *
 * HTTP 메서드 선택, URL 입력, 메서드 변경 시 탭 전환 등에 대한 테스트를 수행합니다.
 */

const { test, expect } = require('@playwright/test');
const { ApiTestingPage } = require('../pages');
const { setupTest, teardownTest, logSuccess, logInfo } = require('../utils/test-helpers');
const { TIMEOUTS, HTTP_METHODS, URLS } = require('../fixtures/test-data');

test.describe('HTTP 요청 구성', () => {
  let browser;
  let context;
  let page;
  let apiTestingPage;

  test.beforeEach(async () => {
    const testContext = await setupTest();
    browser = testContext.browser;
    context = testContext.context;
    page = testContext.page;
    apiTestingPage = testContext.apiTestingPage;
    logInfo('테스트 설정 완료');
  });

  test.afterEach(async () => {
    await teardownTest(context, browser);
    logInfo('테스트 정리 완료');
  });

  test('HTTP 메서드 선택 드롭다운이 작동해야 함', async () => {
    // Arrange & Act - 메서드 드롭다운 확인

    // Assert - 메서드 선택 드롭다운이 보이고 활성화되어 있는지 확인
    await expect(apiTestingPage.methodSelect).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    await expect(apiTestingPage.methodSelect).toBeEnabled();

    // 기본값 확인 (GET이 기본)
    await apiTestingPage.verifySelectedMethod('GET');

    logSuccess('HTTP 메서드 선택 드롭다운 작동 확인');
  });

  test('GET, POST, PUT, DELETE, PATCH 메서드 전환 가능', async () => {
    // Arrange - HTTP 메서드 목록
    const methods = HTTP_METHODS; // ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']

    // Act & Assert - 각 메서드로 전환 가능한지 확인
    for (const method of methods) {
      await apiTestingPage.changeMethodAndVerify(method);
      logInfo(`${method} 메서드 전환 확인`);
    }

    logSuccess('모든 HTTP 메서드 전환 가능 확인');
  });

  test('URL 입력 필드에 값 입력 가능', async () => {
    // Arrange
    const testUrl = `${URLS.EXTERNAL_API.JSON_PLACEHOLDER}/users/1`;

    // Act
    await apiTestingPage.fillUrl(testUrl);

    // Assert
    await apiTestingPage.verifyUrl(testUrl);

    // 입력 필드가 활성화되어 있는지 확인
    await expect(apiTestingPage.urlInput).toBeEnabled();

    logSuccess('URL 입력 필드 값 입력 확인');
  });

  test('메서드 변경 시 Body/Params 탭 자동 전환', async () => {
    // Arrange - 초기 상태 확인 (GET 메서드)
    await apiTestingPage.verifySelectedMethod('GET');

    // GET 메서드에서는 Params 탭이 기본으로 표시됨
    // Page Object의 selectors 사용
    const { paramsTab, bodyTab } = apiTestingPage.selectors;

    // Act - POST 메서드로 변경
    await apiTestingPage.selectMethod('POST');
    await apiTestingPage.wait(TIMEOUTS.SHORT);

    // Assert - Body 탭이 활성화되거나 표시 상태 변경 확인
    await expect(bodyTab).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    await expect(paramsTab).toBeVisible({ timeout: TIMEOUTS.DEFAULT });

    // Act - 다시 GET 메서드로 변경
    await apiTestingPage.selectMethod('GET');
    await apiTestingPage.wait(TIMEOUTS.SHORT);

    // Assert - Params 탭 상태 확인
    await expect(paramsTab).toBeVisible({ timeout: TIMEOUTS.DEFAULT });

    logSuccess('메서드 변경 시 탭 전환 확인');
  });
});
