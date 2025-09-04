# Pipelines API

Pipeline 관리 및 실행을 위한 API 엔드포인트입니다.

## 폴더 관리

### `GET /api/pipelines/folders`

모든 Pipeline 폴더와 포함된 Pipeline 목록을 조회합니다.

**인증:** 세션 또는 API Key 필요

**응답 (200 OK):**
```json
[
  {
    "id": 1,
    "name": "사용자 관리",
    "description": "사용자 관련 API 테스트",
    "pipelines": [
      {
        "id": 101,
        "name": "로그인 플로우",
        "description": "로그인 → 프로필 조회",
        "stepCount": 2,
        "createdAt": "2025-01-15T10:00:00Z",
        "updatedAt": "2025-01-15T10:00:00Z"
      }
    ],
    "isActive": true,
    "createdAt": "2025-01-15T09:00:00Z",
    "updatedAt": "2025-01-15T09:00:00Z"
  }
]
```

### `POST /api/pipelines/folders`

새 Pipeline 폴더를 생성합니다.

**인증:** 관리자 권한 필요

**요청 본문:**
```json
{
  "name": "상품 관리",
  "description": "상품 CRUD 관련 테스트"
}
```

**응답 (201 Created):**
```json
{
  "id": 2,
  "name": "상품 관리", 
  "description": "상품 CRUD 관련 테스트",
  "isActive": true,
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-15T10:30:00Z"
}
```

### `PUT /api/pipelines/folders/{id}`

기존 폴더 정보를 수정합니다.

**인증:** 관리자 권한 필요

**요청 본문:**
```json
{
  "name": "사용자 관리 (수정)",
  "description": "사용자 관련 API 테스트 및 인증"
}
```

**응답 (200 OK):**
```json
{
  "id": 1,
  "name": "사용자 관리 (수정)",
  "description": "사용자 관련 API 테스트 및 인증",
  "isActive": true,
  "createdAt": "2025-01-15T09:00:00Z",
  "updatedAt": "2025-01-15T10:35:00Z"
}
```

### `DELETE /api/pipelines/folders/{id}`

폴더를 삭제합니다 (실제로는 비활성화).

**인증:** 관리자 권한 필요

**응답 (200 OK):**
```json
{
  "success": true,
  "message": "폴더가 삭제되었습니다"
}
```

## Pipeline 관리

### `GET /api/pipelines`

모든 활성 Pipeline 목록을 조회합니다.

**인증:** 세션 또는 API Key 필요

**응답 (200 OK):**
```json
[
  {
    "id": 101,
    "name": "로그인 플로우",
    "description": "사용자 로그인부터 프로필 조회까지",
    "folderId": 1,
    "stepCount": 2,
    "isActive": true,
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-15T10:00:00Z"
  }
]
```

### `POST /api/pipelines`

새 Pipeline을 생성합니다.

**인증:** 폴더 접근 권한 필요

**요청 본문:**
```json
{
  "name": "주문 처리 플로우",
  "description": "상품 조회 → 장바구니 → 주문 → 결제",
  "folderId": 2
}
```

**응답 (201 Created):**
```json
{
  "id": 102,
  "name": "주문 처리 플로우",
  "description": "상품 조회 → 장바구니 → 주문 → 결제",
  "folderId": 2,
  "stepCount": 0,
  "isActive": true,
  "createdAt": "2025-01-15T10:45:00Z",
  "updatedAt": "2025-01-15T10:45:00Z"
}
```

### `GET /api/pipelines/{id}`

특정 Pipeline의 상세 정보를 조회합니다.

**인증:** Pipeline 접근 권한 필요

**응답 (200 OK):**
```json
{
  "id": 101,
  "name": "로그인 플로우",
  "description": "사용자 로그인부터 프로필 조회까지",
  "folderId": 1,
  "stepCount": 2,
  "isActive": true,
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T10:00:00Z"
}
```

### `PUT /api/pipelines/{id}`

Pipeline 정보를 수정합니다.

**인증:** Pipeline 접근 권한 필요

**요청 본문:**
```json
{
  "name": "완전한 로그인 플로우",
  "description": "로그인 → 프로필 조회 → 권한 확인"
}
```

**응답 (200 OK):**
```json
{
  "id": 101,
  "name": "완전한 로그인 플로우",
  "description": "로그인 → 프로필 조회 → 권한 확인",
  "folderId": 1,
  "stepCount": 2,
  "isActive": true,
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T10:50:00Z"
}
```

### `DELETE /api/pipelines/{id}`

Pipeline을 삭제합니다.

**인증:** Pipeline 접근 권한 필요

**응답 (200 OK):**
```json
{
  "success": true,
  "message": "Pipeline이 삭제되었습니다"
}
```

### `GET /api/pipelines/folder/{folderId}`

특정 폴더의 Pipeline 목록을 조회합니다.

**인증:** 폴더 접근 권한 필요

**응답 (200 OK):**
```json
[
  {
    "id": 101,
    "name": "로그인 플로우",
    "description": "사용자 로그인부터 프로필 조회까지",
    "stepCount": 2,
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-15T10:00:00Z"
  }
]
```

## Pipeline 실행

### `POST /api/pipelines/{id}/execute`

Pipeline을 실행합니다.

**인증:** Pipeline 실행 권한 필요

**응답 (200 OK):**
```json
{
  "id": 1001,
  "pipelineId": 101,
  "pipelineName": "로그인 플로우",
  "status": "RUNNING",
  "startedAt": "2025-01-15T11:00:00Z",
  "completedAt": null,
  "errorMessage": null,
  "totalSteps": 2,
  "completedSteps": 0,
  "successfulSteps": 0,
  "failedSteps": 0,
  "sessionCookies": null
}
```

### `GET /api/pipelines/executions/{executionId}`

실행 상태를 조회합니다.

**인증:** 실행 조회 권한 필요

**응답 (200 OK):**
```json
{
  "id": 1001,
  "pipelineId": 101,
  "pipelineName": "로그인 플로우",
  "status": "SUCCESS",
  "startedAt": "2025-01-15T11:00:00Z",
  "completedAt": "2025-01-15T11:00:05Z",
  "errorMessage": null,
  "totalSteps": 2,
  "completedSteps": 2,
  "successfulSteps": 2,
  "failedSteps": 0
}
```

### `GET /api/pipelines/executions/{executionId}/steps`

Step별 실행 결과를 조회합니다.

**인증:** 실행 조회 권한 필요

**응답 (200 OK):**
```json
[
  {
    "id": "step-1",
    "stepName": "로그인 API",
    "stepOrder": 1,
    "status": "SUCCESS",
    "method": "POST",
    "url": "/api/auth/login",
    "statusCode": 200,
    "responseTime": 250,
    "errorMessage": null,
    "responseBody": "{\"success\": true, \"token\": \"jwt-token-here\"}",
    "responseHeaders": "Content-Type: application/json"
  },
  {
    "id": "step-2", 
    "stepName": "프로필 조회",
    "stepOrder": 2,
    "status": "SUCCESS",
    "method": "GET",
    "url": "/api/user/profile",
    "statusCode": 200,
    "responseTime": 180,
    "errorMessage": null,
    "responseBody": "{\"id\": 1, \"email\": \"user@example.com\"}",
    "responseHeaders": "Content-Type: application/json"
  }
]
```

### `GET /api/pipelines/{id}/executions`

Pipeline의 실행 히스토리를 조회합니다.

**인증:** Pipeline 접근 권한 필요

**응답 (200 OK):**
```json
[
  {
    "id": 1001,
    "status": "SUCCESS",
    "startedAt": "2025-01-15T11:00:00Z",
    "completedAt": "2025-01-15T11:00:05Z",
    "totalSteps": 2,
    "successfulSteps": 2,
    "failedSteps": 0
  },
  {
    "id": 1000,
    "status": "FAILED",
    "startedAt": "2025-01-15T10:30:00Z",
    "completedAt": "2025-01-15T10:30:03Z",
    "totalSteps": 2,
    "successfulSteps": 1,
    "failedSteps": 1,
    "errorMessage": "Step 2 failed: Connection timeout"
  }
]
```

## 실행 상태

### Pipeline 실행 상태
- `PENDING`: 실행 대기중
- `RUNNING`: 실행중
- `SUCCESS`: 모든 Step 성공 완료
- `FAILED`: 하나 이상의 Step 실패
- `CANCELLED`: 사용자가 취소

### Step 실행 상태
- `PENDING`: 실행 대기
- `RUNNING`: 실행중
- `SUCCESS`: 성공 (HTTP 2xx)
- `FAILED`: 실패 (HTTP 4xx, 5xx 또는 네트워크 오류)
- `SKIPPED`: 건너뛰기 설정됨

## 오류 응답

### Pipeline 관련 오류

**Pipeline을 찾을 수 없음:**
```json
{
  "error": "Pipeline not found",
  "message": "ID 123에 해당하는 Pipeline을 찾을 수 없습니다",
  "timestamp": "2025-01-15T11:00:00Z"
}
```

**실행 권한 부족:**
```json
{
  "error": "Execution not allowed",
  "message": "이 Pipeline을 실행할 권한이 없습니다",
  "requiredPermission": "EXECUTE_PIPELINES"
}
```

**동시 실행 제한:**
```json
{
  "error": "Execution limit exceeded", 
  "message": "동시 실행 가능한 Pipeline 수를 초과했습니다",
  "currentExecutions": 5,
  "maxExecutions": 5
}
```

## 사용 예시

### Pipeline 생성부터 실행까지

```bash
# 1. 폴더 생성
curl -X POST "http://localhost:8080/api/pipelines/folders" \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"name": "E2E 테스트", "description": "전체 플로우 테스트"}'

# 2. Pipeline 생성  
curl -X POST "http://localhost:8080/api/pipelines" \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"name": "회원가입 플로우", "folderId": 1}'

# 3. Pipeline 실행
curl -X POST "http://localhost:8080/api/pipelines/101/execute" \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json"

# 4. 실행 상태 확인
curl -X GET "http://localhost:8080/api/pipelines/executions/1001" \
  -H "X-API-Key: your-api-key"

# 5. Step별 결과 조회
curl -X GET "http://localhost:8080/api/pipelines/executions/1001/steps" \
  -H "X-API-Key: your-api-key"
```