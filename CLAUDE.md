# API Test Automation Project

## 프로젝트 개요
QA 팀을 위한 API 테스트 자동화 도구 개발

## 코드 작성 원칙
- 유지보수가 쉽고 개발자가 읽기 쉬운 코드를작성
- FSD 아키텍처 원칙 준수

## 완료된 작업들

### 1. API 파라미터 관리 개선
- ✅ API_PARAMETER 테이블 제거
- ✅ REQUEST_PARAMS 컬럼을 JSON 형태로 통일
- ✅ 히스토리 스냅샷과 동일한 데이터 구조 사용

### 2. HTTP 메소드 변경 시 자동 전환 기능
- ✅ GET/DELETE → POST/PUT/PATCH: Params → Body 자동 변환
- ✅ POST/PUT/PATCH → GET/DELETE: Body → Params 자동 변환  
- ✅ Content-Type 헤더 자동 관리
- ✅ 탭 자동 전환

### 3. UI/UX 개선
- ✅ Monaco Editor 사용 (JSON 구문 강조)
- ✅ 사이드바 아이콘 변경 (expand/collapse)
- ✅ 로그아웃 버튼 아이콘화
- ✅ 헤더에서 이메일 표기 제거

### 4. 폴더 권한 관리
- ✅ 권한 선택 없이 추가 시 유효성 검사 알림

### 5. 네비게이션 구조
- ✅ 헤더에 네비게이션 메뉴 추가
  - API Testing (기존 페이지)
  - Test Automation (신규 페이지)

## 현재 진행 중인 작업

### Test Automation 페이지 개발
**목표**: QA 팀이 여러 API를 배치로 테스트할 수 있는 자동화 도구

#### Phase 1: 기본 배치 실행 (진행 중)
- ✅ 기본 페이지 구조 생성
- ✅ API 선택 UI (체크박스)
- ✅ 배치 실행 기능
- ✅ 실시간 진행 상황 표시
- 🔄 실제 API 호출 연동 (예정)

#### Phase 3: 결과 분석 및 리포팅 (일부 완료)
- ✅ 테스트 히스토리 표시
- ✅ 성공률 통계
- ✅ 실행 결과 상세 정보
- 🔄 차트 라이브러리 연동 (예정)
- 🔄 결과 Export 기능 (예정)

## 기술 스택

### Frontend
- React 18 + TypeScript
- Tailwind CSS
- Monaco Editor
- Axios (API 통신)

### Backend  
- Spring Boot 3
- JPA/Hibernate
- H2 Database (개발용)
- Jackson (JSON 처리)

## 다음 작업 계획

### 우선순위 1: Test Automation 페이지 완성
1. **실제 API 호출 연동**
   - 기존 API 호출 로직 재사용
   - 실시간 응답 처리
   - 에러 핸들링

2. **백엔드 API 개발**
   - TestExecution Entity 생성
   - TestBatch Controller 구현
   - 결과 저장 및 조회 API

3. **차트 및 분석 기능**
   - Chart.js 또는 Recharts 연동
   - 성공률 차트
   - 응답시간 분석

4. **결과 Export**
   - PDF/Excel 다운로드
   - 상세 리포트 생성

### 우선순위 2: 기능 고도화
1. **사이드바 연동**
   - 기존 폴더/API 구조 활용
   - 선택된 API 정보 동기화

2. **고급 테스트 설정**
   - 타임아웃 설정
   - 재시도 로직
   - 병렬 실행 옵션

## 주요 파일 위치

### Frontend
- `/src/components/Header.tsx` - 네비게이션 메뉴
- `/src/components/TestAutomationPage.tsx` - 테스트 자동화 페이지
- `/src/components/MainContent.tsx` - 기존 API 테스트 페이지

### Backend
- `/src/main/java/com/example/apitest/entity/ApiItem.java` - API 아이템 엔티티
- `/src/main/java/com/example/apitest/controller/ApiItemController.java` - API 컨트롤러

## 참고사항

### 개발 환경 설정
```bash
# Backend 실행
cd backend
./gradlew bootRun

# Frontend 실행  
cd frontend
npm start
```

### 데이터베이스
- H2 Console: http://localhost:8080/h2-console
- JDBC URL: jdbc:h2:file:./data/testdb
- Username: sa, Password: (빈 값)

### API 테스트
- Frontend: http://localhost:3001
- Backend API: http://localhost:8080/api

## 이슈 및 해결책

### HTTP 메소드 변경 시 상태 초기화 문제
**문제**: 메소드 변경 시 selectedItem 업데이트로 인한 useEffect 재실행
**해결**: onUpdateSelectedItem 호출 제거, Save 시에만 업데이트

### Monaco Editor 상태 업데이트 문제  
**문제**: setRequest 호출 후 Editor에 반영 안됨
**해결**: textarea로 임시 교체 후 다시 Monaco Editor로 복원

## 성능 최적화 계획
1. API 호출 최적화 (배치 처리)
2. 실시간 업데이트 최적화 (WebSocket 고려)
3. 대용량 테스트 결과 페이징 처리