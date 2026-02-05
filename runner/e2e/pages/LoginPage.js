/**
 * Login Page Object Model
 *
 * 로그인 페이지의 셀렉터와 액션을 정의합니다.
 * Page Object Model 패턴을 사용하여 테스트 코드의 재사용성과 유지보수성을 높입니다.
 */

const { expect } = require('@playwright/test');
const { TIMEOUTS } = require('../fixtures/test-data');

/**
 * 로그인 페이지 Page Object
 */
class LoginPage {
  /**
   * LoginPage 생성자
   * @param {import('@playwright/test').Page} page - Playwright Page 객체
   */
  constructor(page) {
    this.page = page;

    // 셀렉터 정의
    this.selectors = {
      /** 페이지 제목 */
      heading: page.getByRole('heading', { name: 'Verification Page' }),
      /** 이메일 입력 필드 */
      emailInput: page.getByRole('textbox', { name: '이메일' }),
      /** 비밀번호 입력 필드 */
      passwordInput: page.getByRole('textbox', { name: '비밀번호' }),
      /** 로그인 버튼 */
      loginButton: page.getByRole('button', { name: '로그인' }),
    };
  }

  /**
   * 페이지 제목 요소 반환
   * @returns {import('@playwright/test').Locator}
   */
  get heading() {
    return this.selectors.heading;
  }

  /**
   * 이메일 입력 필드 반환
   * @returns {import('@playwright/test').Locator}
   */
  get emailInput() {
    return this.selectors.emailInput;
  }

  /**
   * 비밀번호 입력 필드 반환
   * @returns {import('@playwright/test').Locator}
   */
  get passwordInput() {
    return this.selectors.passwordInput;
  }

  /**
   * 로그인 버튼 반환
   * @returns {import('@playwright/test').Locator}
   */
  get loginButton() {
    return this.selectors.loginButton;
  }

  /**
   * 로그인 페이지로 이동
   * @param {string} baseUrl - 기본 URL
   */
  async goto(baseUrl) {
    await this.page.goto(baseUrl);
  }

  /**
   * 로그인 페이지 로드 확인
   * @param {number} [timeout=TIMEOUTS.DEFAULT] - 대기 시간 (밀리초)
   */
  async waitForPageLoad(timeout = TIMEOUTS.DEFAULT) {
    await expect(this.heading).toBeVisible({ timeout });
  }

  /**
   * 이메일 입력
   * @param {string} email - 이메일 주소
   */
  async fillEmail(email) {
    await this.emailInput.fill(email);
  }

  /**
   * 비밀번호 입력
   * @param {string} password - 비밀번호
   */
  async fillPassword(password) {
    await this.passwordInput.fill(password);
  }

  /**
   * 로그인 버튼 클릭
   */
  async clickLogin() {
    await this.loginButton.click();
  }

  /**
   * 로그인 수행 (이메일, 비밀번호 입력 후 로그인 버튼 클릭)
   * @param {string} email - 이메일 주소
   * @param {string} password - 비밀번호
   */
  async login(email, password) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickLogin();
  }

  /**
   * 전체 로그인 플로우 수행 (페이지 이동 + 로그인)
   * @param {string} baseUrl - 기본 URL
   * @param {string} email - 이메일 주소
   * @param {string} password - 비밀번호
   */
  async performLogin(baseUrl, email, password) {
    await this.goto(baseUrl);
    await this.waitForPageLoad();
    await this.login(email, password);
  }
}

module.exports = LoginPage;
