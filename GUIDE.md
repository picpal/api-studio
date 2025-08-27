# API Test Automation Tool 사용 가이드

## 목차
1. [시작하기](#시작하기)
2. [API Testing](#api-testing)
3. [Test Automation (Pipeline)](#test-automation-pipeline)
4. [모바일/태블릿 사용법](#모바일태블릿-사용법)
5. [자주 묻는 질문](#자주-묻는-질문)

---

## 시작하기

### 접속 및 로그인
1. **웹 브라우저**에서 `http://localhost:3001` 접속
2. **로그인** 화면에서 계정 정보 입력
3. **메인 페이지**에 접속하면 상단 네비게이션 메뉴가 표시됩니다

### 메뉴 구성
- **API Testing**: 개별 API 테스트 및 관리
- **Test Automation**: Pipeline을 통한 자동화 테스트 시나리오 구성

---

## API Testing

### 기본 사용법

#### 1. 폴더 관리
- **폴더 생성**: "New Folder" 버튼으로 API를 분류할 폴더 생성
- **권한 설정**: 폴더 생성 시 팀원들의 읽기/쓰기 권한 설정
- **폴더 편집/삭제**: 폴더명 수정 및 불필요한 폴더 제거

#### 2. API 추가 및 편집
```
1. "New API" 버튼 클릭
2. 기본 정보 입력:
   - API 이름
   - HTTP 메소드 (GET, POST, PUT, DELETE)
   - URL
   - 설명 (선택사항)

3. 요청 설정:
   - Headers: Content-Type, Authorization 등
   - Parameters (GET/DELETE): Query Parameters
   - Body (POST/PUT/PATCH): JSON 데이터
```

#### 3. 스마트 자동 전환
HTTP 메소드 변경 시 자동으로 데이터 형태가 전환됩니다:
- **GET/DELETE → POST/PUT**: Parameters → Body 자동 변환
- **POST/PUT → GET/DELETE**: Body → Parameters 자동 변환
- **Content-Type 헤더 자동 관리**

#### 4. 테스트 실행
- **개별 실행**: 각 API별로 "Send" 버튼으로 즉시 테스트
- **응답 확인**: 상태 코드, 헤더, 응답 데이터 확인
- **히스토리**: 과거 실행 결과 조회 가능

---

## Test Automation (Pipeline)

### Pipeline이란?
Pipeline은 **여러 API를 순서대로 실행**하여 복잡한 테스트 시나리오를 자동화하는 기능입니다.

### 주요 활용 사례
- **로그인 → 데이터 조회** 시나리오
- **파일 업로드 → 처리 → 결과 확인** 플로우
- **사용자 생성 → 권한 설정 → 검증** 과정

### Pipeline 생성 및 관리

#### 1. Pipeline 폴더 생성
```
1. "New Folder" 클릭
2. 폴더명 입력 (예: "사용자 관리 테스트")
3. 필요시 하위 폴더 생성으로 구조화
```

#### 2. Pipeline 생성
```
1. 원하는 폴더에서 "New Pipeline" 클릭
2. Pipeline 정보 입력:
   - 이름: "로그인 후 프로필 조회"
   - 설명: 시나리오 설명
```

#### 3. Step 추가
```
1. "Add Step" 버튼 클릭
2. API Step 정보 입력:
   - Step 이름
   - HTTP 메소드 및 URL
   - Headers, Parameters/Body 설정
   - 지연시간 (선택, 밀리초 단위)
```

### 데이터 전달 시스템

#### 1. Variable Builder 사용법
**이전 Step 응답에서 데이터 추출**하여 **다음 Step에서 사용**하는 기능입니다.

#### 2. 데이터 추출 설정
```
예시: 로그인 API에서 토큰 추출
1. Variable Builder에서 "+" 클릭
2. 변수명: token
3. 추출 경로: response.data.accessToken
   (실제 응답 구조에 맞게 설정)
```

#### 3. 데이터 주입 사용
```
예시: 추출한 토큰을 헤더에 사용
1. 다음 Step의 Headers 설정
2. Authorization: Bearer {{token}}
   ({{변수명}} 형태로 사용)
```

#### 4. 주요 추출 패턴
```javascript
// 기본 데이터 추출
response.data.userId          // 응답의 data.userId
response.id                   // 응답의 id
response.result.items[0].name // 배열의 첫 번째 요소

// 헤더에서 추출
response.headers.location     // Location 헤더 값
```

#### 5. 주입 위치
- **Headers**: `Authorization: Bearer {{token}}`
- **Parameters**: `userId: {{userId}}`
- **Body**: `{"token": "{{token}}", "id": "{{userId}}"}`

### Visual Flow 이해하기

Pipeline은 **시각적 플로우**로 표시됩니다:

#### 색상 의미
- 🟢 **초록색**: 데이터 추출 (Extract)
- 🔵 **파란색**: 데이터 주입 (Inject)
- 🟡 **노란색**: 대기시간 (Delay)

#### 연결선
Step 간의 **데이터 흐름**을 화살표로 표시합니다.

### Pipeline 실행

#### 1. 실행 시작
```
1. Pipeline 페이지에서 "Execute" 버튼 클릭
2. 실행 상태 실시간 모니터링
3. 각 Step별 진행 상황 확인
```

#### 2. 실행 결과 확인
```
1. 전체 실행 결과 요약
2. 각 Step별 상세 결과:
   - 요청/응답 데이터
   - 실행 시간
   - 성공/실패 상태
3. 추출된 변수 값 확인
```

#### 3. 실행 히스토리
- 과거 실행 기록 조회
- 성공/실패 통계
- 실행 시간 분석

---

## 모바일/태블릿 사용법

### API Testing 페이지
- **사이드바**: 위아래로 스크롤하여 API 목록 확인
- **API Selection**: 폴더 선택 후 API 목록이 하단에 표시
- **접기/펼치기**: 우상단 화살표 버튼으로 영역 조절

### Pipeline 페이지
- **터치 스크롤**: Step 카드들을 좌우로 스와이프하여 확인
- **카드 편집**: Step 카드를 터치하여 편집 모달 열기
- **반응형 모달**: 화면 크기에 맞게 모달 크기 자동 조정

---

## 자주 묻는 질문

### Q1. Pipeline에서 변수가 제대로 치환되지 않아요
**A**: 다음을 확인해주세요:
1. 변수명이 정확한지 확인 (`{{token}}` 형태)
2. 이전 Step에서 해당 경로로 데이터가 실제로 추출되는지 확인
3. 추출 경로가 응답 구조와 일치하는지 확인

### Q2. API 테스트에서 CORS 에러가 발생해요
**A**: 
1. 백엔드 서버가 정상 실행 중인지 확인
2. 브라우저 개발자 도구에서 네트워크 탭 확인
3. 필요시 관리자에게 CORS 설정 문의

### Q3. Pipeline 실행이 중간에 멈춰요
**A**:
1. 각 Step의 API 설정이 정확한지 확인
2. 서버 응답이 예상과 다를 수 있으니 개별 API부터 테스트
3. 네트워크 연결 상태 확인

### Q4. 모바일에서 화면이 잘려서 보여요
**A**:
1. 브라우저 주소창을 숨기기 위해 아래로 스크롤
2. 가로/세로 모드 전환 시도
3. 브라우저 확대/축소 설정 확인

### Q5. Pipeline Step 순서를 바꾸고 싶어요
**A**: 
현재는 Step 편집을 통해 순서를 조정할 수 있습니다.
향후 드래그 앤 드롭 기능이 추가될 예정입니다.

### Q6. 대용량 파일 업로드 테스트는 어떻게 하나요?
**A**:
1. API Testing 페이지에서 파일 업로드 API 설정
2. Body 부분에 form-data 형태로 설정
3. Pipeline에서는 파일 업로드 후 결과 조회 시나리오 구성

---

## 추가 지원

### 기술 문의
개발팀 또는 시스템 관리자에게 문의하세요.

### 기능 요청
새로운 기능이나 개선사항이 있으면 언제든지 제안해주세요.

### 버그 신고
문제 발생 시 다음 정보와 함께 신고해주세요:
1. 발생 시점 및 상황
2. 브라우저 종류 및 버전
3. 오류 메시지 (있는 경우)
4. 스크린샷 (가능한 경우)

---

*이 가이드는 지속적으로 업데이트됩니다. 최신 버전을 확인해주세요.*