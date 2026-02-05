/**
 * Authentication E2E Tests
 *
 * 인증 기능에 대한 E2E 테스트를 정의합니다.
 * - 로그인 페이지 로드
 * - 유효한 자격증명으로 로그인 성공
 * - 잘못된 이메일로 로그인 실패
 * - 잘못된 비밀번호로 로그인 실패
 * - 로그아웃 후 리다이렉트
 */

const { test, expect } = require('@playwright/test');
const { LoginPage, ApiTestingPage } = require('../pages');
const {
  createBrowserContext,
  closeBrowserContext,
  takeScreenshot,
} = require('../utils/test-helpers');
const { URLS, TEST_CREDENTIALS, TIMEOUTS } = require('../fixtures/test-data');

test.describe('Authentication Features', () => {
  /** @type {import('@playwright/test').Browser} */
  let browser;
  /** @type {import('@playwright/test').BrowserContext} */
  let context;
  /** @type {import('@playwright/test').Page} */
  let page;
  /** @type {LoginPage} */
  let loginPage;

  test.beforeEach(async () => {
    const browserSetup = await createBrowserContext();
    browser = browserSetup.browser;
    context = browserSetup.context;
    page = browserSetup.page;
    loginPage = new LoginPage(page);
  });

  test.afterEach(async ({}, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      await takeScreenshot(page, `auth-${testInfo.title.replace(/\s+/g, '-')}`);
    }
    await closeBrowserContext(context, browser);
  });

  test('should load login page correctly', async () => {
    // Arrange & Act
    await loginPage.goto(URLS.BASE_URL);

    // Assert
    await loginPage.waitForPageLoad();
    await expect(loginPage.heading).toBeVisible();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();
  });

  test('should login successfully with valid credentials', async () => {
    // Arrange
    const { email, password } = TEST_CREDENTIALS.ADMIN;

    // Act
    await loginPage.performLogin(URLS.BASE_URL, email, password);

    // Assert
    const apiTestingPage = new ApiTestingPage(page);
    await apiTestingPage.waitForPageLoad();
    await expect(apiTestingPage.apiTestingNavButton).toBeVisible();
  });

  test('should fail login with invalid email', async () => {
    // Arrange
    const invalidEmail = 'invalid@example.com';
    const validPassword = TEST_CREDENTIALS.ADMIN.password;

    // Act
    await loginPage.goto(URLS.BASE_URL);
    await loginPage.waitForPageLoad();
    await loginPage.login(invalidEmail, validPassword);

    // Assert - should stay on login page or show error
    await page.waitForTimeout(TIMEOUTS.SHORT);

    // Check if still on login page (login failed)
    const isLoginPage = await loginPage.heading.isVisible().catch(() => false);
    const hasError = await page.locator('text=/error|invalid|fail|incorrect/i').isVisible().catch(() => false);

    expect(isLoginPage || hasError).toBeTruthy();
  });

  test('should fail login with invalid password', async () => {
    // Arrange
    const validEmail = TEST_CREDENTIALS.ADMIN.email;
    const invalidPassword = 'WrongPassword123!';

    // Act
    await loginPage.goto(URLS.BASE_URL);
    await loginPage.waitForPageLoad();
    await loginPage.login(validEmail, invalidPassword);

    // Assert - should stay on login page or show error
    await page.waitForTimeout(TIMEOUTS.SHORT);

    // Check if still on login page (login failed)
    const isLoginPage = await loginPage.heading.isVisible().catch(() => false);
    const hasError = await page.locator('text=/error|invalid|fail|incorrect/i').isVisible().catch(() => false);

    expect(isLoginPage || hasError).toBeTruthy();
  });

  test('should redirect to login page after logout', async () => {
    // Arrange - First login
    const { email, password } = TEST_CREDENTIALS.ADMIN;
    await loginPage.performLogin(URLS.BASE_URL, email, password);

    const apiTestingPage = new ApiTestingPage(page);
    await apiTestingPage.waitForPageLoad();

    // Act - Find and click logout button
    const logoutButton = page.getByRole('button', { name: /logout|로그아웃/i });
    const logoutLink = page.getByRole('link', { name: /logout|로그아웃/i });
    const logoutMenuItem = page.locator('text=/logout|로그아웃/i').first();

    // Try different logout mechanisms
    if (await logoutButton.isVisible().catch(() => false)) {
      await logoutButton.click();
    } else if (await logoutLink.isVisible().catch(() => false)) {
      await logoutLink.click();
    } else if (await logoutMenuItem.isVisible().catch(() => false)) {
      await logoutMenuItem.click();
    } else {
      // Try clicking user menu first
      const userMenu = page.locator('[data-testid="user-menu"], .user-menu, .profile-menu').first();
      if (await userMenu.isVisible().catch(() => false)) {
        await userMenu.click();
        await page.waitForTimeout(TIMEOUTS.SHORT);
        await page.locator('text=/logout|로그아웃/i').first().click();
      }
    }

    // Assert - Should be redirected to login page
    await page.waitForTimeout(TIMEOUTS.SHORT);
    await expect(loginPage.heading).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
  });
});
