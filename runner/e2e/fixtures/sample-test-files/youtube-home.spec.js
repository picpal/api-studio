const { test, expect } = require('@playwright/test');

test.describe('YouTube Homepage Tests', () => {
  test('should load YouTube homepage', async ({ page }) => {
    await page.goto('https://www.youtube.com');

    await expect(page).toHaveTitle(/YouTube/);
  });

  test('should have search bar visible', async ({ page }) => {
    await page.goto('https://www.youtube.com');

    const searchInput = page.locator('input#search');
    await expect(searchInput).toBeVisible();
  });

  test('should perform a search', async ({ page }) => {
    await page.goto('https://www.youtube.com');

    const searchInput = page.locator('input#search');
    await searchInput.fill('Playwright tutorial');
    await searchInput.press('Enter');

    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/results/);
  });
});
