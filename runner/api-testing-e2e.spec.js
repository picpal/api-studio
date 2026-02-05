/**
 * API Testing Page E2E Tests
 *
 * 이 스크립트는 API Studio의 API Testing 페이지에 대한 E2E 테스트를 수행합니다.
 *
 * 실행 방법:
 *   npx playwright test api-testing-e2e.spec.js
 *   npx playwright test api-testing-e2e.spec.js --headed  (브라우저 표시)
 */

const { test, expect, chromium } = require('@playwright/test');

// 테스트 설정
const BASE_URL = 'http://localhost:3001';
const TEST_CREDENTIALS = {
  email: 'admin@blue.com',
  password: 'Admin!2024@Blue'
};

// 헬퍼 함수: 로그인
async function login(page) {
  await page.goto(BASE_URL);
  await page.getByRole('textbox', { name: '이메일' }).fill(TEST_CREDENTIALS.email);
  await page.getByRole('textbox', { name: '비밀번호' }).fill(TEST_CREDENTIALS.password);
  await page.getByRole('button', { name: '로그인' }).click();
  await expect(page.getByRole('button', { name: 'API Testing' })).toBeVisible({ timeout: 10000 });
}

test.describe('API Testing Page E2E Tests', () => {

  test('1. 로그인 테스트', async () => {
    console.log('Starting login test...');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await page.goto(BASE_URL);

      // 로그인 폼 확인
      await expect(page.getByRole('heading', { name: 'Verification Page' })).toBeVisible();
      console.log('✅ Login page loaded');

      // 로그인
      await page.getByRole('textbox', { name: '이메일' }).fill(TEST_CREDENTIALS.email);
      await page.getByRole('textbox', { name: '비밀번호' }).fill(TEST_CREDENTIALS.password);
      await page.getByRole('button', { name: '로그인' }).click();

      // 로그인 성공 확인
      await expect(page.getByRole('button', { name: 'API Testing' })).toBeVisible({ timeout: 10000 });
      console.log('✅ Login successful');

    } finally {
      await context.close();
      await browser.close();
    }

    console.log('Login test completed!');
  });

  test('2. 폴더 생성 테스트', async () => {
    console.log('Starting folder creation test...');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    const folderName = `E2E-Test-${Date.now()}`;

    try {
      await login(page);

      // Create Folder 버튼 클릭
      await page.getByRole('button', { name: '+ Create Folder' }).click();

      // 모달 확인
      await expect(page.getByRole('heading', { name: 'Create New Folder' })).toBeVisible();
      console.log('✅ Create folder modal opened');

      // 폴더 이름 입력
      await page.getByRole('textbox', { name: 'Enter folder name...' }).fill(folderName);

      // Create 버튼 클릭
      await page.getByRole('button', { name: 'Create', exact: true }).click();

      // 폴더 생성 확인 (첫 번째 매칭 요소 확인)
      await expect(page.getByText(folderName).first()).toBeVisible({ timeout: 5000 });
      console.log(`✅ Folder "${folderName}" created`);

    } finally {
      await context.close();
      await browser.close();
    }

    console.log('Folder creation test completed!');
  });

  test('3. HTTP 메서드 변경 테스트', async () => {
    console.log('Starting HTTP method change test...');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await login(page);

      // 메서드 선택 콤보박스
      const methodSelect = page.locator('select').first();

      // POST로 변경
      await methodSelect.selectOption('POST');
      await expect(methodSelect).toHaveValue('POST');
      console.log('✅ Changed to POST');

      // PUT으로 변경
      await methodSelect.selectOption('PUT');
      await expect(methodSelect).toHaveValue('PUT');
      console.log('✅ Changed to PUT');

      // DELETE로 변경
      await methodSelect.selectOption('DELETE');
      await expect(methodSelect).toHaveValue('DELETE');
      console.log('✅ Changed to DELETE');

      // PATCH로 변경
      await methodSelect.selectOption('PATCH');
      await expect(methodSelect).toHaveValue('PATCH');
      console.log('✅ Changed to PATCH');

      // GET으로 되돌리기
      await methodSelect.selectOption('GET');
      await expect(methodSelect).toHaveValue('GET');
      console.log('✅ Changed back to GET');

    } finally {
      await context.close();
      await browser.close();
    }

    console.log('HTTP method change test completed!');
  });

  test('4. Request 탭 전환 테스트', async () => {
    console.log('Starting request tab test...');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await login(page);

      // Params 탭 클릭
      await page.getByRole('button', { name: 'Params' }).click();
      console.log('✅ Params tab clicked');

      // Headers 탭 클릭
      await page.getByRole('button', { name: 'Headers' }).click();
      console.log('✅ Headers tab clicked');

      // Body 탭 클릭
      await page.getByRole('button', { name: 'Body' }).first().click();
      console.log('✅ Body tab clicked');

      // cURL 탭 클릭
      await page.getByRole('button', { name: 'cURL' }).click();
      console.log('✅ cURL tab clicked');

      // Response Validation 탭 클릭
      await page.getByRole('button', { name: 'Response Validation' }).click();
      console.log('✅ Response Validation tab clicked');

    } finally {
      await context.close();
      await browser.close();
    }

    console.log('Request tab test completed!');
  });

  test('5. 검색 기능 테스트', async () => {
    console.log('Starting search test...');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await login(page);

      // 검색어 입력 (첫 번째 검색 필드)
      const searchInput = page.getByRole('textbox', { name: 'Search items...' }).first();
      await searchInput.fill('test');
      console.log('✅ Search query entered');

      // 잠시 대기
      await page.waitForTimeout(500);

      // 검색어 지우기
      await searchInput.fill('');
      console.log('✅ Search cleared');

    } finally {
      await context.close();
      await browser.close();
    }

    console.log('Search test completed!');
  });

  test('6. GET 요청 테스트', async () => {
    console.log('Starting GET request test...');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await login(page);

      // URL 입력
      const urlInput = page.getByPlaceholder('https://api.example.com/endpoint');
      await urlInput.fill('https://jsonplaceholder.typicode.com/users/1');
      console.log('✅ URL entered');

      // Send 버튼 클릭
      await page.getByRole('button', { name: 'Send' }).click();
      console.log('✅ Send button clicked');

      // 응답 대기 - Response 헤더에서 Time이나 Size가 표시되는지 확인
      await expect(page.locator('text=/Time:\\s*\\d+ms/')).toBeVisible({ timeout: 30000 });
      console.log('✅ Response received');

    } finally {
      await context.close();
      await browser.close();
    }

    console.log('GET request test completed!');
  });

  test('7. URL 입력 및 Send 버튼 테스트', async () => {
    console.log('Starting URL input test...');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await login(page);

      // URL 입력 필드 확인
      const urlInput = page.getByPlaceholder('https://api.example.com/endpoint');
      await expect(urlInput).toBeVisible();
      console.log('✅ URL input field visible');

      // URL 입력
      await urlInput.fill('https://httpbin.org/get');
      await expect(urlInput).toHaveValue('https://httpbin.org/get');
      console.log('✅ URL entered correctly');

      // Send 버튼 확인
      const sendButton = page.getByRole('button', { name: 'Send' });
      await expect(sendButton).toBeVisible();
      console.log('✅ Send button visible');

    } finally {
      await context.close();
      await browser.close();
    }

    console.log('URL input test completed!');
  });

  test('8. Reset 버튼 테스트', async () => {
    console.log('Starting reset button test...');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await login(page);

      // Reset 버튼 확인
      const resetButton = page.getByRole('button', { name: 'Reset' });
      await expect(resetButton).toBeVisible();
      console.log('✅ Reset button visible');

      // Reset 버튼 클릭
      await resetButton.click();
      console.log('✅ Reset button clicked');

    } finally {
      await context.close();
      await browser.close();
    }

    console.log('Reset button test completed!');
  });

});

// 전체 플로우 테스트
test('Full E2E Flow - API Testing', async () => {
  console.log('Starting full E2E flow test...');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. 로그인
    await page.goto(BASE_URL);
    await page.getByRole('textbox', { name: '이메일' }).fill(TEST_CREDENTIALS.email);
    await page.getByRole('textbox', { name: '비밀번호' }).fill(TEST_CREDENTIALS.password);
    await page.getByRole('button', { name: '로그인' }).click();
    await expect(page.getByRole('button', { name: 'API Testing' })).toBeVisible({ timeout: 10000 });
    console.log('✅ Step 1: Login successful');

    // 2. API Testing 페이지 확인
    await expect(page.getByRole('button', { name: '+ Create Folder' })).toBeVisible();
    console.log('✅ Step 2: API Testing page loaded');

    // 3. HTTP 메서드 변경
    const methodSelect = page.locator('select').first();
    await methodSelect.selectOption('POST');
    await expect(methodSelect).toHaveValue('POST');
    console.log('✅ Step 3: HTTP method changed to POST');

    // 4. GET으로 되돌리기
    await methodSelect.selectOption('GET');
    await expect(methodSelect).toHaveValue('GET');
    console.log('✅ Step 4: HTTP method changed back to GET');

    // 5. URL 입력
    const urlInput = page.getByPlaceholder('https://api.example.com/endpoint');
    await urlInput.fill('https://jsonplaceholder.typicode.com/posts/1');
    console.log('✅ Step 5: URL entered');

    // 6. Send 버튼 클릭
    await page.getByRole('button', { name: 'Send' }).click();
    console.log('✅ Step 6: Send button clicked');

    // 7. 응답 대기
    await expect(page.locator('text=/Time:\\s*\\d+ms/')).toBeVisible({ timeout: 30000 });
    console.log('✅ Step 7: Response received');

    // 8. Request 탭 전환
    await page.getByRole('button', { name: 'Headers' }).first().click();
    await page.getByRole('button', { name: 'Params' }).click();
    console.log('✅ Step 8: Request tabs switched');

    console.log('\n🎉 Full E2E flow test completed successfully!');

  } finally {
    await context.close();
    await browser.close();
  }
});
