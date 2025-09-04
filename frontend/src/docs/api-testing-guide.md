# API Testing 가이드

**개별 API를 테스트하고 검증하는 기본 기능입니다.**

## API Item 만들기

### 1. 새 API 추가
1. 좌측 사이드바에서 **"+ 새 아이템"** 클릭
2. API 정보 입력:
   - **이름**: API의 용도 (예: "사용자 로그인")
   - **설명**: 상세 설명 (선택사항)
   - **Method**: GET, POST, PUT, DELETE 등
   - **URL**: API 엔드포인트

### 2. Parameters 설정

**Query Parameters (GET 요청)**
```
예시: GET /api/users?page=1&size=10
- Key: page, Value: 1
- Key: size, Value: 10
```

**Request Body (POST/PUT 요청)**
```json
{
  "email": "user@example.com", 
  "password": "password123"
}
```

### 3. Headers 설정
```
Content-Type: application/json
Authorization: Bearer token-here
X-API-Key: your-api-key
```

## API 실행 및 결과 확인

### 실행하기
1. 모든 파라미터 설정 완료 후
2. **"Send Request"** 버튼 클릭
3. 응답 결과 확인

### 응답 정보 해석
- **Status Code**: HTTP 응답 코드 (200, 404, 500 등)
- **Response Time**: API 응답 시간 (밀리초)
- **Response Body**: 실제 API 응답 데이터
- **Response Headers**: 응답 헤더 정보

## 폴더로 API 관리하기

### 폴더 생성
1. **"+ 새 폴더"** 클릭
2. 폴더 이름 입력 (예: "사용자 관리", "상품 관리")
3. 관련된 API들을 같은 폴더로 분류

### API 이동 및 정리
- API 우클릭 → **"폴더 이동"**
- 드래그 앤 드롭으로 폴더 간 이동
- 폴더별로 색상 구분 가능

## 고급 기능

### 환경 변수 사용
```
Base URL: {{baseUrl}}/api/users
Authorization: Bearer {{token}}
```

### 응답 시간 측정
- 각 API 호출의 성능 모니터링
- 평균 응답 시간 추적
- 성능 이상 알림 설정

### 히스토리 관리
- 이전 실행 결과 조회
- 요청/응답 데이터 비교
- 성공/실패 패턴 분석

## 실제 사용 예시

### 예시 1: REST API 테스트
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

**기대 결과:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "test@example.com"
  }
}
```

### 예시 2: GraphQL 테스트
```http
POST /graphql
Content-Type: application/json

{
  "query": "query GetUser($id: ID!) { user(id: $id) { id name email } }",
  "variables": { "id": "1" }
}
```

### 예시 3: 파일 업로드 테스트
```http
POST /api/files/upload
Content-Type: multipart/form-data

file: [선택된 파일]
description: "테스트용 이미지"
```

## 문제 해결

### 일반적인 오류

#### CORS 오류
```
Access to fetch at 'API_URL' from origin 'ORIGIN' has been blocked by CORS policy
```
**해결 방법**: 서버에서 CORS 헤더 설정 확인

#### 인증 오류 (401)
```
HTTP 401 Unauthorized
```
**해결 방법**: 
1. API Key 또는 토큰 확인
2. Headers의 Authorization 값 검증
3. 토큰 만료 여부 확인

#### 타임아웃 오류
```
Request timeout
```
**해결 방법**:
1. 네트워크 연결 상태 확인
2. API 서버 응답 시간 확인
3. 타임아웃 설정 조정

### 디버깅 팁

1. **단계적 접근**: 간단한 GET 요청부터 시작
2. **로그 확인**: 브라우저 개발자 도구 Network 탭 활용
3. **데이터 검증**: JSON 형식 및 필수 필드 확인
4. **환경 분리**: 개발/스테이징/프로덕션 환경별 테스트

## 모범 사례

### ✅ 권장사항
- **명확한 네이밍**: API 이름을 직관적으로 작성
- **폴더 구조화**: 기능별/모듈별로 체계적 분류
- **문서화**: API 설명과 예상 결과 명시
- **버전 관리**: API 변경사항 추적

### ❌ 주의사항
- **중복 생성**: 동일한 API를 여러 번 만들지 않기
- **하드코딩**: 민감한 정보를 직접 입력하지 않기
- **무분별 실행**: 프로덕션 환경에서 주의깊게 테스트
- **결과 무시**: 실패한 테스트의 원인 분석 필수

---

다음 단계: **[Pipelines 가이드](/docs/pipelines)**에서 복잡한 시나리오 자동화를 알아보세요!