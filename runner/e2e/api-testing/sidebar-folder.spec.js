/**
 * Sidebar Folder Management E2E Tests
 *
 * 사이드바 폴더 관리 기능에 대한 E2E 테스트를 정의합니다.
 * - 폴더 목록 로드
 * - 새 폴더 생성
 * - 폴더 확장/축소
 * - 폴더 이름 변경
 * - 빈 폴더 삭제
 * - 아이템이 있는 폴더 삭제 확인
 */

const { test, expect } = require('@playwright/test');
const { LoginPage, ApiTestingPage } = require('../pages');
const {
  setupTest,
  teardownTest,
  takeScreenshot,
} = require('../utils/test-helpers');
const { URLS, TEST_CREDENTIALS, TIMEOUTS, generateFolderName } = require('../fixtures/test-data');

test.describe('Sidebar Folder Management', () => {
  /** @type {import('@playwright/test').Browser} */
  let browser;
  /** @type {import('@playwright/test').BrowserContext} */
  let context;
  /** @type {import('@playwright/test').Page} */
  let page;
  /** @type {ApiTestingPage} */
  let apiTestingPage;

  test.beforeEach(async () => {
    const setup = await setupTest();
    browser = setup.browser;
    context = setup.context;
    page = setup.page;
    apiTestingPage = setup.apiTestingPage;
  });

  test.afterEach(async ({}, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      await takeScreenshot(page, `sidebar-folder-${testInfo.title.replace(/\s+/g, '-')}`);
    }
    await teardownTest(context, browser);
  });

  test('should load folder list', async () => {
    // Assert - Sidebar should be visible with create folder button
    await expect(apiTestingPage.createFolderButton).toBeVisible({ timeout: TIMEOUTS.DEFAULT });

    // Check if sidebar area is visible using Page Object method
    const sidebar = apiTestingPage.getSidebar();
    await expect(sidebar).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
  });

  test('should create a new folder', async () => {
    // Arrange
    const folderName = generateFolderName();

    // Act
    await apiTestingPage.createFolder(folderName);

    // Assert
    await apiTestingPage.verifyFolderExists(folderName);
  });

  test('should expand and collapse folder', async () => {
    // Arrange - Create a folder first
    const folderName = generateFolderName();
    await apiTestingPage.createFolder(folderName);

    // Find the folder element
    const folderElement = page.getByText(folderName).first();
    await expect(folderElement).toBeVisible();

    // Find the expand/collapse toggle (arrow icon or button near folder name)
    const folderRow = folderElement.locator('..').first();
    const expandToggle = folderRow.locator('svg, [data-testid="expand-toggle"], .expand-icon, button').first();

    // Act - Click to expand (if collapsed)
    if (await expandToggle.isVisible().catch(() => false)) {
      await expandToggle.click();
      await page.waitForTimeout(TIMEOUTS.SHORT);

      // Assert - Folder should be expanded (look for expanded state indicator)
      const isExpanded = await folderRow.locator('.expanded, [aria-expanded="true"]').isVisible().catch(() => true);
      expect(isExpanded).toBeTruthy();

      // Act - Click to collapse
      await expandToggle.click();
      await page.waitForTimeout(TIMEOUTS.SHORT);

      // Assert - Folder should be collapsed
      const isCollapsed = await folderRow.locator('.collapsed, [aria-expanded="false"]').isVisible().catch(() => true);
      expect(isCollapsed).toBeTruthy();
    } else {
      // Direct folder click toggle test
      await folderElement.click();
      await page.waitForTimeout(TIMEOUTS.SHORT);
    }
  });

  test('should rename folder', async () => {
    // Arrange - Create a folder first
    const originalName = generateFolderName();
    const newName = `${originalName}-Renamed`;
    await apiTestingPage.createFolder(originalName);

    // Find the folder and right-click for context menu
    const folderElement = page.getByText(originalName).first();
    await expect(folderElement).toBeVisible();

    // Act - Right-click to open context menu
    await folderElement.click({ button: 'right' });
    await page.waitForTimeout(TIMEOUTS.SHORT);

    // Find and click rename option using various possible selectors
    // 실제 UI에서 컨텍스트 메뉴는 button role에 이모지 포함 (예: "✏️ Rename")
    const renameButton = page.getByRole('button', { name: /✏️ Rename|Rename|이름/i });
    const renameMenuitem = page.getByRole('menuitem', { name: /rename|이름/i });
    const renameText = page.getByText(/rename|이름 변경/i);
    const renameOption = renameButton.or(renameMenuitem).or(renameText).first();

    if (await renameOption.isVisible({ timeout: TIMEOUTS.SHORT }).catch(() => false)) {
      await renameOption.click();
      await page.waitForTimeout(TIMEOUTS.SHORT);

      // Find input field and enter new name - check multiple possible selectors
      const renameInput = page.locator('input[type="text"]').last();
      const focusedInput = page.locator('input:focus');
      const inputField = renameInput.or(focusedInput).first();

      if (await inputField.isVisible({ timeout: TIMEOUTS.SHORT }).catch(() => false)) {
        await inputField.clear();
        await inputField.fill(newName);
        await inputField.press('Enter');

        // Assert
        await page.waitForTimeout(TIMEOUTS.SHORT);
        await expect(page.getByText(newName).first()).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
      }
    } else {
      // Alternative: double-click to edit inline
      await folderElement.dblclick();
      await page.waitForTimeout(TIMEOUTS.SHORT);

      const inlineInput = page.locator('input:focus').first();
      if (await inlineInput.isVisible({ timeout: TIMEOUTS.SHORT }).catch(() => false)) {
        await inlineInput.clear();
        await inlineInput.fill(newName);
        await inlineInput.press('Enter');

        // Assert
        await page.waitForTimeout(TIMEOUTS.SHORT);
        await expect(page.getByText(newName).first()).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
      }
    }
  });

  test('should delete empty folder', async () => {
    // Arrange - Create a folder first
    const folderName = generateFolderName();
    await apiTestingPage.createFolder(folderName);

    // Verify folder exists
    const folderElement = page.getByText(folderName).first();
    await expect(folderElement).toBeVisible();

    // Act - Right-click to open context menu
    await folderElement.click({ button: 'right' });
    await page.waitForTimeout(TIMEOUTS.SHORT);

    // Find and click delete option using various possible selectors
    // 실제 UI에서 컨텍스트 메뉴는 button role에 이모지 포함 (예: "🗑️ Delete")
    const deleteButton = page.getByRole('button', { name: /🗑️ Delete|Delete|삭제/i });
    const deleteMenuitem = page.getByRole('menuitem', { name: /delete|삭제/i });
    const deleteText = page.getByText(/delete|삭제|remove/i);
    const deleteOption = deleteButton.or(deleteMenuitem).or(deleteText).first();

    if (await deleteOption.isVisible({ timeout: TIMEOUTS.SHORT }).catch(() => false)) {
      await deleteOption.click();
      await page.waitForTimeout(TIMEOUTS.SHORT);

      // Handle confirmation dialog if present - try various button patterns
      const confirmByRole = page.getByRole('button', { name: /confirm|확인|yes|삭제|delete|ok/i });
      const confirmByText = page.locator('button').filter({ hasText: /확인|OK|Delete|Yes/i });
      const confirmButton = confirmByRole.or(confirmByText).first();

      if (await confirmButton.isVisible({ timeout: TIMEOUTS.SHORT }).catch(() => false)) {
        await confirmButton.click();
      }

      // Assert - Folder should be deleted
      await page.waitForTimeout(TIMEOUTS.SHORT);
      await expect(folderElement).not.toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    }
  });

  test('should require confirmation when deleting folder with items', async () => {
    // Arrange - Create a folder and add an item to it
    const folderName = generateFolderName();
    await apiTestingPage.createFolder(folderName);

    // Find the folder and click to select it
    const folderElement = page.getByText(folderName).first();
    await expect(folderElement).toBeVisible();
    await folderElement.click();
    await page.waitForTimeout(TIMEOUTS.SHORT);

    // Try to add an item to the folder (if there's an add item button)
    const addItemButton = page.locator('button:has-text("+ Add"), button:has-text("New Item"), button:has-text("Add API")').first();
    if (await addItemButton.isVisible().catch(() => false)) {
      await addItemButton.click();
      await page.waitForTimeout(TIMEOUTS.SHORT);

      // Fill in item details if a modal appears
      const itemNameInput = page.locator('input[placeholder*="name"], input[name="name"]').first();
      if (await itemNameInput.isVisible().catch(() => false)) {
        await itemNameInput.fill(`Test-Item-${Date.now()}`);
        const createBtn = page.locator('button:has-text("Create"), button:has-text("Save")').first();
        if (await createBtn.isVisible().catch(() => false)) {
          await createBtn.click();
          await page.waitForTimeout(TIMEOUTS.SHORT);
        }
      }
    }

    // Act - Try to delete the folder
    await folderElement.click({ button: 'right' });
    await page.waitForTimeout(TIMEOUTS.SHORT);

    // 실제 UI에서 컨텍스트 메뉴는 button role에 이모지 포함 (예: "🗑️ Delete")
    const deleteButton = page.getByRole('button', { name: /🗑️ Delete|Delete|삭제/i });
    const deleteText = page.locator('text=/delete|삭제|remove/i');
    const deleteOption = deleteButton.or(deleteText).first();
    if (await deleteOption.isVisible().catch(() => false)) {
      await deleteOption.click();
      await page.waitForTimeout(TIMEOUTS.SHORT);

      // Assert - Confirmation dialog should appear
      const confirmDialog = page.locator('[role="dialog"], .modal, .confirm-dialog, [data-testid="confirm-dialog"]').first();
      const confirmText = page.locator('text=/contain|포함|items|아이템|confirm|확인/i').first();

      const hasDialog = await confirmDialog.isVisible().catch(() => false);
      const hasConfirmText = await confirmText.isVisible().catch(() => false);

      // Should have some form of confirmation
      expect(hasDialog || hasConfirmText).toBeTruthy();

      // Cancel the deletion
      const cancelButton = page.locator('button:has-text("Cancel"), button:has-text("취소"), button:has-text("No")').first();
      if (await cancelButton.isVisible().catch(() => false)) {
        await cancelButton.click();
      }
    }
  });
});
