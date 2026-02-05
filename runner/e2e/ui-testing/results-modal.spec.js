/**
 * UI Testing - Results Modal E2E Tests
 *
 * UI Testing 페이지의 결과 모달 기능을 테스트합니다.
 * - 모달 열기/닫기
 * - 파일명 표시
 * - 테스트 통계 (passed/failed/skipped)
 * - 실행 시간 표시
 * - Raw Output 표시
 * - 실행 시각 표시
 */

const { test, expect } = require('@playwright/test');
const path = require('path');
const { UiTestingPage } = require('../pages');
const {
  setupUiTestingTest,
  teardownTest,
  logSuccess,
  logInfo,
  cleanupUiTestData,
  waitForFileExecutionComplete,
} = require('../utils/test-helpers');
const {
  generateUiTestFolderName,
  generateUiTestScriptName,
  SAMPLE_TEST_FILES,
  UI_TEST_FILE_STATUS,
  TIMEOUTS,
} = require('../fixtures/test-data');

test.describe('UI Testing - Results Modal', () => {
  let browser;
  let context;
  let page;
  let uiTestingPage;
  let createdFolders = [];
  let createdScripts = [];

  // 샘플 테스트 파일 경로
  const runnerDir = path.resolve(__dirname, '../..');
  const sampleFile1 = path.join(runnerDir, SAMPLE_TEST_FILES.PLAYWRIGHT_EXAMPLE);

  // 테스트 전 파일 업로드 및 실행 완료까지 대기
  async function setupAndExecuteFile() {
    const folderName = generateUiTestFolderName();
    const scriptName = generateUiTestScriptName();
    createdFolders.push(folderName);
    createdScripts.push(scriptName);

    await uiTestingPage.createFolder(folderName);
    // createScript 메서드가 자동으로 폴더를 펼침
    await uiTestingPage.createScript(folderName, scriptName);

    // 스크립트 선택 (createScript에서 이미 폴더가 펼쳐짐)
    await uiTestingPage.selectScript(scriptName);

    // 파일 업로드
    await uiTestingPage.uploadFile(sampleFile1);
    await uiTestingPage.verifyFileUploaded('playwright-example.spec.js');

    // 파일 실행
    await uiTestingPage.runFile('playwright-example.spec.js');

    // 실행 완료 대기
    await waitForFileExecutionComplete(uiTestingPage, 'playwright-example.spec.js');

    return { folderName, scriptName };
  }

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
    if (createdScripts.length > 0 || createdFolders.length > 0) {
      await cleanupUiTestData(uiTestingPage, {
        scripts: createdScripts,
        folders: createdFolders,
      });
    }
    await teardownTest(context, browser);
  });

  test('should open results modal by clicking Results button', async () => {
    await setupAndExecuteFile();

    // Results 모달 열기
    await uiTestingPage.openResultsModal('playwright-example.spec.js');

    // 모달이 열렸는지 확인
    await expect(page.getByRole('heading', { name: /Execution Results/ })).toBeVisible();

    logSuccess('Results modal opened successfully');
  });

  test('should close results modal', async () => {
    await setupAndExecuteFile();

    // 모달 열기
    await uiTestingPage.openResultsModal('playwright-example.spec.js');
    await expect(page.getByRole('heading', { name: /Execution Results/ })).toBeVisible();

    // 모달 닫기 (X 버튼 클릭)
    const closeButton = page.locator('.fixed.inset-0 button').filter({ has: page.locator('svg') }).first();
    await closeButton.click();

    // 모달이 닫혔는지 확인
    await expect(page.getByRole('heading', { name: /Execution Results/ })).not.toBeVisible({ timeout: 3000 });

    logSuccess('Results modal closed successfully');
  });

  test('should display file name in results modal', async () => {
    await setupAndExecuteFile();

    // 모달 열기
    await uiTestingPage.openResultsModal('playwright-example.spec.js');

    // 파일명 표시 확인
    await uiTestingPage.verifyResultsModalFileName('playwright-example.spec.js');

    logSuccess('File name displayed in results modal');
  });

  test('should display test statistics in results modal', async () => {
    await setupAndExecuteFile();

    // 모달 열기
    await uiTestingPage.openResultsModal('playwright-example.spec.js');

    // 통계 필드 확인
    const modal = page.locator('.fixed.inset-0 .bg-white.rounded-lg');

    // Status 필드
    await expect(modal.getByText('Status:')).toBeVisible();

    // Passed/Failed/Skipped 필드
    await expect(modal.getByText('Passed:')).toBeVisible();
    await expect(modal.getByText('Failed:')).toBeVisible();
    await expect(modal.getByText('Skipped:')).toBeVisible();

    // Total Tests 필드
    await expect(modal.getByText('Total Tests:')).toBeVisible();

    logSuccess('Test statistics displayed in results modal');
  });

  test('should display duration in results modal', async () => {
    await setupAndExecuteFile();

    // 모달 열기
    await uiTestingPage.openResultsModal('playwright-example.spec.js');

    // Duration 필드 확인
    const modal = page.locator('.fixed.inset-0 .bg-white.rounded-lg');
    await expect(modal.getByText('Duration:')).toBeVisible();

    logSuccess('Duration displayed in results modal');
  });

  test('should display Raw Output in results modal', async () => {
    await setupAndExecuteFile();

    // 모달 열기
    await uiTestingPage.openResultsModal('playwright-example.spec.js');

    // Raw Output 확인
    await uiTestingPage.verifyRawOutputVisible();

    logSuccess('Raw Output displayed in results modal');
  });

  test('should display execution time in results modal', async () => {
    await setupAndExecuteFile();

    // 모달 열기
    await uiTestingPage.openResultsModal('playwright-example.spec.js');

    // 실행 시각 확인
    await uiTestingPage.verifyExecutionTimeVisible();

    logSuccess('Execution time displayed in results modal');
  });
});
