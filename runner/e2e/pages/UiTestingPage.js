/**
 * UI Testing Page Object Model
 *
 * UI Testing 페이지의 셀렉터와 액션을 정의합니다.
 * Page Object Model 패턴을 사용하여 테스트 코드의 재사용성과 유지보수성을 높입니다.
 */

const { expect } = require('@playwright/test');
const { TIMEOUTS, UI_TESTING_TIMEOUTS } = require('../fixtures/test-data');

/**
 * UI Testing 페이지 Page Object
 */
class UiTestingPage {
  /**
   * UiTestingPage 생성자
   * @param {import('@playwright/test').Page} page - Playwright Page 객체
   */
  constructor(page) {
    this.page = page;

    // 셀렉터 정의 - 실제 UI 구조 기반
    this.selectors = {
      // 네비게이션
      /** UI Testing 네비게이션 버튼 */
      uiTestingNavButton: page.getByRole('button', { name: 'UI Testing' }),

      // 사이드바
      /** 폴더 생성 버튼 */
      createFolderButton: page.getByRole('button', { name: '+ Create Folder' }),
      /** 검색 입력 필드 */
      searchInput: page.getByPlaceholder('Search items...').first(),
      /** 사이드바 접기 버튼 */
      collapseSidebarButton: page.locator('button[title="Collapse Sidebar"]').first(),
      /** 사이드바 펼치기 버튼 */
      expandSidebarButton: page.locator('button[title="Expand Sidebar"]').first(),
      /** 모든 폴더 펼치기 버튼 */
      expandAllButton: page.locator('button[title="모든 폴더 펼치기"]').first(),
      /** 모든 폴더 접기 버튼 */
      collapseAllButton: page.locator('button[title="모든 폴더 접기"]').first(),

      // 폴더 생성 모달
      /** 폴더 생성 모달 제목 */
      createFolderModalTitle: page.getByRole('heading', { name: 'Create New Folder' }),
      /** 폴더 이름 입력 필드 */
      folderNameInput: page.getByPlaceholder('Enter folder name...'),
      /** Create 버튼 */
      createButton: page.getByRole('button', { name: 'Create', exact: true }),
      /** Cancel 버튼 */
      cancelButton: page.getByRole('button', { name: 'Cancel', exact: true }),

      // 스크립트 생성 모달
      /** 스크립트 생성 모달 제목 */
      createScriptModalTitle: page.getByRole('heading', { name: 'Create New Script' }),
      /** 스크립트 이름 입력 필드 */
      scriptNameInput: page.getByPlaceholder('Enter script name...'),

      // 이름 변경 모달
      /** 폴더 이름 변경 모달 제목 */
      renameFolderModalTitle: page.getByRole('heading', { name: 'Rename Folder' }),
      /** 새 폴더 이름 입력 필드 */
      newFolderNameInput: page.getByPlaceholder('Enter new folder name...'),
      /** 스크립트 이름 변경 모달 제목 */
      renameScriptModalTitle: page.getByRole('heading', { name: 'Rename Script' }),
      /** 새 스크립트 이름 입력 필드 */
      newScriptNameInput: page.getByPlaceholder('Enter new script name...'),
      /** Rename 버튼 */
      renameButton: page.getByRole('button', { name: 'Rename', exact: true }),

      // 컨텍스트 메뉴
      /** Rename Folder 메뉴 항목 */
      renameFolderMenuItem: page.getByRole('button', { name: 'Rename Folder' }),
      /** Add Script 메뉴 항목 */
      addScriptMenuItem: page.getByRole('button', { name: 'Add Script' }),
      /** Delete Folder 메뉴 항목 */
      deleteFolderMenuItem: page.getByRole('button', { name: 'Delete Folder' }),
      /** Rename Script 메뉴 항목 */
      renameScriptMenuItem: page.getByRole('button', { name: 'Rename Script' }),
      /** Delete Script 메뉴 항목 */
      deleteScriptMenuItem: page.getByRole('button', { name: 'Delete Script' }),

      // 메인 콘텐츠 - 헤더
      /** 스크립트 제목 (메인 콘텐츠) */
      scriptTitle: page.locator('h1.text-xl.font-semibold'),
      /** Refresh 버튼 */
      refreshButton: page.locator('button[title="Refresh file list"]'),
      /** Run All 버튼 */
      runAllButton: page.getByRole('button', { name: /Run All/ }),
      /** Stop All 버튼 */
      stopAllButton: page.getByRole('button', { name: 'Stop All' }),

      // 파일 업로드 영역
      /** 업로드 드롭존 */
      uploadDropzone: page.locator('.border-dashed').filter({ hasText: 'Drop your test files here' }),
      /** Browse 링크 */
      browseLink: page.getByRole('button', { name: 'browse' }),
      /** 파일 input (hidden) */
      fileInput: page.locator('input[type="file"]'),

      // 파일 목록
      /** 업로드된 파일 목록 컨테이너 */
      uploadedFilesContainer: page.locator('.bg-gray-50.rounded-lg'),
      /** 업로드된 파일 제목 */
      uploadedFilesTitle: page.getByText('Uploaded Files'),

      // 스크립트 미선택 상태
      /** 스크립트 미선택 메시지 */
      noScriptSelected: page.getByText('No script selected'),

      // 결과 모달
      /** 결과 모달 제목 */
      resultsModalTitle: page.getByRole('heading', { name: /Execution Results/ }),
      /** 결과 모달 닫기 버튼 */
      resultsModalCloseButton: page.locator('.fixed.inset-0 button').filter({ has: page.locator('svg.w-6.h-6') }),
    };
  }

  // ==================== Getter 메서드 ====================

  /**
   * UI Testing 네비게이션 버튼 반환
   * @returns {import('@playwright/test').Locator}
   */
  get uiTestingNavButton() {
    return this.selectors.uiTestingNavButton;
  }

  /**
   * 폴더 생성 버튼 반환
   * @returns {import('@playwright/test').Locator}
   */
  get createFolderButton() {
    return this.selectors.createFolderButton;
  }

  /**
   * 검색 입력 필드 반환
   * @returns {import('@playwright/test').Locator}
   */
  get searchInput() {
    return this.selectors.searchInput;
  }

  /**
   * Run All 버튼 반환
   * @returns {import('@playwright/test').Locator}
   */
  get runAllButton() {
    return this.selectors.runAllButton;
  }

  /**
   * Stop All 버튼 반환
   * @returns {import('@playwright/test').Locator}
   */
  get stopAllButton() {
    return this.selectors.stopAllButton;
  }

  // ==================== 페이지 네비게이션 메서드 ====================

  /**
   * UI Testing 페이지로 이동
   */
  async navigateToUiTesting() {
    await this.uiTestingNavButton.click();
    await this.waitForPageLoad();
  }

  /**
   * UI Testing 페이지 로드 확인
   * @param {number} [timeout=TIMEOUTS.PAGE_LOAD] - 대기 시간 (밀리초)
   */
  async waitForPageLoad(timeout = TIMEOUTS.PAGE_LOAD) {
    await expect(this.createFolderButton).toBeVisible({ timeout });
  }

  /**
   * UI Testing 페이지가 로드되었는지 확인
   * @returns {Promise<boolean>}
   */
  async isPageLoaded() {
    try {
      await expect(this.createFolderButton).toBeVisible({ timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  // ==================== 폴더 관리 메서드 ====================

  /**
   * 폴더 생성 모달 열기
   */
  async openCreateFolderModal() {
    await this.createFolderButton.click();
    await expect(this.selectors.createFolderModalTitle).toBeVisible();
  }

  /**
   * 폴더 이름 입력
   * @param {string} folderName - 폴더 이름
   */
  async fillFolderName(folderName) {
    await this.selectors.folderNameInput.fill(folderName);
  }

  /**
   * 폴더 생성 확인 버튼 클릭
   */
  async clickCreateFolder() {
    await this.selectors.createButton.click();
  }

  /**
   * 폴더 생성 전체 플로우 수행
   * @param {string} folderName - 생성할 폴더 이름
   */
  async createFolder(folderName) {
    await this.openCreateFolderModal();
    await this.fillFolderName(folderName);
    await this.clickCreateFolder();
    // 폴더 생성 확인
    await expect(this.page.getByText(folderName).first()).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
  }

  /**
   * 폴더 선택 (클릭)
   * @param {string} folderName - 선택할 폴더 이름
   */
  async selectFolder(folderName) {
    await this.page.getByText(folderName).first().click();
  }

  /**
   * 폴더 존재 여부 확인
   * @param {string} folderName - 확인할 폴더 이름
   * @param {number} [timeout=TIMEOUTS.DEFAULT] - 대기 시간 (밀리초)
   */
  async verifyFolderExists(folderName, timeout = TIMEOUTS.DEFAULT) {
    await expect(this.page.getByText(folderName).first()).toBeVisible({ timeout });
  }

  /**
   * 폴더 컨텍스트 메뉴 열기
   * @param {string} folderName - 폴더 이름
   */
  async openFolderContextMenu(folderName) {
    await this.page.getByText(folderName).first().click({ button: 'right' });
  }

  /**
   * 폴더 이름 변경
   * @param {string} oldName - 현재 폴더 이름
   * @param {string} newName - 새 폴더 이름
   */
  async renameFolder(oldName, newName) {
    await this.openFolderContextMenu(oldName);
    await this.selectors.renameFolderMenuItem.click();
    await expect(this.selectors.renameFolderModalTitle).toBeVisible();
    await this.selectors.newFolderNameInput.fill(newName);
    await this.selectors.renameButton.click();
    await expect(this.page.getByText(newName).first()).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
  }

  /**
   * 폴더 삭제
   * @param {string} folderName - 삭제할 폴더 이름
   */
  async deleteFolder(folderName) {
    await this.openFolderContextMenu(folderName);
    await this.selectors.deleteFolderMenuItem.click();
    // 폴더가 사라질 때까지 대기
    await this.page.waitForTimeout(500);
  }

  /**
   * 모든 폴더 펼치기
   */
  async expandAllFolders() {
    await this.selectors.expandAllButton.click();
  }

  /**
   * 모든 폴더 접기
   */
  async collapseAllFolders() {
    await this.selectors.collapseAllButton.click();
  }

  /**
   * 폴더 확장/축소 토글
   * @param {string} folderName - 폴더 이름
   */
  async toggleFolder(folderName) {
    await this.page.getByText(folderName).first().click();
  }

  /**
   * 폴더가 확장되어 있는지 확인
   * @param {string} folderName - 폴더 이름
   * @returns {Promise<boolean>}
   */
  async isFolderExpanded(folderName) {
    // 폴더 요소 내에 ChevronDownIcon이 있는지 확인
    const folderRow = this.page.locator('.px-2\\.5.py-1\\.5').filter({ hasText: folderName }).first();
    const downIcon = folderRow.locator('svg.w-3.h-3');
    // ChevronDown이 있으면 확장됨
    return await downIcon.count() > 0;
  }

  // ==================== 스크립트 관리 메서드 ====================

  /**
   * 스크립트 생성 (폴더 컨텍스트 메뉴에서)
   * @param {string} folderName - 폴더 이름
   * @param {string} scriptName - 스크립트 이름
   */
  async createScript(folderName, scriptName) {
    await this.openFolderContextMenu(folderName);
    await this.selectors.addScriptMenuItem.click();
    await expect(this.selectors.createScriptModalTitle).toBeVisible();
    await this.selectors.scriptNameInput.fill(scriptName);
    await this.selectors.createButton.click();
    // 모달이 닫힐 때까지 대기
    await this.page.waitForTimeout(500);
    // 폴더를 펼쳐서 스크립트가 보이도록 함
    await this.toggleFolder(folderName);
    await this.page.waitForTimeout(300);
    // 스크립트 생성 확인
    await expect(this.page.getByText(scriptName).first()).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
  }

  /**
   * 스크립트 선택
   * @param {string} scriptName - 스크립트 이름
   */
  async selectScript(scriptName) {
    await this.page.getByText(scriptName).first().click();
    // 메인 콘텐츠에 스크립트 이름이 표시될 때까지 대기
    await expect(this.selectors.scriptTitle).toContainText(scriptName, { timeout: TIMEOUTS.DEFAULT });
  }

  /**
   * 스크립트 컨텍스트 메뉴 열기
   * @param {string} scriptName - 스크립트 이름
   */
  async openScriptContextMenu(scriptName) {
    await this.page.getByText(scriptName).first().click({ button: 'right' });
  }

  /**
   * 스크립트 이름 변경
   * @param {string} oldName - 현재 스크립트 이름
   * @param {string} newName - 새 스크립트 이름
   */
  async renameScript(oldName, newName) {
    await this.openScriptContextMenu(oldName);
    await this.selectors.renameScriptMenuItem.click();
    await expect(this.selectors.renameScriptModalTitle).toBeVisible();
    await this.selectors.newScriptNameInput.fill(newName);
    await this.selectors.renameButton.click();
    await expect(this.page.getByText(newName).first()).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
  }

  /**
   * 스크립트 삭제
   * @param {string} scriptName - 삭제할 스크립트 이름
   */
  async deleteScript(scriptName) {
    await this.openScriptContextMenu(scriptName);
    await this.selectors.deleteScriptMenuItem.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * 스크립트 타입 배지 확인
   * @param {string} scriptName - 스크립트 이름
   * @param {string} expectedType - 예상 타입 ('PLA', 'CYP', 'SEL')
   */
  async verifyScriptTypeBadge(scriptName, expectedType) {
    const scriptRow = this.page.locator('.ml-8.px-2\\.5').filter({ hasText: scriptName });
    const badge = scriptRow.locator('span.rounded.text-xs');
    await expect(badge).toContainText(expectedType);
  }

  // ==================== 검색 관련 메서드 ====================

  /**
   * 검색어 입력
   * @param {string} searchQuery - 검색어
   */
  async search(searchQuery) {
    await this.searchInput.fill(searchQuery);
    // 검색 결과 반영 대기
    await this.page.waitForTimeout(300);
  }

  /**
   * 검색어 초기화
   */
  async clearSearch() {
    await this.searchInput.fill('');
    await this.page.waitForTimeout(300);
  }

  /**
   * 검색 결과 없음 메시지 확인
   * @param {string} searchQuery - 검색어
   */
  async verifyNoSearchResults(searchQuery) {
    await expect(this.page.getByText(`No results found for "${searchQuery}"`)).toBeVisible();
  }

  // ==================== 파일 업로드 메서드 ====================

  /**
   * 업로드 영역이 표시되는지 확인
   */
  async verifyUploadAreaVisible() {
    await expect(this.selectors.uploadDropzone).toBeVisible();
  }

  /**
   * 파일 업로드 (단일)
   * @param {string} filePath - 업로드할 파일 경로
   */
  async uploadFile(filePath) {
    await this.selectors.fileInput.setInputFiles(filePath);
    // 업로드 완료 대기
    await this.page.waitForTimeout(1000);
  }

  /**
   * 파일 업로드 (다중)
   * @param {string[]} filePaths - 업로드할 파일 경로 배열
   */
  async uploadFiles(filePaths) {
    await this.selectors.fileInput.setInputFiles(filePaths);
    // 업로드 완료 대기
    await this.page.waitForTimeout(2000);
  }

  /**
   * 업로드된 파일 목록에서 파일 존재 확인
   * @param {string} fileName - 파일 이름
   */
  async verifyFileUploaded(fileName) {
    await expect(this.selectors.uploadedFilesTitle).toBeVisible();
    await expect(this.page.getByText(fileName).first()).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
  }

  /**
   * 파일 상태 확인
   * @param {string} fileName - 파일 이름
   * @param {string} expectedStatus - 예상 상태 ('UPLOADED', 'RUNNING', 'COMPLETED', 'FAILED')
   */
  async verifyFileStatus(fileName, expectedStatus) {
    const fileRow = this.page.locator('.flex.items-center.justify-between').filter({ hasText: fileName });
    const statusBadge = fileRow.locator('.rounded-full');
    await expect(statusBadge).toContainText(expectedStatus);
  }

  /**
   * 파일 상태가 될 때까지 대기
   * @param {string} fileName - 파일 이름
   * @param {string} expectedStatus - 예상 상태
   * @param {number} [timeout=60000] - 대기 시간 (밀리초)
   */
  async waitForFileStatus(fileName, expectedStatus, timeout = 60000) {
    const fileRow = this.page.locator('.flex.items-center.justify-between').filter({ hasText: fileName });
    const statusBadge = fileRow.locator('.rounded-full');
    await expect(statusBadge).toContainText(expectedStatus, { timeout });
  }

  /**
   * 파일 삭제
   * @param {string} fileName - 삭제할 파일 이름
   */
  async deleteFile(fileName) {
    const fileRow = this.page.locator('.flex.items-center.justify-between').filter({ hasText: fileName });
    const deleteButton = fileRow.locator('button').filter({ has: this.page.locator('svg') }).last();
    await deleteButton.click();
    // confirm 대화상자 처리
    this.page.on('dialog', async dialog => {
      await dialog.accept();
    });
    await this.page.waitForTimeout(500);
  }

  /**
   * 업로드된 파일 개수 확인
   * @returns {Promise<number>}
   */
  async getUploadedFileCount() {
    const files = this.page.locator('.flex.items-center.justify-between.py-3');
    return await files.count();
  }

  // ==================== 파일 실행 메서드 ====================

  /**
   * 개별 파일 실행
   * @param {string} fileName - 실행할 파일 이름
   */
  async runFile(fileName) {
    const fileRow = this.page.locator('.flex.items-center.justify-between').filter({ hasText: fileName });
    const runButton = fileRow.getByRole('button', { name: 'Run' });
    await runButton.click();
  }

  /**
   * 개별 파일 중지
   * @param {string} fileName - 중지할 파일 이름
   */
  async stopFile(fileName) {
    const fileRow = this.page.locator('.flex.items-center.justify-between').filter({ hasText: fileName });
    const stopButton = fileRow.getByRole('button', { name: 'Stop' });
    await stopButton.click();
  }

  /**
   * Run All 버튼 클릭
   */
  async clickRunAll() {
    await this.runAllButton.click();
  }

  /**
   * Stop All 버튼 클릭
   */
  async clickStopAll() {
    await this.stopAllButton.click();
  }

  /**
   * 파일이 실행 중인지 확인 (스피너 표시)
   * @param {string} fileName - 파일 이름
   * @returns {Promise<boolean>}
   */
  async isFileRunning(fileName) {
    const fileRow = this.page.locator('.flex.items-center.justify-between').filter({ hasText: fileName });
    const spinner = fileRow.locator('svg.animate-spin');
    return await spinner.isVisible();
  }

  /**
   * Stop 버튼이 표시되는지 확인
   * @param {string} fileName - 파일 이름
   * @returns {Promise<boolean>}
   */
  async isStopButtonVisible(fileName) {
    const fileRow = this.page.locator('.flex.items-center.justify-between').filter({ hasText: fileName });
    const stopButton = fileRow.getByRole('button', { name: 'Stop' });
    return await stopButton.isVisible();
  }

  /**
   * Results 버튼이 표시되는지 확인
   * @param {string} fileName - 파일 이름
   * @returns {Promise<boolean>}
   */
  async isResultsButtonVisible(fileName) {
    const fileRow = this.page.locator('.flex.items-center.justify-between').filter({ hasText: fileName });
    const resultsButton = fileRow.getByRole('button', { name: 'Results' });
    return await resultsButton.isVisible();
  }

  /**
   * Refresh 버튼 클릭
   */
  async clickRefresh() {
    await this.selectors.refreshButton.click();
    await this.page.waitForTimeout(500);
  }

  // ==================== 결과 모달 메서드 ====================

  /**
   * Results 모달 열기
   * @param {string} fileName - 파일 이름
   */
  async openResultsModal(fileName) {
    const fileRow = this.page.locator('.flex.items-center.justify-between').filter({ hasText: fileName });
    const resultsButton = fileRow.getByRole('button', { name: 'Results' });
    await resultsButton.click();
    await expect(this.selectors.resultsModalTitle).toBeVisible();
  }

  /**
   * Results 모달 닫기
   */
  async closeResultsModal() {
    // 모달 외부 클릭 또는 X 버튼 클릭
    await this.page.locator('.fixed.inset-0.bg-black').click({ position: { x: 10, y: 10 } });
  }

  /**
   * Results 모달에서 파일 이름 확인
   * @param {string} fileName - 예상 파일 이름
   */
  async verifyResultsModalFileName(fileName) {
    await expect(this.selectors.resultsModalTitle).toContainText(fileName);
  }

  /**
   * Results 모달에서 테스트 통계 가져오기
   * @returns {Promise<{passed: number, failed: number, skipped: number, duration: string}>}
   */
  async getTestStats() {
    const modal = this.page.locator('.fixed.inset-0 .bg-white.rounded-lg');

    const passedText = await modal.locator('text=Passed:').locator('xpath=following-sibling::span').first().textContent();
    const failedText = await modal.locator('text=Failed:').locator('xpath=following-sibling::span').first().textContent();
    const skippedText = await modal.locator('text=Skipped:').locator('xpath=following-sibling::span').first().textContent();
    const durationText = await modal.locator('text=Duration:').locator('xpath=following-sibling::span').first().textContent();

    return {
      passed: parseInt(passedText || '0'),
      failed: parseInt(failedText || '0'),
      skipped: parseInt(skippedText || '0'),
      duration: durationText || 'N/A',
    };
  }

  /**
   * Results 모달에서 Raw Output 확인
   */
  async verifyRawOutputVisible() {
    const modal = this.page.locator('.fixed.inset-0 .bg-white.rounded-lg');
    await expect(modal.locator('text=Raw Output:')).toBeVisible();
    await expect(modal.locator('pre')).toBeVisible();
  }

  /**
   * Results 모달에서 실행 관련 정보 확인 (Duration)
   * 현재 UI에는 "Executed at:" 필드가 없고 "Duration:" 필드가 있음
   */
  async verifyExecutionTimeVisible() {
    const modal = this.page.locator('.fixed.inset-0 .bg-white.rounded-lg');
    // 실행 시간 정보는 Duration 필드로 확인
    await expect(modal.getByText(/Duration:/)).toBeVisible();
  }

  // ==================== 유틸리티 메서드 ====================

  /**
   * 잠시 대기
   * @param {number} [ms=TIMEOUTS.SHORT] - 대기 시간 (밀리초)
   */
  async wait(ms = TIMEOUTS.SHORT) {
    await this.page.waitForTimeout(ms);
  }

  /**
   * 스크립트가 선택되지 않은 상태 확인
   */
  async verifyNoScriptSelected() {
    await expect(this.selectors.noScriptSelected).toBeVisible();
  }

  /**
   * 스크립트 헤더에 이름이 표시되는지 확인
   * @param {string} scriptName - 스크립트 이름
   */
  async verifyScriptHeader(scriptName) {
    await expect(this.selectors.scriptTitle).toContainText(scriptName);
  }
}

module.exports = UiTestingPage;
