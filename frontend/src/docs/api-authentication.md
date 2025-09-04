# Authentication API

인증 및 권한 관리를 위한 API 엔드포인트입니다.

## 인증 방식

### 세션 기반 인증 (웹 브라우저용)

웹 애플리케이션에서 사용하는 기본 인증 방식입니다.

#### `POST /api/auth/login`

사용자 로그인을 수행합니다.

**요청 헤더:**
```
Content-Type: application/json
```

**요청 본문:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**응답 (200 OK):**
```json
{
  "success": true,
  "message": "로그인 성공",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "USER"
  }
}
```

**응답 (401 Unauthorized):**
```json
{
  "success": false,
  "message": "이메일 또는 비밀번호가 올바르지 않습니다"
}
```

#### `POST /api/auth/logout`

현재 세션을 종료합니다.

**요청 헤더:**
```
Cookie: JSESSIONID=...
```

**응답 (200 OK):**
```json
{
  "success": true,
  "message": "로그아웃 성공"
}
```

### API Key 기반 인증 (프로그래밍용)

자동화 및 프로그래밍 방식 접근을 위한 인증 방식입니다.

**헤더 형식:**
```
X-API-Key: your-api-key-here
Content-Type: application/json
```

**권한 레벨:**
- **Read-Only**: 조회 권한만
- **Execute**: 조회 + 실행 권한
- **Full-Access**: 모든 권한 (생성/수정/삭제 포함)

## 사용자 관리

#### `POST /api/auth/register`

새 사용자를 등록합니다.

**요청 본문:**
```json
{
  "email": "newuser@example.com",
  "password": "securePassword123",
  "name": "홍길동"
}
```

**응답 (201 Created):**
```json
{
  "success": true,
  "message": "회원가입이 완료되었습니다",
  "user": {
    "id": 2,
    "email": "newuser@example.com",
    "name": "홍길동",
    "role": "USER",
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

**응답 (409 Conflict):**
```json
{
  "success": false,
  "message": "이미 등록된 이메일입니다"
}
```

#### `PUT /api/auth/password`

현재 사용자의 비밀번호를 변경합니다.

**인증 필요:** 세션 또는 API Key

**요청 본문:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePassword456"
}
```

**응답 (200 OK):**
```json
{
  "success": true,
  "message": "비밀번호가 변경되었습니다"
}
```

**응답 (400 Bad Request):**
```json
{
  "success": false,
  "message": "현재 비밀번호가 일치하지 않습니다"
}
```

## 권한 확인

#### `GET /api/auth/me`

현재 사용자 정보를 조회합니다.

**인증 필요:** 세션 또는 API Key

**응답 (200 OK):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "홍길동",
  "role": "ADMIN",
  "permissions": [
    "READ_PIPELINES",
    "WRITE_PIPELINES", 
    "EXECUTE_PIPELINES",
    "MANAGE_USERS"
  ],
  "allowedFolders": [1, 2, 3],
  "createdAt": "2025-01-10T09:00:00Z"
}
```

**응답 (401 Unauthorized):**
```json
{
  "error": "Authentication required",
  "message": "유효한 인증 정보가 필요합니다"
}
```

## 오류 응답

### 공통 오류 코드

| 상태 코드 | 설명 | 예시 응답 |
|----------|------|----------|
| 400 | Bad Request | `{"error": "Invalid input", "message": "요청 데이터가 올바르지 않습니다"}` |
| 401 | Unauthorized | `{"error": "Authentication failed", "message": "인증에 실패했습니다"}` |
| 403 | Forbidden | `{"error": "Access denied", "message": "접근 권한이 없습니다"}` |
| 429 | Too Many Requests | `{"error": "Rate limit exceeded", "message": "요청 한도를 초과했습니다"}` |

### 보안 관련 오류

**잘못된 API Key:**
```json
{
  "error": "Invalid API Key",
  "message": "제공된 API Key가 유효하지 않거나 만료되었습니다",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

**권한 부족:**
```json
{
  "error": "Insufficient permissions",
  "message": "이 작업을 수행할 권한이 없습니다",
  "requiredPermission": "EXECUTE_PIPELINES"
}
```

**Rate Limit 초과:**
```json
{
  "error": "Rate limit exceeded",
  "message": "API 호출 한도를 초과했습니다",
  "retryAfter": 3600,
  "limit": 1000,
  "remaining": 0
}
```

## 보안 모범 사례

### API Key 관리
- 환경변수에 저장
- 정기적 갱신 (90일)
- 최소 권한 원칙 적용
- 사용량 모니터링

### 세션 관리
- HTTPS 사용 필수
- 세션 타임아웃 설정
- 안전한 쿠키 속성 사용
- 로그아웃 시 세션 완전 삭제

### 일반 보안
- 강력한 비밀번호 정책
- 로그인 실패 제한
- 의심스러운 활동 모니터링
- 정기적인 권한 감사