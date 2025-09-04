# API 가이드

## API 인증

이 API는 두 가지 인증 방식을 지원합니다:

### 1. 세션 기반 인증 (일반 사용자)
웹 브라우저를 통한 로그인 세션을 사용합니다.

```javascript
// 로그인
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

### 2. API Key 인증 (자동화용)
프로그래밍 방식의 접근을 위한 API Key를 사용합니다.

```javascript
// API Key를 헤더에 포함
GET /api/pipelines/folders
X-API-Key: your-api-key-here
```

## Pipeline API

### 폴더 관리

#### 폴더 목록 조회
```http
GET /api/pipelines/folders
```

**응답 예시:**
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
        "stepCount": 2
      }
    ],
    "isActive": true,
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-15T10:00:00Z"
  }
]
```

#### 폴더 생성
```http
POST /api/pipelines/folders
Content-Type: application/json

{
  "name": "새 폴더",
  "description": "폴더 설명 (선택사항)"
}
```

### Pipeline 관리

#### Pipeline 생성
```http
POST /api/pipelines
Content-Type: application/json

{
  "name": "새 Pipeline",
  "description": "Pipeline 설명",
  "folderId": 1
}
```

#### Pipeline 수정
```http
PUT /api/pipelines/{id}
Content-Type: application/json

{
  "name": "수정된 Pipeline 이름",
  "description": "수정된 설명"
}
```

#### Pipeline 삭제
```http
DELETE /api/pipelines/{id}
```

### Step 관리

#### Step 목록 조회
```http
GET /api/pipelines/{pipelineId}/steps
```

#### Step 추가
```http
POST /api/pipelines/{pipelineId}/steps
Content-Type: application/json

{
  "stepName": "로그인 API",
  "description": "사용자 로그인 처리",
  "apiItemId": 123,
  "dataExtractions": "{\"token\": \"response.data.accessToken\"}",
  "dataInjections": "{}",
  "executionCondition": "",
  "delayAfter": 1000
}
```

## Pipeline 실행 API

### Pipeline 실행
특정 Pipeline의 모든 Step을 순차적으로 실행합니다.

```http
POST /api/pipelines/{pipelineId}/execute
```

**응답 예시:**
```json
{
  "id": 1001,
  "pipelineId": 101,
  "pipelineName": "로그인 플로우",
  "status": "RUNNING",
  "startedAt": "2025-01-15T10:30:00Z",
  "totalSteps": 2,
  "completedSteps": 0,
  "successfulSteps": 0,
  "failedSteps": 0
}
```

### 실행 상태 조회
```http
GET /api/pipelines/executions/{executionId}
```

**응답 예시:**
```json
{
  "id": 1001,
  "status": "SUCCESS",
  "startedAt": "2025-01-15T10:30:00Z",
  "completedAt": "2025-01-15T10:30:05Z",
  "totalSteps": 2,
  "completedSteps": 2,
  "successfulSteps": 2,
  "failedSteps": 0
}
```

### Step 실행 결과 조회
```http
GET /api/pipelines/executions/{executionId}/steps
```

**응답 예시:**
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
    "responseBody": "{\"success\": true, \"data\": {\"accessToken\": \"jwt-token-here\"}}",
    "errorMessage": null
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
    "responseBody": "{\"id\": 1, \"email\": \"user@example.com\"}",
    "errorMessage": null
  }
]
```

## 상태 코드

### Pipeline 실행 상태
- `PENDING`: 실행 대기중
- `RUNNING`: 실행중
- `SUCCESS`: 성공 완료
- `FAILED`: 실패
- `CANCELLED`: 취소됨

### Step 실행 상태
- `PENDING`: 실행 대기
- `RUNNING`: 실행중
- `SUCCESS`: 성공
- `FAILED`: 실패
- `SKIPPED`: 건너뛰기

## 오류 응답

### 공통 오류 형식
```json
{
  "error": "Bad Request",
  "message": "요청이 잘못되었습니다",
  "timestamp": "2025-01-15T10:30:00Z",
  "path": "/api/pipelines/123"
}
```

### 주요 오류 코드
- `400 Bad Request`: 잘못된 요청 형식
- `401 Unauthorized`: 인증 실패
- `403 Forbidden`: 권한 없음
- `404 Not Found`: 리소스를 찾을 수 없음
- `500 Internal Server Error`: 서버 내부 오류

## 예제 시나리오

### 로그인 → API 호출 플로우
```javascript
// 1. Pipeline 생성
const pipeline = await fetch('/api/pipelines', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    name: '로그인 플로우',
    folderId: 1
  })
});

// 2. 로그인 Step 추가
await fetch(`/api/pipelines/${pipeline.id}/steps`, {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    stepName: '로그인',
    apiItemId: 123,
    dataExtractions: '{"token": "response.data.accessToken"}'
  })
});

// 3. API 호출 Step 추가  
await fetch(`/api/pipelines/${pipeline.id}/steps`, {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    stepName: '프로필 조회',
    apiItemId: 124,
    dataInjections: '{"headers.Authorization": "Bearer {{token}}"}'
  })
});

// 4. Pipeline 실행
const execution = await fetch(`/api/pipelines/${pipeline.id}/execute`, {
  method: 'POST'
});

// 5. 결과 확인
const results = await fetch(`/api/pipelines/executions/${execution.id}/steps`);
```