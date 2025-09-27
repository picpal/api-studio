# UI Test Runner Server

Playwright 기반 UI 테스트 실행을 위한 Node.js 서버

## 기능

- 📁 **스크립트 업로드**: `.js`, `.ts`, `.mjs` 파일 업로드 지원
- ⚡ **단일/배치 실행**: 개별 또는 여러 스크립트 병렬 실행
- 🔌 **실시간 상태**: WebSocket을 통한 실행 상태 실시간 전송
- 🎭 **Playwright 통합**: Chromium, Firefox, WebKit 브라우저 지원
- 🛡️ **안전한 실행**: 파일 유형 검증 및 실행 격리

## API 엔드포인트

### Health Check
```
GET /health
```

### 스크립트 업로드
```
POST /api/upload
Content-Type: multipart/form-data

Form field: script (file)
```

### 단일 스크립트 실행
```
POST /api/execute
Content-Type: application/json

{
  "scriptPath": "/path/to/script.js",
  "fileName": "test.js",
  "options": {
    "headless": true,
    "browser": "chromium",
    "timeout": 30000
  }
}
```

### 배치 실행
```
POST /api/batch-execute
Content-Type: application/json

{
  "scripts": [
    {
      "scriptPath": "/path/to/script1.js",
      "fileName": "test1.js"
    },
    {
      "scriptPath": "/path/to/script2.js",
      "fileName": "test2.js"
    }
  ],
  "parallel": true,
  "maxConcurrency": 3
}
```

### 실행 취소
```
DELETE /api/execute/:scriptId
```

### 실행 중인 테스트 조회
```
GET /api/running-tests
```

## WebSocket 연결

```javascript
const ws = new WebSocket('ws://localhost:3002/ws');

ws.on('message', (data) => {
  const message = JSON.parse(data);

  switch(message.type) {
    case 'execution-start':
      console.log('Test started:', message.data);
      break;
    case 'execution-complete':
      console.log('Test completed:', message.data);
      break;
    case 'execution-error':
      console.log('Test failed:', message.data);
      break;
  }
});
```

## 설치 및 실행

### 1. 의존성 설치
```bash
cd runner
npm install
```

### 2. Playwright 브라우저 설치
```bash
npm run install-browsers
```

### 3. 개발 서버 실행
```bash
npm run dev
```

### 4. 프로덕션 빌드 및 실행
```bash
npm run build
npm start
```

## 환경 변수

```env
PORT=3002                    # 서버 포트
NODE_ENV=development         # 개발/운영 모드
```

## 디렉토리 구조

```
runner/
├── src/
│   ├── controllers/         # API 컨트롤러
│   ├── services/           # 비즈니스 로직
│   ├── types/              # TypeScript 타입 정의
│   ├── utils/              # 유틸리티 함수
│   └── index.ts            # 서버 엔트리포인트
├── uploads/
│   ├── scripts/            # 업로드된 스크립트 저장소
│   └── temp/               # 임시 업로드 파일
└── dist/                   # 컴파일된 JavaScript 파일
```