const { test, expect } = require('@playwright/test');

test.describe('NPM Package Search Tests', () => {
  test('should load NPM homepage', async ({ page }) => {
    await page.goto('https://www.npmjs.com');

    await expect(page).toHaveTitle(/npm/);
  });

  test('should search for a package', async ({ page }) => {
    await page.goto('https://www.npmjs.com');

    const searchInput = page.locator('input[type="search"]').first();
    await searchInput.fill('playwright');
    await searchInput.press('Enter');

    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/search/);
  });

  test('should navigate to package details page', async ({ page }) => {
    await page.goto('https://www.npmjs.com/package/playwright');

    await expect(page).toHaveURL(/package\/playwright/);
    await expect(page.locator('h1')).toContainText('playwright');
  });
});
