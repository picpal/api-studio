# /seed-api-tests - API Testing 기본 데이터 등록

> **주의**: 이 문서의 비밀번호는 로컬 개발 환경용 예시입니다. 프로덕션에서는 환경변수를 사용하세요.

API Testing 페이지에 테스트용 샘플 데이터를 등록합니다.

## 실행 절차

### 1. 로그인 세션 획득

먼저 API 서버에 로그인하여 세션 쿠키를 획득합니다.

```bash
curl -c /tmp/api-studio-cookies.txt -b /tmp/api-studio-cookies.txt \
  -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@blue.com","password":"Admin!2024@Blue"}'
```

### 2. test 폴더 생성

테스트용 폴더를 생성하고 폴더 ID를 저장합니다.

```bash
FOLDER_RESPONSE=$(curl -s -c /tmp/api-studio-cookies.txt -b /tmp/api-studio-cookies.txt \
  -X POST http://localhost:8080/api/folders \
  -H "Content-Type: application/json" \
  -d '{"name":"test","isExpanded":true}')

FOLDER_ID=$(echo $FOLDER_RESPONSE | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
echo "Created folder with ID: $FOLDER_ID"
```

### 3. 샘플 API 등록

생성된 폴더 아래에 5개의 샘플 API 테스트 케이스를 등록합니다.

#### 3.1 JSONPlaceholder - Get Posts

```bash
curl -s -c /tmp/api-studio-cookies.txt -b /tmp/api-studio-cookies.txt \
  -X POST http://localhost:8080/api/items \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"JSONPlaceholder - Get Posts\",
    \"method\": \"GET\",
    \"url\": \"https://jsonplaceholder.typicode.com/posts\",
    \"description\": \"JSONPlaceholder API에서 모든 게시글 목록을 조회합니다.\",
    \"folderId\": $FOLDER_ID,
    \"requestParams\": \"[]\",
    \"requestHeaders\": \"[]\",
    \"requestBody\": \"\"
  }"
```

#### 3.2 JSONPlaceholder - Get Single Post

```bash
curl -s -c /tmp/api-studio-cookies.txt -b /tmp/api-studio-cookies.txt \
  -X POST http://localhost:8080/api/items \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"JSONPlaceholder - Get Single Post\",
    \"method\": \"GET\",
    \"url\": \"https://jsonplaceholder.typicode.com/posts/1\",
    \"description\": \"JSONPlaceholder API에서 특정 게시글(ID=1)을 조회합니다.\",
    \"folderId\": $FOLDER_ID,
    \"requestParams\": \"[]\",
    \"requestHeaders\": \"[]\",
    \"requestBody\": \"\"
  }"
```

#### 3.3 JSONPlaceholder - Create Post

```bash
curl -s -c /tmp/api-studio-cookies.txt -b /tmp/api-studio-cookies.txt \
  -X POST http://localhost:8080/api/items \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"JSONPlaceholder - Create Post\",
    \"method\": \"POST\",
    \"url\": \"https://jsonplaceholder.typicode.com/posts\",
    \"description\": \"JSONPlaceholder API에 새 게시글을 생성합니다.\",
    \"folderId\": $FOLDER_ID,
    \"requestParams\": \"[]\",
    \"requestHeaders\": \"[{\\\"key\\\":\\\"Content-Type\\\",\\\"value\\\":\\\"application/json\\\",\\\"enabled\\\":true}]\",
    \"requestBody\": \"{\\\"title\\\":\\\"foo\\\",\\\"body\\\":\\\"bar\\\",\\\"userId\\\":1}\"
  }"
```

#### 3.4 JSONPlaceholder - Get Users

```bash
curl -s -c /tmp/api-studio-cookies.txt -b /tmp/api-studio-cookies.txt \
  -X POST http://localhost:8080/api/items \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"JSONPlaceholder - Get Users\",
    \"method\": \"GET\",
    \"url\": \"https://jsonplaceholder.typicode.com/users\",
    \"description\": \"JSONPlaceholder API에서 모든 사용자 목록을 조회합니다.\",
    \"folderId\": $FOLDER_ID,
    \"requestParams\": \"[]\",
    \"requestHeaders\": \"[]\",
    \"requestBody\": \"\"
  }"
```

#### 3.5 HTTPBin - IP Check

```bash
curl -s -c /tmp/api-studio-cookies.txt -b /tmp/api-studio-cookies.txt \
  -X POST http://localhost:8080/api/items \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"HTTPBin - IP Check\",
    \"method\": \"GET\",
    \"url\": \"https://httpbin.org/ip\",
    \"description\": \"HTTPBin API를 통해 현재 클라이언트의 IP 주소를 확인합니다.\",
    \"folderId\": $FOLDER_ID,
    \"requestParams\": \"[]\",
    \"requestHeaders\": \"[]\",
    \"requestBody\": \"\"
  }"
```

## 전체 스크립트 (한 번에 실행)

아래 스크립트를 복사하여 터미널에서 실행하면 모든 데이터가 한 번에 등록됩니다.

```bash
#!/bin/bash

# 1. 로그인
echo "Logging in..."
curl -s -c /tmp/api-studio-cookies.txt -b /tmp/api-studio-cookies.txt \
  -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@blue.com","password":"Admin!2024@Blue"}'
echo ""

# 2. 폴더 생성
echo "Creating test folder..."
FOLDER_RESPONSE=$(curl -s -c /tmp/api-studio-cookies.txt -b /tmp/api-studio-cookies.txt \
  -X POST http://localhost:8080/api/folders \
  -H "Content-Type: application/json" \
  -d '{"name":"test","isExpanded":true}')

FOLDER_ID=$(echo $FOLDER_RESPONSE | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
echo "Created folder with ID: $FOLDER_ID"

if [ -z "$FOLDER_ID" ]; then
  echo "Error: Failed to create folder"
  exit 1
fi

# 3. API 항목 등록
echo "Creating API test cases..."

# 3.1 JSONPlaceholder - Get Posts
curl -s -c /tmp/api-studio-cookies.txt -b /tmp/api-studio-cookies.txt \
  -X POST http://localhost:8080/api/items \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"JSONPlaceholder - Get Posts\",
    \"method\": \"GET\",
    \"url\": \"https://jsonplaceholder.typicode.com/posts\",
    \"description\": \"JSONPlaceholder API에서 모든 게시글 목록을 조회합니다.\",
    \"folderId\": $FOLDER_ID,
    \"requestParams\": \"[]\",
    \"requestHeaders\": \"[]\",
    \"requestBody\": \"\"
  }" > /dev/null
echo "  - JSONPlaceholder - Get Posts: Created"

# 3.2 JSONPlaceholder - Get Single Post
curl -s -c /tmp/api-studio-cookies.txt -b /tmp/api-studio-cookies.txt \
  -X POST http://localhost:8080/api/items \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"JSONPlaceholder - Get Single Post\",
    \"method\": \"GET\",
    \"url\": \"https://jsonplaceholder.typicode.com/posts/1\",
    \"description\": \"JSONPlaceholder API에서 특정 게시글(ID=1)을 조회합니다.\",
    \"folderId\": $FOLDER_ID,
    \"requestParams\": \"[]\",
    \"requestHeaders\": \"[]\",
    \"requestBody\": \"\"
  }" > /dev/null
echo "  - JSONPlaceholder - Get Single Post: Created"

# 3.3 JSONPlaceholder - Create Post
curl -s -c /tmp/api-studio-cookies.txt -b /tmp/api-studio-cookies.txt \
  -X POST http://localhost:8080/api/items \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"JSONPlaceholder - Create Post\",
    \"method\": \"POST\",
    \"url\": \"https://jsonplaceholder.typicode.com/posts\",
    \"description\": \"JSONPlaceholder API에 새 게시글을 생성합니다.\",
    \"folderId\": $FOLDER_ID,
    \"requestParams\": \"[]\",
    \"requestHeaders\": \"[{\\\"key\\\":\\\"Content-Type\\\",\\\"value\\\":\\\"application/json\\\",\\\"enabled\\\":true}]\",
    \"requestBody\": \"{\\\"title\\\":\\\"foo\\\",\\\"body\\\":\\\"bar\\\",\\\"userId\\\":1}\"
  }" > /dev/null
echo "  - JSONPlaceholder - Create Post: Created"

# 3.4 JSONPlaceholder - Get Users
curl -s -c /tmp/api-studio-cookies.txt -b /tmp/api-studio-cookies.txt \
  -X POST http://localhost:8080/api/items \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"JSONPlaceholder - Get Users\",
    \"method\": \"GET\",
    \"url\": \"https://jsonplaceholder.typicode.com/users\",
    \"description\": \"JSONPlaceholder API에서 모든 사용자 목록을 조회합니다.\",
    \"folderId\": $FOLDER_ID,
    \"requestParams\": \"[]\",
    \"requestHeaders\": \"[]\",
    \"requestBody\": \"\"
  }" > /dev/null
echo "  - JSONPlaceholder - Get Users: Created"

# 3.5 HTTPBin - IP Check
curl -s -c /tmp/api-studio-cookies.txt -b /tmp/api-studio-cookies.txt \
  -X POST http://localhost:8080/api/items \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"HTTPBin - IP Check\",
    \"method\": \"GET\",
    \"url\": \"https://httpbin.org/ip\",
    \"description\": \"HTTPBin API를 통해 현재 클라이언트의 IP 주소를 확인합니다.\",
    \"folderId\": $FOLDER_ID,
    \"requestParams\": \"[]\",
    \"requestHeaders\": \"[]\",
    \"requestBody\": \"\"
  }" > /dev/null
echo "  - HTTPBin - IP Check: Created"

echo ""
echo "Done! Created 1 folder and 5 API test cases."
```

## 결과

스킬 실행 후 생성되는 데이터:

| 구분 | 이름 | 설명 |
|------|------|------|
| 폴더 | test | 테스트용 API 폴더 |
| API | JSONPlaceholder - Get Posts | 게시글 목록 조회 (GET) |
| API | JSONPlaceholder - Get Single Post | 단일 게시글 조회 (GET) |
| API | JSONPlaceholder - Create Post | 게시글 생성 (POST) |
| API | JSONPlaceholder - Get Users | 사용자 목록 조회 (GET) |
| API | HTTPBin - IP Check | IP 주소 확인 (GET) |

## 사전 요구사항

- Backend 서버가 `http://localhost:8080`에서 실행 중이어야 합니다.
- 기본 관리자 계정(admin@blue.com)이 존재해야 합니다.

## 정리

테스트 데이터를 삭제하려면 API Testing 페이지에서 "test" 폴더를 삭제하면 됩니다.
