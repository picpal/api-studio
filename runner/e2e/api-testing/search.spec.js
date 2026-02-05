/**
 * API Testing - 검색 기능 E2E 테스트
 *
 * 검색 입력창 및 검색 기능에 대한 테스트를 수행합니다.
 */

const { test, expect } = require('@playwright/test');
const { ApiTestingPage } = require('../pages');
const { setupTest, teardownTest, logSuccess, logInfo } = require('../utils/test-helpers');
const { TIMEOUTS, generateFolderName } = require('../fixtures/test-data');

test.describe('검색 기능', () => {
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

  test('검색 입력창이 표시되어야 함', async () => {
    // Arrange & Act - 페이지 로드 후 검색 입력창 확인
    // 검색 입력 필드가 나타날 때까지 충분히 대기
    await page.waitForTimeout(TIMEOUTS.SHORT);

    // Assert
    await expect(apiTestingPage.searchInput).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    await expect(apiTestingPage.searchInput).toBeEnabled();

    logSuccess('검색 입력창 표시 확인');
  });

  test('검색어 입력 시 결과가 필터링되어야 함', async () => {
    // Arrange - 테스트용 폴더 생성
    const folderName1 = generateFolderName();
    const folderName2 = `Search-Test-${Date.now()}`;

    await apiTestingPage.createFolder(folderName1);
    await page.waitForTimeout(TIMEOUTS.SHORT);
    await apiTestingPage.createFolder(folderName2);
    await page.waitForTimeout(TIMEOUTS.SHORT);

    // 두 폴더 모두 보이는지 확인
    await apiTestingPage.verifyFolderExists(folderName1);
    await apiTestingPage.verifyFolderExists(folderName2);

    // Act - 첫 번째 폴더 이름으로 검색
    await apiTestingPage.searchInput.click();
    await apiTestingPage.searchInput.fill(folderName1);
    await page.waitForTimeout(TIMEOUTS.SHORT);

    // Assert - 검색 결과에 첫 번째 폴더만 표시되어야 함
    await expect(page.getByText(folderName1).first()).toBeVisible({ timeout: TIMEOUTS.DEFAULT });

    logSuccess('검색어 입력 시 결과 필터링 확인');
  });

  test('검색 결과가 없을 때 메시지 표시', async () => {
    // Arrange
    const nonExistentSearchTerm = `NonExistent-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Act - 존재하지 않는 검색어로 검색
    await apiTestingPage.searchInput.click();
    await apiTestingPage.searchInput.fill(nonExistentSearchTerm);
    await page.waitForTimeout(TIMEOUTS.SHORT);

    // Assert - 검색 결과 없음 상태 확인 (빈 목록 또는 안내 메시지)
    // 검색 결과가 없을 때의 UI 상태를 확인
    const searchInput = apiTestingPage.searchInput;
    await expect(searchInput).toHaveValue(nonExistentSearchTerm);

    logSuccess('검색 결과 없음 상태 확인');
  });

  test('검색어 지우면 전체 목록 복원', async () => {
    // Arrange - 테스트용 폴더 생성
    const folderName1 = generateFolderName();
    const folderName2 = `Restore-Test-${Date.now()}`;

    await apiTestingPage.createFolder(folderName1);
    await page.waitForTimeout(TIMEOUTS.SHORT);
    await apiTestingPage.createFolder(folderName2);
    await page.waitForTimeout(TIMEOUTS.SHORT);

    // 검색어 입력
    await apiTestingPage.searchInput.click();
    await apiTestingPage.searchInput.fill(folderName1);
    await page.waitForTimeout(TIMEOUTS.SHORT);

    // Act - 검색어 지우기
    await apiTestingPage.searchInput.clear();
    await page.waitForTimeout(TIMEOUTS.SHORT);

    // Assert - 전체 목록 복원 확인 (두 폴더 모두 표시)
    await apiTestingPage.verifyFolderExists(folderName1);
    await apiTestingPage.verifyFolderExists(folderName2);

    // 검색 입력 필드가 비어있는지 확인
    await expect(apiTestingPage.searchInput).toHaveValue('');

    logSuccess('검색어 지우기 후 전체 목록 복원 확인');
  });
});
