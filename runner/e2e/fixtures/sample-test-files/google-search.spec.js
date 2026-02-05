const { test, expect } = require('@playwright/test');

test.describe('Google Search Tests', () => {
  test('should load Google homepage', async ({ page }) => {
    await page.goto('https://www.google.com');

    await expect(page).toHaveTitle(/Google/);
    await expect(page.locator('input[name="q"]')).toBeVisible();
  });

  test('should perform a search', async ({ page }) => {
    await page.goto('https://www.google.com');

    const searchInput = page.locator('input[name="q"]');
    await searchInput.fill('Playwright testing');
    await searchInput.press('Enter');

    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/search/);
    await expect(page.locator('#search')).toBeVisible();
  });

  test('should show search suggestions', async ({ page }) => {
    await page.goto('https://www.google.com');

    const searchInput = page.locator('input[name="q"]');
    await searchInput.fill('playwright');

    await page.waitForTimeout(1000);
    const suggestions = page.locator('[role="listbox"]');
    await expect(suggestions).toBeVisible();
  });
});
