/**
 * API Testing Page Object Model
 *
 * API Testing 페이지의 셀렉터와 액션을 정의합니다.
 * Page Object Model 패턴을 사용하여 테스트 코드의 재사용성과 유지보수성을 높입니다.
 */

const { expect } = require('@playwright/test');
const { TIMEOUTS } = require('../fixtures/test-data');

/**
 * API Testing 페이지 Page Object
 */
class ApiTestingPage {
  /**
   * ApiTestingPage 생성자
   * @param {import('@playwright/test').Page} page - Playwright Page 객체
   */
  constructor(page) {
    this.page = page;

    // 셀렉터 정의 - 실제 UI 구조 기반
    this.selectors = {
      // 네비게이션
      /** API Testing 네비게이션 버튼 */
      apiTestingNavButton: page.getByRole('button', { name: 'API Testing' }),

      // 사이드바
      /** 폴더 생성 버튼 */
      createFolderButton: page.getByRole('button', { name: '+ Create Folder' }),
      /** 검색 입력 필드 */
      searchInput: page.getByPlaceholder('Search items...'),
      /** 사이드바 접기 버튼 */
      collapseSidebarButton: page.getByRole('button', { name: 'Collapse Sidebar' }),
      /** 모두 펼치기 버튼 */
      expandAllButton: page.getByRole('button', { name: 'Expand All' }),
      /** 모두 접기 버튼 */
      collapseAllButton: page.getByRole('button', { name: 'Collapse All' }),

      // 폴더 관리 모달
      /** 폴더 생성 모달 제목 */
      createFolderModalTitle: page.getByRole('heading', { name: 'Create New Folder' }),
      /** 폴더 이름 입력 필드 */
      folderNameInput: page.getByPlaceholder('Enter folder name...'),
      /** 폴더 생성 확인 버튼 */
      createButton: page.getByRole('button', { name: 'Create', exact: true }),

      // HTTP 요청 설정
      /** HTTP 메서드 선택 드롭다운 (combobox role) */
      methodSelect: page.getByRole('combobox'),
      /** URL 입력 필드 */
      urlInput: page.getByPlaceholder('https://api.example.com/endpoint'),
      /** Send 버튼 */
      sendButton: page.getByRole('button', { name: 'Send' }),
      /** Save 버튼 */
      saveButton: page.getByRole('button', { name: 'Save' }),
      /** Reset 버튼 */
      resetButton: page.getByRole('button', { name: 'Reset' }),

      // Request 탭
      /** Params 탭 */
      paramsTab: page.getByRole('button', { name: 'Params' }),
      /** Headers 탭 */
      headersTab: page.getByRole('button', { name: 'Headers' }),
      /** Body 탭 */
      bodyTab: page.getByRole('button', { name: 'Body' }),
      /** cURL 탭 */
      curlTab: page.getByRole('button', { name: 'cURL' }),
      /** Response Validation 탭 */
      responseValidationTab: page.getByRole('button', { name: 'Response Validation' }),

      // Params 테이블
      /** Params 체크박스 - 파라미터 활성화/비활성화 */
      paramCheckbox: page.getByRole('checkbox'),
      /** Params description 입력 필드 */
      paramDescription: page.getByPlaceholder('description'),
      /** Params key 입력 필드 */
      paramKey: page.getByPlaceholder('key'),
      /** Params value 입력 필드 */
      paramValue: page.getByPlaceholder('value'),
      /** 파라미터 추가 버튼 */
      addParameterButton: page.getByRole('button', { name: 'Add Parameter' }),
      /** 파라미터 삭제 버튼 */
      deleteParamButton: page.getByRole('button', { name: '×' }),

      // 응답 영역
      /** Response 섹션 헤딩 */
      responseHeading: page.getByRole('heading', { name: 'Response' }),
      /** 응답 없음 기본 메시지 */
      noResponseText: page.getByText('요청을 시작할 수 있습니다'),
      /** 응답 시간 표시 (정규식 패턴: "Time: 123ms") */
      responseTime: page.locator('text=/Time:\\s*\\d+ms/'),
      /** 응답 크기 표시 */
      responseSize: page.locator('text=/Size:/'),
      /** 성공 상태 표시 (2xx 응답) - 초록색 배지 */
      successStatus: page.locator('span.bg-green-100.text-green-800'),
      /** 에러 상태 표시 (4xx/5xx 응답) - 빨간색 배지 */
      errorStatus: page.locator('span.bg-red-100.text-red-800'),
    };
  }

  // ==================== Getter 메서드 ====================

  /**
   * API Testing 네비게이션 버튼 반환
   * @returns {import('@playwright/test').Locator}
   */
  get apiTestingNavButton() {
    return this.selectors.apiTestingNavButton;
  }

  /**
   * 사이드바 컨테이너 반환
   * @returns {import('@playwright/test').Locator}
   */
  get sidebar() {
    return this.getSidebar();
  }

  /**
   * 폴더 생성 버튼 반환
   * @returns {import('@playwright/test').Locator}
   */
  get createFolderButton() {
    return this.selectors.createFolderButton;
  }

  /**
   * HTTP 메서드 선택 드롭다운 반환
   * @returns {import('@playwright/test').Locator}
   */
  get methodSelect() {
    return this.selectors.methodSelect;
  }

  /**
   * URL 입력 필드 반환
   * @returns {import('@playwright/test').Locator}
   */
  get urlInput() {
    return this.selectors.urlInput;
  }

  /**
   * Send 버튼 반환
   * @returns {import('@playwright/test').Locator}
   */
  get sendButton() {
    return this.selectors.sendButton;
  }

  /**
   * Reset 버튼 반환
   * @returns {import('@playwright/test').Locator}
   */
  get resetButton() {
    return this.selectors.resetButton;
  }

  /**
   * Save 버튼 반환
   * @returns {import('@playwright/test').Locator}
   */
  get saveButton() {
    return this.selectors.saveButton;
  }

  /**
   * 검색 입력 필드 반환
   * @returns {import('@playwright/test').Locator}
   */
  get searchInput() {
    return this.selectors.searchInput;
  }

  // ==================== 페이지 상태 확인 메서드 ====================

  /**
   * API Testing 페이지 로드 확인 (로그인 후)
   * @param {number} [timeout=TIMEOUTS.LOGIN] - 대기 시간 (밀리초)
   */
  async waitForPageLoad(timeout = TIMEOUTS.LOGIN) {
    await expect(this.apiTestingNavButton).toBeVisible({ timeout });
  }

  /**
   * 응답 수신 확인
   * @param {number} [timeout=TIMEOUTS.API_RESPONSE] - 대기 시간 (밀리초)
   */
  async waitForResponse(timeout = TIMEOUTS.API_RESPONSE) {
    await expect(this.selectors.responseTime).toBeVisible({ timeout });
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
    // 폴더 생성 확인 (첫 번째 매칭 요소)
    await expect(this.page.getByText(folderName).first()).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
  }

  /**
   * 폴더 존재 여부 확인
   * @param {string} folderName - 확인할 폴더 이름
   * @param {number} [timeout=TIMEOUTS.DEFAULT] - 대기 시간 (밀리초)
   */
  async verifyFolderExists(folderName, timeout = TIMEOUTS.DEFAULT) {
    await expect(this.page.getByText(folderName).first()).toBeVisible({ timeout });
  }

  // ==================== HTTP 메서드 관련 메서드 ====================

  /**
   * HTTP 메서드 선택
   * @param {string} method - HTTP 메서드 (GET, POST, PUT, DELETE, PATCH)
   */
  async selectMethod(method) {
    await this.methodSelect.selectOption(method);
  }

  /**
   * 선택된 HTTP 메서드 확인
   * @param {string} expectedMethod - 예상되는 HTTP 메서드
   */
  async verifySelectedMethod(expectedMethod) {
    await expect(this.methodSelect).toHaveValue(expectedMethod);
  }

  /**
   * HTTP 메서드 변경 및 확인
   * @param {string} method - 변경할 HTTP 메서드
   */
  async changeMethodAndVerify(method) {
    await this.selectMethod(method);
    await this.verifySelectedMethod(method);
  }

  // ==================== URL 및 요청 관련 메서드 ====================

  /**
   * URL 입력
   * @param {string} url - 요청 URL
   */
  async fillUrl(url) {
    await this.urlInput.fill(url);
  }

  /**
   * URL 값 확인
   * @param {string} expectedUrl - 예상되는 URL
   */
  async verifyUrl(expectedUrl) {
    await expect(this.urlInput).toHaveValue(expectedUrl);
  }

  /**
   * Send 버튼 클릭
   */
  async clickSend() {
    await this.sendButton.click();
  }

  /**
   * Reset 버튼 클릭
   */
  async clickReset() {
    await this.resetButton.click();
  }

  /**
   * API 요청 전송 및 응답 대기
   * @param {string} url - 요청 URL
   * @param {string} [method='GET'] - HTTP 메서드
   */
  async sendRequest(url, method = 'GET') {
    await this.selectMethod(method);
    await this.fillUrl(url);
    await this.clickSend();
    await this.waitForResponse();
  }

  // ==================== 탭 관련 메서드 ====================

  /**
   * Request 탭 클릭
   * @param {string} tabName - 탭 이름 (Params, Headers, Body, cURL, Response Validation)
   */
  async clickRequestTab(tabName) {
    const tabMap = {
      'Params': this.selectors.paramsTab,
      'Headers': this.selectors.headersTab,
      'Body': this.selectors.bodyTab,
      'cURL': this.selectors.curlTab,
      'Response Validation': this.selectors.responseValidationTab,
    };

    const tab = tabMap[tabName];
    if (!tab) {
      throw new Error(`Unknown tab: ${tabName}`);
    }
    await tab.click();
  }

  /**
   * Params 탭 클릭
   */
  async clickParamsTab() {
    await this.selectors.paramsTab.click();
  }

  /**
   * Headers 탭 클릭
   */
  async clickHeadersTab() {
    await this.selectors.headersTab.click();
  }

  /**
   * Body 탭 클릭
   */
  async clickBodyTab() {
    await this.selectors.bodyTab.click();
  }

  /**
   * cURL 탭 클릭
   */
  async clickCurlTab() {
    await this.selectors.curlTab.click();
  }

  /**
   * Response Validation 탭 클릭
   */
  async clickResponseValidationTab() {
    await this.selectors.responseValidationTab.click();
  }

  /**
   * cURL 미리보기 텍스트 반환
   * cURL 탭의 pre 태그 내용을 반환
   * @returns {import('@playwright/test').Locator}
   */
  getCurlPreview() {
    return this.page.locator('pre').filter({ hasText: 'curl' });
  }

  /**
   * cURL 미리보기 텍스트 값 가져오기
   * @returns {Promise<string>}
   */
  async getCurlPreviewText() {
    const curlElement = this.getCurlPreview();
    return await curlElement.textContent();
  }

  // ==================== Params 관련 메서드 ====================

  /**
   * 파라미터 추가 버튼 클릭
   */
  async clickAddParameter() {
    await this.selectors.addParameterButton.click();
  }

  /**
   * 파라미터 입력 (key-value)
   * @param {number} index - 파라미터 인덱스 (0부터 시작)
   * @param {string} key - 파라미터 키
   * @param {string} value - 파라미터 값
   * @param {string} [description] - 파라미터 설명 (선택)
   */
  async fillParameter(index, key, value, description = '') {
    const keyInputs = this.selectors.paramKey;
    const valueInputs = this.selectors.paramValue;

    await keyInputs.nth(index).fill(key);
    await valueInputs.nth(index).fill(value);

    if (description) {
      const descInputs = this.selectors.paramDescription;
      await descInputs.nth(index).fill(description);
    }
  }

  /**
   * 파라미터 체크박스 토글
   * @param {number} index - 파라미터 인덱스 (0부터 시작)
   */
  async toggleParameterCheckbox(index) {
    await this.selectors.paramCheckbox.nth(index).click();
  }

  /**
   * 파라미터 삭제 (x 버튼 클릭)
   * @param {number} index - 삭제할 파라미터 인덱스 (0부터 시작)
   */
  async deleteParameter(index) {
    await this.selectors.deleteParamButton.nth(index).click();
  }

  // ==================== 검색 관련 메서드 ====================

  /**
   * 검색어 입력
   * @param {string} searchQuery - 검색어
   */
  async search(searchQuery) {
    await this.searchInput.fill(searchQuery);
  }

  /**
   * 검색어 초기화
   */
  async clearSearch() {
    await this.searchInput.fill('');
  }

  // ==================== 사이드바 관련 메서드 ====================

  /**
   * 사이드바 컨테이너 반환
   * Create Folder 버튼이 포함된 사이드바 영역
   * @returns {import('@playwright/test').Locator}
   */
  getSidebar() {
    // Create Folder 버튼의 상위 컨테이너를 사이드바로 사용
    return this.selectors.createFolderButton.locator('xpath=ancestor::div[contains(@class, "border-r")]').first();
  }

  /**
   * 폴더 목록 반환 (모든 폴더 항목)
   * 폴더는 화살표 아이콘(▶ 또는 ▼)을 포함하는 요소들
   * @returns {import('@playwright/test').Locator}
   */
  getFolderList() {
    // 폴더 아이콘이 있는 클릭 가능한 요소들
    return this.page.locator('[class*="cursor-pointer"]').filter({ hasText: /^[▶▼]/ });
  }

  /**
   * API 아이템 목록 반환 (폴더 하위 항목)
   * @returns {import('@playwright/test').Locator}
   */
  getItemList() {
    // HTTP 메서드 배지가 있는 아이템들 (GET, POST 등)
    return this.page.locator('[class*="ml-"]').filter({ hasText: /^(GET|POST|PUT|DELETE|PATCH)/ });
  }

  /**
   * 특정 폴더 클릭 (이름으로 찾기)
   * @param {string} folderName - 클릭할 폴더 이름
   */
  async clickFolder(folderName) {
    await this.page.getByText(folderName, { exact: false }).first().click();
  }

  /**
   * 특정 API 아이템 클릭 (이름으로 찾기)
   * @param {string} itemName - 클릭할 API 아이템 이름
   */
  async clickApiItem(itemName) {
    await this.page.getByText(itemName, { exact: false }).first().click();
  }

  /**
   * Expand All 버튼 클릭
   */
  async clickExpandAll() {
    await this.selectors.expandAllButton.click();
  }

  /**
   * Collapse All 버튼 클릭
   */
  async clickCollapseAll() {
    await this.selectors.collapseAllButton.click();
  }

  /**
   * 사이드바 접기/펼치기
   */
  async toggleSidebar() {
    await this.selectors.collapseSidebarButton.click();
  }

  // ==================== 응답 관련 메서드 ====================

  /**
   * 응답 시간 텍스트 반환
   * @returns {import('@playwright/test').Locator}
   */
  getResponseTime() {
    return this.selectors.responseTime;
  }

  /**
   * 응답 크기 텍스트 반환
   * @returns {import('@playwright/test').Locator}
   */
  getResponseSize() {
    return this.selectors.responseSize;
  }

  /**
   * 성공 상태 배지 반환 (2xx 응답)
   * @returns {import('@playwright/test').Locator}
   */
  getSuccessStatus() {
    return this.selectors.successStatus;
  }

  /**
   * 에러 상태 배지 반환 (4xx/5xx 응답)
   * @returns {import('@playwright/test').Locator}
   */
  getErrorStatus() {
    return this.selectors.errorStatus;
  }

  /**
   * 응답이 성공인지 확인
   * @param {number} [timeout=TIMEOUTS.API_RESPONSE] - 대기 시간 (밀리초)
   */
  async verifySuccessResponse(timeout = TIMEOUTS.API_RESPONSE) {
    await expect(this.selectors.successStatus).toBeVisible({ timeout });
  }

  /**
   * 응답이 에러인지 확인
   * @param {number} [timeout=TIMEOUTS.API_RESPONSE] - 대기 시간 (밀리초)
   */
  async verifyErrorResponse(timeout = TIMEOUTS.API_RESPONSE) {
    await expect(this.selectors.errorStatus).toBeVisible({ timeout });
  }

  /**
   * Response 섹션 헤딩 반환
   * @returns {import('@playwright/test').Locator}
   */
  getResponseHeading() {
    return this.selectors.responseHeading;
  }

  /**
   * 응답 없음 상태 확인
   * @param {number} [timeout=TIMEOUTS.DEFAULT] - 대기 시간 (밀리초)
   */
  async verifyNoResponse(timeout = TIMEOUTS.DEFAULT) {
    await expect(this.selectors.noResponseText).toBeVisible({ timeout });
  }

  // ==================== Save/Reset 관련 메서드 ====================

  /**
   * Save 버튼 클릭
   */
  async clickSave() {
    await this.selectors.saveButton.click();
  }

  // ==================== 유틸리티 메서드 ====================

  /**
   * 잠시 대기
   * @param {number} [ms=TIMEOUTS.SHORT] - 대기 시간 (밀리초)
   */
  async wait(ms = TIMEOUTS.SHORT) {
    await this.page.waitForTimeout(ms);
  }
}

module.exports = ApiTestingPage;
