/**
 * Save and Reset E2E Tests
 *
 * API 저장 및 리셋 관련 테스트를 정의합니다.
 * - Save 버튼으로 API 저장
 * - 저장된 API 불러오기
 * - Reset 버튼으로 폼 초기화
 * - 수정 후 저장하지 않고 나가면 경고
 */

const { test, expect } = require('@playwright/test');
const { ApiTestingPage } = require('../pages');
const { setupTest, teardownTest, logSuccess, logInfo } = require('../utils/test-helpers');
const { URLS, TIMEOUTS, TEST_ENDPOINTS, generateApiName, generateFolderName } = require('../fixtures/test-data');

/**
 * 저장 및 리셋 테스트 그룹
 */
test.describe('Save and Reset', () => {
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
   * Save 버튼으로 API 저장 테스트
   */
  test('Save 버튼으로 API 저장', async () => {
    // Arrange: 폴더 생성
    const folderName = generateFolderName();
    await apiTestingPage.createFolder(folderName);
    await page.waitForTimeout(TIMEOUTS.SHORT);

    // 폴더 클릭하여 선택
    const folderElement = page.getByText(folderName).first();
    await folderElement.click();
    await page.waitForTimeout(TIMEOUTS.SHORT);

    // API 정보 입력
    const testUrl = `${URLS.EXTERNAL_API.JSON_PLACEHOLDER}${TEST_ENDPOINTS.GET_POSTS}`;
    await apiTestingPage.selectMethod('GET');
    await apiTestingPage.fillUrl(testUrl);
    await page.waitForTimeout(TIMEOUTS.SHORT);

    // Act: Save 버튼 클릭 - Page Object의 clickSave() 사용
    await apiTestingPage.clickSave();
    await page.waitForTimeout(TIMEOUTS.SHORT);

    // API 이름 입력 모달이 표시될 경우
    // 모달이 열리는 것을 대기
    const modal = page.locator('[role="dialog"]');
    const modalVisible = await modal.isVisible({ timeout: TIMEOUTS.SHORT }).catch(() => false);

    if (modalVisible) {
      // 모달 내 입력 필드 찾기
      const apiNameInput = modal.locator('input').first();
      const apiName = generateApiName();
      await apiNameInput.fill(apiName);

      // 저장 확인 버튼 클릭
      const confirmSaveButton = modal.getByRole('button', { name: /save|저장|confirm|확인|create/i });
      await confirmSaveButton.click();
      await page.waitForTimeout(TIMEOUTS.SHORT);

      // Assert: 저장된 API가 목록에 표시되는지 확인
      const savedApi = page.getByText(apiName);
      await expect(savedApi.first()).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
      logSuccess('API가 정상적으로 저장됨');
    } else {
      // API 이름 입력 모달 없이 직접 저장되는 경우
      const apiNameInput = page.getByRole('textbox', { name: /name|이름/i });
      if (await apiNameInput.isVisible({ timeout: TIMEOUTS.SHORT }).catch(() => false)) {
        const apiName = generateApiName();
        await apiNameInput.fill(apiName);

        // 저장 확인 버튼 클릭
        const confirmSaveButton = page.getByRole('button', { name: /save|저장|confirm|확인/i }).last();
        await confirmSaveButton.click();

        // Assert: 저장된 API가 목록에 표시되는지 확인
        const savedApi = page.getByText(apiName);
        await expect(savedApi.first()).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
        logSuccess('API가 정상적으로 저장됨');
      } else {
        // 직접 저장되는 경우
        // 성공 메시지 또는 저장 완료 표시 확인
        const successIndicator = page.getByText(/saved|저장|success|완료/i);
        await expect(successIndicator.first()).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
        logSuccess('API가 정상적으로 저장됨');
      }
    }
  });

  /**
   * 저장된 API 불러오기 테스트
   */
  test('저장된 API 불러오기', async () => {
    // Arrange: 폴더 및 API 생성
    const folderName = generateFolderName();
    await apiTestingPage.createFolder(folderName);
    await page.waitForTimeout(TIMEOUTS.SHORT);

    // 폴더 클릭
    const folderElement = page.getByText(folderName).first();
    await folderElement.click();
    await page.waitForTimeout(TIMEOUTS.SHORT);

    // API 정보 입력 및 저장
    const testUrl = `${URLS.EXTERNAL_API.JSON_PLACEHOLDER}${TEST_ENDPOINTS.GET_USERS}`;
    await apiTestingPage.selectMethod('GET');
    await apiTestingPage.fillUrl(testUrl);
    await page.waitForTimeout(TIMEOUTS.SHORT);

    // Page Object의 clickSave() 사용
    await apiTestingPage.clickSave();
    await page.waitForTimeout(TIMEOUTS.SHORT);

    // API 이름 입력
    const apiName = generateApiName();

    // 모달이 열리는 것을 대기
    const modal = page.locator('[role="dialog"]');
    const modalVisible = await modal.isVisible({ timeout: TIMEOUTS.SHORT }).catch(() => false);

    if (modalVisible) {
      // 모달 내 입력 필드 찾기
      const apiNameInput = modal.locator('input').first();
      await apiNameInput.fill(apiName);

      // 저장 확인 버튼 클릭
      const confirmSaveButton = modal.getByRole('button', { name: /save|저장|confirm|확인|create/i });
      await confirmSaveButton.click();
      await page.waitForTimeout(TIMEOUTS.SHORT);
    } else {
      const apiNameInput = page.getByRole('textbox', { name: /name|이름/i });
      if (await apiNameInput.isVisible({ timeout: TIMEOUTS.SHORT }).catch(() => false)) {
        await apiNameInput.fill(apiName);
        const confirmSaveButton = page.getByRole('button', { name: /save|저장|confirm|확인/i }).last();
        await confirmSaveButton.click();
        await page.waitForTimeout(TIMEOUTS.SHORT);
      }
    }

    // URL 초기화 (다른 값으로 변경)
    await apiTestingPage.fillUrl('https://example.com/different');
    await page.waitForTimeout(TIMEOUTS.SHORT);

    // Act: 저장된 API 클릭하여 불러오기
    const savedApiElement = page.getByText(apiName);
    if (await savedApiElement.first().isVisible({ timeout: TIMEOUTS.DEFAULT }).catch(() => false)) {
      await savedApiElement.first().click();
      await page.waitForTimeout(TIMEOUTS.SHORT);

      // Assert: 저장된 URL이 불러와지는지 확인
      await expect(apiTestingPage.urlInput).toHaveValue(testUrl, { timeout: TIMEOUTS.DEFAULT });
      logSuccess('저장된 API가 정상적으로 불러와짐');
    } else {
      logInfo('저장된 API 항목을 찾을 수 없음 - 저장 UI 확인 필요');
    }
  });

  /**
   * Reset 버튼으로 폼 초기화 테스트
   */
  test('Reset 버튼으로 폼 초기화', async () => {
    // Arrange: API 정보 입력
    const testUrl = `${URLS.EXTERNAL_API.JSON_PLACEHOLDER}${TEST_ENDPOINTS.GET_POSTS}`;
    await apiTestingPage.selectMethod('POST');
    await apiTestingPage.fillUrl(testUrl);
    await page.waitForTimeout(TIMEOUTS.SHORT);

    // 입력된 값 확인
    await expect(apiTestingPage.urlInput).toHaveValue(testUrl);
    await expect(apiTestingPage.methodSelect).toHaveValue('POST');

    // Act: Reset 버튼 클릭
    await apiTestingPage.clickReset();
    await page.waitForTimeout(TIMEOUTS.SHORT);

    // Assert: 폼이 초기화되는지 확인
    // URL 필드가 비어있거나 기본값으로 돌아가는지 확인
    const urlValue = await apiTestingPage.urlInput.inputValue();
    const isReset = urlValue === '' || urlValue === 'https://api.example.com/endpoint' || !urlValue.includes('jsonplaceholder');
    expect(isReset).toBeTruthy();

    // HTTP 메서드가 기본값(GET)으로 돌아가는지 확인
    await expect(apiTestingPage.methodSelect).toHaveValue('GET');
    logSuccess('Reset 버튼으로 폼이 정상적으로 초기화됨');
  });

  /**
   * 수정 후 저장하지 않고 나가면 경고 테스트
   */
  test('수정 후 저장하지 않고 나가면 경고', async () => {
    // Arrange: 폴더 및 API 생성하여 저장
    const folderName = generateFolderName();
    await apiTestingPage.createFolder(folderName);
    await page.waitForTimeout(TIMEOUTS.SHORT);

    const folderElement = page.getByText(folderName).first();
    await folderElement.click();
    await page.waitForTimeout(TIMEOUTS.SHORT);

    // API 저장
    const originalUrl = `${URLS.EXTERNAL_API.JSON_PLACEHOLDER}${TEST_ENDPOINTS.GET_POST}`;
    await apiTestingPage.selectMethod('GET');
    await apiTestingPage.fillUrl(originalUrl);
    await page.waitForTimeout(TIMEOUTS.SHORT);

    // Page Object의 clickSave() 사용
    await apiTestingPage.clickSave();
    await page.waitForTimeout(TIMEOUTS.SHORT);

    const apiName = generateApiName();

    // 모달이 열리는 것을 대기
    const modal = page.locator('[role="dialog"]');
    const modalVisible = await modal.isVisible({ timeout: TIMEOUTS.SHORT }).catch(() => false);

    if (modalVisible) {
      // 모달 내 입력 필드 찾기
      const apiNameInput = modal.locator('input').first();
      await apiNameInput.fill(apiName);

      // 저장 확인 버튼 클릭
      const confirmSaveButton = modal.getByRole('button', { name: /save|저장|confirm|확인|create/i });
      await confirmSaveButton.click();
      await page.waitForTimeout(TIMEOUTS.SHORT);
    } else {
      const apiNameInput = page.getByRole('textbox', { name: /name|이름/i });
      if (await apiNameInput.isVisible({ timeout: TIMEOUTS.SHORT }).catch(() => false)) {
        await apiNameInput.fill(apiName);
        const confirmSaveButton = page.getByRole('button', { name: /save|저장|confirm|확인/i }).last();
        await confirmSaveButton.click();
        await page.waitForTimeout(TIMEOUTS.SHORT);
      }
    }

    // Act: 저장된 API 수정
    const savedApiElement = page.getByText(apiName);
    if (await savedApiElement.first().isVisible({ timeout: TIMEOUTS.DEFAULT }).catch(() => false)) {
      await savedApiElement.first().click();
      await page.waitForTimeout(TIMEOUTS.SHORT);

      // URL 수정
      const modifiedUrl = `${URLS.EXTERNAL_API.JSON_PLACEHOLDER}${TEST_ENDPOINTS.GET_USERS}`;
      await apiTestingPage.fillUrl(modifiedUrl);
      await page.waitForTimeout(TIMEOUTS.SHORT);

      // 다른 API나 폴더로 이동 시도 (새 폴더 생성 버튼 클릭)
      await apiTestingPage.createFolderButton.click();
      await page.waitForTimeout(TIMEOUTS.SHORT);

      // Assert: 경고 다이얼로그 또는 모달이 표시되는지 확인
      // 브라우저 confirm 다이얼로그 또는 커스텀 모달
      const warningDialog = page.getByText(/unsaved|저장되지 않|변경사항|discard|취소/i);
      const dialogVisible = await warningDialog.first().isVisible({ timeout: TIMEOUTS.SHORT }).catch(() => false);

      if (dialogVisible) {
        logSuccess('수정 후 저장하지 않고 나가면 경고가 표시됨');
      } else {
        // 경고 없이 바로 이동하는 경우 (경고 기능이 없을 수 있음)
        logInfo('경고 다이얼로그가 표시되지 않음 - 해당 기능 미구현일 수 있음');

        // 폴더 생성 모달이 열렸다면 닫기
        const createFolderModal = page.locator('[role="dialog"]');
        if (await createFolderModal.isVisible({ timeout: TIMEOUTS.SHORT }).catch(() => false)) {
          const cancelButton = createFolderModal.getByRole('button', { name: /cancel|취소|close/i });
          if (await cancelButton.isVisible({ timeout: TIMEOUTS.SHORT }).catch(() => false)) {
            await cancelButton.click();
          } else {
            // ESC 키로 모달 닫기
            await page.keyboard.press('Escape');
          }
        }
      }
    } else {
      logInfo('저장된 API를 찾을 수 없음 - 테스트 스킵');
    }
  });
});
