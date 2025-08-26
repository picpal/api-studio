/**
 * 템플릿 변수와 관련된 유틸리티 함수들
 */

export interface TemplateVariable {
  name: string;
  value: string;
  defaultValue?: string;
}

/**
 * 문자열에서 {{변수명}} 또는 {{변수명:기본값}} 형태의 템플릿 변수를 추출합니다
 * @param text 검사할 문자열
 * @returns 발견된 변수명들의 배열 (기본값 제외)
 */
export const extractTemplateVariables = (text: string): string[] => {
  if (!text) return [];
  
  const regex = /\{\{([^}:]+)(?::([^}]*))?\}\}/g;
  const variables: string[] = [];
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    const variableName = match[1].trim();
    if (variableName && !variables.includes(variableName)) {
      variables.push(variableName);
    }
  }
  
  return variables;
};

/**
 * 문자열에서 {{변수명:기본값}} 형태의 템플릿 변수를 TemplateVariable 객체로 추출합니다
 * @param text 검사할 문자열
 * @returns 발견된 TemplateVariable 객체들의 배열
 */
export const extractTemplateVariablesWithDefaults = (text: string): TemplateVariable[] => {
  if (!text) return [];
  
  const regex = /\{\{([^}:]+)(?::([^}]*))?\}\}/g;
  const variables: TemplateVariable[] = [];
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    const variableName = match[1].trim();
    const defaultValue = match[2]; // undefined if no default value
    
    if (variableName && !variables.some(v => v.name === variableName)) {
      variables.push({
        name: variableName,
        value: defaultValue || '',
        defaultValue: defaultValue
      });
    }
  }
  
  return variables;
};

/**
 * 객체의 모든 속성에서 템플릿 변수를 추출합니다
 * @param obj 검사할 객체
 * @returns 발견된 변수명들의 배열
 */
export const extractTemplateVariablesFromObject = (obj: any): string[] => {
  if (!obj || typeof obj !== 'object') return [];
  
  const variables: string[] = [];
  
  const traverse = (value: any) => {
    if (typeof value === 'string') {
      const vars = extractTemplateVariables(value);
      vars.forEach(v => {
        if (!variables.includes(v)) {
          variables.push(v);
        }
      });
    } else if (typeof value === 'object' && value !== null) {
      Object.values(value).forEach(traverse);
    }
  };
  
  traverse(obj);
  return variables;
};

/**
 * API 요청 데이터에서 모든 템플릿 변수를 추출합니다
 * @param request API 요청 객체
 * @returns 발견된 변수명들의 배열
 */
export const extractTemplateVariablesFromRequest = (request: any): string[] => {
  const variables: string[] = [];
  
  // URL에서 변수 추출
  if (request.url) {
    const urlVars = extractTemplateVariables(request.url);
    urlVars.forEach(v => {
      if (!variables.includes(v)) variables.push(v);
    });
  }
  
  // Headers에서 변수 추출
  if (request.headers) {
    const headerVars = extractTemplateVariablesFromObject(request.headers);
    headerVars.forEach(v => {
      if (!variables.includes(v)) variables.push(v);
    });
  }
  
  // Body에서 변수 추출
  if (request.body) {
    const bodyVars = extractTemplateVariables(request.body);
    bodyVars.forEach(v => {
      if (!variables.includes(v)) variables.push(v);
    });
  }
  
  // Params에서 변수 추출 (객체 형태)
  if (request.params) {
    const paramVars = extractTemplateVariablesFromObject(request.params);
    paramVars.forEach(v => {
      if (!variables.includes(v)) variables.push(v);
    });
  }
  
  return variables;
};

/**
 * API 요청 데이터에서 모든 템플릿 변수를 기본값과 함께 추출합니다
 * @param request API 요청 객체
 * @returns 발견된 TemplateVariable 객체들의 배열
 */
export const extractTemplateVariablesFromRequestWithDefaults = (request: any): TemplateVariable[] => {
  const variableMap = new Map<string, TemplateVariable>();
  
  const addVariables = (variables: TemplateVariable[]) => {
    variables.forEach(variable => {
      if (!variableMap.has(variable.name)) {
        variableMap.set(variable.name, variable);
      }
    });
  };
  
  // URL에서 변수 추출
  if (request.url) {
    const urlVars = extractTemplateVariablesWithDefaults(request.url);
    addVariables(urlVars);
  }
  
  // Headers에서 변수 추출 (문자열 값들)
  if (request.headers) {
    Object.values(request.headers).forEach(value => {
      if (typeof value === 'string') {
        const headerVars = extractTemplateVariablesWithDefaults(value);
        addVariables(headerVars);
      }
    });
  }
  
  // Body에서 변수 추출
  if (request.body) {
    const bodyVars = extractTemplateVariablesWithDefaults(request.body);
    addVariables(bodyVars);
  }
  
  // Params에서 변수 추출 (문자열 값들)
  if (request.params) {
    Object.values(request.params).forEach(value => {
      if (typeof value === 'string') {
        const paramVars = extractTemplateVariablesWithDefaults(value);
        addVariables(paramVars);
      }
    });
  }
  
  return Array.from(variableMap.values());
};

/**
 * 템플릿 변수를 실제 값으로 치환합니다 (기본값 지원)
 * @param text 원본 텍스트
 * @param variables 변수명과 값의 맵핑
 * @returns 치환된 텍스트
 */
export const replaceTemplateVariables = (text: string, variables: Record<string, string> = {}): string => {
  if (!text) return text;
  
  // {{변수명:기본값}} 또는 {{변수명}} 패턴 매칭
  const regex = /\{\{([^}:]+)(?::([^}]*))?\}\}/g;
  
  return text.replace(regex, (match, variableName, defaultValue) => {
    const trimmedName = variableName.trim();
    
    // 변수에 값이 있으면 사용
    if (variables[trimmedName] !== undefined && variables[trimmedName] !== null) {
      return variables[trimmedName];
    }
    
    // 기본값이 있으면 사용
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    
    // 둘 다 없으면 빈 문자열
    return '';
  });
};

/**
 * 객체의 모든 문자열 속성에서 템플릿 변수를 치환합니다
 * @param obj 원본 객체
 * @param variables 변수명과 값의 맵핑
 * @returns 치환된 새 객체
 */
export const replaceTemplateVariablesInObject = (obj: any, variables: Record<string, string>): any => {
  if (!obj) return obj;
  
  if (typeof obj === 'string') {
    return replaceTemplateVariables(obj, variables);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => replaceTemplateVariablesInObject(item, variables));
  }
  
  if (typeof obj === 'object') {
    const result: any = {};
    Object.entries(obj).forEach(([key, value]) => {
      result[key] = replaceTemplateVariablesInObject(value, variables);
    });
    return result;
  }
  
  return obj;
};

/**
 * API 요청 객체의 모든 템플릿 변수를 치환합니다
 * @param request 원본 요청 객체
 * @param variables 변수명과 값의 맵핑
 * @returns 치환된 새 요청 객체
 */
export const replaceTemplateVariablesInRequest = (request: any, variables: Record<string, string>): any => {
  return {
    ...request,
    url: replaceTemplateVariables(request.url, variables),
    headers: replaceTemplateVariablesInObject(request.headers, variables),
    body: replaceTemplateVariables(request.body, variables),
    params: replaceTemplateVariablesInObject(request.params, variables)
  };
};