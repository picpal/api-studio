# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# API Test Automation Project

## 프로젝트 개요
QA 팀을 위한 API 테스트 자동화 도구 개발

## 코드 작성 원칙
- 유지보수가 쉽고 개발자가 읽기 쉬운 코드 작성
- FSD 아키텍처 원칙 준수

## 기술 스택

### Frontend
- React 18 + TypeScript
- Vite (빌드 도구)
- Tailwind CSS
- FSD 아키텍처 (Feature-Sliced Design)
- Axios (API 통신)
- Monaco Editor (JSON 편집)

### Backend
- Spring Boot 3.2.2
- Java 17
- JPA/Hibernate
- H2 Database (개발용)
- Spring Security (세션 기반 인증)

### Runner (Playwright Test Runner)
- Node.js + TypeScript
- Express (REST API 서버)
- Playwright (UI 테스트 실행)
- WebSocket (실시간 결과 전송)

## 주요 명령어

### Backend
```bash
# 애플리케이션 실행
./gradlew bootRun

# 빌드
./gradlew build

# 테스트 실행 (커버리지 포함)
./gradlew test jacocoTestReport

# Maven 저장소 배포
./gradlew publish
```

### Frontend
```bash
# 개발 서버 실행
npm start
# 또는
npm run dev

# 프로덕션 빌드
npm run build

# 번들 분석과 함께 빌드
npm run build:analyze

# 테스트 실행
npm run test

# 린트 실행
npm run lint
```

### Runner
```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start

# Playwright 브라우저 설치
npm run install-browsers
```

## 주요 아키텍처

### Frontend 구조 (FSD)
```
src/
├── entities/pipeline/          # Pipeline 도메인 타입
├── features/                  # 기능별 모듈
│   ├── api-testing/           # API 테스트 관리
│   ├── pipeline-management/   # Pipeline 관리
│   ├── admin/                # 관리자 기능
│   └── history-management/   # 히스토리 관리
├── widgets/pipeline/          # Pipeline UI 컴포넌트
│   ├── VisualFlow/           # 시각적 플로우
│   ├── VariableBuilder/      # 변수 빌더
│   ├── AddStepModal/         # Step 추가 모달
│   ├── EditStepModal/        # Step 편집 모달
│   └── EditPipelineModal/    # Pipeline 편집 모달
├── pages/                    # 라우팅 페이지
├── contexts/AuthContext.tsx  # 인증 컨텍스트
└── config/                   # 설정 파일
```

### Backend 구조
```
com/example/apitest/
├── controller/          # REST API 엔드포인트
├── entity/             # JPA 엔티티
├── repository/         # 데이터 접근 계층
├── service/           # 비즈니스 로직
├── dto/              # 데이터 전송 객체
├── config/           # 설정 클래스
├── util/             # 유틸리티 클래스
└── aspect/           # 횡단 관심사
```

### Runner 구조 (Playwright Test Runner)
- Node.js + TypeScript 기반 테스트 실행기
- Playwright를 사용한 UI 테스트 실행
- WebSocket을 통한 실시간 결과 전송
- Express 서버 (포트 3002)

```
runner/
├── src/
│   ├── index.ts                 # Express 서버 진입점
│   ├── controllers/
│   │   ├── testController.ts    # 테스트 실행 API
│   │   └── resultController.ts  # 결과 조회 API
│   ├── services/
│   │   ├── playwrightService.ts    # Playwright 테스트 실행
│   │   ├── websocketService.ts     # 실시간 결과 전송
│   │   └── resultStorageService.ts # 결과 저장 관리
│   ├── types/                   # TypeScript 타입 정의
│   └── utils/                   # 유틸리티 (Logger 등)
└── uploads/                     # 업로드된 테스트 스크립트
```

## 데이터베이스
- H2 Console: http://localhost:8080/h2-console
- JDBC URL: jdbc:h2:file:./data/testdb
- Username: sa, Password: (빈 값)

## API 서버
- Frontend: http://localhost:3001 (Vite가 포트 충돌 시 자동으로 다음 포트 선택: 3002, 3003 등)
- Backend API: http://localhost:8080/api
- Runner API: http://localhost:3002 (WebSocket: ws://localhost:3002/ws)

## 주요 API 엔드포인트

### 인증
- `POST /auth/login` - 로그인 (세션 기반)
- `POST /auth/logout` - 로그아웃
- `GET /auth/me` - 현재 사용자 정보

### API 관리
- `GET /items` - API 목록 조회
- `POST /items` - API 생성
- `PUT /items/{id}` - API 수정
- `DELETE /items/{id}` - API 삭제
- `POST /items/{id}/execute` - API 실행

### Pipeline 관리
- `GET /pipelines/folders` - Pipeline 폴더 구조
- `POST /pipelines` - Pipeline 생성
- `PUT /pipelines/{id}` - Pipeline 편집
- `DELETE /pipelines/{id}` - Pipeline 삭제
- `GET /pipelines/{id}/steps` - Step 목록
- `POST /pipelines/{id}/steps` - Step 추가
- `PUT /pipelines/steps/{id}` - Step 편집
- `DELETE /pipelines/steps/{id}` - Step 삭제

### Pipeline 실행
- `POST /pipelines/{id}/execute` - Pipeline 실행
- `GET /pipelines/executions/{id}` - 실행 상태 조회
- `GET /pipelines/executions/{id}/steps` - Step 실행 결과

### UI Testing
- `GET /ui-tests/folders` - UI 테스트 폴더 목록 조회
- `GET /ui-tests/folders/structure` - 폴더 구조 조회
- `GET /ui-tests/folders/{id}` - 폴더 상세 조회
- `GET /ui-tests/folders/{id}/children` - 하위 폴더 조회
- `POST /ui-tests/folders` - 폴더 생성
- `PUT /ui-tests/folders/{id}` - 폴더 수정
- `DELETE /ui-tests/folders/{id}` - 폴더 삭제
- `GET /ui-tests/scripts` - 스크립트 목록 조회
- `GET /ui-tests/scripts/{id}` - 스크립트 상세 조회
- `GET /ui-tests/folders/{folderId}/scripts` - 폴더별 스크립트 조회
- `GET /ui-tests/scripts/search` - 스크립트 검색
- `POST /ui-tests/scripts` - 스크립트 생성
- `PUT /ui-tests/scripts/{id}` - 스크립트 수정
- `DELETE /ui-tests/scripts/{id}` - 스크립트 삭제
- `POST /ui-tests/scripts/{id}/execute` - 스크립트 실행
- `GET /ui-tests/scripts/{scriptId}/files` - 스크립트 파일 목록 조회
- `GET /ui-tests/files/{id}` - 파일 상세 조회
- `POST /ui-tests/scripts/{scriptId}/files/upload` - 파일 업로드
- `DELETE /ui-tests/files/{id}` - 파일 삭제
- `POST /ui-tests/files/{id}/execute` - 파일 실행
- `POST /ui-tests/files/{id}/callback` - 파일 실행 결과 콜백
- `POST /ui-tests/files/{id}/stop` - 파일 실행 중지
- `POST /ui-tests/scripts/{scriptId}/files/stop-all` - 스크립트 내 모든 파일 실행 중지
- `GET /ui-tests/executions` - 실행 목록 조회
- `GET /ui-tests/executions/{id}` - 실행 상세 조회
- `GET /ui-tests/executions/by-execution-id/{executionId}` - 실행 ID로 조회
- `GET /ui-tests/scripts/{scriptId}/executions` - 스크립트별 실행 이력 조회
- `GET /ui-tests/executions/running` - 실행 중인 테스트 조회
- `GET /ui-tests/executions/stats` - 실행 통계 조회
- `POST /ui-tests/executions/{executionId}/cancel` - 실행 취소
- `PUT /ui-tests/executions/by-execution-id/{executionId}` - 실행 상태 업데이트
- `DELETE /ui-tests/executions/{id}` - 실행 이력 삭제
- `GET /ui-tests/health` - 헬스 체크

### Chat (채팅방 관리)
- `GET /chat/rooms` - 사용자 채팅방 목록 조회
- `GET /chat/rooms/{roomId}` - 특정 채팅방 조회
- `POST /chat/rooms` - 채팅방 생성
- `POST /chat/rooms/{roomId}/invite/{targetUserId}` - 사용자 초대
- `POST /chat/rooms/{roomId}/leave` - 채팅방 나가기
- `GET /chat/rooms/{roomId}/messages` - 채팅방 메시지 조회 (size, beforeMessageId 파라미터)
- `POST /chat/rooms/{roomId}/messages` - 메시지 전송
- `GET /chat/available-users` - 채팅 가능한 사용자 목록 조회

### Chat (읽음 상태)
- `POST /chat/rooms/{roomId}/messages/read` - 메시지 읽음 처리
- `GET /chat/rooms/{roomId}/unread-count` - 안읽은 메시지 수 조회
- `GET /chat/messages/{messageId}/read-status` - 메시지 읽음 상태 조회
- `GET /chat/messages/{messageId}/read-count` - 메시지 읽은 사용자 수 조회
- `POST /chat/messages/read-counts` - 여러 메시지 읽음 상태 일괄 조회
- `GET /chat/messages/{messageId}/read-by-me` - 현재 사용자 메시지 읽음 확인

### Chat WebSocket
- WebSocket 연결: `/ws/chat`
- `@MessageMapping /chat/{roomId}/send` - 메시지 전송 (구독: `/topic/room/{roomId}`)
- `@MessageMapping /chat/{roomId}/join` - 채팅방 입장 알림
- `@MessageMapping /chat/{roomId}/leave` - 채팅방 퇴장 알림
- `@MessageMapping /chat/{roomId}/typing` - 타이핑 표시 (구독: `/topic/room/{roomId}/typing`)
- 개인 알림 구독: `/user/queue/notifications`
- 에러 메시지 구독: `/user/queue/errors`
- 초대 알림 구독: `/user/queue/room-invitation`

## 핵심 기능

### 1. Pipeline 시스템
- **Variable Builder**: 드롭다운 기반 변수 설정 UI
- **데이터 추출**: 이전 Step 응답에서 변수 추출 (`response.data.token`)
- **데이터 주입**: 추출된 변수를 다음 Step에서 사용 (`{{token}}`)
- **Visual Flow**: 카드 형태의 Step 표시와 연결선 시각화
- **세션 유지**: HttpClient 기반 쿠키 관리

### 2. HTTP 메소드 자동 전환
- GET/DELETE → POST/PUT/PATCH: Params → Body 자동 변환
- POST/PUT/PATCH → GET/DELETE: Body → Params 자동 변환
- Content-Type 헤더 자동 관리

### 3. 외부 API 호출
- 프록시를 통한 외부 도메인 API 호출 지원
- 세션 쿠키 자동 관리
- CORS 우회 처리

## 테스트

### Backend 테스트
- JUnit 5 + Mockito
- 최소 커버리지: 5%
- 테스트 실행: `./gradlew test`
- 커버리지 리포트: `build/reports/jacoco/test/html/index.html`

### Frontend 테스트
- Vitest + React Testing Library
- 테스트 실행: `npm run test`

## 개발 환경 요구사항
- Java 17+
- Node.js 18+
- Gradle 8.5+

## 기본 계정
- Email: admin@blue.com
- Password: Admin!2024@Blue

## 주의사항
- 세션 기반 인증 사용 (JWT 토큰 아님)
- Monaco Editor 사용으로 JSON 편집 시 구문 강조 제공
- Pipeline 실행 시 Step 간 변수 전달은 `{{variable}}` 형식 사용
- 외부 API 호출 시 자동으로 프록시 경유