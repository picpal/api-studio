const { test, expect } = require('@playwright/test');

test.describe('Wikipedia Search Tests', () => {
  test('should load Wikipedia homepage', async ({ page }) => {
    await page.goto('https://en.wikipedia.org');

    await expect(page).toHaveTitle(/Wikipedia/);
    await expect(page.locator('#searchInput')).toBeVisible();
  });

  test('should search for an article', async ({ page }) => {
    await page.goto('https://en.wikipedia.org');

    const searchInput = page.locator('#searchInput');
    await searchInput.fill('Software testing');
    await searchInput.press('Enter');

    await page.waitForLoadState('networkidle');
    await expect(page.locator('#firstHeading')).toBeVisible();
  });

  test('should navigate to random article', async ({ page }) => {
    await page.goto('https://en.wikipedia.org/wiki/Special:Random');

    await page.waitForLoadState('networkidle');
    await expect(page.locator('#firstHeading')).toBeVisible();
    await expect(page.locator('#mw-content-text')).toBeVisible();
  });
});
