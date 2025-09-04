# Steps API

Pipeline Step 관리를 위한 API 엔드포인트입니다.

## Step 관리

### `GET /api/pipelines/{pipelineId}/steps`

특정 Pipeline의 모든 Step을 조회합니다.

**인증:** Pipeline 접근 권한 필요

**응답 (200 OK):**
```json
[
  {
    "id": 1,
    "stepName": "사용자 로그인",
    "description": "이메일과 비밀번호로 로그인",
    "stepOrder": 1,
    "apiItem": {
      "id": 123,
      "name": "로그인 API",
      "method": "POST",
      "url": "/api/auth/login"
    },
    "dataExtractions": "{\"token\": \"response.data.accessToken\"}",
    "dataInjections": "{}",
    "executionCondition": "",
    "delayAfter": 0,
    "isSkip": false,
    "isActive": true,
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-15T10:00:00Z"
  },
  {
    "id": 2,
    "stepName": "프로필 조회",
    "description": "로그인한 사용자의 프로필 정보 조회",
    "stepOrder": 2,
    "apiItem": {
      "id": 124,
      "name": "프로필 조회 API",
      "method": "GET",
      "url": "/api/user/profile"
    },
    "dataExtractions": "{}",
    "dataInjections": "{\"headers.Authorization\": \"Bearer {{token}}\"}",
    "executionCondition": "",
    "delayAfter": 1000,
    "isSkip": false,
    "isActive": true,
    "createdAt": "2025-01-15T10:05:00Z",
    "updatedAt": "2025-01-15T10:05:00Z"
  }
]
```

### `POST /api/pipelines/{pipelineId}/steps`

새 Step을 추가합니다.

**인증:** Pipeline 접근 권한 필요

**요청 본문:**
```json
{
  "stepName": "비밀번호 변경",
  "description": "사용자 비밀번호 변경 처리",
  "apiItemId": 125,
  "dataExtractions": "{}",
  "dataInjections": "{\"headers.Authorization\": \"Bearer {{token}}\"}",
  "executionCondition": "",
  "delayAfter": 500
}
```

**응답 (201 Created):**
```json
{
  "id": 3,
  "stepName": "비밀번호 변경",
  "description": "사용자 비밀번호 변경 처리",
  "stepOrder": 3,
  "apiItem": {
    "id": 125,
    "name": "비밀번호 변경 API",
    "method": "PUT",
    "url": "/api/auth/password"
  },
  "dataExtractions": "{}",
  "dataInjections": "{\"headers.Authorization\": \"Bearer {{token}}\"}",
  "executionCondition": "",
  "delayAfter": 500,
  "isSkip": false,
  "isActive": true,
  "createdAt": "2025-01-15T10:15:00Z",
  "updatedAt": "2025-01-15T10:15:00Z"
}
```

### `PUT /api/pipelines/steps/{stepId}`

기존 Step을 수정합니다.

**인증:** Pipeline 접근 권한 필요

**요청 본문:**
```json
{
  "stepName": "사용자 로그인 (수정)",
  "description": "이메일과 비밀번호로 로그인 처리",
  "apiItemId": 123,
  "dataExtractions": "{\"token\": \"response.data.accessToken\", \"userId\": \"response.data.user.id\"}",
  "dataInjections": "{}",
  "executionCondition": "",
  "delayAfter": 1000
}
```

**응답 (200 OK):**
```json
{
  "id": 1,
  "stepName": "사용자 로그인 (수정)",
  "description": "이메일과 비밀번호로 로그인 처리",
  "stepOrder": 1,
  "apiItem": {
    "id": 123,
    "name": "로그인 API",
    "method": "POST",
    "url": "/api/auth/login"
  },
  "dataExtractions": "{\"token\": \"response.data.accessToken\", \"userId\": \"response.data.user.id\"}",
  "dataInjections": "{}",
  "executionCondition": "",
  "delayAfter": 1000,
  "isSkip": false,
  "isActive": true,
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T10:20:00Z"
}
```

### `DELETE /api/pipelines/steps/{stepId}`

Step을 삭제합니다.

**인증:** Pipeline 접근 권한 필요

**응답 (200 OK):**
```json
{
  "success": true,
  "message": "Step이 삭제되었습니다"
}
```

## Step 순서 관리

### `PUT /api/pipelines/steps/{stepId}/order`

개별 Step의 순서를 변경합니다.

**인증:** Pipeline 접근 권한 필요

**요청 본문:**
```json
{
  "newOrder": 1
}
```

**응답 (200 OK):**
```json
[
  {
    "id": 2,
    "stepName": "프로필 조회",
    "stepOrder": 1
  },
  {
    "id": 1,
    "stepName": "사용자 로그인",
    "stepOrder": 2
  },
  {
    "id": 3,
    "stepName": "비밀번호 변경",
    "stepOrder": 3
  }
]
```

### `PUT /api/pipelines/{pipelineId}/steps/batch-reorder`

여러 Step의 순서를 한 번에 변경합니다.

**인증:** Pipeline 접근 권한 필요

**요청 본문:**
```json
{
  "steps": [
    {
      "stepId": 1,
      "newOrder": 3
    },
    {
      "stepId": 2,
      "newOrder": 1
    },
    {
      "stepId": 3,
      "newOrder": 2
    }
  ]
}
```

**응답 (200 OK):**
```json
[
  {
    "id": 2,
    "stepName": "프로필 조회",
    "stepOrder": 1,
    "isSkip": false
  },
  {
    "id": 3,
    "stepName": "비밀번호 변경",
    "stepOrder": 2,
    "isSkip": false
  },
  {
    "id": 1,
    "stepName": "사용자 로그인",
    "stepOrder": 3,
    "isSkip": false
  }
]
```

## Step 실행 옵션

### `PUT /api/pipelines/steps/{stepId}/skip`

Step의 건너뛰기 상태를 변경합니다.

**인증:** Pipeline 접근 권한 필요

**요청 본문:**
```json
{
  "skip": true
}
```

**응답 (200 OK):**
```json
{
  "id": 2,
  "stepName": "프로필 조회",
  "stepOrder": 2,
  "isSkip": true,
  "isActive": true,
  "updatedAt": "2025-01-15T10:25:00Z"
}
```

## 데이터 추출 및 주입

### 데이터 추출 (Data Extraction)

API 응답에서 변수를 추출하는 설정입니다.

**JSON 형식:**
```json
{
  "변수명": "추출경로"
}
```

**예시:**
```json
{
  "token": "response.data.accessToken",
  "userId": "response.data.user.id",
  "userEmail": "response.data.user.email"
}
```

**추출 가능한 데이터:**
- `response.data.*`: 응답 본문의 데이터
- `response.status`: HTTP 상태 코드
- `response.headers.*`: 응답 헤더
- `response.cookies.*`: 응답 쿠키

### 데이터 주입 (Data Injection)

추출된 변수를 다음 API 요청에 사용하는 설정입니다.

**JSON 형식:**
```json
{
  "대상경로": "{{변수명}}"
}
```

**예시:**
```json
{
  "headers.Authorization": "Bearer {{token}}",
  "params.userId": "{{userId}}",
  "body.email": "{{userEmail}}"
}
```

**주입 가능한 위치:**
- `headers.*`: 요청 헤더
- `params.*`: URL 쿼리 파라미터
- `body.*`: 요청 본문
- `cookies.*`: 요청 쿠키

## 실행 조건

### 조건부 실행 (향후 지원)

특정 조건에 따라 Step 실행 여부를 결정합니다.

**지원 예정 조건:**
```javascript
// 이전 Step의 응답 코드 확인
response.statusCode === 200

// 응답 데이터 값 확인
response.data.success === true

// 변수 값 확인
{{userId}} !== null

// 복합 조건
response.statusCode === 200 && response.data.hasPermission === true
```

## 딜레이 설정

### `delayAfter` 속성

Step 완료 후 다음 Step 실행 전까지의 대기 시간을 밀리초 단위로 설정합니다.

**사용 예시:**
```json
{
  "delayAfter": 2000  // 2초 대기
}
```

**권장 사용 케이스:**
- 파일 업로드 후 처리 대기
- 외부 API의 Rate Limiting 회피
- 데이터베이스 업데이트 완료 대기
- 비동기 작업 완료 대기

## 오류 응답

### Step 관련 오류

**Step을 찾을 수 없음:**
```json
{
  "error": "Step not found",
  "message": "ID 123에 해당하는 Step을 찾을 수 없습니다"
}
```

**잘못된 API Item:**
```json
{
  "error": "API item not found",
  "message": "지정된 API Item이 존재하지 않습니다",
  "apiItemId": 999
}
```

**잘못된 순서 값:**
```json
{
  "error": "Invalid order",
  "message": "Step 순서는 1부터 시작해야 합니다",
  "providedOrder": 0,
  "validRange": "1-5"
}
```

**데이터 추출 오류:**
```json
{
  "error": "Invalid extraction path",
  "message": "잘못된 데이터 추출 경로입니다",
  "path": "response.data.nonexistent",
  "validPaths": ["response.data", "response.status", "response.headers"]
}
```

## 사용 예시

### Step 생성 및 관리

```bash
# 1. Step 목록 조회
curl -X GET "http://localhost:8080/api/pipelines/101/steps" \
  -H "X-API-Key: your-api-key"

# 2. 새 Step 추가
curl -X POST "http://localhost:8080/api/pipelines/101/steps" \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "stepName": "로그인",
    "apiItemId": 123,
    "dataExtractions": "{\"token\": \"response.data.accessToken\"}",
    "delayAfter": 1000
  }'

# 3. Step 순서 변경
curl -X PUT "http://localhost:8080/api/pipelines/steps/1/order" \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"newOrder": 2}'

# 4. Step 건너뛰기 설정
curl -X PUT "http://localhost:8080/api/pipelines/steps/1/skip" \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"skip": true}'

# 5. Step 삭제
curl -X DELETE "http://localhost:8080/api/pipelines/steps/1" \
  -H "X-API-Key: your-api-key"
```

### 복잡한 데이터 흐름 예시

```bash
# Step 1: 로그인 (토큰 추출)
{
  "stepName": "로그인",
  "dataExtractions": "{\"token\": \"response.data.accessToken\", \"refreshToken\": \"response.data.refreshToken\"}"
}

# Step 2: 프로필 조회 (토큰 사용, 사용자 ID 추출)
{
  "stepName": "프로필 조회", 
  "dataInjections": "{\"headers.Authorization\": \"Bearer {{token}}\"}",
  "dataExtractions": "{\"userId\": \"response.data.id\"}"
}

# Step 3: 주문 생성 (토큰과 사용자 ID 사용)
{
  "stepName": "주문 생성",
  "dataInjections": "{\"headers.Authorization\": \"Bearer {{token}}\", \"body.userId\": \"{{userId}}\"}"
}
```