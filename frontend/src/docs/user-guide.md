# 사용자 가이드

## 시작하기

QA API Test Automation 도구는 API 테스트를 쉽고 체계적으로 수행할 수 있도록 도와주는 웹 기반 플랫폼입니다.

### 🌟 주요 기능
- 🧪 **개별 API 테스트**: 단일 API 호출 및 검증
- 🔄 **자동화 테스트**: 복잡한 테스트 시나리오 자동 실행
- 📊 **테스트 리포트**: 상세한 실행 결과 및 분석
- 🔗 **데이터 연결**: API 간 데이터 흐름 관리
- 📁 **체계적 관리**: 폴더와 그룹으로 테스트 조직화

### 🎯 사용 대상
- **QA 엔지니어**: 체계적인 API 테스트 수행
- **개발자**: API 개발 시 빠른 테스트 및 검증
- **팀 리드**: 전체 프로젝트의 API 품질 관리

### 💡 핵심 개념
- **API Item**: 개별 API 호출 정의 (URL, Method, Parameters 등)
- **Pipeline**: 여러 API를 순차적으로 실행하는 시나리오
- **Step**: Pipeline 내의 개별 API 호출 단위
- **데이터 추출/주입**: API 응답 데이터를 다른 API에서 재사용

---

## 📝 회원가입 및 로그인

### 계정 생성
1. 로그인 페이지에서 **"회원가입"** 클릭
2. 이메일과 비밀번호 입력
3. 계정 생성 완료 후 로그인

### 로그인
1. 등록한 이메일과 비밀번호 입력
2. **"로그인"** 버튼 클릭
3. 메인 대시보드로 이동

### 비밀번호 변경
1. 우측 상단 사용자 메뉴 클릭
2. **"비밀번호 변경"** 선택
3. 현재 비밀번호와 새 비밀번호 입력

---

## 🧪 API Testing 페이지

**개별 API를 테스트하고 검증하는 기본 기능입니다.**

### API Item 만들기

#### 1. 새 API 추가
1. 좌측 사이드바에서 **"+ 새 아이템"** 클릭
2. API 정보 입력:
   - **이름**: API의 용도 (예: "사용자 로그인")
   - **설명**: 상세 설명 (선택사항)
   - **Method**: GET, POST, PUT, DELETE 등
   - **URL**: API 엔드포인트

#### 2. Parameters 설정

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

#### 3. Headers 설정
```
Content-Type: application/json
Authorization: Bearer token-here
X-API-Key: your-api-key
```

### API 실행 및 결과 확인

#### 실행하기
1. 모든 파라미터 설정 완료 후
2. **"Send Request"** 버튼 클릭
3. 응답 결과 확인

#### 응답 정보 해석
- **Status Code**: HTTP 응답 코드 (200, 404, 500 등)
- **Response Time**: API 응답 시간 (밀리초)
- **Response Body**: 실제 API 응답 데이터
- **Response Headers**: 응답 헤더 정보

### 폴더로 API 관리하기

#### 폴더 생성
1. **"+ 새 폴더"** 클릭
2. 폴더 이름 입력 (예: "사용자 관리", "상품 관리")
3. 관련된 API들을 같은 폴더로 분류

#### API 이동 및 정리
- API 우클릭 → **"폴더 이동"**
- 드래그 앤 드롭으로 폴더 간 이동
- 폴더별로 색상 구분 가능

---

## 📊 Test&Report 페이지

**테스트 히스토리와 상세한 리포트를 확인하는 페이지입니다.**

### 테스트 히스토리 보기

#### 1. 개별 API 테스트 기록
- 각 API 호출의 성공/실패 여부
- 호출 시간 및 응답 시간
- 요청/응답 데이터 스냅샷

#### 2. Pipeline 실행 기록
- Pipeline별 전체 실행 결과
- Step별 상세 성공/실패 분석
- 실행 시간 및 성능 지표

### 리포트 분석하기

#### 성공률 분석
```
예시 리포트:
- 총 실행: 100회
- 성공: 95회 (95%)
- 실패: 5회 (5%)
- 평균 응답시간: 250ms
```

#### 오류 패턴 분석
- 자주 발생하는 오류 유형
- 특정 API의 불안정성 확인
- 시간대별 성능 변화

### 테스트 데이터 내보내기

#### CSV 내보내기
1. 기간 선택 (예: 최근 7일)
2. **"Export to CSV"** 클릭
3. Excel에서 추가 분석 가능

#### 리포트 공유
1. **"Share Report"** 클릭
2. 공유 링크 생성
3. 팀원들과 결과 공유

---

## 🔧 Admin 페이지 (관리자 전용)

**시스템 관리 및 사용자 권한을 관리하는 페이지입니다.**

### 사용자 관리

#### 사용자 목록 보기
- 등록된 모든 사용자 조회
- 사용자별 활동 상태 확인
- 권한 레벨 관리

#### 권한 설정
- **일반 사용자**: API 테스트 및 Pipeline 생성
- **관리자**: 전체 시스템 관리 권한
- **읽기 전용**: 조회만 가능

### 폴더 권한 관리

#### 폴더별 접근 제어
```
예시 권한 설정:
- "결제 API" 폴더: 결제팀만 접근 가능
- "사용자 API" 폴더: 모든 사용자 접근 가능
- "관리자 API" 폴더: 관리자만 접근 가능
```

#### API Key 발급 및 관리
1. 사용자 선택
2. **"API Key 생성"** 클릭
3. 폴더별 접근 권한 설정
4. 생성된 Key 사용자에게 전달

---

## 🔑 API Key 발급 요청 방법

**프로그래밍 방식으로 API를 호출하려면 API Key가 필요합니다.**

### 1. API Key 요청 방법

#### 내부 팀원인 경우
1. 팀 관리자 또는 시스템 관리자에게 연락
2. 다음 정보 제공:
   - 사용 목적 (예: 자동화 테스트, CI/CD 연동)
   - 필요한 폴더 접근 권한
   - 사용 기간
3. 승인 후 API Key 수령

#### 외부 협력사인 경우
1. 공식 채널을 통해 요청서 제출
2. 다음 문서 준비:
   - 사용 목적서
   - 보안 서약서
   - 접근 필요 범위
3. 검토 후 제한적 권한으로 발급

### 2. API Key 사용법

#### 기본 사용 방법
```javascript
// HTTP Header에 포함
fetch('/api/pipelines/folders', {
  headers: {
    'X-API-Key': 'your-api-key-here',
    'Content-Type': 'application/json'
  }
});
```

#### cURL 예시
```bash
curl -X GET "http://localhost:8080/api/pipelines/folders" \
  -H "X-API-Key: your-api-key-here" \
  -H "Content-Type: application/json"
```

### 3. API Key 보안 수칙

#### ✅ 해야 할 것
- 환경변수나 설정 파일에 저장
- 정기적으로 갱신 요청
- 사용하지 않는 Key는 즉시 폐기 요청

#### ❌ 하지 말아야 할 것
- 코드에 직접 하드코딩
- 공개 저장소에 업로드
- 타인과 공유
- 로그에 출력

---

## 🚀 Pipelines 페이지 (고급 사용법)

**복잡한 API 테스트 시나리오를 자동화하는 강력한 기능입니다.**

### Pipeline 기본 개념

#### Pipeline이란?
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

### Q: API Key 인증은 어떻게 설정하나요?
A: API 항목 생성 시 Headers에 `X-API-Key` 또는 `Authorization` 헤더를 추가하세요.

---

더 자세한 정보나 문의사항이 있으시면 개발팀에 문의해주세요! 📧