# API Test Automation Project

QA 팀을 위한 API 테스트 자동화 도구입니다. 이 프로젝트는 React + TypeScript 프론트엔드와 Spring Boot 백엔드로 구성되어 있으며, API 테스트와 배치 실행 자동화 기능을 제공합니다.

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

### API Testing
- **API 요청 관리**: HTTP 메소드별 API 요청 생성 및 관리
- **폴더 구조**: API를 폴더별로 체계적 관리
- **파라미터 관리**: Query Parameters, Headers, Request Body 설정
- **응답 검증**: Response Validation을 통한 자동 테스트
- **요청 히스토리**: API 요청 결과 저장 및 관리

### Test Automation
- **배치 실행**: 여러 API를 한번에 실행하는 자동화 기능
- **실시간 진행상황**: 배치 실행 중 실시간 상태 모니터링
- **테스트 리포팅**: 실행 결과 통계 및 성공률 분석
- **Pipeline 관리**: 테스트 시나리오를 파이프라인으로 구성

### 관리 기능
- **사용자 인증**: 세션 기반 로그인/로그아웃
- **권한 관리**: 폴더별 접근 권한 설정
- **활동 로그**: 사용자 활동 추적 및 기록

## 기술 스택

### Frontend
- **React 18** + **TypeScript**
- **Tailwind CSS** - 스타일링
- **Monaco Editor** - 코드 에디터 (JSON 구문 강조)
- **Axios** - API 통신
- **Vite** - 빌드 도구

### Backend
- **Spring Boot 3**
- **JPA/Hibernate** - 데이터베이스 ORM
- **H2 Database** - 개발용 인메모리 데이터베이스
- **Spring Security** - 인증 및 보안
- **Jackson** - JSON 처리

## 사전 준비 사항
시작하기 전에 다음 소프트웨어가 시스템에 설치되어 있는지 확인하십시오:

*   **Node.js**: [Node.js 다운로드 및 설치](https://nodejs.org/) (npm 포함)
    *   또는 **Yarn**을 사용할 수 있습니다: `npm install -g yarn`
*   **Java Development Kit (JDK)**: 버전 17 이상을 권장합니다.
    *   [Oracle JDK](https://www.oracle.com/java/technologies/downloads/)에서 다운로드하거나 [Adoptium Temurin](https://adoptium.net/)과 같은 OpenJDK 배포판을 사용할 수 있습니다.
*   **Git**: 저장소를 클론하기 위해 필요합니다.

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

백엔드 서버가 성공적으로 시작되면 `http://localhost:8080`에서 실행됩니다.

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

#### 3-3. 개발 서버 실행
```bash
npm start
# 또는 yarn 사용 시
# yarn start
```

프론트엔드 애플리케이션이 성공적으로 시작되면 `http://localhost:3001`에서 접근할 수 있습니다.

### 4. 애플리케이션 접속

브라우저에서 `http://localhost:3001`로 접속하여 애플리케이션을 사용할 수 있습니다.

**기본 로그인 정보:**
- 이메일: `admin@blue.com`  
- 비밀번호: `Admin!2024@Blue`

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