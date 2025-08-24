# API Test Automation Project

QA 팀을 위한 종합적인 API 테스트 자동화 플랫폼입니다. React + TypeScript 프론트엔드와 Spring Boot 백엔드로 구성되어 있으며, 개별 API 테스트부터 복잡한 Pipeline 기반 시나리오 자동화까지 지원합니다.

## 목차
- [프로젝트 기능](#프로젝트-기능)
- [기술 스택](#기술-스택)
- [사전 준비 사항](#사전-준비-사항)
- [로컬 환경 구성 및 실행](#로컬-환경-구성-및-실행)
  - [1. 저장소 클론](#1-저장소-클론)
  - [2. 백엔드 설정 및 실행](#2-백엔드-설정-및-실행)
  - [3. 프론트엔드 설정 및 실행](#3-프론트엔드-설정-및-실행)
  - [4. 애플리케이션 접속](#4-애플리케이션-접속)
- [데이터베이스](#데이터베이스)
- [인증 방식](#인증-방식)
- [Postman 컬렉션 사용 안내](#postman-컬렉션-사용-안내)

## 프로젝트 기능

### 🔧 API Testing
- **API 요청 관리**: HTTP 메소드별 API 요청 생성 및 관리 (GET, POST, PUT, DELETE, PATCH)
- **폴더 구조**: API를 폴더별로 체계적 관리 및 권한 설정
- **스마트 파라미터 관리**: HTTP 메소드 변경 시 자동 전환 (Params ↔ Body)
- **Monaco Editor**: JSON 구문 강조 및 자동 완성
- **응답 검증**: Response Validation을 통한 자동 테스트
- **요청 히스토리**: API 요청 결과 저장 및 분석

### 🚀 Pipeline System (NEW)
- **시각적 Pipeline 설계**: 드래그&드롭 방식의 직관적 인터페이스
- **세션 관리**: HttpClient 기반 쿠키 세션 유지로 인증 플로우 지원
- **Variable Builder**: JSON Path를 활용한 QA 친화적 데이터 전달
  - 이전 단계 응답에서 값 추출: `response.data.token`
  - 다음 단계 요청에서 변수 주입: `{{token}}`
- **실시간 실행 모니터링**: 각 단계별 진행 상황 및 결과 추적
- **Click-to-Edit**: Pipeline 단계 클릭으로 즉시 편집 가능

### 📊 Test Automation
- **배치 실행**: 여러 API를 한번에 실행하는 자동화 기능
- **실시간 진행상황**: 배치 실행 중 실시간 상태 모니터링
- **테스트 리포팅**: 실행 결과 통계 및 성공률 분석
- **Pipeline 실행**: 복잡한 시나리오를 단일 Pipeline으로 실행

### 관리 기능
- **사용자 인증**: 세션 기반 로그인/로그아웃
- **권한 관리**: 폴더별 접근 권한 설정
- **활동 로그**: 사용자 활동 추적 및 기록

## 기술 스택

### Frontend
- **React 18** + **TypeScript** - 현대적인 컴포넌트 기반 아키텍처
- **FSD (Feature-Sliced Design)** - 확장 가능한 아키텍처 패턴
- **Tailwind CSS** - 유틸리티 퍼스트 CSS 프레임워크
- **Monaco Editor** - VS Code 기반 코드 에디터 (JSON 구문 강조)
- **Axios** - HTTP 클라이언트 라이브러리
- **Vite** - 차세대 빌드 도구

### Backend
- **Spring Boot 3** - 엔터프라이즈급 Java 프레임워크
- **JPA/Hibernate** - 객체 관계 매핑 (ORM)
- **H2 Database** - 개발용 인메모리 데이터베이스
- **Spring Security** - 세션 기반 인증 및 권한 관리
- **HttpClient** - Pipeline 실행을 위한 HTTP 세션 관리
- **Jackson** - JSON 직렬화/역직렬화

## 사전 준비 사항
시작하기 전에 다음 소프트웨어가 시스템에 설치되어 있는지 확인하십시오:

### 필수 요구사항
*   **Java Development Kit (JDK)**: **버전 17 이상 필수**
    *   현재 프로젝트는 Java 17로 개발됨
    *   [Amazon Corretto 17](https://aws.amazon.com/corretto/) (권장)
    *   [Oracle JDK](https://www.oracle.com/java/technologies/downloads/) 
    *   [Adoptium Temurin](https://adoptium.net/) 또는 기타 OpenJDK 배포판
    *   설치 확인: `java --version`

*   **Node.js**: **버전 18 이상 권장**
    *   현재 환경은 Node.js 24.5.0에서 테스트됨
    *   [Node.js 공식 사이트](https://nodejs.org/)에서 다운로드 (npm 자동 포함)
    *   설치 확인: `node --version` 및 `npm --version`

*   **Git**: 저장소를 클론하기 위해 필요합니다
    *   설치 확인: `git --version`

### 선택 사항
*   **Yarn**: npm 대신 사용 가능한 패키지 매니저
    *   설치: `npm install -g yarn`

## 로컬 환경 구성 및 실행

### 1. 저장소 클론
```bash
git clone <repository-url>
cd feature-test
```

### 2. 백엔드 설정 및 실행

백엔드는 Spring Boot 3 + Gradle로 구성된 애플리케이션입니다.

#### 2-1. 백엔드 디렉토리로 이동
```bash
cd backend
```

#### 2-2. 백엔드 실행
```bash
# Windows
gradlew.bat bootRun

# macOS/Linux  
./gradlew bootRun
```

**실행 상태 확인:**
- 백엔드 서버: `http://localhost:8080`
- H2 데이터베이스 콘솔: `http://localhost:8080/h2-console`
- 성공 시 콘솔에 "Started ApiTestApplication" 메시지 표시

**문제 해결:**
- 포트 8080 사용 중 오류 시: 기존 프로세스 종료 후 재실행
- 권한 오류 (macOS/Linux): `chmod +x gradlew` 실행 후 재시도

### 3. 프론트엔드 설정 및 실행

프론트엔드는 React 18 + TypeScript + Vite로 구성된 애플리케이션입니다.

#### 3-1. 프론트엔드 디렉토리로 이동 (새 터미널)
```bash
cd frontend
```

#### 3-2. 의존성 설치
```bash
npm install
# 또는 yarn 사용 시
# yarn install
```

**의존성 설치 확인:**
- node_modules 폴더 생성 확인
- 오류 시 Node.js 버전 확인 (18 이상 권장)

#### 3-3. 개발 서버 실행
```bash
npm start
# 또는 다음 중 하나 사용
npm run dev
# yarn 사용 시
# yarn start 또는 yarn dev
```

**실행 상태 확인:**
- Vite가 자동으로 사용 가능한 포트 탐색 (3001 → 3002 → 3003 → ...)
- 콘솔에 "Local: http://localhost:XXXX/" 형태로 URL 표시
- 브라우저가 자동으로 열리지 않으면 표시된 URL 수동 접속

**성능 최적화:**
- 개발 환경에서 Hot Module Replacement (HMR) 지원
- 파일 변경 시 자동 새로고침

### 4. 애플리케이션 접속

브라우저에서 Vite가 표시한 URL (예: `http://localhost:3004`)로 접속하여 애플리케이션을 사용할 수 있습니다.

**주요 페이지:**
- **API Testing**: 개별 API 테스트 및 관리
- **Pipeline Management**: 시각적 Pipeline 설계 및 실행

**기본 로그인 정보:**
- 이메일: `admin@blue.com`  
- 비밀번호: `Admin!2024@Blue`

### 5. 최초 실행 체크리스트

다음 단계를 통해 시스템이 정상 작동하는지 확인하세요:

1. **백엔드 상태 확인**
   - [ ] `http://localhost:8080/h2-console` 접속 가능
   - [ ] H2 데이터베이스 로그인 성공 (JDBC URL: `jdbc:h2:file:./data/testdb`)

2. **프론트엔드 상태 확인**  
   - [ ] Vite 서버 URL 접속 가능
   - [ ] 로그인 페이지 정상 표시

3. **기능 테스트**
   - [ ] 관리자 계정으로 로그인 성공
   - [ ] API Testing 페이지 접근 가능
   - [ ] Pipeline Management 페이지 접근 가능

**문제 발생 시:**
- 백엔드/프론트엔드 콘솔에서 오류 메시지 확인
- 포트 충돌 시 다른 애플리케이션 종료 후 재시작
- 브라우저 캐시 삭제 후 재접속

## 데이터베이스

이 프로젝트는 개발 편의성을 위해 H2 인메모리 데이터베이스를 사용합니다.

**H2 Console 접속:**
- URL: http://localhost:8080/h2-console
- JDBC URL: `jdbc:h2:file:./data/testdb`
- Username: `sa`
- Password: (빈 값)

## 인증 방식

이 프로젝트의 백엔드는 **세션 기반 인증**을 사용합니다. 이는 사용자가 성공적으로 로그인하면 서버가 세션을 생성하고 해당 세션 ID를 포함하는 쿠키(예: `JSESSIONID`)를 클라이언트에게 발급한다는 의미입니다. 이후 클라이언트가 인증이 필요한 API 엔드포인트에 요청을 보낼 때, 이 세션 쿠키가 자동으로 함께 전송되어 서버가 사용자를 식별하고 인증 상태를 유지합니다.

**Postman 테스트 시 유의사항:**

1.  **로그인 선행**: 인증이 필요한 API를 테스트하기 전에, 반드시 `POST /api/auth/login` 엔드포인트를 통해 먼저 로그인해야 합니다.
2.  **세션 쿠키 자동 관리**: Postman은 로그인 응답으로 받은 세션 쿠키를 자동으로 저장하고, 이후 동일한 도메인으로 보내는 모든 요청에 해당 쿠키를 자동으로 포함시킵니다. 따라서 로그인 후에는 별도로 인증 헤더를 설정할 필요 없이 다른 인증된 API를 테스트할 수 있습니다.
3.  **세션 유지**: Postman 애플리케이션을 재시작하거나, Postman의 쿠키를 수동으로 지우지 않는 한 세션은 유지됩니다. 세션이 만료되거나 무효화되면 다시 로그인해야 합니다.

## Postman 컬렉션 사용 안내

제공된 `.json` 파일들은 Postman 컬렉션으로, 백엔드 API를 테스트하기 위한 요청 예시들을 포함하고 있습니다.

**사용 방법:**

1.  **Postman 실행**: Postman 데스크톱 애플리케이션 또는 웹 버전을 실행합니다.
2.  **컬렉션 임포트**:
    *   Postman 좌측 사이드바에서 `Collections` 탭을 선택합니다.
    *   `Import` 버튼을 클릭합니다.
    *   `Upload Files`를 선택하고, 제공된 `Postman_Auth_API.json`, `Postman_AdminActivity_API.json` 등 모든 `.json` 파일을 선택하여 임포트합니다.
3.  **환경 설정 (선택 사항)**: API의 기본 URL(`http://localhost:8080`)이 변경될 수 있는 경우, Postman 환경 변수를 설정하여 유연하게 관리할 수 있습니다.
4.  **요청 실행**: 임포트된 컬렉션에서 원하는 요청을 선택하고 `Send` 버튼을 클릭하여 API를 테스트합니다.
5.  **`YOUR_UNIQUE_POSTMAN_ID`**: 각 `.json` 파일 내의 `_postman_id` 필드는 Postman이 컬렉션을 식별하는 데 사용하는 고유 ID입니다. 이 값은 임포트 시 Postman에 의해 자동으로 생성되므로, 파일을 직접 수정할 필요는 없습니다.

**참고:** 관리자 권한이 필요한 API(`Postman_Admin_API.json`, `Postman_AdminActivity_API.json`)를 테스트하려면, 먼저 관리자 계정으로 로그인해야 합니다.

## 주요 기능 가이드

### Pipeline System 사용법
1. **Pipeline Management** 페이지로 이동
2. **"새 파이프라인 생성"** 버튼 클릭
3. 파이프라인 이름과 설명 입력
4. **"단계 추가"**로 API 호출 단계 구성
5. **Variable Builder**에서 데이터 전달 규칙 설정:
   - **Extract Variables**: 응답에서 값 추출 (예: `response.data.token`)
   - **Inject Variables**: 요청에서 변수 사용 (예: `{{token}}`)
6. **"실행"** 버튼으로 전체 Pipeline 실행

### Variable Builder 활용
- **JSON Path 추출**: `response.user.id`, `response.data.items[0].name`
- **템플릿 변수 주입**: `{{userId}}`, `{{authToken}}`
- **자동 제안**: 이전 단계 응답을 기반으로 추출 가능한 경로 제안

### 세션 관리 특징
- Pipeline 실행 시 각 파이프라인마다 독립적인 HttpClient 세션 유지
- 쿠키 기반 인증 자동 처리
- 다단계 로그인 플로우 지원

## 프로젝트 구조
```
feature-test/
├── backend/              # Spring Boot 백엔드
│   ├── src/main/java/
│   │   └── com/example/apitest/
│   │       ├── controller/   # REST API 컨트롤러
│   │       ├── entity/       # JPA 엔티티
│   │       ├── service/      # 비즈니스 로직
│   │       └── repository/   # 데이터 액세스
│   └── build.gradle
├── frontend/             # React 프론트엔드
│   ├── src/
│   │   ├── components/      # 공통 컴포넌트
│   │   ├── pages/          # 페이지 컴포넌트
│   │   ├── widgets/        # 위젯 컴포넌트
│   │   ├── features/       # 기능별 모듈
│   │   └── entities/       # 도메인 엔티티
│   └── package.json
├── CLAUDE.md            # 개발 가이드 문서
└── README.md           # 프로젝트 설명서
```

## 개발 히스토리

### 최근 주요 업데이트 (2024.08)
- ✅ **Pipeline System 완전 구현**
- ✅ **Variable Builder** - QA 친화적 데이터 전달 인터페이스
- ✅ **Visual Flow** - 직관적 파이프라인 시각화
- ✅ **Session Management** - HttpClient 기반 쿠키 세션 유지
- ✅ **Click-to-Edit** - 파이프라인 단계 즉시 편집
- ✅ **Git 최적화** - 빌드/캐시 파일 제거 및 .gitignore 개선