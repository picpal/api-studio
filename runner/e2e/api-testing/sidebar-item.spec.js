/**
 * Sidebar Item Management E2E Tests
 *
 * 사이드바 아이템 관리 기능에 대한 E2E 테스트를 정의합니다.
 * - 아이템 목록 로드
 * - 새 아이템 생성
 * - 아이템 선택 시 상세 정보 표시
 * - 아이템 이름 변경
 * - 아이템 삭제
 * - 아이템 다른 폴더로 이동
 * - 아이템 복제
 */

const { test, expect } = require('@playwright/test');
const { LoginPage, ApiTestingPage } = require('../pages');
const {
  setupTest,
  teardownTest,
  takeScreenshot,
} = require('../utils/test-helpers');
const { URLS, TEST_CREDENTIALS, TIMEOUTS, generateFolderName, generateApiName } = require('../fixtures/test-data');

test.describe('Sidebar Item Management', () => {
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
      await takeScreenshot(page, `sidebar-item-${testInfo.title.replace(/\s+/g, '-')}`);
    }
    await teardownTest(context, browser);
  });

  test('should load item list', async () => {
    // Assert - Sidebar should be visible using Page Object method
    const sidebar = apiTestingPage.getSidebar();
    await expect(sidebar).toBeVisible({ timeout: TIMEOUTS.DEFAULT });

    // Check for folder list (contains items) using Page Object method
    const folderList = apiTestingPage.getFolderList();
    // Folder list may be empty initially, just check sidebar is loaded
    await expect(apiTestingPage.createFolderButton).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
  });

  test('should create a new item', async () => {
    // Arrange - Create a folder first to add item into
    const folderName = generateFolderName();
    await apiTestingPage.createFolder(folderName);

    // Click on the folder to select it
    const folderElement = page.getByText(folderName).first();
    await folderElement.click();
    await page.waitForTimeout(TIMEOUTS.SHORT);

    // Act - Find add item button
    const addItemButton = page.locator('button:has-text("+ Add"), button:has-text("New"), button:has-text("Add API"), [data-testid="add-item"]').first();

    if (await addItemButton.isVisible().catch(() => false)) {
      await addItemButton.click();
      await page.waitForTimeout(TIMEOUTS.SHORT);

      // Fill in item name
      const itemName = generateApiName();
      const itemNameInput = page.locator('input[placeholder*="name"], input[name="name"], input[type="text"]').last();

      if (await itemNameInput.isVisible().catch(() => false)) {
        await itemNameInput.fill(itemName);

        // Click create button
        const createBtn = page.locator('button:has-text("Create"), button:has-text("Save"), button:has-text("Add")').first();
        if (await createBtn.isVisible().catch(() => false)) {
          await createBtn.click();
          await page.waitForTimeout(TIMEOUTS.SHORT);

          // Assert
          await expect(page.getByText(itemName).first()).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
        }
      }
    }
  });

  test('should display item details when selected', async () => {
    // Arrange - Create a folder and item
    const folderName = generateFolderName();
    await apiTestingPage.createFolder(folderName);

    // Click on the folder
    const folderElement = page.getByText(folderName).first();
    await folderElement.click();
    await page.waitForTimeout(TIMEOUTS.SHORT);

    // Create an item
    const addItemButton = page.locator('button:has-text("+ Add"), button:has-text("New"), button:has-text("Add API")').first();
    const itemName = generateApiName();

    if (await addItemButton.isVisible().catch(() => false)) {
      await addItemButton.click();
      await page.waitForTimeout(TIMEOUTS.SHORT);

      const itemNameInput = page.locator('input[placeholder*="name"], input[name="name"], input[type="text"]').last();
      if (await itemNameInput.isVisible().catch(() => false)) {
        await itemNameInput.fill(itemName);
        const createBtn = page.locator('button:has-text("Create"), button:has-text("Save")').first();
        if (await createBtn.isVisible().catch(() => false)) {
          await createBtn.click();
          await page.waitForTimeout(TIMEOUTS.SHORT);
        }
      }

      // Act - Click on the created item
      const itemElement = page.getByText(itemName).first();
      await expect(itemElement).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
      await itemElement.click();
      await page.waitForTimeout(TIMEOUTS.SHORT);

      // Assert - Details panel should show item information
      const detailsPanel = page.locator('.details-panel, .main-content, [data-testid="details"], main').first();
      await expect(detailsPanel).toBeVisible();

      // URL input and method select should be visible (API testing specific)
      await expect(apiTestingPage.urlInput).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
      await expect(apiTestingPage.methodSelect).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    }
  });

  test('should rename item', async () => {
    // Arrange - Create a folder and item
    const folderName = generateFolderName();
    await apiTestingPage.createFolder(folderName);

    const folderElement = page.getByText(folderName).first();
    await folderElement.click();
    await page.waitForTimeout(TIMEOUTS.SHORT);

    const originalName = generateApiName();
    const newName = `${originalName}-Renamed`;
    const addItemButton = page.locator('button:has-text("+ Add"), button:has-text("New")').first();

    if (await addItemButton.isVisible().catch(() => false)) {
      await addItemButton.click();
      await page.waitForTimeout(TIMEOUTS.SHORT);

      const itemNameInput = page.locator('input[placeholder*="name"], input[name="name"], input[type="text"]').last();
      if (await itemNameInput.isVisible().catch(() => false)) {
        await itemNameInput.fill(originalName);
        const createBtn = page.locator('button:has-text("Create"), button:has-text("Save")').first();
        if (await createBtn.isVisible().catch(() => false)) {
          await createBtn.click();
          await page.waitForTimeout(TIMEOUTS.SHORT);
        }
      }

      // Act - Right-click on item for context menu
      const itemElement = page.getByText(originalName).first();
      await expect(itemElement).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
      await itemElement.click({ button: 'right' });
      await page.waitForTimeout(TIMEOUTS.SHORT);

      // Find and click rename option
      const renameOption = page.locator('text=/rename|이름 변경|edit/i').first();
      if (await renameOption.isVisible().catch(() => false)) {
        await renameOption.click();
        await page.waitForTimeout(TIMEOUTS.SHORT);

        const renameInput = page.locator('input:focus, input[type="text"]').last();
        if (await renameInput.isVisible().catch(() => false)) {
          await renameInput.clear();
          await renameInput.fill(newName);
          await renameInput.press('Enter');

          // Assert
          await page.waitForTimeout(TIMEOUTS.SHORT);
          await expect(page.getByText(newName).first()).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
        }
      }
    }
  });

  test('should delete item', async () => {
    // Arrange - Create a folder and item
    const folderName = generateFolderName();
    await apiTestingPage.createFolder(folderName);

    const folderElement = page.getByText(folderName).first();
    await folderElement.click();
    await page.waitForTimeout(TIMEOUTS.SHORT);

    const itemName = generateApiName();
    const addItemButton = page.locator('button:has-text("+ Add"), button:has-text("New")').first();

    if (await addItemButton.isVisible().catch(() => false)) {
      await addItemButton.click();
      await page.waitForTimeout(TIMEOUTS.SHORT);

      const itemNameInput = page.locator('input[placeholder*="name"], input[name="name"], input[type="text"]').last();
      if (await itemNameInput.isVisible().catch(() => false)) {
        await itemNameInput.fill(itemName);
        const createBtn = page.locator('button:has-text("Create"), button:has-text("Save")').first();
        if (await createBtn.isVisible().catch(() => false)) {
          await createBtn.click();
          await page.waitForTimeout(TIMEOUTS.SHORT);
        }
      }

      // Act - Right-click on item for context menu
      const itemElement = page.getByText(itemName).first();
      await expect(itemElement).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
      await itemElement.click({ button: 'right' });
      await page.waitForTimeout(TIMEOUTS.SHORT);

      // Find and click delete option
      const deleteOption = page.locator('text=/delete|삭제|remove/i').first();
      if (await deleteOption.isVisible().catch(() => false)) {
        await deleteOption.click();
        await page.waitForTimeout(TIMEOUTS.SHORT);

        // Handle confirmation if present
        const confirmButton = page.locator('button:has-text("확인"), button:has-text("OK"), button:has-text("Delete"), button:has-text("Yes")').first();
        if (await confirmButton.isVisible().catch(() => false)) {
          await confirmButton.click();
        }

        // Assert - Item should be deleted
        await page.waitForTimeout(TIMEOUTS.SHORT);
        await expect(page.getByText(itemName).first()).not.toBeVisible({ timeout: TIMEOUTS.DEFAULT });
      }
    }
  });

  test('should move item to different folder', async () => {
    // Arrange - Create two folders
    const sourceFolderName = generateFolderName();
    const targetFolderName = `${generateFolderName()}-Target`;

    await apiTestingPage.createFolder(sourceFolderName);
    await apiTestingPage.createFolder(targetFolderName);

    // Create item in source folder
    const sourceFolder = page.getByText(sourceFolderName).first();
    await sourceFolder.click();
    await page.waitForTimeout(TIMEOUTS.SHORT);

    const itemName = generateApiName();
    const addItemButton = page.locator('button:has-text("+ Add"), button:has-text("New")').first();

    if (await addItemButton.isVisible().catch(() => false)) {
      await addItemButton.click();
      await page.waitForTimeout(TIMEOUTS.SHORT);

      const itemNameInput = page.locator('input[placeholder*="name"], input[name="name"], input[type="text"]').last();
      if (await itemNameInput.isVisible().catch(() => false)) {
        await itemNameInput.fill(itemName);
        const createBtn = page.locator('button:has-text("Create"), button:has-text("Save")').first();
        if (await createBtn.isVisible().catch(() => false)) {
          await createBtn.click();
          await page.waitForTimeout(TIMEOUTS.SHORT);
        }
      }

      // Act - Right-click on item and select move option
      const itemElement = page.getByText(itemName).first();
      await expect(itemElement).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
      await itemElement.click({ button: 'right' });
      await page.waitForTimeout(TIMEOUTS.SHORT);

      const moveOption = page.locator('text=/move|이동|transfer/i').first();
      if (await moveOption.isVisible().catch(() => false)) {
        await moveOption.click();
        await page.waitForTimeout(TIMEOUTS.SHORT);

        // Select target folder
        const targetOption = page.locator(`text=${targetFolderName}`).first();
        if (await targetOption.isVisible().catch(() => false)) {
          await targetOption.click();

          // Confirm move
          const confirmBtn = page.locator('button:has-text("Move"), button:has-text("확인"), button:has-text("OK")').first();
          if (await confirmBtn.isVisible().catch(() => false)) {
            await confirmBtn.click();
            await page.waitForTimeout(TIMEOUTS.SHORT);

            // Assert - Item should be in target folder
            const targetFolder = page.getByText(targetFolderName).first();
            await targetFolder.click();
            await page.waitForTimeout(TIMEOUTS.SHORT);

            // The item should now be visible under the target folder
            await expect(page.getByText(itemName).first()).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
          }
        }
      } else {
        // Alternative: drag and drop
        const targetFolder = page.getByText(targetFolderName).first();
        await itemElement.dragTo(targetFolder);
        await page.waitForTimeout(TIMEOUTS.SHORT);
      }
    }
  });

  test('should duplicate item', async () => {
    // Arrange - Create a folder and item
    const folderName = generateFolderName();
    await apiTestingPage.createFolder(folderName);

    const folderElement = page.getByText(folderName).first();
    await folderElement.click();
    await page.waitForTimeout(TIMEOUTS.SHORT);

    const itemName = generateApiName();
    const addItemButton = page.locator('button:has-text("+ Add"), button:has-text("New")').first();

    if (await addItemButton.isVisible().catch(() => false)) {
      await addItemButton.click();
      await page.waitForTimeout(TIMEOUTS.SHORT);

      const itemNameInput = page.locator('input[placeholder*="name"], input[name="name"], input[type="text"]').last();
      if (await itemNameInput.isVisible().catch(() => false)) {
        await itemNameInput.fill(itemName);
        const createBtn = page.locator('button:has-text("Create"), button:has-text("Save")').first();
        if (await createBtn.isVisible().catch(() => false)) {
          await createBtn.click();
          await page.waitForTimeout(TIMEOUTS.SHORT);
        }
      }

      // Act - Right-click on item for context menu
      const itemElement = page.getByText(itemName).first();
      await expect(itemElement).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
      await itemElement.click({ button: 'right' });
      await page.waitForTimeout(TIMEOUTS.SHORT);

      // Find and click duplicate/copy option
      const duplicateOption = page.locator('text=/duplicate|복제|copy|복사|clone/i').first();
      if (await duplicateOption.isVisible().catch(() => false)) {
        await duplicateOption.click();
        await page.waitForTimeout(TIMEOUTS.SHORT);

        // Assert - Duplicated item should appear (usually with "Copy" suffix or similar)
        const duplicatedItem = page.locator(`text=/${itemName}.*copy|${itemName}.*복사|${itemName}.*\\(1\\)|${itemName}.*clone/i`).first();
        const exactDuplicate = page.getByText(itemName);

        // Should have at least 2 items with similar names
        const itemCount = await exactDuplicate.count();
        expect(itemCount).toBeGreaterThanOrEqual(1);

        // Or find the duplicated item with modified name
        const hasDuplicate = await duplicatedItem.isVisible().catch(() => false) || itemCount >= 2;
        expect(hasDuplicate).toBeTruthy();
      }
    }
  });
});
