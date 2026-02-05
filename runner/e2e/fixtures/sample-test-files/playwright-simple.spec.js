/**
 * Simple Playwright Test - Playwright.dev
 *
 * E2E 테스트에서 파일 업로드 및 실행 테스트에 사용되는 샘플 테스트 파일입니다.
 * playwright.dev 문서 사이트를 대상으로 테스트를 수행합니다.
 */

const { test, expect } = require('@playwright/test');

test.describe('Playwright Documentation Tests', () => {
  test('should load playwright documentation', async ({ page }) => {
    await page.goto('https://playwright.dev');

    // 페이지 제목에 Playwright 포함 확인
    await expect(page).toHaveTitle(/Playwright/);
  });

  test('should have get started button', async ({ page }) => {
    await page.goto('https://playwright.dev');

    // Get Started 또는 Docs 링크 확인
    const getStartedLink = page.getByRole('link', { name: /Get started/i });
    // 요소가 보이거나 다른 형태의 시작 링크가 있는지 확인
    const docsLink = page.getByRole('link', { name: /Docs/i });

    // 둘 중 하나라도 있으면 통과
    const hasGetStarted = await getStartedLink.isVisible().catch(() => false);
    const hasDocs = await docsLink.isVisible().catch(() => false);

    expect(hasGetStarted || hasDocs).toBeTruthy();
  });

  test.skip('skipped test example', async ({ page }) => {
    // 이 테스트는 의도적으로 skip 처리됨 (결과 모달에서 skipped 카운트 테스트용)
    await page.goto('https://playwright.dev');
    await expect(page.locator('non-existent-element')).toBeVisible();
  });
});
