const { test, expect } = require('@playwright/test');

test('basic page test', async ({ page }) => {
  console.log('Starting test...');

  await page.goto('https://example.com');

  await expect(page).toHaveTitle(/Example Domain/);

  console.log('Test completed successfully!');
});