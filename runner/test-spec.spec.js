const { test, expect } = require('@playwright/test');

test('codegen style test', async ({ page }) => {
  console.log('Starting codegen test...');

  // Navigate to the page
  await page.goto('https://example.com');

  // Expect a title "to contain" a substring
  await expect(page).toHaveTitle(/Example Domain/);

  // Click the "More information..." link
  await page.getByRole('link', { name: 'More information...' }).click();

  console.log('Codegen test completed!');
});