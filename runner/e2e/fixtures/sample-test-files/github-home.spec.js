const { test, expect } = require('@playwright/test');

test.describe('GitHub Homepage Tests', () => {
  test('should load GitHub homepage', async ({ page }) => {
    await page.goto('https://github.com');

    await expect(page).toHaveTitle(/GitHub/);
    await expect(page.locator('header')).toBeVisible();
  });

  test('should have sign up button visible', async ({ page }) => {
    await page.goto('https://github.com');

    const signUpButton = page.locator('a[href="/signup"]').first();
    await expect(signUpButton).toBeVisible();
  });

  test('should navigate to explore page', async ({ page }) => {
    await page.goto('https://github.com/explore');

    await expect(page).toHaveURL(/explore/);
    await expect(page.locator('h1')).toBeVisible();
  });
});
