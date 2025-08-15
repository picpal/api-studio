# 프로젝트 구조

## 📁 디렉토리 구조

```
feature-test/
├── backend/                    # Spring Boot 백엔드
│   ├── src/main/java/com/example/apitest/
│   │   ├── controller/        # REST API 컨트롤러
│   │   ├── entity/           # JPA 엔티티
│   │   ├── repository/       # 데이터 액세스 레이어
│   │   ├── service/          # 비즈니스 로직
│   │   └── config/           # 설정 클래스
│   └── data/                 # H2 데이터베이스 파일
├── frontend/                   # React + TypeScript 프론트엔드
│   ├── src/
│   │   ├── components/       # React 컴포넌트
│   │   ├── hooks/           # 커스텀 훅
│   │   ├── services/        # API 클라이언트
│   │   ├── types/           # TypeScript 타입 정의
│   │   └── utils/           # 유틸리티 함수
│   └── public/              # 정적 파일
├── docs/                      # 프로젝트 문서
└── Postman_*.json            # API 테스트 컬렉션
```

## 🔧 주요 기능

### 백엔드 (Spring Boot)
- **API 관리**: API 아이템 CRUD
- **폴더 관리**: API 그룹화
- **파라미터 관리**: 요청 파라미터 상세 관리
- **사용자 인증**: 세션 기반 인증
- **관리자 기능**: 사용자 및 권한 관리
- **활동 로깅**: 사용자 활동 추적

### 프론트엔드 (React + TypeScript)
- **사이드바**: 폴더/아이템 트리 구조
- **API 테스터**: 요청/응답 테스트 인터페이스  
- **파라미터 관리**: 요청 파라미터 편집
- **관리자 페이지**: 사용자/권한 관리 UI
- **반응형 디자인**: 모바일/데스크톱 지원

## 📡 API 엔드포인트

### 인증
- `POST /api/auth/login` - 로그인
- `POST /api/auth/logout` - 로그아웃
- `GET /api/auth/me` - 현재 사용자 정보

### API 아이템 관리
- `GET /api/items` - 모든 아이템 조회
- `GET /api/items/{id}` - 아이템 상세 조회 (파라미터 포함)
- `POST /api/items` - 아이템 생성
- `PUT /api/items/{id}` - 아이템 수정
- `DELETE /api/items/{id}` - 아이템 삭제

### 폴더 관리
- `GET /api/folders` - 모든 폴더 조회
- `POST /api/folders` - 폴더 생성
- `PUT /api/folders/{id}` - 폴더 수정
- `DELETE /api/folders/{id}` - 폴더 삭제

### 히스토리 관리 (NEW!)
- `POST /api/items/{id}/history` - 히스토리 저장
- `GET /api/items/{id}/history` - 히스토리 목록 조회
- `GET /api/items/{id}/history/{historyId}` - 히스토리 상세 조회
- `DELETE /api/items/{id}/history/{historyId}` - 히스토리 삭제

## 🗄️ 데이터베이스 스키마

### 주요 테이블
- `api_item` - API 아이템 정보
- `api_parameter` - 요청 파라미터 정보
- `api_folder` - 폴더 정보
- `api_item_history` - API 아이템 히스토리 (스냅샷)
- `user` - 사용자 정보
- `user_activity` - 사용자 활동 로그

## 🚀 실행 방법

### 백엔드
```bash
cd backend
./gradlew bootRun
```

### 프론트엔드
```bash
cd frontend
npm install
npm run dev
```

## 📋 최근 수정사항

- ✅ 요청 파라미터 탭 조회/매핑 문제 해결
- ✅ 프론트엔드 타입 정의 업데이트 (`ApiParameterItem` 추가)
- ✅ 개별 아이템 조회 API 연동 (`itemApi.getById`)
- ✅ 불필요한 파일들 정리 (쿠키, 중복 파일 등)
- ✅ `.gitignore` 추가 및 보안 강화
- ✅ 디버그 버튼 및 개발용 로그 제거
- ✅ **저장 이력 관리 기능 추가**
  - 히스토리 저장 팝업 (`SaveHistoryModal`)
  - 히스토리 select box (최신 등록순 정렬)
  - 데이터베이스 저장 (`api_item_history` 테이블)
  - 10개 이력 제한 및 자동 정리
  - 히스토리별 스냅샷 복원 기능