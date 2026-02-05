const { test, expect } = require('@playwright/test');

test.describe('MDN Web Docs Tests', () => {
  test('should load MDN homepage', async ({ page }) => {
    await page.goto('https://developer.mozilla.org');

    await expect(page).toHaveTitle(/MDN/);
  });

  test('should search for documentation', async ({ page }) => {
    await page.goto('https://developer.mozilla.org');

    const searchButton = page.locator('button[type="button"]').filter({ hasText: /search/i }).first();
    await searchButton.click();

    const searchInput = page.locator('input[type="search"]').first();
    await searchInput.fill('JavaScript');
    await searchInput.press('Enter');

    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/search/);
  });

  test('should navigate to JavaScript documentation', async ({ page }) => {
    await page.goto('https://developer.mozilla.org/en-US/docs/Web/JavaScript');

    await expect(page).toHaveURL(/JavaScript/);
    await expect(page.locator('h1')).toBeVisible();
  });
});
