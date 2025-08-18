// 테스트 시나리오 관련 타입 정의

export interface TestScenario {
  id: string;
  name: string;
  description: string;
  steps: TestStep[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface TestStep {
  id: string;
  apiId: string;
  apiName: string;
  order: number;
  
  // 데이터 추출 설정 (이전 응답에서 값 추출)
  dataExtractions?: DataExtraction[];
  
  // 데이터 주입 설정 (추출된 값을 현재 요청에 주입)
  dataInjections?: DataInjection[];
  
  // 조건부 실행
  condition?: StepCondition;
  
  // 실행 후 대기 시간 (ms)
  delayAfter?: number;
}

export interface DataExtraction {
  id: string;
  name: string; // 변수명 (예: "authToken", "userId")
  source: 'response_body' | 'response_headers' | 'response_status';
  jsonPath?: string; // response_body인 경우 JSON 경로 (예: "data.token")
  headerKey?: string; // response_headers인 경우 헤더 키
  description?: string;
}

export interface DataInjection {
  id: string;
  variableName: string; // 사용할 변수명
  target: 'url' | 'headers' | 'body' | 'params';
  targetPath?: string; // 주입할 위치의 경로
  targetKey?: string; // headers나 params인 경우 키
  placeholder?: string; // URL이나 body에서 대체할 플레이스홀더 (예: "{authToken}")
}

export interface StepCondition {
  type: 'always' | 'if_previous_success' | 'if_previous_failed' | 'if_variable_exists';
  variableName?: string; // if_variable_exists인 경우
}

// 시나리오 실행 컨텍스트
export interface ScenarioExecutionContext {
  scenarioId: string;
  variables: Record<string, any>; // 추출된 변수들
  stepResults: StepExecutionResult[];
  startTime: Date;
  status: 'running' | 'completed' | 'failed' | 'stopped';
}

export interface StepExecutionResult {
  stepId: string;
  apiId: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  responseTime?: number;
  statusCode?: number;
  error?: string;
  extractedData?: Record<string, any>;
  timestamp: Date;
  responseBody?: string;
  responseHeaders?: Record<string, string>;
}

// 시나리오 템플릿 (자주 사용되는 패턴)
export interface ScenarioTemplate {
  id: string;
  name: string;
  description: string;
  template: Omit<TestScenario, 'id' | 'createdAt' | 'updatedAt'>;
}