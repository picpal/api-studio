# UI Testing 사이드바 스크립트 사라짐 버그 수정

## 개요
UI Testing 사이드바에서 폴더 선택 시 다른 폴더의 스크립트가 사라지는 버그 수정

## 문제 분석

### 증상
- 폴더 A를 선택하면 폴더 B의 스크립트가 UI에서 사라짐
- 폴더를 선택할 때마다 해당 폴더의 스크립트만 남고 나머지가 삭제됨

### 원인
**파일**: `frontend/src/features/ui-testing/hooks/useUiTestingSidebar.ts`
**위치**: 218-221줄

```typescript
// Load scripts when folder selection changes
useEffect(() => {
  loadScripts();
}, [selectedFolderId, loadScripts]);
```

문제점:
1. `selectedFolderId`가 변경될 때마다 `loadScripts()`가 호출됨
2. `loadScripts()` 내부에서 `selectedFolderId`가 있으면 해당 폴더의 스크립트만 가져옴
3. 가져온 스크립트로 전체 `scripts` 상태를 덮어씀 (다른 폴더 스크립트 삭제됨)

### 해결책
**이 useEffect를 제거**

이유:
- 초기 로드 (213-216줄)에서 이미 `loadScripts(null)`로 전체 스크립트를 가져옴
- `selectedFolderId`는 단순히 UI 필터링 용도로만 사용되어야 함
- 스크립트 생성/수정/삭제 시에는 각 함수 내에서 `loadScripts()`를 직접 호출함

## TODO

### TODO-001: 불필요한 useEffect 제거
- **유형**: FIX
- **복잡도**: Low
- **파일**: `frontend/src/features/ui-testing/hooks/useUiTestingSidebar.ts`
- **작업 내용**:
  1. 218-221줄의 useEffect 블록 삭제
  2. 빈 줄 정리
- **테스트**:
  - 폴더 A, B에 각각 스크립트가 있을 때
  - 폴더 A 선택 -> 폴더 A 스크립트 표시
  - 폴더 B 선택 -> 폴더 B 스크립트 표시
  - "All" 선택 -> 모든 스크립트 표시

## 커밋 계획

```
[FIX] UI Testing 사이드바 폴더 선택 시 스크립트 사라짐 버그 수정

- selectedFolderId 변경 시 loadScripts 재호출 제거
- 초기 로드에서 전체 스크립트를 가져오므로 재호출 불필요
- 폴더 선택은 UI 필터링 용도로만 사용

Plan: uitesting-scripts-disappearing-fix
```

## 체크리스트
- [ ] TODO-001 완료
- [ ] 수동 테스트 완료
- [ ] 커밋 완료
