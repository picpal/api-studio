const { test, expect } = require('@playwright/test');

test('failing test with screenshot', async ({ page }) => {
  console.log('Starting failing test to capture screenshot...');

  // 페이지 로드
  await page.goto('https://example.com');

  // 페이지가 로드되었는지 확인
  await expect(page).toHaveTitle(/Example Domain/);

  // 의도적으로 실패하는 테스트 - 존재하지 않는 요소 찾기
  await expect(page.locator('#non-existent-element')).toBeVisible();

  console.log('This should not be reached due to failure above');
});