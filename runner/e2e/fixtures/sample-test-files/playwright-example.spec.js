/**
 * Example Playwright Test - Example.com
 *
 * E2E 테스트에서 파일 업로드 및 실행 테스트에 사용되는 샘플 테스트 파일입니다.
 * example.com을 대상으로 기본적인 페이지 로드 테스트를 수행합니다.
 */

const { test, expect } = require('@playwright/test');

test.describe('Example.com Tests', () => {
  test('should load example.com homepage', async ({ page }) => {
    await page.goto('https://example.com');

    // 페이지 제목 확인
    await expect(page).toHaveTitle(/Example Domain/);

    // 메인 헤딩 확인
    const heading = page.locator('h1');
    await expect(heading).toHaveText('Example Domain');
  });

  test('should have more information link', async ({ page }) => {
    await page.goto('https://example.com');

    // "More information..." 링크 확인
    const link = page.locator('a');
    await expect(link).toHaveText('More information...');

    // 링크의 href 속성 확인
    await expect(link).toHaveAttribute('href', 'https://www.iana.org/domains/example');
  });

  test('should have correct page structure', async ({ page }) => {
    await page.goto('https://example.com');

    // 기본 구조 확인
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('div')).toBeVisible();
    await expect(page.locator('p')).toHaveCount(2);
  });
});
