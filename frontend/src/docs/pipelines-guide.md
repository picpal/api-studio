# Pipelines 가이드

**복잡한 API 테스트 시나리오를 자동화하는 강력한 기능입니다.**

## Pipeline 기본 개념

### Pipeline이란?
여러 API 호출을 순차적으로 실행하여 복잡한 비즈니스 플로우를 테스트하는 것

```
예시: 전자상거래 주문 플로우
1. 로그인 API → 토큰 추출
2. 상품 조회 API → 상품 정보 확인  
3. 장바구니 추가 API → 토큰 사용
4. 주문 생성 API → 주문 ID 추출
5. 결제 API → 주문 ID 사용
```

## Pipeline 만들기

### 1. 폴더 생성하기

좌측 사이드바에서 **"+ 새 폴더"** 버튼을 클릭합니다.

```
예시: "사용자 관리" 폴더 만들기
- 이름: 사용자 관리
- 설명: 사용자 로그인, 프로필 관련 테스트
```

### 2. Pipeline 생성하기

폴더 우클릭 → **"Add Pipeline"** 선택 또는 폴더 선택 후 **"+ New Pipeline"** 클릭

```
예시: "로그인 플로우" Pipeline 만들기
- 이름: 로그인 플로우
- 설명: 로그인 → 프로필 조회 → 설정 변경
```

### 3. Pipeline 편집하기

Pipeline을 클릭하면 상세 페이지로 이동합니다. 여기서 Pipeline 제목과 설명을 수정할 수 있습니다.

## Step 관리하기

### Step 추가하기

1. Pipeline 상세 페이지에서 **"+ 새 단계 추가"** 클릭
2. 기존 API 항목 선택 또는 새로 생성
3. Step 정보 입력:
   - **단계 이름**: 이 Step이 무엇을 하는지 설명
   - **설명**: 상세 설명 (선택사항)
   - **API 선택**: 실행할 API 선택

### Step 순서 변경하기

Visual Flow에서 Step 카드를 드래그해서 순서를 변경할 수 있습니다.

### Step 편집하기

Step 카드를 클릭하면 편집 모달이 열립니다:

- **기본 정보**: 이름, 설명 수정
- **데이터 연결**: 변수 추출/주입 설정
- **실행 옵션**: 대기시간, 건너뛰기 설정

## 데이터 연결하기

API 테스트에서 가장 중요한 기능입니다. 이전 API의 응답을 다음 API에서 사용할 수 있습니다.

### 데이터 추출 (Variable Extraction)

API 응답에서 필요한 값을 변수로 저장합니다.

**예시: 로그인 API에서 토큰 추출**
```json
{
  "token": "response.data.accessToken",
  "userId": "response.data.user.id"
}
```

위 설정은 다음 응답에서 값을 추출합니다:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 123,
      "email": "user@example.com"
    }
  }
}
```

결과:
- `token` 변수에 `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` 저장
- `userId` 변수에 `123` 저장

### 데이터 주입 (Variable Injection)

저장된 변수를 다음 API 요청에서 사용합니다.

**예시: 인증이 필요한 API 호출**
```json
{
  "headers.Authorization": "Bearer {{token}}",
  "params.userId": "{{userId}}"
}
```

실제 요청 시:
```http
GET /api/user/profile?userId=123
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Variable Builder 사용하기

복잡한 JSON 경로를 직접 입력하는 대신 **Variable Builder**를 사용하세요:

1. **"+ 변수 추가"** 클릭
2. **변수 이름** 입력 (예: `token`)
3. **추출 경로** 드롭다운에서 선택
4. 샘플 응답이 있다면 자동 완성 제안

## 실행 및 결과 보기

### Pipeline 실행하기

1. Pipeline 상세 페이지에서 **"▶️ 실행"** 버튼 클릭
2. 실행 상태 모달이 열리며 진행상황 표시
3. 각 Step별 실행 결과 실시간 확인

### 실행 상태 이해하기

#### Pipeline 상태
- 🟡 **PENDING**: 실행 대기중
- 🔵 **RUNNING**: 실행중
- 🟢 **SUCCESS**: 모든 Step 성공
- 🔴 **FAILED**: 하나 이상의 Step 실패
- ⚫ **CANCELLED**: 사용자가 취소

#### Step 상태
- ⏸️ **PENDING**: 실행 대기
- ⏯️ **RUNNING**: 실행중
- ✅ **SUCCESS**: 성공 (HTTP 2xx)
- ❌ **FAILED**: 실패 (HTTP 4xx, 5xx 또는 네트워크 오류)
- ⏭️ **SKIPPED**: 건너뛰기 설정됨

### 결과 분석하기

실행 결과에서 확인할 수 있는 정보:

- **응답 시간**: 각 API 호출이 얼마나 걸렸는지
- **상태 코드**: HTTP 응답 상태 (200, 404, 500 등)
- **응답 내용**: 실제 API 응답 데이터
- **오류 메시지**: 실패한 경우 상세 오류 정보

## 고급 기능

### Step 건너뛰기

특정 Step을 일시적으로 비활성화할 수 있습니다:

1. Step 카드의 ⏭️ 아이콘 클릭
2. 건너뛰기가 활성화되면 회색으로 표시
3. 실행 시 해당 Step은 `SKIPPED` 상태가 됩니다

### 대기 시간 설정

각 Step 완료 후 다음 Step 실행 전 대기 시간을 설정할 수 있습니다:

```
예시: 파일 업로드 후 처리 대기
- Step 1: 파일 업로드
- 대기시간: 2000ms (2초)
- Step 2: 처리 상태 확인
```

### 조건부 실행 (향후 지원 예정)

특정 조건에 따라 Step 실행 여부를 결정할 수 있습니다:

```javascript
// 이전 Step의 응답 코드가 200일 때만 실행
response.statusCode === 200

// 특정 값이 있을 때만 실행  
response.data.hasPermission === true
```

## 실제 사용 예시

### 예시 1: 사용자 등록 → 로그인 → 프로필 수정

**Step 1: 사용자 등록**
- API: `POST /api/auth/register`
- 추출: `{"userId": "response.data.id"}`

**Step 2: 로그인**  
- API: `POST /api/auth/login`
- 주입: `{"body.userId": "{{userId}}"}`
- 추출: `{"token": "response.data.accessToken"}`

**Step 3: 프로필 수정**
- API: `PUT /api/user/profile`
- 주입: `{"headers.Authorization": "Bearer {{token}}"}`

### 예시 2: 파일 업로드 → 처리 → 결과 다운로드

**Step 1: 파일 업로드**
- API: `POST /api/files/upload`
- 추출: `{"fileId": "response.fileId"}`

**Step 2: 처리 요청**
- API: `POST /api/files/process`  
- 주입: `{"body.fileId": "{{fileId}}"}`
- 추출: `{"jobId": "response.jobId"}`
- 대기시간: 3000ms

**Step 3: 처리 상태 확인**
- API: `GET /api/jobs/status`
- 주입: `{"params.jobId": "{{jobId}}"}`

**Step 4: 결과 다운로드**
- API: `GET /api/files/download`
- 주입: `{"params.fileId": "{{fileId}}"}`

## 팁과 요령

### 🔍 디버깅 팁

1. **단계별 확인**: 복잡한 Pipeline은 Step을 하나씩 추가하며 테스트
2. **변수 확인**: 데이터 추출이 제대로 되었는지 실행 결과에서 확인
3. **응답 분석**: API 응답 구조를 먼저 파악한 후 추출 경로 설정

### ⚡ 효율성 팁

1. **폴더 구조화**: 기능별로 폴더를 나누어 관리
2. **재사용**: 비슷한 Pipeline은 복사해서 수정
3. **명명 규칙**: Step 이름을 명확하고 일관성 있게 작성

### 🚨 주의사항

1. **API 순서**: 의존성이 있는 API는 올바른 순서로 배치
2. **데이터 타입**: 숫자 값이 문자열로 추출될 수 있음에 주의
3. **인증 토큰**: 토큰 만료 시간을 고려하여 테스트 설계
4. **네트워크**: 외부 API 호출 시 네트워크 상태 확인

## 자주 묻는 질문

### Q: Pipeline이 중간에 실패하면 어떻게 되나요?
A: 실패한 Step에서 Pipeline 실행이 중단됩니다. 실행 결과에서 어떤 Step에서 왜 실패했는지 확인할 수 있습니다.

### Q: 변수가 제대로 추출되지 않아요.
A: 1) API 응답 구조 확인 2) 추출 경로 문법 확인 3) Sample Response에서 테스트해보세요.

### Q: 동일한 API를 여러 번 호출해야 해요.
A: 각각 별도 Step으로 추가하고, 서로 다른 파라미터를 주입하면 됩니다.

### Q: Pipeline 실행이 너무 오래 걸려요.
A: 불필요한 대기 시간을 줄이거나, 병렬 실행이 가능한 Step은 별도 Pipeline로 분리하세요.

---

다음 단계: **[Test&Report 가이드](/docs/test-report)**에서 결과 분석 방법을 알아보세요!