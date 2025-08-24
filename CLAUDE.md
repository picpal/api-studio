# API Test Automation Project

## 프로젝트 개요
QA 팀을 위한 API 테스트 자동화 도구 개발

## 코드 작성 원칙
- 유지보수가 쉽고 개발자가 읽기 쉬운 코드 작성
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
  - Test Automation (Pipeline 관리 페이지)

### 6. Pipeline 시스템 (신규 완성)
**목표**: QA 팀이 의존성 있는 API 테스트 시나리오를 구성하고 실행할 수 있는 도구

#### 6.1 Pipeline 기본 관리 ✅
- ✅ Pipeline 폴더/계층 구조 관리
- ✅ Pipeline 생성/편집/삭제
- ✅ Pipeline 제목과 설명 편집 기능
- ✅ Step 순서 관리 및 의존성 설정

#### 6.2 Step 관리 시스템 ✅
- ✅ API Step 추가/편집/삭제
- ✅ Step 간 실행 순서 보장
- ✅ 각 Step별 지연시간 설정

#### 6.3 데이터 전달 시스템 ✅
- ✅ **Variable Builder**: 직관적인 변수 설정 UI
- ✅ **데이터 추출**: 이전 Step 응답에서 변수 추출 (`response.data.token`)
- ✅ **데이터 주입**: 추출된 변수를 다음 Step에서 사용 (`{{token}}`)
- ✅ **자동완성**: 샘플 응답에서 추출 가능한 필드 제안
- ✅ **실시간 미리보기**: 설정된 변수 JSON 표시

#### 6.4 시각적 인터페이스 ✅
- ✅ **Visual Flow**: 카드 형태의 Step 표시
- ✅ **연결선**: Step 간 데이터 흐름 시각화
- ✅ **색상 코딩**: 추출(초록), 주입(파랑), 대기시간(노랑)
- ✅ **클릭 편집**: Step 카드 클릭으로 즉시 편집
- ✅ **실시간 로딩**: Step 수 동적 업데이트

#### 6.5 실행 시스템 ✅
- ✅ **세션 유지**: HttpClient 기반 쿠키 관리
- ✅ **순차 실행**: Step 순서대로 API 호출
- ✅ **변수 치환**: `{{variable}}` → 실제 값으로 치환
- ✅ **실행 히스토리**: 결과 저장 및 조회
- ✅ **실시간 모니터링**: 진행 상황 실시간 표시

## 기술 스택

### Frontend
- React 18 + TypeScript
- Tailwind CSS
- FSD 아키텍처 (Feature-Sliced Design)
- Axios (API 통신)

### Backend  
- Spring Boot 3
- JPA/Hibernate
- H2 Database (개발용)
- Jackson (JSON 처리)

## 주요 아키텍처

### Frontend 구조 (FSD)
```
src/
├── entities/pipeline/          # Pipeline 도메인 타입
├── features/pipeline-management/  # Pipeline 관리 기능
│   ├── api/                   # API 통신
│   └── hooks/                 # 상태 관리
├── widgets/pipeline/          # Pipeline UI 컴포넌트
│   ├── VisualFlow/           # 시각적 플로우
│   ├── VariableBuilder/      # 변수 빌더
│   ├── AddStepModal/         # Step 추가 모달
│   ├── EditStepModal/        # Step 편집 모달
│   └── EditPipelineModal/    # Pipeline 편집 모달
└── pages/pipeline/           # Pipeline 페이지
```

### Backend 구조
```
src/main/java/com/example/apitest/
├── entity/
│   ├── Pipeline.java          # Pipeline 엔티티
│   ├── PipelineStep.java      # Step 엔티티
│   ├── PipelineExecution.java # 실행 기록
│   └── StepExecution.java     # Step 실행 기록
├── controller/
│   └── PipelineController.java # Pipeline API
└── service/
    └── PipelineExecutionService.java # 실행 로직
```

## QA 친화적 개선사항

### 1. Variable Builder
- **문제**: JSON 직접 입력은 QA에게 어려움
- **해결**: 드롭다운 선택 + 자동완성으로 변수 설정
- **효과**: 코딩 지식 없이도 복잡한 데이터 전달 설정 가능

### 2. 시각적 플로우
- **문제**: 텍스트 기반 Step 목록은 플로우 이해 어려움  
- **해결**: 카드 + 연결선 + 색상 코딩으로 시각화
- **효과**: 데이터 흐름을 직관적으로 파악 가능

### 3. 클릭 편집
- **문제**: 별도 편집 메뉴 찾아가는 번거로움
- **해결**: Step 카드 클릭으로 즉시 편집 모달 열림
- **효과**: 빠른 수정으로 작업 효율성 향상

## 개발 환경 설정

```bash
# Backend 실행
cd backend
./gradlew bootRun

# Frontend 실행  
cd frontend
npm start
```

## 데이터베이스
- H2 Console: http://localhost:8080/h2-console
- JDBC URL: jdbc:h2:file:./data/testdb
- Username: sa, Password: (빈 값)

## API 서버
- Frontend: http://localhost:3001
- Backend API: http://localhost:8080/api

## 주요 API 엔드포인트

### Pipeline 관리
- `GET /api/pipelines/folders` - Pipeline 폴더 목록
- `POST /api/pipelines` - Pipeline 생성
- `PUT /api/pipelines/{id}` - Pipeline 편집
- `DELETE /api/pipelines/{id}` - Pipeline 삭제

### Step 관리  
- `GET /api/pipelines/{id}/steps` - Step 목록
- `POST /api/pipelines/{id}/steps` - Step 추가
- `PUT /api/pipelines/steps/{id}` - Step 편집
- `DELETE /api/pipelines/steps/{id}` - Step 삭제

### 실행 관리
- `POST /api/pipelines/{id}/execute` - Pipeline 실행
- `GET /api/pipelines/executions/{id}` - 실행 상태 조회
- `GET /api/pipelines/executions/{id}/steps` - Step 실행 결과

## 사용 예시

### 1. 로그인 → API 호출 시나리오
```
Step 1: POST /auth/login
- 추출: {"token": "response.data.accessToken"}

Step 2: GET /user/profile  
- 주입: {"headers.Authorization": "Bearer {{token}}"}
```

### 2. 파일 업로드 → 처리 → 결과 확인
```
Step 1: POST /files/upload
- 추출: {"fileId": "response.fileId"}

Step 2: POST /files/process
- 주입: {"body.fileId": "{{fileId}}"}
- 추출: {"jobId": "response.jobId"}

Step 3: GET /jobs/status  
- 주입: {"params.jobId": "{{jobId}}"}
- 지연: 2000ms
```

## 향후 개선 계획

### 우선순위 1: 고급 실행 기능
1. **조건부 실행**: Step 실행 조건 설정
2. **재시도 로직**: 실패 시 자동 재시도
3. **병렬 실행**: 독립적인 Step 동시 실행
4. **Assertion**: 응답 검증 로직

### 우선순위 2: 리포팅 및 분석
1. **실행 리포트**: PDF/Excel 내보내기
2. **성공률 분석**: 차트 및 통계
3. **성능 모니터링**: 응답 시간 분석
4. **알림 시스템**: 실패 시 Slack/Email 알림

### 우선순위 3: 협업 기능
1. **템플릿 공유**: 자주 사용하는 Pipeline 패턴
2. **버전 관리**: Pipeline 변경 이력
3. **팀 권한**: 읽기/쓰기 권한 관리
4. **댓글 시스템**: Pipeline/Step별 메모

## 성능 최적화

### 현재 구현
- HttpClient 연결 풀 사용
- JPA 배치 처리
- 트랜잭션 최적화
- 세션 쿠키 자동 관리

### 계획된 최적화
- WebSocket 실시간 업데이트
- 결과 데이터 압축
- 대용량 Pipeline 페이징
- 캐싱 전략 적용