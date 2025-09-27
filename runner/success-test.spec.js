const { test, expect } = require('@playwright/test');

test('successful test example', async ({ page }) => {
  console.log('Starting successful test...');

  // 페이지 로드
  await page.goto('https://example.com');

  // 페이지가 로드되었는지 확인
  await expect(page).toHaveTitle(/Example Domain/);

  // 성공하는 테스트 - 실제 존재하는 요소 확인
  await expect(page.locator('h1')).toBeVisible();

  console.log('Test completed successfully!');
});