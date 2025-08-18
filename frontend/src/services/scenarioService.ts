import { TestScenario, TestStep, ScenarioExecutionContext, StepExecutionResult, DataExtraction, DataInjection } from '../types/scenario';
import { ApiItem } from '../types/api';

export class ScenarioService {
  
  // JSON Path에서 값 추출
  static extractValueFromJsonPath(data: any, jsonPath: string): any {
    const paths = jsonPath.split('.');
    let current = data;
    
    for (const path of paths) {
      if (current === null || current === undefined) {
        return undefined;
      }
      
      // 배열 인덱스 처리 (예: items.0.name)
      if (/^\d+$/.test(path)) {
        const index = parseInt(path);
        if (Array.isArray(current) && index < current.length) {
          current = current[index];
        } else {
          return undefined;
        }
      } else {
        current = current[path];
      }
    }
    
    return current;
  }
  
  // 응답에서 데이터 추출
  static extractDataFromResponse(
    extraction: DataExtraction, 
    responseBody: string, 
    responseHeaders: Record<string, string>, 
    statusCode: number
  ): any {
    try {
      switch (extraction.source) {
        case 'response_body':
          if (extraction.jsonPath) {
            const jsonData = JSON.parse(responseBody);
            return this.extractValueFromJsonPath(jsonData, extraction.jsonPath);
          }
          return responseBody;
          
        case 'response_headers':
          if (extraction.headerKey) {
            return responseHeaders[extraction.headerKey] || responseHeaders[extraction.headerKey.toLowerCase()];
          }
          return responseHeaders;
          
        case 'response_status':
          return statusCode;
          
        default:
          return undefined;
      }
    } catch (error) {
      console.error('Data extraction error:', error);
      return undefined;
    }
  }
  
  // 요청에 데이터 주입
  static injectDataIntoRequest(
    injection: DataInjection, 
    apiItem: ApiItem, 
    variables: Record<string, any>
  ): ApiItem {
    const value = variables[injection.variableName];
    if (value === undefined) {
      console.warn(`Variable ${injection.variableName} not found for injection`);
      return apiItem;
    }
    
    const updatedApi = { ...apiItem };
    
    try {
      switch (injection.target) {
        case 'url':
          if (injection.placeholder) {
            updatedApi.url = updatedApi.url.replace(injection.placeholder, String(value));
          }
          break;
          
        case 'headers':
          const headers = updatedApi.requestHeaders ? JSON.parse(updatedApi.requestHeaders) : {};
          if (injection.targetKey) {
            headers[injection.targetKey] = value;
            updatedApi.requestHeaders = JSON.stringify(headers);
          }
          break;
          
        case 'body':
          if (injection.placeholder && updatedApi.requestBody) {
            updatedApi.requestBody = updatedApi.requestBody.replace(injection.placeholder, String(value));
          }
          break;
          
        case 'params':
          const params = updatedApi.requestParams ? JSON.parse(updatedApi.requestParams) : [];
          if (injection.targetKey) {
            // 기존 파라미터 찾아서 업데이트하거나 새로 추가
            const existingParam = params.find((p: any) => p.key === injection.targetKey);
            if (existingParam) {
              existingParam.value = String(value);
            } else {
              params.push({
                key: injection.targetKey,
                value: String(value),
                description: `Injected from ${injection.variableName}`,
                required: false
              });
            }
            updatedApi.requestParams = JSON.stringify(params);
          }
          break;
      }
    } catch (error) {
      console.error('Data injection error:', error);
    }
    
    return updatedApi;
  }
  
  // 단계 실행 조건 확인
  static shouldExecuteStep(
    step: TestStep, 
    context: ScenarioExecutionContext,
    previousStepResult?: StepExecutionResult
  ): boolean {
    if (!step.condition || step.condition.type === 'always') {
      return true;
    }
    
    switch (step.condition.type) {
      case 'if_previous_success':
        return previousStepResult?.status === 'success';
        
      case 'if_previous_failed':
        return previousStepResult?.status === 'failed';
        
      case 'if_variable_exists':
        return step.condition.variableName ? 
          context.variables[step.condition.variableName] !== undefined : false;
        
      default:
        return true;
    }
  }
  
  // 플레이스홀더 패턴 찾기
  static findPlaceholders(text: string): string[] {
    const pattern = /\{([^}]+)\}/g;
    const matches = [];
    let match;
    
    while ((match = pattern.exec(text)) !== null) {
      matches.push(match[1]);
    }
    
    return matches;
  }
  
  // API 아이템에서 사용된 변수 찾기
  static findUsedVariables(apiItem: ApiItem): string[] {
    const variables = new Set<string>();
    
    // URL에서 플레이스홀더 찾기
    this.findPlaceholders(apiItem.url).forEach(v => variables.add(v));
    
    // Body에서 플레이스홀더 찾기
    if (apiItem.requestBody) {
      this.findPlaceholders(apiItem.requestBody).forEach(v => variables.add(v));
    }
    
    return Array.from(variables);
  }
}

// 시나리오 실행 엔진
export class ScenarioExecutor {
  private context: ScenarioExecutionContext;
  private onStepComplete?: (result: StepExecutionResult) => void;
  private onScenarioComplete?: (context: ScenarioExecutionContext) => void;
  
  constructor(
    scenarioId: string,
    onStepComplete?: (result: StepExecutionResult) => void,
    onScenarioComplete?: (context: ScenarioExecutionContext) => void
  ) {
    this.context = {
      scenarioId,
      variables: {},
      stepResults: [],
      startTime: new Date(),
      status: 'running'
    };
    this.onStepComplete = onStepComplete;
    this.onScenarioComplete = onScenarioComplete;
  }
  
  async executeScenario(scenario: TestScenario, apiItems: ApiItem[]): Promise<ScenarioExecutionContext> {
    console.log('Starting scenario execution:', scenario.name);
    
    try {
      // 단계별 순차 실행
      for (let i = 0; i < scenario.steps.length; i++) {
        const step = scenario.steps[i];
        const previousResult = this.context.stepResults[i - 1];
        
        // 실행 조건 확인
        if (!ScenarioService.shouldExecuteStep(step, this.context, previousResult)) {
          const skippedResult: StepExecutionResult = {
            stepId: step.id,
            apiId: step.apiId,
            status: 'skipped',
            timestamp: new Date()
          };
          
          this.context.stepResults.push(skippedResult);
          this.onStepComplete?.(skippedResult);
          continue;
        }
        
        // API 아이템 찾기
        const apiItem = apiItems.find(api => api.id === step.apiId);
        if (!apiItem) {
          throw new Error(`API item not found: ${step.apiId}`);
        }
        
        // 단계 실행
        const result = await this.executeStep(step, apiItem);
        this.context.stepResults.push(result);
        this.onStepComplete?.(result);
        
        // 실패 시 시나리오 중단 (조건에 따라)
        if (result.status === 'failed') {
          console.warn(`Step failed: ${step.apiName}. Continuing to next step.`);
          // 필요에 따라 break; 로 중단할 수 있음
        }
        
        // 단계 간 대기
        if (step.delayAfter && step.delayAfter > 0) {
          await new Promise(resolve => setTimeout(resolve, step.delayAfter));
        }
      }
      
      this.context.status = 'completed';
    } catch (error) {
      console.error('Scenario execution error:', error);
      this.context.status = 'failed';
    }
    
    this.onScenarioComplete?.(this.context);
    return this.context;
  }
  
  private async executeStep(step: TestStep, apiItem: ApiItem): Promise<StepExecutionResult> {
    const result: StepExecutionResult = {
      stepId: step.id,
      apiId: step.apiId,
      status: 'running',
      timestamp: new Date()
    };
    
    try {
      // 데이터 주입 (변수를 요청에 주입)
      let processedApi = { ...apiItem };
      if (step.dataInjections) {
        for (const injection of step.dataInjections) {
          processedApi = ScenarioService.injectDataIntoRequest(injection, processedApi, this.context.variables);
        }
      }
      
      // API 실행 (기존 executeApiCall 로직 사용)
      const startTime = Date.now();
      const response = await this.executeApiCall(processedApi);
      const endTime = Date.now();
      
      result.responseTime = endTime - startTime;
      result.statusCode = response.statusCode;
      result.responseBody = response.responseBody;
      result.responseHeaders = response.responseHeaders;
      result.status = (response.statusCode >= 200 && response.statusCode < 300) ? 'success' : 'failed';
      
      // 데이터 추출 (응답에서 변수 추출)
      if (step.dataExtractions && result.status === 'success') {
        const extractedData: Record<string, any> = {};
        
        for (const extraction of step.dataExtractions) {
          const value = ScenarioService.extractDataFromResponse(
            extraction,
            response.responseBody,
            response.responseHeaders,
            response.statusCode
          );
          
          if (value !== undefined) {
            extractedData[extraction.name] = value;
            this.context.variables[extraction.name] = value;
          }
        }
        
        result.extractedData = extractedData;
      }
      
    } catch (error) {
      console.error('Step execution error:', error);
      result.status = 'failed';
      result.error = error instanceof Error ? error.message : 'Unknown error';
    }
    
    return result;
  }
  
  // API 호출 (기존 로직과 동일)
  private async executeApiCall(api: ApiItem): Promise<{
    responseBody: string;
    responseHeaders: Record<string, string>;
    statusCode: number;
  }> {
    // 실제 구현은 TestAutomationPage의 executeApiCall과 동일
    // 여기서는 간소화된 버전
    console.log('Executing API call:', api.name);
    
    // TODO: 실제 API 호출 로직 구현
    // 현재는 mock 응답 반환
    return {
      responseBody: '{"status": "success", "data": {"token": "mock-token-123"}}',
      responseHeaders: {'content-type': 'application/json'},
      statusCode: 200
    };
  }
  
  getContext(): ScenarioExecutionContext {
    return this.context;
  }
  
  stop(): void {
    this.context.status = 'stopped';
  }
}