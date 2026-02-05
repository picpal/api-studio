const { test, expect } = require('@playwright/test');

test.describe('JSONPlaceholder API Tests', () => {
  test('should load JSONPlaceholder homepage', async ({ page }) => {
    await page.goto('https://jsonplaceholder.typicode.com');

    await expect(page).toHaveTitle(/JSONPlaceholder/);
    await expect(page.locator('h1')).toContainText('JSONPlaceholder');
  });

  test('should display posts endpoint example', async ({ page }) => {
    await page.goto('https://jsonplaceholder.typicode.com');

    const postsLink = page.locator('a[href="/posts"]');
    await expect(postsLink).toBeVisible();
  });

  test('should fetch posts data via API request', async ({ page, request }) => {
    const response = await request.get('https://jsonplaceholder.typicode.com/posts');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const posts = await response.json();
    expect(posts.length).toBeGreaterThan(0);
    expect(posts[0]).toHaveProperty('id');
    expect(posts[0]).toHaveProperty('title');
    expect(posts[0]).toHaveProperty('body');
  });
});
