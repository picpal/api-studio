const { test, expect } = require('@playwright/test');

test('simple passing test', async ({ page }) => {
  // Simple test that just passes
  console.log('Test is running...');
  expect(1 + 1).toBe(2);
  console.log('Test completed successfully!');
});
