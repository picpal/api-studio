# Plan: fix-ui-test-execution-path

## Meta
- Created: 2026-02-08T23:10:00+09:00
- Author: Interviewer
- Status: draft

## Summary
Backend에서 Runner로 UI 테스트 실행 요청 시 전달되는 파일 절대경로가 Runner의 Path Traversal 보안 검증을 통과하지 못해 실행이 항상 실패하는 버그를 수정한다. Runner의 허용 디렉토리 목록을 환경변수 기반으로 확장하는 방법(방법 D)을 채택한다.

## Goals
1. Backend가 전송하는 절대경로(`backend/uploads/ui-tests/script-{id}/...`)를 Runner가 정상적으로 수락하여 테스트 실행이 성공하도록 한다
2. Runner의 Path Traversal 보안 검증을 유지하면서 허용 디렉토리를 유연하게 설정할 수 있도록 한다
3. 환경변수(`ALLOWED_SCRIPT_DIRS`)로 추가 허용 디렉토리를 지정할 수 있도록 한다

## Scope

### In Scope
- Runner의 `playwrightService.ts` Path Traversal 검증 로직 수정 (단일 디렉토리 -> 복수 디렉토리 허용)
- 환경변수 `ALLOWED_SCRIPT_DIRS`를 통한 추가 허용 디렉토리 설정 지원
- 허용 디렉토리 목록 유틸리티 함수 분리
- 단위 테스트 작성 (Path Traversal 검증 로직)

### Out of Scope
- Backend의 파일 저장 경로 변경
- uploads 디렉토리 통합 (프로젝트 루트로 이동)
- Runner의 파일 업로드 기능 변경
- Frontend 변경

## Technical Approach

### 현재 문제 흐름
```
1. [Backend] 파일 업로드 -> backend/uploads/ui-tests/script-{id}/{file}.spec.js
2. [Backend] Runner에 실행 요청 -> scriptPath: "/abs/path/backend/uploads/ui-tests/script-1/test.spec.js"
3. [Runner]  Path Traversal 검증:
   - resolvedPath = "/abs/path/backend/uploads/ui-tests/script-1/test.spec.js"
   - uploadsDir   = "/abs/path/runner/uploads"
   - resolvedPath.startsWith(uploadsDir) => FALSE => Error!
```

### 수정 후 흐름
```
1. [Backend] 파일 업로드 -> backend/uploads/ui-tests/script-{id}/{file}.spec.js (변경 없음)
2. [Backend] Runner에 실행 요청 -> scriptPath: (변경 없음)
3. [Runner]  Path Traversal 검증 (수정됨):
   - resolvedPath = "/abs/path/backend/uploads/ui-tests/script-1/test.spec.js"
   - allowedDirs  = ["/abs/path/runner/uploads", "/abs/path/backend/uploads/ui-tests"]
                    (기본값 + ALLOWED_SCRIPT_DIRS 환경변수)
   - allowedDirs 중 하나라도 매칭 => PASS => 실행 진행
```

### 핵심 변경 사항

1. **경로 검증 유틸리티 함수 추출**: `isPathAllowed(scriptPath: string, allowedDirs: string[]): boolean`
   - 여러 허용 디렉토리 중 하나에 속하는지 검사
   - `path.resolve()`로 정규화 후 `startsWith` 비교
   - 심볼릭 링크 공격 방지를 위해 `fs.realpathSync` 고려

2. **허용 디렉토리 목록 구성**: `getAllowedScriptDirs(): string[]`
   - 기본값: `[path.resolve(process.cwd(), 'uploads')]`
   - 환경변수 `ALLOWED_SCRIPT_DIRS`에서 콤마 구분으로 추가 디렉토리 파싱
   - 각 디렉토리를 `path.resolve()`로 절대경로 변환

3. **playwrightService.ts의 `runPlaywrightScript` 메서드 수정**:
   - 기존 하드코딩된 단일 디렉토리 검사를 유틸리티 함수 호출로 교체

## TODO List

### Feature: Path Validation Utility (group: path-validation)

- [ ] [TEST] 경로 검증 유틸리티 함수 단위 테스트 작성
  - Files: `runner/src/__tests__/pathValidation.test.ts`
  - Acceptance:
    - `isPathAllowed()`: 허용된 디렉토리 내부 경로는 true 반환
    - `isPathAllowed()`: 허용된 디렉토리 외부 경로는 false 반환
    - `isPathAllowed()`: Path Traversal 시도 (`../`) false 반환
    - `isPathAllowed()`: 빈 allowedDirs 배열은 false 반환
    - `isPathAllowed()`: 디렉토리 경로 자체(파일 아닌)는 false 반환
    - `getAllowedScriptDirs()`: 기본 디렉토리 포함 확인
    - `getAllowedScriptDirs()`: ALLOWED_SCRIPT_DIRS 환경변수 파싱 확인
    - `getAllowedScriptDirs()`: 환경변수 미설정 시 기본값만 반환 확인
    - `getAllowedScriptDirs()`: 빈 문자열/공백 경로 무시 확인

- [ ] [IMPL] 경로 검증 유틸리티 함수 구현
  - Files: `runner/src/utils/pathValidation.ts`
  - Dependencies: `path`, `fs`
  - Details:
    - `isPathAllowed(scriptPath: string, allowedDirs: string[]): boolean` 함수 구현
    - `getAllowedScriptDirs(): string[]` 함수 구현
    - 모든 경로를 `path.resolve()`로 정규화
    - `path.sep` 추가하여 부분 매칭 방지 (e.g., `/uploads-evil/` vs `/uploads/`)

### Feature: PlaywrightService Path Validation 수정 (group: service-fix, dependsOn: [path-validation])

- [ ] [TEST] PlaywrightService의 경로 검증 로직 통합 테스트 작성
  - Files: `runner/src/__tests__/playwrightService.test.ts`
  - Acceptance:
    - Runner의 uploads 디렉토리 내 스크립트 경로는 검증 통과
    - Backend의 uploads 디렉토리 경로(ALLOWED_SCRIPT_DIRS 설정 시)도 검증 통과
    - 허용 디렉토리 외부 경로는 'Script path is outside allowed directory' 에러 발생
    - Path Traversal 시도 시 에러 발생

- [ ] [IMPL] PlaywrightService의 runPlaywrightScript 메서드 수정
  - Files: `runner/src/services/playwrightService.ts`
  - Dependencies: `runner/src/utils/pathValidation.ts`
  - Details:
    - 209-213행의 하드코딩된 경로 검증을 `isPathAllowed()` + `getAllowedScriptDirs()` 호출로 교체
    - 에러 메시지에 허용 디렉토리 목록 포함하여 디버깅 용이하게
    - 기존 보안 수준 유지 (외부 경로 여전히 차단)

### Feature: 환경변수 설정 문서화 (group: config-docs, parallel: true)

- [ ] [IMPL] Runner 실행 시 환경변수 설정 방법 안내
  - Files: `runner/.env.example`
  - Details:
    - `ALLOWED_SCRIPT_DIRS` 환경변수 설명 및 예시
    - 절대경로와 상대경로 모두 지원됨을 명시
    - 콤마 구분 형식 설명

## Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| 허용 디렉토리 오설정으로 보안 취약점 발생 | High | 기본값을 `runner/uploads`만 유지, 추가 디렉토리는 명시적 환경변수 설정 필요 |
| 심볼릭 링크를 통한 Path Traversal 우회 | Medium | `path.resolve()` + `realpath` 사용, 경로 정규화 후 비교 |
| Runner와 Backend가 다른 머신에서 실행될 경우 경로 접근 불가 | Medium | 이는 현재 범위 외. 향후 공유 스토리지 또는 파일 전송 API 도입 필요 |
| 환경변수 미설정 시 기존 문제 지속 | Low | 기본 허용 디렉토리에 상위 프로젝트 경로 패턴 자동 감지 로직 고려 가능 (현재는 수동 설정) |

## Open Questions
- [ ] 운영 환경에서 Backend와 Runner가 같은 파일시스템을 공유하는지 확인 필요
- [ ] `ALLOWED_SCRIPT_DIRS` 환경변수의 기본값에 `../backend/uploads/ui-tests`를 포함시킬지 여부 (보안 vs 편의성 트레이드오프)
- [ ] Runner 시작 시 허용 디렉토리 존재 여부를 검증하고 경고 로그를 출력할지 여부

## 수정 대상 파일 요약

| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `runner/src/utils/pathValidation.ts` | **신규** | 경로 검증 유틸리티 함수 |
| `runner/src/__tests__/pathValidation.test.ts` | **신규** | 경로 검증 유틸리티 단위 테스트 |
| `runner/src/__tests__/playwrightService.test.ts` | **신규** | PlaywrightService 경로 검증 통합 테스트 |
| `runner/src/services/playwrightService.ts` | **수정** | 209-213행 Path Traversal 검증 로직 교체 |
| `runner/.env.example` | **신규** | 환경변수 설정 예시 파일 |

## 테스트 계획

### 1. 단위 테스트 (자동화)
- `pathValidation.test.ts`: 경로 검증 유틸리티 함수의 모든 경우의 수 테스트
  - 허용 경로 / 거부 경로 / Traversal 시도 / 환경변수 파싱

### 2. 통합 테스트 (자동화)
- `playwrightService.test.ts`: PlaywrightService 내 경로 검증 통합 동작 검증
  - Mock을 활용한 허용/거부 시나리오 테스트

### 3. 수동 검증
- Backend에서 파일 업로드 후 실행 버튼 클릭
- Runner 로그에서 경로 검증 통과 확인
- 실제 Playwright 테스트 실행 성공 확인
- Path Traversal 공격 시도 시 여전히 차단되는지 확인
