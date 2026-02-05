# Plan: API Testing E2E Test Refactoring

## Meta
- Created: 2026-02-03T09:30:00+09:00
- Author: Interviewer
- Status: draft

## Summary
API Testing 페이지의 E2E 테스트를 기능별로 분리하고, 체계적인 디렉토리 구조로 재구성합니다. 기존 단일 파일(363줄)을 9개의 기능별 테스트 파일로 분리하여 유지보수성과 테스트 커버리지를 향상시킵니다.

## Goals
1. 테스트 파일을 기능별로 분리하여 유지보수성 향상
2. 공통 유틸리티 및 Page Object Model 도입
3. 전체 API Testing 페이지에 대한 포괄적 테스트 커버리지 달성
4. 병렬 실행 가능한 테스트 구조 설계

## Scope

### In Scope
- 테스트 디렉토리 구조 재설계
- 기능별 테스트 파일 생성 (9개 기능)
- 공통 유틸리티 및 fixtures 분리
- Page Object Model (POM) 패턴 도입
- Playwright 설정 파일 개선

### Out of Scope
- 다른 페이지(UI Testing, Pipeline 등) E2E 테스트
- CI/CD 파이프라인 설정
- 성능 테스트, 부하 테스트

## Technical Approach

### 1. 디렉토리 구조 재설계

```
runner/
├── e2e/
│   ├── api-testing/              # API Testing 페이지 테스트
│   │   ├── auth.spec.js          # 인증 테스트
│   │   ├── sidebar-folder.spec.js     # 사이드바 폴더 관리
│   │   ├── sidebar-item.spec.js       # 사이드바 아이템 관리
│   │   ├── search.spec.js             # 검색 기능
│   │   ├── http-request.spec.js       # HTTP 요청 구성
│   │   ├── request-tabs.spec.js       # Request 탭 (Params, Headers, Body, cURL)
│   │   ├── api-execution.spec.js      # API 실행 및 응답
│   │   ├── save-reset.spec.js         # 저장/리셋 기능
│   │   └── template-variables.spec.js # 템플릿 변수 모달
│   │
│   ├── fixtures/                 # 테스트 fixtures
│   │   ├── test-data.js          # 테스트 데이터
│   │   └── api-endpoints.js      # 테스트용 API 엔드포인트
│   │
│   ├── pages/                    # Page Object Models
│   │   ├── login.page.js         # 로그인 페이지 객체
│   │   ├── api-testing.page.js   # API Testing 페이지 객체
│   │   └── sidebar.page.js       # 사이드바 페이지 객체
│   │
│   └── utils/                    # 공통 유틸리티
│       ├── auth.js               # 인증 헬퍼
│       ├── test-helpers.js       # 테스트 헬퍼 함수
│       └── constants.js          # 상수 정의
│
├── playwright.config.js          # Playwright 설정 (개선)
└── package.json
```

### 2. Page Object Model 패턴

각 페이지의 요소와 동작을 캡슐화하여 테스트 코드의 중복을 제거하고 유지보수성을 향상시킵니다.

### 3. 테스트 실행 전략

- 독립적인 테스트: 각 테스트는 독립적으로 실행 가능
- 병렬 실행: 기능별 테스트 파일은 병렬로 실행 가능
- 순차 의존성: auth.spec.js는 다른 테스트의 전제 조건

## TODO List

### Feature: Test Infrastructure (group: infra)
<!-- 다른 모든 그룹의 전제 조건 -->

- [ ] [TEST] Playwright 설정 파일 검증 테스트
  - Files: `runner/e2e/utils/config.spec.js`
  - Acceptance: 설정 파일이 올바르게 로드되는지 확인

- [ ] [IMPL] 테스트 디렉토리 구조 생성
  - Files: `runner/e2e/`, `runner/e2e/api-testing/`, `runner/e2e/fixtures/`, `runner/e2e/pages/`, `runner/e2e/utils/`
  - Dependencies: None

- [ ] [IMPL] 상수 및 설정 파일 작성
  - Files: `runner/e2e/utils/constants.js`
  - Dependencies: 디렉토리 구조

- [ ] [IMPL] Playwright 설정 개선
  - Files: `runner/playwright.config.js`
  - Dependencies: 디렉토리 구조

### Feature: Common Utilities (group: utils, dependsOn: [infra])

- [ ] [TEST] 인증 헬퍼 함수 테스트
  - Files: `runner/e2e/utils/auth.spec.js`
  - Acceptance: login(), logout() 함수가 정상 동작

- [ ] [IMPL] 인증 헬퍼 함수 구현
  - Files: `runner/e2e/utils/auth.js`
  - Dependencies: constants.js

- [ ] [TEST] 테스트 헬퍼 함수 테스트
  - Files: `runner/e2e/utils/test-helpers.spec.js`
  - Acceptance: 공통 헬퍼 함수 동작 확인

- [ ] [IMPL] 테스트 헬퍼 함수 구현
  - Files: `runner/e2e/utils/test-helpers.js`
  - Dependencies: constants.js

### Feature: Page Objects (group: pom, dependsOn: [utils])

- [ ] [TEST] LoginPage 클래스 테스트
  - Files: `runner/e2e/pages/login.page.spec.js`
  - Acceptance: 로그인 페이지 요소 접근 및 동작 확인

- [ ] [IMPL] LoginPage 클래스 구현
  - Files: `runner/e2e/pages/login.page.js`
  - Dependencies: auth.js

- [ ] [TEST] SidebarPage 클래스 테스트
  - Files: `runner/e2e/pages/sidebar.page.spec.js`
  - Acceptance: 사이드바 요소 접근 및 동작 확인

- [ ] [IMPL] SidebarPage 클래스 구현
  - Files: `runner/e2e/pages/sidebar.page.js`
  - Dependencies: test-helpers.js

- [ ] [TEST] ApiTestingPage 클래스 테스트
  - Files: `runner/e2e/pages/api-testing.page.spec.js`
  - Acceptance: API Testing 페이지 요소 접근 및 동작 확인

- [ ] [IMPL] ApiTestingPage 클래스 구현
  - Files: `runner/e2e/pages/api-testing.page.js`
  - Dependencies: test-helpers.js

### Feature: Test Fixtures (group: fixtures, dependsOn: [infra])

- [ ] [IMPL] 테스트 데이터 작성
  - Files: `runner/e2e/fixtures/test-data.js`
  - Dependencies: None

- [ ] [IMPL] 테스트용 API 엔드포인트 정의
  - Files: `runner/e2e/fixtures/api-endpoints.js`
  - Dependencies: None

### Feature: Auth Tests (group: auth, dependsOn: [pom])

- [ ] [TEST] 로그인 성공 테스트
  - Files: `runner/e2e/api-testing/auth.spec.js`
  - Acceptance: 올바른 자격 증명으로 로그인 성공

- [ ] [TEST] 로그인 실패 테스트 (잘못된 비밀번호)
  - Files: `runner/e2e/api-testing/auth.spec.js`
  - Acceptance: 잘못된 비밀번호로 로그인 실패 메시지 표시

- [ ] [TEST] 로그인 실패 테스트 (존재하지 않는 이메일)
  - Files: `runner/e2e/api-testing/auth.spec.js`
  - Acceptance: 존재하지 않는 이메일로 로그인 실패

- [ ] [TEST] 로그아웃 테스트
  - Files: `runner/e2e/api-testing/auth.spec.js`
  - Acceptance: 로그아웃 후 로그인 페이지로 리다이렉트

- [ ] [TEST] 세션 만료 테스트
  - Files: `runner/e2e/api-testing/auth.spec.js`
  - Acceptance: 세션 만료 시 재로그인 요청

- [ ] [IMPL] Auth 테스트 스위트 구현
  - Files: `runner/e2e/api-testing/auth.spec.js`
  - Dependencies: LoginPage, constants

### Feature: Sidebar Folder Tests (group: sidebar-folder, dependsOn: [pom], parallel: true)

- [ ] [TEST] 폴더 생성 테스트
  - Files: `runner/e2e/api-testing/sidebar-folder.spec.js`
  - Acceptance: 새 폴더 생성 후 목록에 표시

- [ ] [TEST] 폴더 이름 변경 테스트
  - Files: `runner/e2e/api-testing/sidebar-folder.spec.js`
  - Acceptance: 컨텍스트 메뉴에서 이름 변경 성공

- [ ] [TEST] 폴더 삭제 테스트
  - Files: `runner/e2e/api-testing/sidebar-folder.spec.js`
  - Acceptance: 폴더 삭제 후 목록에서 제거

- [ ] [TEST] 폴더 확장/축소 테스트
  - Files: `runner/e2e/api-testing/sidebar-folder.spec.js`
  - Acceptance: 폴더 클릭 시 아이템 목록 표시/숨김

- [ ] [TEST] 전체 확장/전체 축소 테스트
  - Files: `runner/e2e/api-testing/sidebar-folder.spec.js`
  - Acceptance: Expand All/Collapse All 버튼 동작

- [ ] [TEST] 빈 폴더 생성 시 유효성 검사 테스트
  - Files: `runner/e2e/api-testing/sidebar-folder.spec.js`
  - Acceptance: 빈 이름으로 폴더 생성 시 에러 메시지

- [ ] [IMPL] Sidebar Folder 테스트 스위트 구현
  - Files: `runner/e2e/api-testing/sidebar-folder.spec.js`
  - Dependencies: SidebarPage, test-data

### Feature: Sidebar Item Tests (group: sidebar-item, dependsOn: [pom], parallel: true)

- [ ] [TEST] 아이템 생성 테스트
  - Files: `runner/e2e/api-testing/sidebar-item.spec.js`
  - Acceptance: 폴더 내 새 아이템 생성

- [ ] [TEST] 아이템 선택 테스트
  - Files: `runner/e2e/api-testing/sidebar-item.spec.js`
  - Acceptance: 아이템 클릭 시 우측 패널에 상세 정보 표시

- [ ] [TEST] 아이템 이름 변경 테스트
  - Files: `runner/e2e/api-testing/sidebar-item.spec.js`
  - Acceptance: 컨텍스트 메뉴에서 아이템 이름 변경

- [ ] [TEST] 아이템 삭제 테스트
  - Files: `runner/e2e/api-testing/sidebar-item.spec.js`
  - Acceptance: 아이템 삭제 후 목록에서 제거

- [ ] [TEST] 아이템 드래그앤드롭 (같은 폴더 내 순서 변경)
  - Files: `runner/e2e/api-testing/sidebar-item.spec.js`
  - Acceptance: 드래그앤드롭으로 아이템 순서 변경

- [ ] [TEST] 아이템 드래그앤드롭 (다른 폴더로 이동)
  - Files: `runner/e2e/api-testing/sidebar-item.spec.js`
  - Acceptance: 아이템을 다른 폴더로 이동

- [ ] [TEST] 폴더 없이 아이템 생성 시도 테스트
  - Files: `runner/e2e/api-testing/sidebar-item.spec.js`
  - Acceptance: 폴더 선택 없이 아이템 생성 시 경고 표시

- [ ] [IMPL] Sidebar Item 테스트 스위트 구현
  - Files: `runner/e2e/api-testing/sidebar-item.spec.js`
  - Dependencies: SidebarPage, test-data

### Feature: Search Tests (group: search, dependsOn: [pom], parallel: true)

- [ ] [TEST] 검색어 입력 테스트
  - Files: `runner/e2e/api-testing/search.spec.js`
  - Acceptance: 검색어 입력 시 필터링된 결과 표시

- [ ] [TEST] 검색 결과 없음 테스트
  - Files: `runner/e2e/api-testing/search.spec.js`
  - Acceptance: 일치하는 결과 없을 때 "No results" 메시지

- [ ] [TEST] 검색 초기화 테스트
  - Files: `runner/e2e/api-testing/search.spec.js`
  - Acceptance: 검색어 지우면 전체 목록 복원

- [ ] [TEST] 대소문자 구분 없는 검색 테스트
  - Files: `runner/e2e/api-testing/search.spec.js`
  - Acceptance: 대소문자 관계없이 검색 가능

- [ ] [IMPL] Search 테스트 스위트 구현
  - Files: `runner/e2e/api-testing/search.spec.js`
  - Dependencies: SidebarPage, test-data

### Feature: HTTP Request Tests (group: http-request, dependsOn: [pom], parallel: true)

- [ ] [TEST] HTTP 메서드 변경 테스트 (GET, POST, PUT, DELETE, PATCH)
  - Files: `runner/e2e/api-testing/http-request.spec.js`
  - Acceptance: 각 메서드로 변경 시 UI 반영

- [ ] [TEST] URL 입력 테스트
  - Files: `runner/e2e/api-testing/http-request.spec.js`
  - Acceptance: URL 필드에 값 입력 및 표시

- [ ] [TEST] 메서드별 색상 표시 테스트
  - Files: `runner/e2e/api-testing/http-request.spec.js`
  - Acceptance: 각 메서드에 맞는 색상 배지 표시

- [ ] [TEST] URL placeholder 표시 테스트
  - Files: `runner/e2e/api-testing/http-request.spec.js`
  - Acceptance: 빈 URL 필드에 placeholder 표시

- [ ] [IMPL] HTTP Request 테스트 스위트 구현
  - Files: `runner/e2e/api-testing/http-request.spec.js`
  - Dependencies: ApiTestingPage

### Feature: Request Tabs Tests (group: request-tabs, dependsOn: [pom], parallel: true)

- [ ] [TEST] Params 탭 전환 테스트
  - Files: `runner/e2e/api-testing/request-tabs.spec.js`
  - Acceptance: Params 탭 클릭 시 파라미터 테이블 표시

- [ ] [TEST] Headers 탭 전환 테스트
  - Files: `runner/e2e/api-testing/request-tabs.spec.js`
  - Acceptance: Headers 탭 클릭 시 헤더 섹션 표시

- [ ] [TEST] Body 탭 전환 테스트
  - Files: `runner/e2e/api-testing/request-tabs.spec.js`
  - Acceptance: Body 탭 클릭 시 본문 입력 영역 표시

- [ ] [TEST] cURL 탭 전환 테스트
  - Files: `runner/e2e/api-testing/request-tabs.spec.js`
  - Acceptance: cURL 탭 클릭 시 cURL 명령어 표시

- [ ] [TEST] Params 테이블 파라미터 추가 테스트
  - Files: `runner/e2e/api-testing/request-tabs.spec.js`
  - Acceptance: Add Parameter 버튼으로 행 추가

- [ ] [TEST] Params 테이블 파라미터 삭제 테스트
  - Files: `runner/e2e/api-testing/request-tabs.spec.js`
  - Acceptance: 삭제 버튼으로 파라미터 행 제거

- [ ] [TEST] Params 테이블 필수 체크박스 테스트
  - Files: `runner/e2e/api-testing/request-tabs.spec.js`
  - Acceptance: Required 체크박스 토글

- [ ] [TEST] Body 탭 텍스트 입력 테스트
  - Files: `runner/e2e/api-testing/request-tabs.spec.js`
  - Acceptance: Body 텍스트 영역에 JSON 입력

- [ ] [IMPL] Request Tabs 테스트 스위트 구현
  - Files: `runner/e2e/api-testing/request-tabs.spec.js`
  - Dependencies: ApiTestingPage

### Feature: API Execution Tests (group: api-execution, dependsOn: [pom], parallel: true)

- [ ] [TEST] Send 버튼 표시 테스트
  - Files: `runner/e2e/api-testing/api-execution.spec.js`
  - Acceptance: Send 버튼이 화면에 표시

- [ ] [TEST] GET 요청 실행 테스트
  - Files: `runner/e2e/api-testing/api-execution.spec.js`
  - Acceptance: GET 요청 후 응답 데이터 표시

- [ ] [TEST] POST 요청 실행 테스트
  - Files: `runner/e2e/api-testing/api-execution.spec.js`
  - Acceptance: POST 요청 후 응답 표시

- [ ] [TEST] 로딩 상태 표시 테스트
  - Files: `runner/e2e/api-testing/api-execution.spec.js`
  - Acceptance: 요청 중 로딩 스피너 표시

- [ ] [TEST] 응답 상태 코드 표시 테스트
  - Files: `runner/e2e/api-testing/api-execution.spec.js`
  - Acceptance: 200, 404, 500 등 상태 코드 표시

- [ ] [TEST] 응답 시간 표시 테스트
  - Files: `runner/e2e/api-testing/api-execution.spec.js`
  - Acceptance: "Time: Xms" 형식으로 응답 시간 표시

- [ ] [TEST] 응답 크기 표시 테스트
  - Files: `runner/e2e/api-testing/api-execution.spec.js`
  - Acceptance: 응답 본문 크기 표시

- [ ] [TEST] 응답 헤더 표시 테스트
  - Files: `runner/e2e/api-testing/api-execution.spec.js`
  - Acceptance: Response Headers 섹션에 헤더 정보 표시

- [ ] [TEST] 에러 응답 처리 테스트
  - Files: `runner/e2e/api-testing/api-execution.spec.js`
  - Acceptance: 4xx, 5xx 에러 시 적절한 UI 표시

- [ ] [IMPL] API Execution 테스트 스위트 구현
  - Files: `runner/e2e/api-testing/api-execution.spec.js`
  - Dependencies: ApiTestingPage, api-endpoints

### Feature: Save/Reset Tests (group: save-reset, dependsOn: [pom], parallel: true)

- [ ] [TEST] Save 버튼 표시 테스트
  - Files: `runner/e2e/api-testing/save-reset.spec.js`
  - Acceptance: Save 버튼이 화면에 표시

- [ ] [TEST] Reset 버튼 표시 테스트
  - Files: `runner/e2e/api-testing/save-reset.spec.js`
  - Acceptance: Reset 버튼이 화면에 표시

- [ ] [TEST] Reset 버튼 클릭 테스트
  - Files: `runner/e2e/api-testing/save-reset.spec.js`
  - Acceptance: Reset 클릭 시 폼 초기화

- [ ] [TEST] Save 후 데이터 유지 테스트
  - Files: `runner/e2e/api-testing/save-reset.spec.js`
  - Acceptance: 저장 후 새로고침해도 데이터 유지

- [ ] [IMPL] Save/Reset 테스트 스위트 구현
  - Files: `runner/e2e/api-testing/save-reset.spec.js`
  - Dependencies: ApiTestingPage

### Feature: Template Variables Tests (group: template-variables, dependsOn: [pom], parallel: true)

- [ ] [TEST] 템플릿 변수 감지 테스트
  - Files: `runner/e2e/api-testing/template-variables.spec.js`
  - Acceptance: URL에 {{variable}} 형식 변수 감지

- [ ] [TEST] 변수 입력 모달 표시 테스트
  - Files: `runner/e2e/api-testing/template-variables.spec.js`
  - Acceptance: 변수 발견 시 입력 모달 표시

- [ ] [TEST] 기본값이 있는 변수 테스트
  - Files: `runner/e2e/api-testing/template-variables.spec.js`
  - Acceptance: {{var:default}} 형식의 기본값 표시

- [ ] [TEST] 변수 입력 후 확인 테스트
  - Files: `runner/e2e/api-testing/template-variables.spec.js`
  - Acceptance: 변수 입력 후 URL에 값 적용

- [ ] [TEST] 필수 변수 미입력 시 검증 테스트
  - Files: `runner/e2e/api-testing/template-variables.spec.js`
  - Acceptance: 필수 변수 미입력 시 경고 메시지

- [ ] [TEST] 모달 취소 테스트
  - Files: `runner/e2e/api-testing/template-variables.spec.js`
  - Acceptance: 취소 버튼으로 모달 닫기

- [ ] [IMPL] Template Variables 테스트 스위트 구현
  - Files: `runner/e2e/api-testing/template-variables.spec.js`
  - Dependencies: ApiTestingPage

### Feature: Integration Tests (group: integration, dependsOn: [auth, sidebar-folder, sidebar-item, search, http-request, request-tabs, api-execution, save-reset, template-variables])

- [ ] [TEST] 전체 플로우 테스트 (로그인 -> 폴더 생성 -> 아이템 생성 -> API 실행)
  - Files: `runner/e2e/api-testing/integration.spec.js`
  - Acceptance: 전체 워크플로우 정상 동작

- [ ] [TEST] 다중 탭 시나리오 테스트
  - Files: `runner/e2e/api-testing/integration.spec.js`
  - Acceptance: 여러 탭에서 동시 작업 가능

- [ ] [IMPL] Integration 테스트 스위트 구현
  - Files: `runner/e2e/api-testing/integration.spec.js`
  - Dependencies: 모든 Page Objects

### Feature: Cleanup (group: cleanup, dependsOn: [integration])

- [ ] [REFACTOR] 기존 api-testing-e2e.spec.js 백업 및 제거
  - Files: `runner/api-testing-e2e.spec.js`
  - Reason: 새 구조로 대체

- [ ] [REFACTOR] 불필요한 테스트 파일 정리
  - Files: `runner/*.spec.js` (루트의 기타 테스트 파일)
  - Reason: e2e/ 디렉토리로 통합

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| 테스트 격리 실패 | High | beforeEach/afterEach로 상태 초기화 |
| 외부 API 의존성 | Medium | 로컬 mock 서버 또는 안정적인 테스트 API 사용 |
| 병렬 실행 충돌 | Medium | 테스트별 고유 데이터 사용 (timestamp 포함) |
| 브라우저 호환성 | Low | chromium 단일 브라우저 우선 지원 |
| 느린 테스트 실행 | Medium | 불필요한 대기 시간 최소화, 병렬 실행 |

## Open Questions

- [ ] 테스트 데이터 초기화 전략: 각 테스트 전 DB 초기화 vs 테스트 데이터 분리?
- [ ] Mock API 서버 사용 여부: 외부 API(jsonplaceholder) 대신 로컬 mock 서버?
- [ ] CI 환경에서의 실행 전략: GitHub Actions / Jenkins 통합 계획?
- [ ] 스크린샷/비디오 저장 정책: 실패 시만 저장 vs 항상 저장?

## Execution Order Summary

```
Phase 1 (Sequential):
  infra → utils → pom → fixtures

Phase 2 (Parallel - 9 groups):
  auth, sidebar-folder, sidebar-item, search, http-request,
  request-tabs, api-execution, save-reset, template-variables

Phase 3 (Sequential):
  integration → cleanup
```

## Estimated Effort

| Group | Files | Tests | Estimated Hours |
|-------|-------|-------|-----------------|
| infra | 4 | 1 | 2h |
| utils | 2 | 2 | 2h |
| pom | 3 | 3 | 4h |
| fixtures | 2 | 0 | 1h |
| auth | 1 | 5 | 2h |
| sidebar-folder | 1 | 6 | 3h |
| sidebar-item | 1 | 7 | 4h |
| search | 1 | 4 | 2h |
| http-request | 1 | 4 | 2h |
| request-tabs | 1 | 8 | 4h |
| api-execution | 1 | 9 | 4h |
| save-reset | 1 | 4 | 2h |
| template-variables | 1 | 6 | 3h |
| integration | 1 | 2 | 2h |
| cleanup | 0 | 0 | 1h |
| **Total** | **21** | **61** | **38h** |
