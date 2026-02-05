# /seed-ui-tests - UI Testing E2E 테스트용 기본 데이터 등록

> **주의**: 이 문서의 비밀번호는 로컬 개발 환경용 예시입니다. 프로덕션에서는 환경변수를 사용하세요.

UI Testing 페이지에 E2E 테스트용 샘플 데이터를 등록합니다.

## 실행 절차

### 1. 로그인 세션 획득

먼저 API 서버에 로그인하여 세션 쿠키를 획득합니다.

```bash
curl -c /tmp/api-studio-cookies.txt -b /tmp/api-studio-cookies.txt \
  -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@blue.com","password":"Admin!2024@Blue"}'
```

### 2. 폴더 생성

UI 테스트용 폴더 2개를 생성합니다.

#### 2.1 E2E Test Folder 생성

```bash
FOLDER1_RESPONSE=$(curl -s -c /tmp/api-studio-cookies.txt -b /tmp/api-studio-cookies.txt \
  -X POST http://localhost:8080/api/ui-tests/folders \
  -H "Content-Type: application/json" \
  -d '{"name":"E2E Test Folder","description":"E2E 테스트를 위한 메인 폴더입니다."}')

FOLDER1_ID=$(echo $FOLDER1_RESPONSE | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
echo "Created E2E Test Folder with ID: $FOLDER1_ID"
```

#### 2.2 Sample Scripts 폴더 생성

```bash
FOLDER2_RESPONSE=$(curl -s -c /tmp/api-studio-cookies.txt -b /tmp/api-studio-cookies.txt \
  -X POST http://localhost:8080/api/ui-tests/folders \
  -H "Content-Type: application/json" \
  -d '{"name":"Sample Scripts","description":"샘플 테스트 스크립트 폴더입니다."}')

FOLDER2_ID=$(echo $FOLDER2_RESPONSE | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
echo "Created Sample Scripts folder with ID: $FOLDER2_ID"
```

### 3. 스크립트 생성

각 폴더에 테스트 스크립트를 생성합니다.

#### 3.1 Login Test (E2E Test Folder)

```bash
curl -s -c /tmp/api-studio-cookies.txt -b /tmp/api-studio-cookies.txt \
  -X POST http://localhost:8080/api/ui-tests/scripts \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Login Test\",
    \"description\": \"로그인 기능을 테스트하는 E2E 스크립트입니다.\",
    \"scriptContent\": \"const { test, expect } = require('@playwright/test');\\n\\ntest('login test', async ({ page }) => {\\n  await page.goto('https://example.com/login');\\n  await page.fill('input[name=\\\"email\\\"]', 'test@example.com');\\n  await page.fill('input[name=\\\"password\\\"]', 'password123');\\n  await page.click('button[type=\\\"submit\\\"]');\\n  await expect(page).toHaveURL(/dashboard/);\\n});\",
    \"scriptType\": \"PLAYWRIGHT\",
    \"browserType\": \"CHROMIUM\",
    \"timeoutSeconds\": 30,
    \"headlessMode\": true,
    \"screenshotOnFailure\": true,
    \"folderId\": $FOLDER1_ID
  }"
```

#### 3.2 Homepage Test (E2E Test Folder)

```bash
curl -s -c /tmp/api-studio-cookies.txt -b /tmp/api-studio-cookies.txt \
  -X POST http://localhost:8080/api/ui-tests/scripts \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Homepage Test\",
    \"description\": \"홈페이지 기본 기능을 테스트하는 E2E 스크립트입니다.\",
    \"scriptContent\": \"const { test, expect } = require('@playwright/test');\\n\\ntest('homepage test', async ({ page }) => {\\n  await page.goto('https://example.com');\\n  await expect(page).toHaveTitle(/Example Domain/);\\n  const heading = page.locator('h1');\\n  await expect(heading).toBeVisible();\\n});\",
    \"scriptType\": \"PLAYWRIGHT\",
    \"browserType\": \"CHROMIUM\",
    \"timeoutSeconds\": 30,
    \"headlessMode\": true,
    \"screenshotOnFailure\": true,
    \"folderId\": $FOLDER1_ID
  }"
```

#### 3.3 Example Test (Sample Scripts)

```bash
curl -s -c /tmp/api-studio-cookies.txt -b /tmp/api-studio-cookies.txt \
  -X POST http://localhost:8080/api/ui-tests/scripts \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Example Test\",
    \"description\": \"간단한 예제 테스트 스크립트입니다.\",
    \"scriptContent\": \"const { test, expect } = require('@playwright/test');\\n\\ntest('example test', async ({ page }) => {\\n  await page.goto('https://example.com');\\n  await expect(page).toHaveTitle(/Example/);\\n});\",
    \"scriptType\": \"PLAYWRIGHT\",
    \"browserType\": \"CHROMIUM\",
    \"timeoutSeconds\": 30,
    \"headlessMode\": true,
    \"screenshotOnFailure\": true,
    \"folderId\": $FOLDER2_ID
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
echo "Creating UI test folders..."

# 2.1 E2E Test Folder
FOLDER1_RESPONSE=$(curl -s -c /tmp/api-studio-cookies.txt -b /tmp/api-studio-cookies.txt \
  -X POST http://localhost:8080/api/ui-tests/folders \
  -H "Content-Type: application/json" \
  -d '{"name":"E2E Test Folder","description":"E2E 테스트를 위한 메인 폴더입니다."}')

FOLDER1_ID=$(echo $FOLDER1_RESPONSE | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
echo "  - E2E Test Folder: Created (ID: $FOLDER1_ID)"

if [ -z "$FOLDER1_ID" ]; then
  echo "Error: Failed to create E2E Test Folder"
  exit 1
fi

# 2.2 Sample Scripts
FOLDER2_RESPONSE=$(curl -s -c /tmp/api-studio-cookies.txt -b /tmp/api-studio-cookies.txt \
  -X POST http://localhost:8080/api/ui-tests/folders \
  -H "Content-Type: application/json" \
  -d '{"name":"Sample Scripts","description":"샘플 테스트 스크립트 폴더입니다."}')

FOLDER2_ID=$(echo $FOLDER2_RESPONSE | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
echo "  - Sample Scripts: Created (ID: $FOLDER2_ID)"

if [ -z "$FOLDER2_ID" ]; then
  echo "Error: Failed to create Sample Scripts folder"
  exit 1
fi

# 3. 스크립트 생성
echo "Creating UI test scripts..."

# 3.1 Login Test (E2E Test Folder)
curl -s -c /tmp/api-studio-cookies.txt -b /tmp/api-studio-cookies.txt \
  -X POST http://localhost:8080/api/ui-tests/scripts \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Login Test\",
    \"description\": \"로그인 기능을 테스트하는 E2E 스크립트입니다.\",
    \"scriptContent\": \"const { test, expect } = require('@playwright/test');\\n\\ntest('login test', async ({ page }) => {\\n  await page.goto('https://example.com/login');\\n  await page.fill('input[name=\\\\\\\"email\\\\\\\"]\', 'test@example.com');\\n  await page.fill('input[name=\\\\\\\"password\\\\\\\"]\', 'password123');\\n  await page.click('button[type=\\\\\\\"submit\\\\\\\"]');\\n  await expect(page).toHaveURL(/dashboard/);\\n});\",
    \"scriptType\": \"PLAYWRIGHT\",
    \"browserType\": \"CHROMIUM\",
    \"timeoutSeconds\": 30,
    \"headlessMode\": true,
    \"screenshotOnFailure\": true,
    \"folderId\": $FOLDER1_ID
  }" > /dev/null
echo "  - Login Test: Created (in E2E Test Folder)"

# 3.2 Homepage Test (E2E Test Folder)
curl -s -c /tmp/api-studio-cookies.txt -b /tmp/api-studio-cookies.txt \
  -X POST http://localhost:8080/api/ui-tests/scripts \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Homepage Test\",
    \"description\": \"홈페이지 기본 기능을 테스트하는 E2E 스크립트입니다.\",
    \"scriptContent\": \"const { test, expect } = require('@playwright/test');\\n\\ntest('homepage test', async ({ page }) => {\\n  await page.goto('https://example.com');\\n  await expect(page).toHaveTitle(/Example Domain/);\\n  const heading = page.locator('h1');\\n  await expect(heading).toBeVisible();\\n});\",
    \"scriptType\": \"PLAYWRIGHT\",
    \"browserType\": \"CHROMIUM\",
    \"timeoutSeconds\": 30,
    \"headlessMode\": true,
    \"screenshotOnFailure\": true,
    \"folderId\": $FOLDER1_ID
  }" > /dev/null
echo "  - Homepage Test: Created (in E2E Test Folder)"

# 3.3 Example Test (Sample Scripts)
curl -s -c /tmp/api-studio-cookies.txt -b /tmp/api-studio-cookies.txt \
  -X POST http://localhost:8080/api/ui-tests/scripts \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Example Test\",
    \"description\": \"간단한 예제 테스트 스크립트입니다.\",
    \"scriptContent\": \"const { test, expect } = require('@playwright/test');\\n\\ntest('example test', async ({ page }) => {\\n  await page.goto('https://example.com');\\n  await expect(page).toHaveTitle(/Example/);\\n});\",
    \"scriptType\": \"PLAYWRIGHT\",
    \"browserType\": \"CHROMIUM\",
    \"timeoutSeconds\": 30,
    \"headlessMode\": true,
    \"screenshotOnFailure\": true,
    \"folderId\": $FOLDER2_ID
  }" > /dev/null
echo "  - Example Test: Created (in Sample Scripts)"

echo ""
echo "Done! Created 2 folders and 3 UI test scripts."
```

## 결과

스킬 실행 후 생성되는 데이터:

| 구분 | 이름 | 설명 | 위치 |
|------|------|------|------|
| 폴더 | E2E Test Folder | E2E 테스트를 위한 메인 폴더 | - |
| 폴더 | Sample Scripts | 샘플 테스트 스크립트 폴더 | - |
| 스크립트 | Login Test | 로그인 기능 테스트 (PLAYWRIGHT) | E2E Test Folder |
| 스크립트 | Homepage Test | 홈페이지 기본 기능 테스트 (PLAYWRIGHT) | E2E Test Folder |
| 스크립트 | Example Test | 간단한 예제 테스트 (PLAYWRIGHT) | Sample Scripts |

## 스크립트 상세

### Login Test
```javascript
const { test, expect } = require('@playwright/test');

test('login test', async ({ page }) => {
  await page.goto('https://example.com/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/dashboard/);
});
```

### Homepage Test
```javascript
const { test, expect } = require('@playwright/test');

test('homepage test', async ({ page }) => {
  await page.goto('https://example.com');
  await expect(page).toHaveTitle(/Example Domain/);
  const heading = page.locator('h1');
  await expect(heading).toBeVisible();
});
```

### Example Test
```javascript
const { test, expect } = require('@playwright/test');

test('example test', async ({ page }) => {
  await page.goto('https://example.com');
  await expect(page).toHaveTitle(/Example/);
});
```

## 사전 요구사항

- Backend 서버가 `http://localhost:8080`에서 실행 중이어야 합니다.
- 기본 관리자 계정(admin@blue.com)이 존재해야 합니다.

## 정리

테스트 데이터를 삭제하려면 UI Testing 페이지에서 "E2E Test Folder"와 "Sample Scripts" 폴더를 삭제하면 됩니다.
