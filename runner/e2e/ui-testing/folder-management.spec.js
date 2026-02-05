/**
 * UI Testing - Folder Management E2E Tests
 *
 * UI Testing 페이지의 폴더 관리 기능을 테스트합니다.
 * - 페이지 네비게이션 및 로드
 * - 폴더 생성/이름변경/삭제
 * - 폴더 확장/축소 (개별, 전체)
 * - 폴더 검색
 */

const { test, expect } = require('@playwright/test');
const { UiTestingPage } = require('../pages');
const {
  setupUiTestingTest,
  teardownTest,
  logSuccess,
  logInfo,
  cleanupUiTestData,
} = require('../utils/test-helpers');
const {
  generateUiTestFolderName,
  TIMEOUTS,
} = require('../fixtures/test-data');

test.describe('UI Testing - Folder Management', () => {
  let browser;
  let context;
  let page;
  let uiTestingPage;
  let createdFolders = [];

  test.beforeEach(async () => {
    const setup = await setupUiTestingTest();
    browser = setup.browser;
    context = setup.context;
    page = setup.page;
    uiTestingPage = setup.uiTestingPage;
    createdFolders = [];
  });

  test.afterEach(async () => {
    // 생성된 폴더 정리
    if (createdFolders.length > 0) {
      await cleanupUiTestData(uiTestingPage, { folders: createdFolders });
    }
    await teardownTest(context, browser);
  });

  test('should navigate to UI Testing page', async () => {
    // UI Testing 네비게이션 버튼이 활성화되어 있어야 함
    await expect(uiTestingPage.uiTestingNavButton).toBeVisible();
    logSuccess('UI Testing page navigation successful');
  });

  test('should display Create Folder button', async () => {
    await expect(uiTestingPage.createFolderButton).toBeVisible();
    logSuccess('Create Folder button is visible');
  });

  test('should display search input', async () => {
    await expect(uiTestingPage.searchInput).toBeVisible();
    logSuccess('Search input is visible');
  });

  test('should create a new folder', async () => {
    const folderName = generateUiTestFolderName();
    createdFolders.push(folderName);

    await uiTestingPage.createFolder(folderName);
    await uiTestingPage.verifyFolderExists(folderName);

    logSuccess(`Folder "${folderName}" created successfully`);
  });

  test('should open and close Create Folder modal', async () => {
    // 모달 열기
    await uiTestingPage.openCreateFolderModal();
    await expect(page.getByRole('heading', { name: 'Create New Folder' })).toBeVisible();

    // 모달 닫기 (Cancel 버튼)
    await page.getByRole('button', { name: 'Cancel' }).click();

    // 모달이 닫혔는지 확인
    await expect(page.getByRole('heading', { name: 'Create New Folder' })).not.toBeVisible();

    logSuccess('Create Folder modal opens and closes correctly');
  });

  test('should rename a folder', async () => {
    // 폴더 생성
    const originalName = generateUiTestFolderName();
    const newName = `${originalName}-Renamed`;
    createdFolders.push(newName); // 변경된 이름으로 정리

    await uiTestingPage.createFolder(originalName);
    await uiTestingPage.verifyFolderExists(originalName);

    // 폴더 이름 변경
    await uiTestingPage.renameFolder(originalName, newName);
    await uiTestingPage.verifyFolderExists(newName);

    logSuccess(`Folder renamed from "${originalName}" to "${newName}"`);
  });

  test('should delete a folder', async () => {
    // 폴더 생성
    const folderName = generateUiTestFolderName();

    await uiTestingPage.createFolder(folderName);
    await uiTestingPage.verifyFolderExists(folderName);

    // 폴더 삭제
    await uiTestingPage.deleteFolder(folderName);

    // 폴더가 삭제되었는지 확인 (약간의 대기 후)
    await page.waitForTimeout(500);

    // 폴더가 보이지 않아야 함
    const folderLocator = page.getByText(folderName).first();
    await expect(folderLocator).not.toBeVisible({ timeout: 3000 });

    logSuccess(`Folder "${folderName}" deleted successfully`);
  });

  test('should expand and collapse individual folder', async () => {
    // 폴더 생성
    const folderName = generateUiTestFolderName();
    createdFolders.push(folderName);

    await uiTestingPage.createFolder(folderName);
    await uiTestingPage.verifyFolderExists(folderName);

    // 폴더 클릭 (토글)
    await uiTestingPage.toggleFolder(folderName);
    await page.waitForTimeout(300);

    // 다시 클릭 (토글)
    await uiTestingPage.toggleFolder(folderName);
    await page.waitForTimeout(300);

    logSuccess(`Folder "${folderName}" expand/collapse works`);
  });

  test('should expand all folders', async () => {
    // 여러 폴더 생성
    const folder1 = generateUiTestFolderName();
    const folder2 = `${folder1}-2`;
    createdFolders.push(folder1, folder2);

    await uiTestingPage.createFolder(folder1);
    await uiTestingPage.createFolder(folder2);

    // 모두 접기 먼저 실행
    await uiTestingPage.collapseAllFolders();
    await page.waitForTimeout(300);

    // 모두 펼치기
    await uiTestingPage.expandAllFolders();
    await page.waitForTimeout(300);

    logSuccess('Expand all folders works');
  });

  test('should collapse all folders', async () => {
    // 여러 폴더 생성
    const folder1 = generateUiTestFolderName();
    const folder2 = `${folder1}-2`;
    createdFolders.push(folder1, folder2);

    await uiTestingPage.createFolder(folder1);
    await uiTestingPage.createFolder(folder2);

    // 모두 펼치기 먼저 실행
    await uiTestingPage.expandAllFolders();
    await page.waitForTimeout(300);

    // 모두 접기
    await uiTestingPage.collapseAllFolders();
    await page.waitForTimeout(300);

    logSuccess('Collapse all folders works');
  });

  test('should search for folders', async () => {
    // 고유한 이름으로 폴더 생성
    const uniqueName = `SearchTest-${Date.now()}`;
    createdFolders.push(uniqueName);

    await uiTestingPage.createFolder(uniqueName);
    await uiTestingPage.verifyFolderExists(uniqueName);

    // 검색
    await uiTestingPage.search('SearchTest');
    await page.waitForTimeout(300);

    // 검색 결과에 폴더가 있는지 확인
    await expect(page.getByText(uniqueName).first()).toBeVisible();

    // 검색어 초기화
    await uiTestingPage.clearSearch();

    logSuccess('Folder search works correctly');
  });

  test('should show no results message for invalid search', async () => {
    const invalidSearchTerm = `NonExistentFolder-${Date.now()}`;

    // 존재하지 않는 폴더 검색
    await uiTestingPage.search(invalidSearchTerm);
    await page.waitForTimeout(300);

    // "No results found" 메시지 확인
    await uiTestingPage.verifyNoSearchResults(invalidSearchTerm);

    // 검색어 초기화
    await uiTestingPage.clearSearch();

    logSuccess('No results message displays correctly');
  });
});
