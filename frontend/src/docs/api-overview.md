# API 개요

QA API Test Automation 플랫폼의 REST API에 대한 전체적인 개요입니다.

## 기본 정보

### Base URL
```
개발환경: http://localhost:8080/api
스테이징: https://staging-api.example.com/api
프로덕션: https://api.example.com/api
```

### API 버전
현재 버전: `v1` (URL에 버전 정보 포함되지 않음)

### 응답 형식
모든 API는 JSON 형식으로 응답합니다.

```json
{
  "success": true,
  "data": { ... },
  "message": "작업이 성공했습니다",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

## 인증 방식

### 1. 세션 기반 인증 (웹 브라우저)
- 로그인 후 세션 쿠키 자동 관리
- 웹 애플리케이션에서 사용
- CSRF 토큰 기반 보안

### 2. API Key 인증 (프로그래밍)
- HTTP 헤더에 API Key 포함
- 자동화 스크립트 및 CI/CD에서 사용
- 세밀한 권한 제어 가능

**헤더 형식:**
```
X-API-Key: your-api-key-here
Content-Type: application/json
```

## API 카테고리

### 🔐 Authentication API
사용자 인증 및 권한 관리
- 로그인/로그아웃
- 회원가입
- 비밀번호 변경
- 사용자 정보 조회

### 📁 Folders API
Pipeline 폴더 관리
- 폴더 생성/조회/수정/삭제
- 폴더별 권한 관리
- 계층 구조 관리

### 🔄 Pipelines API
테스트 시나리오 관리
- Pipeline 생성/조회/수정/삭제
- Pipeline 실행
- 실행 상태 모니터링
- 실행 히스토리 조회

### ⚙️ Steps API
Pipeline의 개별 단계 관리
- Step 생성/조회/수정/삭제
- Step 순서 관리
- 데이터 추출/주입 설정
- 실행 조건 설정

### 🧪 API Items API
개별 API 테스트 관리
- API 정의 생성/조회/수정/삭제
- API 실행 및 테스트
- 히스토리 관리

### 📊 Reports API
테스트 결과 및 리포트
- 실행 결과 조회
- 성능 지표 분석
- 리포트 생성 및 내보내기

## HTTP 상태 코드

### 성공 응답
| 코드 | 의미 | 설명 |
|------|------|------|
| 200 | OK | 요청 성공 |
| 201 | Created | 리소스 생성 성공 |
| 204 | No Content | 성공, 응답 본문 없음 |

### 클라이언트 오류
| 코드 | 의미 | 설명 |
|------|------|------|
| 400 | Bad Request | 잘못된 요청 |
| 401 | Unauthorized | 인증 필요 |
| 403 | Forbidden | 권한 부족 |
| 404 | Not Found | 리소스 없음 |
| 409 | Conflict | 리소스 충돌 |
| 422 | Unprocessable Entity | 검증 실패 |
| 429 | Too Many Requests | 요청 한도 초과 |

### 서버 오류
| 코드 | 의미 | 설명 |
|------|------|------|
| 500 | Internal Server Error | 서버 내부 오류 |
| 502 | Bad Gateway | 게이트웨이 오류 |
| 503 | Service Unavailable | 서비스 일시 중단 |

## 오류 응답 형식

### 표준 오류 형식
```json
{
  "success": false,
  "error": "Validation Error",
  "message": "입력 데이터가 올바르지 않습니다",
  "details": {
    "field": "email",
    "code": "INVALID_FORMAT",
    "message": "이메일 형식이 올바르지 않습니다"
  },
  "timestamp": "2025-01-15T10:30:00Z",
  "path": "/api/auth/login"
}
```

### 검증 오류
```json
{
  "success": false,
  "error": "Validation Error",
  "message": "입력 데이터 검증에 실패했습니다",
  "validationErrors": [
    {
      "field": "email",
      "message": "이메일은 필수입니다"
    },
    {
      "field": "password", 
      "message": "비밀번호는 최소 8자 이상이어야 합니다"
    }
  ]
}
```

## Rate Limiting

### 기본 제한
- **일반 사용자**: 시간당 1,000회
- **API Key**: 계정별 설정
- **관리자**: 무제한

### 헤더 정보
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642765200
```

### 제한 초과 시
```json
{
  "error": "Rate Limit Exceeded",
  "message": "API 호출 한도를 초과했습니다",
  "retryAfter": 3600,
  "limit": 1000,
  "remaining": 0
}
```

## 페이징

### 기본 페이징
대용량 데이터 조회 시 페이징을 지원합니다.

**요청 파라미터:**
```
GET /api/pipelines/executions?page=1&size=20&sort=createdAt,desc
```

**응답 형식:**
```json
{
  "content": [...],
  "page": {
    "number": 1,
    "size": 20,
    "totalElements": 156,
    "totalPages": 8
  },
  "sort": {
    "sorted": true,
    "by": "createdAt",
    "direction": "desc"
  }
}
```

## 필터링 및 검색

### 기본 필터링
```
GET /api/pipelines?status=ACTIVE&folder=1&created_after=2025-01-01
```

### 텍스트 검색
```
GET /api/pipelines?search=login&search_fields=name,description
```

### 고급 필터링
```json
POST /api/pipelines/search
{
  "filters": {
    "status": ["ACTIVE", "RUNNING"],
    "folder": [1, 2, 3],
    "createdAt": {
      "from": "2025-01-01T00:00:00Z",
      "to": "2025-01-31T23:59:59Z"
    }
  },
  "search": {
    "query": "user login",
    "fields": ["name", "description"]
  },
  "sort": [
    {"field": "createdAt", "direction": "desc"},
    {"field": "name", "direction": "asc"}
  ]
}
```

## CORS 설정

### 허용된 도메인
```
http://localhost:3000
http://localhost:3001
https://app.example.com
https://staging.example.com
```

### 허용된 메소드
```
GET, POST, PUT, DELETE, OPTIONS
```

### 허용된 헤더
```
Content-Type, Authorization, X-API-Key, X-Requested-With
```

## API 변경 정책

### 하위 호환성
- 마이너 버전 업데이트는 하위 호환성 유지
- 필드 추가는 언제든 가능
- 필드 제거 또는 변경은 메이저 버전 업데이트

### 변경 공지
- 중요 변경사항은 최소 30일 전 공지
- 폐기 예정 API는 `Deprecated` 헤더 포함
- 마이그레이션 가이드 제공

### 버전 관리
```
X-API-Version: 1.0
Deprecated: true
Sunset: 2025-12-31T23:59:59Z
Link: <https://docs.example.com/api/v2>; rel="successor-version"
```

## SDK 및 도구

### 공식 SDK
- JavaScript/TypeScript
- Python
- Java
- Go

### 개발 도구
- Postman Collection
- OpenAPI/Swagger 스펙
- API 클라이언트 생성기
- 테스트 데이터 생성기

## 지원 및 문의

### 문서
- API 문서: [이 문서]
- 사용자 가이드: [사용자 가이드 링크]
- FAQ: [FAQ 링크]

### 지원 채널
- 이메일: api-support@example.com
- Slack: #api-support
- GitHub Issues: [레포지토리 링크]

### SLA
- 가용성: 99.9%
- 응답 시간: < 200ms (95%ile)
- 지원 응답: 24시간 이내