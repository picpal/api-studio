/**
 * UI Testing - Script Management E2E Tests
 *
 * UI Testing 페이지의 스크립트 관리 기능을 테스트합니다.
 * - 스크립트 생성 (폴더 컨텍스트 메뉴)
 * - 스크립트 선택 및 헤더 표시
 * - 스크립트 이름변경/삭제
 * - 스크립트 타입 배지 표시
 * - 스크립트 검색
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
  generateUiTestScriptName,
  TIMEOUTS,
} = require('../fixtures/test-data');

test.describe('UI Testing - Script Management', () => {
  let browser;
  let context;
  let page;
  let uiTestingPage;
  let createdFolders = [];
  let createdScripts = [];

  test.beforeEach(async () => {
    const setup = await setupUiTestingTest();
    browser = setup.browser;
    context = setup.context;
    page = setup.page;
    uiTestingPage = setup.uiTestingPage;
    createdFolders = [];
    createdScripts = [];
  });

  test.afterEach(async () => {
    // 생성된 스크립트와 폴더 정리
    if (createdScripts.length > 0 || createdFolders.length > 0) {
      await cleanupUiTestData(uiTestingPage, {
        scripts: createdScripts,
        folders: createdFolders,
      });
    }
    await teardownTest(context, browser);
  });

  test('should create a script from folder context menu', async () => {
    // 폴더 생성
    const folderName = generateUiTestFolderName();
    const scriptName = generateUiTestScriptName();
    createdFolders.push(folderName);
    createdScripts.push(scriptName);

    await uiTestingPage.createFolder(folderName);

    // 스크립트 생성 (createScript 메서드가 자동으로 폴더를 펼침)
    await uiTestingPage.createScript(folderName, scriptName);

    // 스크립트가 보이는지 확인 (createScript에서 이미 폴더가 펼쳐짐)
    await expect(page.getByText(scriptName).first()).toBeVisible();

    logSuccess(`Script "${scriptName}" created in folder "${folderName}"`);
  });

  test('should select script and display header', async () => {
    // 폴더와 스크립트 생성
    const folderName = generateUiTestFolderName();
    const scriptName = generateUiTestScriptName();
    createdFolders.push(folderName);
    createdScripts.push(scriptName);

    await uiTestingPage.createFolder(folderName);
    // createScript 메서드가 자동으로 폴더를 펼침
    await uiTestingPage.createScript(folderName, scriptName);

    // 스크립트 선택 (createScript에서 이미 폴더가 펼쳐짐)
    await uiTestingPage.selectScript(scriptName);

    // 메인 콘텐츠 헤더에 스크립트 이름 표시 확인
    await uiTestingPage.verifyScriptHeader(scriptName);

    logSuccess(`Script "${scriptName}" selected and header displayed`);
  });

  test('should display script type badge', async () => {
    // 폴더와 스크립트 생성
    const folderName = generateUiTestFolderName();
    const scriptName = generateUiTestScriptName();
    createdFolders.push(folderName);
    createdScripts.push(scriptName);

    await uiTestingPage.createFolder(folderName);
    // createScript 메서드가 자동으로 폴더를 펼침
    await uiTestingPage.createScript(folderName, scriptName);

    // 스크립트 타입 배지 확인 (기본값: PLAYWRIGHT -> 'PLA')
    // createScript에서 이미 폴더가 펼쳐짐
    await uiTestingPage.verifyScriptTypeBadge(scriptName, 'PLA');

    logSuccess(`Script type badge displayed correctly`);
  });

  test('should rename a script', async () => {
    // 폴더와 스크립트 생성
    const folderName = generateUiTestFolderName();
    const originalName = generateUiTestScriptName();
    const newName = `${originalName}-Renamed`;
    createdFolders.push(folderName);
    createdScripts.push(newName); // 변경된 이름으로 정리

    await uiTestingPage.createFolder(folderName);
    // createScript 메서드가 자동으로 폴더를 펼침
    await uiTestingPage.createScript(folderName, originalName);

    // 스크립트 이름 변경 (createScript에서 이미 폴더가 펼쳐짐)
    await uiTestingPage.renameScript(originalName, newName);

    // 변경된 이름 확인
    await expect(page.getByText(newName).first()).toBeVisible();

    logSuccess(`Script renamed from "${originalName}" to "${newName}"`);
  });

  test('should delete a script', async () => {
    // 폴더와 스크립트 생성
    const folderName = generateUiTestFolderName();
    const scriptName = generateUiTestScriptName();
    createdFolders.push(folderName);

    await uiTestingPage.createFolder(folderName);
    // createScript 메서드가 자동으로 폴더를 펼침
    await uiTestingPage.createScript(folderName, scriptName);

    // 스크립트 확인 (createScript에서 이미 폴더가 펼쳐짐)
    await expect(page.getByText(scriptName).first()).toBeVisible();

    // 스크립트 삭제
    await uiTestingPage.deleteScript(scriptName);
    await page.waitForTimeout(500);

    // 스크립트가 삭제되었는지 확인
    const scriptLocator = page.locator('.ml-8').filter({ hasText: scriptName });
    await expect(scriptLocator).not.toBeVisible({ timeout: 3000 });

    logSuccess(`Script "${scriptName}" deleted successfully`);
  });

  test('should search for folders containing scripts', async () => {
    // 폴더와 스크립트 생성 - 검색 가능한 폴더명 사용
    const folderName = `SearchFolder-${Date.now()}`;
    const scriptName = generateUiTestScriptName();
    createdFolders.push(folderName);
    createdScripts.push(scriptName);

    await uiTestingPage.createFolder(folderName);
    // createScript 메서드가 자동으로 폴더를 펼침
    await uiTestingPage.createScript(folderName, scriptName);

    // 스크립트가 이미 보이는지 확인 (createScript에서 폴더가 펼쳐짐)
    await expect(page.getByText(scriptName).first()).toBeVisible();

    // 폴더 검색 (검색 기능은 폴더 이름만 필터링)
    await uiTestingPage.search('SearchFolder');
    await page.waitForTimeout(500);

    // 검색 결과에서 폴더가 보이는지 확인
    await expect(page.getByText(folderName).first()).toBeVisible();

    // 검색어 초기화
    await uiTestingPage.clearSearch();
    await page.waitForTimeout(300);

    // 검색 초기화 후 폴더와 스크립트 모두 보이는지 확인
    await expect(page.getByText(folderName).first()).toBeVisible();

    logSuccess('Folder search works correctly');
  });

  test('should show no script selected message initially', async () => {
    // 스크립트가 선택되지 않은 상태 확인
    await uiTestingPage.verifyNoScriptSelected();

    logSuccess('No script selected message displays correctly');
  });
});
