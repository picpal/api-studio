import { ValidationResult } from '../../../shared/lib/responseValidation';

export interface TestExecution {
  id: string;
  apiName: string;
  method: string;
  url: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  responseTime?: number;
  statusCode?: number;
  error?: string;
  timestamp: Date;
  responseBody?: string;
  responseHeaders?: Record<string, string>;
  responseData?: any;
  requestBody?: string;
  requestHeaders?: Record<string, string>;
  requestParams?: any;
  validationResult?: ValidationResult;
  validationEnabled?: boolean;
  // Pipeline execution fields
  type?: 'api' | 'pipeline';
  pipelineId?: string;
  stepExecutions?: PipelineStepExecution[];
}

export interface PipelineStepExecution {
  id: string;
  stepName: string;
  stepOrder: number;
  status: 'pending' | 'running' | 'success' | 'failed';
  responseTime?: number;
  statusCode?: number;
  error?: string;
  method: string;
  url: string;
  requestBody?: string;
  requestHeaders?: Record<string, string>;
  responseBody?: string;
  responseHeaders?: Record<string, string>;
  extractedData?: Record<string, any>;  // 추출된 변수들
  injectedData?: Record<string, any>;   // 주입된 변수들
  requestData?: string; // 실제 실행된 요청 데이터 (JSON 문자열)
  responseData?: string; // 실제 실행된 응답 데이터
  apiItem?: {
    id: string;
    name: string;
    method: string;
    url: string;
    baseUrl?: string;
  };
}

export interface ReportData {
  summary: {
    totalTests: number;
    successCount: number;
    failureCount: number;
    successRate: number;
    avgResponseTime: number;
    validationTests: number;
    validationPassed: number;
    validationRate: number;
  };
  executions: TestExecution[];
  failedTests: TestExecution[];
  statusCodeStats: Record<number, number>;
  pipelineStats: {
    totalPipelines: number;
    successfulPipelines: number;
    failedPipelines: number;
    totalSteps: number;
    successfulSteps: number;
    failedSteps: number;
  };
}