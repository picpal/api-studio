const { test, expect } = require('@playwright/test');

test.describe('Stack Overflow Homepage Tests', () => {
  test('should load Stack Overflow homepage', async ({ page }) => {
    await page.goto('https://stackoverflow.com');

    await expect(page).toHaveTitle(/Stack Overflow/);
  });

  test('should have questions section visible', async ({ page }) => {
    await page.goto('https://stackoverflow.com/questions');

    await expect(page).toHaveURL(/questions/);
    await expect(page.locator('#questions')).toBeVisible();
  });

  test('should navigate to tags page', async ({ page }) => {
    await page.goto('https://stackoverflow.com/tags');

    await expect(page).toHaveURL(/tags/);
    await expect(page.locator('#tags-browser')).toBeVisible();
  });
});
