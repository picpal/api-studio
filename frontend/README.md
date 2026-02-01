# API Studio Frontend

QA 팀을 위한 API 테스트 자동화 도구의 프론트엔드

## 기술 스택

- **React 19** + **TypeScript**
- **Vite** (빌드 도구)
- **Tailwind CSS** (스타일링)
- **FSD 아키텍처** (Feature-Sliced Design)
- **Monaco Editor** (JSON 편집)
- **Axios** (API 통신)

## 스크립트

```bash
# 개발 서버 실행 (http://localhost:3001)
npm run dev

# 프로덕션 빌드
npm run build

# 번들 분석과 함께 빌드
npm run build:analyze

# 빌드 결과 미리보기
npm run preview

# 테스트 실행
npm run test

# 린트 실행
npm run lint
```

## 디렉토리 구조 (FSD)

```
src/
├── entities/         # 도메인 엔티티 타입 정의
├── features/         # 기능별 모듈
│   ├── api-testing/         # API 테스트 관리
│   ├── pipeline-management/ # Pipeline 관리
│   ├── admin/               # 관리자 기능
│   └── history-management/  # 히스토리 관리
├── widgets/          # 재사용 가능한 UI 블록
├── pages/            # 라우팅 페이지
├── shared/           # 공통 유틸리티, 컴포넌트
├── contexts/         # React Context
├── hooks/            # 커스텀 훅
├── services/         # API 서비스 레이어
└── config/           # 설정 파일
```

## 환경 설정

- Backend API: `http://localhost:8080/api`
- Frontend Dev Server: `http://localhost:3001`

## 주요 의존성

| 패키지 | 용도 |
|--------|------|
| @monaco-editor/react | JSON 편집기 |
| @dnd-kit | 드래그 앤 드롭 |
| react-router-dom | 라우팅 |
| axios | HTTP 클라이언트 |
| @stomp/stompjs | WebSocket 통신 |
