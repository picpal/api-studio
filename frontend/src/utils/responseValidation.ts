/**
 * 응답 검증을 위한 유틸리티 함수들
 */

export interface ValidationRule {
  key: string;
  value: string;
}

export interface ValidationResult {
  passed: boolean;
  results: Array<{
    key: string;
    expectedValue: string;
    actualValue: any;
    passed: boolean;
    error?: string;
  }>;
}

/**
 * JSON 객체에서 지정된 경로(path)의 값을 추출합니다.
 * 
 * @param obj - 검색할 JSON 객체
 * @param path - 점(.)으로 구분된 경로 (예: "data.code", "result.items.0.name")
 * @returns 경로에 해당하는 값, 없으면 undefined
 * 
 * 예시:
 * - getValueByPath({status: "success"}, "status") → "success"
 * - getValueByPath({data: {code: 200}}, "data.code") → 200
 * - getValueByPath({items: [{name: "test"}]}, "items.0.name") → "test"
 */
export function getValueByPath(obj: any, path: string): any {
  if (!obj || typeof obj !== 'object' || !path) {
    return undefined;
  }

  // 경로를 점(.)으로 분할
  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }

    // 배열 인덱스인지 확인 (숫자인지 체크)
    if (Array.isArray(current) && /^\d+$/.test(key)) {
      const index = parseInt(key, 10);
      if (index >= 0 && index < current.length) {
        current = current[index];
      } else {
        return undefined;
      }
    } else if (typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * 응답 JSON에서 모든 키를 재귀적으로 탐색하여 지정된 키가 존재하는지 확인합니다.
 * 
 * @param obj - 검색할 JSON 객체
 * @param targetKey - 찾을 키 이름
 * @returns 키가 존재하는 모든 경로들의 배열
 */
export function findAllKeyPaths(obj: any, targetKey: string): string[] {
  const paths: string[] = [];

  function search(current: any, currentPath: string = '') {
    if (current === null || current === undefined) {
      return;
    }

    if (typeof current === 'object') {
      if (Array.isArray(current)) {
        // 배열인 경우
        current.forEach((item, index) => {
          const newPath = currentPath ? `${currentPath}.${index}` : index.toString();
          search(item, newPath);
        });
      } else {
        // 객체인 경우
        Object.keys(current).forEach(key => {
          const newPath = currentPath ? `${currentPath}.${key}` : key;
          
          // 타겟 키와 일치하는 경우 경로 추가
          if (key === targetKey) {
            paths.push(newPath);
          }
          
          // 재귀적으로 계속 탐색
          search(current[key], newPath);
        });
      }
    }
  }

  search(obj);
  return paths;
}

/**
 * 문자열 값을 적절한 타입으로 변환합니다.
 * 
 * @param value - 변환할 문자열 값
 * @returns 변환된 값
 */
function parseExpectedValue(value: string): any {
  const trimmedValue = value.trim();
  
  // 빈 문자열
  if (trimmedValue === '') {
    return '';
  }
  
  // 불린 값
  if (trimmedValue.toLowerCase() === 'true') {
    return true;
  }
  if (trimmedValue.toLowerCase() === 'false') {
    return false;
  }
  
  // null
  if (trimmedValue.toLowerCase() === 'null') {
    return null;
  }
  
  // undefined
  if (trimmedValue.toLowerCase() === 'undefined') {
    return undefined;
  }
  
  // 숫자 (정수)
  if (/^-?\d+$/.test(trimmedValue)) {
    return parseInt(trimmedValue, 10);
  }
  
  // 숫자 (실수)
  if (/^-?\d*\.\d+$/.test(trimmedValue)) {
    return parseFloat(trimmedValue);
  }
  
  // JSON 객체나 배열
  if ((trimmedValue.startsWith('{') && trimmedValue.endsWith('}')) ||
      (trimmedValue.startsWith('[') && trimmedValue.endsWith(']'))) {
    try {
      return JSON.parse(trimmedValue);
    } catch {
      // JSON 파싱 실패 시 문자열로 처리
      return trimmedValue;
    }
  }
  
  // 기본적으로 문자열로 처리
  return trimmedValue;
}

/**
 * 응답 데이터가 지정된 검증 규칙들을 만족하는지 확인합니다.
 * 
 * @param responseData - 검증할 응답 데이터 (JSON 객체)
 * @param rules - 검증 규칙 배열
 * @returns 검증 결과
 */
export function validateResponse(responseData: any, rules: ValidationRule[]): ValidationResult {
  const results: ValidationResult['results'] = [];
  
  for (const rule of rules) {
    if (!rule.key.trim()) {
      // 빈 키는 무시
      continue;
    }
    
    try {
      const actualValue = getValueByPath(responseData, rule.key.trim());
      const expectedValue = parseExpectedValue(rule.value);
      
      // 값 비교 (깊은 비교)
      const passed = deepEqual(actualValue, expectedValue);
      
      results.push({
        key: rule.key.trim(),
        expectedValue: rule.value,
        actualValue,
        passed
      });
    } catch (error) {
      results.push({
        key: rule.key.trim(),
        expectedValue: rule.value,
        actualValue: undefined,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  const allPassed = results.length > 0 && results.every(result => result.passed);
  
  return {
    passed: allPassed,
    results
  };
}

/**
 * 두 값이 깊은 수준에서 동일한지 비교합니다.
 * 
 * @param a - 첫 번째 값
 * @param b - 두 번째 값
 * @returns 동일하면 true, 다르면 false
 */
function deepEqual(a: any, b: any): boolean {
  if (a === b) {
    return true;
  }
  
  if (a === null || b === null || a === undefined || b === undefined) {
    return a === b;
  }
  
  if (typeof a !== typeof b) {
    return false;
  }
  
  if (typeof a === 'object') {
    if (Array.isArray(a) !== Array.isArray(b)) {
      return false;
    }
    
    if (Array.isArray(a)) {
      if (a.length !== b.length) {
        return false;
      }
      for (let i = 0; i < a.length; i++) {
        if (!deepEqual(a[i], b[i])) {
          return false;
        }
      }
      return true;
    } else {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      
      if (keysA.length !== keysB.length) {
        return false;
      }
      
      for (const key of keysA) {
        if (!keysB.includes(key) || !deepEqual(a[key], b[key])) {
          return false;
        }
      }
      
      return true;
    }
  }
  
  return false;
}

/**
 * 검증 결과를 사람이 읽기 쉬운 형태로 포맷합니다.
 * 
 * @param result - 검증 결과
 * @returns 포맷된 결과 문자열
 */
export function formatValidationResult(result: ValidationResult): string {
  if (result.results.length === 0) {
    return 'No validation rules specified';
  }
  
  const summary = `${result.results.filter(r => r.passed).length}/${result.results.length} tests passed`;
  
  const details = result.results.map(r => {
    const status = r.passed ? '✅' : '❌';
    const actualStr = typeof r.actualValue === 'undefined' ? 'undefined' : 
                     typeof r.actualValue === 'string' ? `"${r.actualValue}"` :
                     JSON.stringify(r.actualValue);
    const expectedStr = typeof r.expectedValue === 'string' ? `"${r.expectedValue}"` : r.expectedValue;
    
    if (r.error) {
      return `${status} ${r.key}: Error - ${r.error}`;
    } else {
      return `${status} ${r.key}: Expected ${expectedStr}, got ${actualStr}`;
    }
  }).join('\n');
  
  return `${summary}\n\n${details}`;
}