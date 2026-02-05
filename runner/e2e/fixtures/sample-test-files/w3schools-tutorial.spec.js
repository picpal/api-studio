const { test, expect } = require('@playwright/test');

test.describe('W3Schools Tutorial Tests', () => {
  test('should load W3Schools homepage', async ({ page }) => {
    await page.goto('https://www.w3schools.com');

    await expect(page).toHaveTitle(/W3Schools/);
  });

  test('should navigate to HTML tutorial', async ({ page }) => {
    await page.goto('https://www.w3schools.com/html/default.asp');

    await expect(page).toHaveURL(/html/);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should navigate to JavaScript tutorial', async ({ page }) => {
    await page.goto('https://www.w3schools.com/js/default.asp');

    await expect(page).toHaveURL(/js/);
    await expect(page.locator('h1')).toBeVisible();
  });
});
