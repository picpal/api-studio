# API Key 발급 가이드

**프로그래밍 방식으로 API를 호출하려면 API Key가 필요합니다.**

## API Key 요청 방법

### 내부 팀원인 경우

**1. 관리자에게 요청**
- 팀 관리자 또는 시스템 관리자에게 연락
- Slack, 이메일, 또는 사내 시스템을 통해 요청

**2. 요청 시 제공할 정보**
```
API Key 요청 정보:
- 요청자: 김개발 (개발팀)
- 사용 목적: CI/CD 파이프라인 자동화
- 필요 권한: Pipeline 실행, 결과 조회
- 접근할 폴더: "사용자 API", "상품 API"
- 사용 기간: 2025.01.15 ~ 2025.12.31
- 예상 사용량: 일 100회 호출
```

**3. 승인 절차**
1. 요청서 검토
2. 보안 정책 확인
3. 권한 범위 결정
4. API Key 생성 및 전달

### 외부 협력사인 경우

**1. 공식 채널을 통한 요청**
- 사업팀 또는 파트너십 담당자를 통해 요청
- 계약서 상의 API 사용 조건 확인

**2. 필요 문서 준비**
```
제출 서류:
✓ API 사용 목적서
✓ 기술 명세서 (사용할 API 목록)
✓ 보안 서약서
✓ 개인정보 처리 동의서
✓ 담당자 연락처
```

**3. 검토 및 승인**
- 법무팀 검토
- 보안팀 승인
- 기술팀 구현
- 제한적 권한으로 발급

## API Key 사용법

### 기본 사용 방법

**HTTP Header에 포함**
```javascript
fetch('/api/pipelines/folders', {
  headers: {
    'X-API-Key': 'your-api-key-here',
    'Content-Type': 'application/json'
  }
});
```

**Axios 사용 시**
```javascript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'X-API-Key': process.env.API_KEY,
    'Content-Type': 'application/json'
  }
});
```

### cURL 예시

**폴더 목록 조회**
```bash
curl -X GET "http://localhost:8080/api/pipelines/folders" \
  -H "X-API-Key: your-api-key-here" \
  -H "Content-Type: application/json"
```

**Pipeline 실행**
```bash
curl -X POST "http://localhost:8080/api/pipelines/123/execute" \
  -H "X-API-Key: your-api-key-here" \
  -H "Content-Type: application/json"
```

**실행 결과 조회**
```bash
curl -X GET "http://localhost:8080/api/pipelines/executions/456/steps" \
  -H "X-API-Key: your-api-key-here" \
  -H "Content-Type: application/json"
```

### 프로그래밍 언어별 예시

**Python**
```python
import requests
import os

API_KEY = os.environ.get('API_KEY')
BASE_URL = 'http://localhost:8080/api'

headers = {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
}

# Pipeline 실행
response = requests.post(
    f'{BASE_URL}/pipelines/123/execute',
    headers=headers
)

if response.status_code == 200:
    execution = response.json()
    print(f"Execution ID: {execution['id']}")
```

**Java**
```java
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;

public class PipelineClient {
    private static final String API_KEY = System.getenv("API_KEY");
    private static final String BASE_URL = "http://localhost:8080/api";
    
    public void executePipeline(int pipelineId) throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(BASE_URL + "/pipelines/" + pipelineId + "/execute"))
            .header("X-API-Key", API_KEY)
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.noBody())
            .build();
            
        HttpResponse<String> response = client.send(request, 
            HttpResponse.BodyHandlers.ofString());
            
        System.out.println("Response: " + response.body());
    }
}
```

## API Key 보안 수칙

### ✅ 반드시 해야 할 것

**환경변수 사용**
```bash
# .env 파일
API_KEY=sk-1a2b3c4d5e6f7g8h9i0j

# 코드에서 사용
const apiKey = process.env.API_KEY;
```

**설정 파일 사용**
```json
// config.json (gitignore에 추가)
{
  "apiKey": "sk-1a2b3c4d5e6f7g8h9i0j",
  "baseUrl": "http://localhost:8080/api"
}
```

**정기적인 갱신**
- 90일마다 새 키로 교체
- 구 키와 신 키 동시 사용 기간 제공
- 모든 서비스 업데이트 후 구 키 폐기

**사용하지 않는 Key 폐기**
- 프로젝트 종료 시 즉시 폐기 요청
- 담당자 변경 시 새 키 발급
- 의심스러운 활동 감지 시 즉시 교체

### ❌ 절대 하지 말아야 할 것

**코드에 직접 작성**
```javascript
// 🚫 잘못된 예시
const apiKey = 'sk-1a2b3c4d5e6f7g8h9i0j';

// ✅ 올바른 예시
const apiKey = process.env.API_KEY;
```

**공개 저장소 업로드**
```bash
# .gitignore 파일에 추가
.env
config.json
secrets/
*.key
```

**타인과 공유**
- 슬랙/이메일로 직접 전송 금지
- 공유 문서에 기재 금지
- 화면 공유 시 가림 처리

**로그에 출력**
```javascript
// 🚫 잘못된 예시
console.log('API Key:', apiKey);

// ✅ 올바른 예시  
console.log('API Key:', apiKey.substring(0, 6) + '***');
```

## 권한 및 제한사항

### 권한 레벨

**읽기 전용 (Read-Only)**
```
허용되는 작업:
✅ 폴더 목록 조회
✅ Pipeline 목록 조회  
✅ 실행 결과 조회
❌ Pipeline 생성/수정/삭제
❌ Pipeline 실행
```

**실행 권한 (Execute)**
```
허용되는 작업:
✅ 읽기 전용 모든 작업
✅ Pipeline 실행
✅ 실행 상태 조회
❌ Pipeline 생성/수정/삭제
```

**전체 권한 (Full Access)**
```
허용되는 작업:
✅ 모든 읽기/실행 작업
✅ Pipeline 생성/수정/삭제
✅ Step 관리
❌ 사용자 관리 (관리자 전용)
```

### 사용량 제한

**기본 제한**
```
일반 API Key 제한:
- 시간당 호출: 1,000회
- 일당 호출: 10,000회
- 동시 실행: 5개 Pipeline
- 파일 업로드: 10MB
```

**엔터프라이즈 제한**
```
엔터프라이즈 API Key:
- 시간당 호출: 10,000회
- 일당 호출: 100,000회
- 동시 실행: 50개 Pipeline
- 파일 업로드: 100MB
```

## 문제 해결

### 자주 발생하는 오류

**401 Unauthorized**
```json
{
  "error": "Invalid API Key",
  "message": "The provided API key is invalid or expired"
}
```
**해결 방법:**
1. API Key 값 확인
2. 헤더명 확인 (`X-API-Key`)
3. 키 만료일 확인
4. 권한 범위 확인

**403 Forbidden**
```json
{
  "error": "Access Denied", 
  "message": "Insufficient permissions for this operation"
}
```
**해결 방법:**
1. 요청하는 리소스의 권한 확인
2. 관리자에게 권한 확대 요청
3. 다른 API Key 사용

**429 Too Many Requests**
```json
{
  "error": "Rate Limit Exceeded",
  "message": "API call limit exceeded. Try again later."
}
```
**해결 방법:**
1. 호출 빈도 줄이기
2. 배치 처리로 효율성 개선
3. 제한량 증대 요청

### 연결 테스트

**기본 연결 확인**
```bash
curl -X GET "http://localhost:8080/api/pipelines/folders" \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -v
```

**응답 확인**
```
< HTTP/1.1 200 OK
< Content-Type: application/json
< X-RateLimit-Remaining: 999
< X-RateLimit-Reset: 1642765200

[
  {
    "id": 1,
    "name": "사용자 관리",
    "pipelines": [...]
  }
]
```

## CI/CD 통합 예시

### Jenkins 연동
```groovy
pipeline {
    agent any
    environment {
        API_KEY = credentials('api-key-credential-id')
        API_BASE_URL = 'http://localhost:8080/api'
    }
    
    stages {
        stage('Run API Tests') {
            steps {
                script {
                    // Pipeline 실행
                    def response = sh(
                        script: """
                            curl -s -X POST "${API_BASE_URL}/pipelines/123/execute" \
                                -H "X-API-Key: ${API_KEY}" \
                                -H "Content-Type: application/json"
                        """,
                        returnStdout: true
                    )
                    
                    def execution = readJSON text: response
                    echo "Execution ID: ${execution.id}"
                    
                    // 결과 대기 및 확인 로직
                }
            }
        }
    }
}
```

### GitHub Actions 연동
```yaml
name: API Test Automation

on: [push, pull_request]

jobs:
  api-test:
    runs-on: ubuntu-latest
    steps:
      - name: Execute Pipeline
        env:
          API_KEY: ${{ secrets.API_KEY }}
        run: |
          EXECUTION_RESPONSE=$(curl -s -X POST "http://localhost:8080/api/pipelines/123/execute" \
            -H "X-API-Key: $API_KEY" \
            -H "Content-Type: application/json")
          
          EXECUTION_ID=$(echo $EXECUTION_RESPONSE | jq -r '.id')
          echo "Execution ID: $EXECUTION_ID"
          
          # 결과 확인 및 검증 로직
```

---

더 자세한 정보나 문의사항이 있으시면 개발팀에 연락해주세요! 🔑