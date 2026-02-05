const { test, expect } = require('@playwright/test');

test.describe('HTTPBin HTTP Tests', () => {
  test('should load HTTPBin homepage', async ({ page }) => {
    await page.goto('https://httpbin.org');

    await expect(page).toHaveTitle(/httpbin/i);
  });

  test('should test GET request via API', async ({ request }) => {
    const response = await request.get('https://httpbin.org/get', {
      params: {
        foo: 'bar',
        test: 'value'
      }
    });

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.args.foo).toBe('bar');
    expect(data.args.test).toBe('value');
  });

  test('should test POST request via API', async ({ request }) => {
    const response = await request.post('https://httpbin.org/post', {
      data: {
        name: 'Playwright',
        type: 'testing'
      }
    });

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.json.name).toBe('Playwright');
    expect(data.json.type).toBe('testing');
  });
});
