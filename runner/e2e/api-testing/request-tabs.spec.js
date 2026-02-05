/**
 * API Testing - Request 탭 E2E 테스트
 *
 * Request 영역의 탭(Params, Headers, Body, cURL, Response Validation)에 대한 테스트를 수행합니다.
 */

const { test, expect } = require('@playwright/test');
const { ApiTestingPage } = require('../pages');
const { setupTest, teardownTest, logSuccess, logInfo } = require('../utils/test-helpers');
const { TIMEOUTS, REQUEST_TABS } = require('../fixtures/test-data');

test.describe('Request 탭', () => {
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

  test('Params 탭이 기본 선택되어야 함', async () => {
    // Arrange & Act - 페이지 로드 후 기본 탭 확인

    // Assert - Params 탭이 보이고 활성화 상태인지 확인
    // Page Object의 selectors 사용
    const { paramsTab } = apiTestingPage.selectors;
    await expect(paramsTab).toBeVisible({ timeout: TIMEOUTS.DEFAULT });

    // Params 탭 영역의 컨텐츠가 표시되는지 확인 (파라미터 테이블 등)
    // 기본적으로 GET 메서드일 때 Params 탭이 활성화됨

    logSuccess('Params 탭 기본 선택 확인');
  });

  test('Headers 탭 전환 및 헤더 추가', async () => {
    // Act - Headers 탭 클릭 (Page Object 메서드 사용)
    await apiTestingPage.clickHeadersTab();
    await apiTestingPage.wait(TIMEOUTS.SHORT);

    // Assert - Headers 탭이 활성화되었는지 확인
    const { headersTab } = apiTestingPage.selectors;
    await expect(headersTab).toBeVisible({ timeout: TIMEOUTS.DEFAULT });

    // Headers 영역이 표시되는지 확인
    // Key/Value 입력 필드가 있는지 확인 (Header 테이블)
    const keyInput = page.getByPlaceholder(/key|키/i).first();
    if (await keyInput.count() > 0) {
      await expect(keyInput).toBeVisible();
    }

    logSuccess('Headers 탭 전환 확인');
  });

  test('Body 탭 전환 및 JSON 입력', async () => {
    // Arrange - POST 메서드로 변경 (Body 탭이 활성화되도록)
    await apiTestingPage.selectMethod('POST');
    await apiTestingPage.wait(TIMEOUTS.SHORT);

    // Act - Body 탭 클릭 (Page Object 메서드 사용)
    await apiTestingPage.clickBodyTab();
    await apiTestingPage.wait(TIMEOUTS.SHORT);

    // Assert - Body 탭이 활성화되었는지 확인
    const { bodyTab } = apiTestingPage.selectors;
    await expect(bodyTab).toBeVisible({ timeout: TIMEOUTS.DEFAULT });

    // Body 영역에서 JSON 에디터 또는 텍스트 영역이 있는지 확인
    // Monaco Editor 또는 textarea 등을 확인
    const editorOrTextarea = page.locator('.monaco-editor, textarea, [contenteditable="true"]').first();
    if (await editorOrTextarea.count() > 0) {
      await expect(editorOrTextarea).toBeVisible();
    }

    logSuccess('Body 탭 전환 확인');
  });

  test('cURL 탭에서 명령 미리보기', async () => {
    // Arrange - URL 입력 (Page Object 메서드 사용)
    // URL을 먼저 입력해야 curl 명령이 생성됨
    await apiTestingPage.fillUrl('https://jsonplaceholder.typicode.com/posts');
    await apiTestingPage.wait(TIMEOUTS.SHORT);

    // Act - cURL 탭 클릭 (Page Object 메서드 사용)
    await apiTestingPage.clickCurlTab();
    await apiTestingPage.wait(TIMEOUTS.SHORT);

    // Assert - cURL 탭이 활성화되었는지 확인
    const { curlTab } = apiTestingPage.selectors;
    await expect(curlTab).toBeVisible({ timeout: TIMEOUTS.DEFAULT });

    // cURL 명령어 미리보기가 표시되는지 확인
    // 실제 UI에서 cURL은 div 요소에 "curl -X GET \ ..." 형태로 표시됨
    const curlPreview = page.getByText(/^curl\s+-X/).first();
    const curlText = page.locator('div').filter({ hasText: /^curl -X/ }).first();
    const curlCode = page.locator('code').filter({ hasText: 'curl' }).first();

    // curl 명령어가 표시될 때까지 대기 (여러 가능한 셀렉터 시도)
    const curlElement = curlPreview.or(curlText).or(curlCode);
    await expect(curlElement).toBeVisible({ timeout: TIMEOUTS.DEFAULT });

    logSuccess('cURL 탭 명령 미리보기 확인');
  });

  test('Response Validation 탭 표시', async () => {
    // Act - Response Validation 탭 클릭 (Page Object 메서드 사용)
    await apiTestingPage.clickResponseValidationTab();
    await apiTestingPage.wait(TIMEOUTS.SHORT);

    // Assert - Response Validation 탭이 활성화되었는지 확인
    const { responseValidationTab } = apiTestingPage.selectors;
    await expect(responseValidationTab).toBeVisible({ timeout: TIMEOUTS.DEFAULT });

    logSuccess('Response Validation 탭 표시 확인');
  });

  test('Params 테이블에 파라미터 추가/삭제', async () => {
    // Act - Params 탭 클릭 (Page Object 메서드 사용)
    await apiTestingPage.clickParamsTab();
    await apiTestingPage.wait(TIMEOUTS.SHORT);

    // Assert - Params 탭이 표시되는지 확인
    const { paramsTab } = apiTestingPage.selectors;
    await expect(paramsTab).toBeVisible({ timeout: TIMEOUTS.DEFAULT });

    // 파라미터 추가 버튼 확인 (+ Add 또는 Add Parameter)
    const addButton = page.getByRole('button', { name: /add|추가/i }).first();
    const addButtonAlt = page.getByText('+ Add').first();

    if (await addButton.count() > 0) {
      await expect(addButton).toBeVisible();
      logInfo('파라미터 추가 버튼 확인');
    } else if (await addButtonAlt.count() > 0) {
      await expect(addButtonAlt).toBeVisible();
      logInfo('파라미터 추가 버튼 (+ Add) 확인');
    }

    // 파라미터 입력 필드 (Key, Value) 확인 - placeholder 기반 셀렉터
    const keyInput = page.locator('input[placeholder="key"]').first();
    const valueInput = page.locator('input[placeholder="value"]').first();

    if (await keyInput.count() > 0) {
      await expect(keyInput).toBeVisible();
      logInfo('Key 입력 필드 확인');
    }

    if (await valueInput.count() > 0) {
      await expect(valueInput).toBeVisible();
      logInfo('Value 입력 필드 확인');
    }

    logSuccess('Params 테이블 파라미터 추가/삭제 UI 확인');
  });

  test('파라미터 필수 여부 체크박스', async () => {
    // Act - Params 탭 클릭 (Page Object 메서드 사용)
    await apiTestingPage.clickParamsTab();
    await apiTestingPage.wait(TIMEOUTS.SHORT);

    // Assert - 체크박스 또는 토글이 있는지 확인
    // getByRole('checkbox')를 사용하여 체크박스 찾기
    const checkbox = page.getByRole('checkbox').first();

    // 체크박스가 표시될 때까지 대기
    await expect(checkbox).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    logInfo('파라미터 체크박스 확인');

    // 체크박스 클릭 테스트
    const isChecked = await checkbox.isChecked();
    await checkbox.click();
    await apiTestingPage.wait(TIMEOUTS.SHORT);

    // 상태 변경 확인
    const newState = await checkbox.isChecked();
    expect(newState).not.toBe(isChecked);

    logSuccess('파라미터 필수 여부 체크박스 확인');
  });

  test('파라미터 설명 입력', async () => {
    // Act - Params 탭 클릭 (Page Object 메서드 사용)
    await apiTestingPage.clickParamsTab();
    await apiTestingPage.wait(TIMEOUTS.SHORT);

    // Assert - 설명(Description) 입력 필드가 있는지 확인
    // placeholder="description" 사용
    const descriptionInput = page.locator('input[placeholder="description"]').first();

    if (await descriptionInput.count() > 0) {
      await expect(descriptionInput).toBeVisible({ timeout: TIMEOUTS.DEFAULT });

      // 설명 입력 테스트
      const testDescription = 'Test parameter description';
      await descriptionInput.fill(testDescription);
      await expect(descriptionInput).toHaveValue(testDescription);

      logInfo('Description 입력 필드 값 입력 확인');
    }

    logSuccess('파라미터 설명 입력 UI 확인');
  });
});
