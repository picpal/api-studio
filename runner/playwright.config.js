/**
 * Playwright Configuration
 *
 * E2E 테스트를 위한 Playwright 설정 파일입니다.
 *
 * @see https://playwright.dev/docs/test-configuration
 */

/** @type {import('@playwright/test').PlaywrightTestConfig} */
module.exports = {
  /**
   * 테스트 디렉토리
   * e2e 디렉토리 내의 모든 테스트 파일을 대상으로 합니다.
   */
  testDir: './e2e',

  /**
   * 테스트 파일 패턴
   * .spec.js 또는 .test.js 파일을 테스트 파일로 인식합니다.
   */
  testMatch: ['**/*.spec.js', '**/*.test.js'],

  /**
   * 전역 타임아웃
   * 각 테스트의 최대 실행 시간 (밀리초)
   */
  timeout: 60000,

  /**
   * expect 타임아웃
   * expect 단언문의 최대 대기 시간 (밀리초)
   */
  expect: {
    timeout: 10000,
  },

  /**
   * 테스트 실패 시 재시도 횟수
   * CI 환경에서는 2회, 로컬에서는 0회
   */
  retries: process.env.CI ? 2 : 0,

  /**
   * 병렬 실행 워커 수
   * CI 환경에서는 1개, 로컬에서는 CPU 코어 수의 50%
   */
  workers: process.env.CI ? 1 : undefined,

  /**
   * 리포터 설정
   * CI 환경에서는 dot, 로컬에서는 list 리포터 사용
   * HTML 리포터도 항상 생성
   */
  reporter: [
    [process.env.CI ? 'dot' : 'list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],

  /**
   * 출력 디렉토리
   * 테스트 아티팩트 (스크린샷, 비디오 등) 저장 위치
   */
  outputDir: 'test-results',

  /**
   * 공통 브라우저 설정
   */
  use: {
    /**
     * 헤드리스 모드
     * CI 환경에서는 true, 로컬에서는 환경변수로 제어 가능
     */
    headless: process.env.HEADLESS !== 'false',

    /**
     * 기본 URL
     * page.goto('/')와 같이 상대 경로 사용 시 적용
     */
    baseURL: 'http://localhost:3001',

    /**
     * 뷰포트 크기
     */
    viewport: { width: 1280, height: 720 },

    /**
     * 액션 타임아웃
     * 클릭, 입력 등의 액션 최대 대기 시간
     */
    actionTimeout: 15000,

    /**
     * 네비게이션 타임아웃
     * 페이지 이동 최대 대기 시간
     */
    navigationTimeout: 30000,

    /**
     * 스크린샷 설정
     * 테스트 실패 시에만 스크린샷 저장
     */
    screenshot: 'only-on-failure',

    /**
     * 비디오 설정
     * 첫 번째 재시도 시에만 비디오 녹화
     */
    video: 'on-first-retry',

    /**
     * 트레이스 설정
     * 첫 번째 재시도 시에만 트레이스 기록
     */
    trace: 'on-first-retry',

    /**
     * 브라우저 로케일
     */
    locale: 'ko-KR',

    /**
     * 타임존
     */
    timezoneId: 'Asia/Seoul',

    /**
     * HTTPS 오류 무시
     */
    ignoreHTTPSErrors: true,
  },

  /**
   * 프로젝트 설정
   * 여러 브라우저에서 테스트 실행 가능
   */
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
      },
    },
    // 필요 시 다른 브라우저 추가
    // {
    //   name: 'firefox',
    //   use: {
    //     browserName: 'firefox',
    //   },
    // },
    // {
    //   name: 'webkit',
    //   use: {
    //     browserName: 'webkit',
    //   },
    // },
  ],

  /**
   * 웹 서버 설정 (선택사항)
   * 테스트 실행 전 개발 서버 자동 시작
   * 주석 해제하여 사용
   */
  // webServer: {
  //   command: 'npm run dev',
  //   port: 3001,
  //   timeout: 120000,
  //   reuseExistingServer: !process.env.CI,
  // },

  /**
   * 전역 설정 파일 (선택사항)
   * 테스트 실행 전후 전역 설정/정리 수행
   */
  // globalSetup: './e2e/global-setup.js',
  // globalTeardown: './e2e/global-teardown.js',
};
