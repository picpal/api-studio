# API Feature Test

이 프로젝트는 웹 기반의 API 테스트 도구입니다. Postman이나 Insomnia와 같이 API 요청을 폴더별로 관리하고 실행하며, 응답을 확인할 수 있는 기능을 제공합니다.

## 🚀 주요 기능

- API 요청을 관리하기 위한 폴더 생성, 조회, 수정, 삭제 (CRUD)
- 폴더 내 API 아이템(요청) 생성, 조회, 수정, 삭제 (CRUD)
- HTTP 메서드(GET, POST, PUT, DELETE 등)를 포함한 API 요청 설정
- API 요청 실행 및 서버 응답 (상태 코드, 헤더, 본문) 확인
- 드래그 앤 드롭을 이용한 폴더 및 아이템 순서 변경

## 🛠️ 기술 스택

### Backend

- **언어**: Java 17
- **프레임워크**: Spring Boot 3.2.2
- **빌드 도구**: Gradle
- **데이터베이스**: H2 (In-memory)
- **API**: REST API

### Frontend

- **언어**: TypeScript
- **라이브러리**: React
- **스타일링**: Tailwind CSS, Styled-components
- **상태 관리**: React Hooks
- **HTTP 클라이언트**: Axios
- **코드 에디터**: Monaco Editor

## 🏁 시작하기

프로젝트를 로컬 환경에서 실행하려면 다음 단계를 따르세요.

### 사전 요구 사항

- Java 17 이상 (JDK)
- Node.js (v16 이상 권장) 및 npm
- Git

### Backend 실행

1.  **백엔드 디렉토리로 이동합니다.**
    ```bash
    cd backend
    ```

2.  **Gradle을 사용하여 프로젝트를 빌드하고 실행합니다.**
    ```bash
    ./gradlew bootRun
    ```
    서버는 `http://localhost:8080`에서 실행됩니다. H2 데이터베이스 콘솔은 `http://localhost:8080/h2-console`에서 확인할 수 있습니다.

### Frontend 실행

1.  **프론트엔드 디렉토리로 이동합니다.**
    ```bash
    cd frontend
    ```

2.  **필요한 패키지를 설치합니다.**
    ```bash
    npm install
    ```

3.  **개발 서버를 시작합니다.**
    ```bash
    npm start
    ```
    애플리케이션은 `http://localhost:3000`에서 열립니다.

## 📁 프로젝트 구조

```
.
├── backend/      # Spring Boot 백엔드 서버
│   ├── build.gradle
│   └── src/
└── frontend/     # React 프론트엔드 애플리케이션
    ├── package.json
    └── src/
```

-   `backend`: Java와 Spring Boot로 구현된 API 서버입니다.
-   `frontend`: TypeScript와 React로 구현된 사용자 인터페이스입니다.
