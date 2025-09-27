export interface TestExecutionRequest {
  scriptId: string;
  scriptPath: string;
  fileName: string;
  options?: PlaywrightOptions;
}

export interface PlaywrightOptions {
  headless?: boolean;
  browser?: 'chromium' | 'firefox' | 'webkit';
  timeout?: number;
  viewport?: {
    width: number;
    height: number;
  };
}

export interface TestExecutionResult {
  scriptId: string;
  fileName: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  output?: string;
  error?: string;
  screenshots?: string[];
  traces?: string[];
}

export interface WebSocketMessage {
  type: 'execution-start' | 'execution-progress' | 'execution-complete' | 'execution-error';
  data: TestExecutionResult;
}

export interface BatchExecutionRequest {
  scripts: TestExecutionRequest[];
  parallel?: boolean;
  maxConcurrency?: number;
}

export interface BatchExecutionResult {
  batchId: string;
  totalScripts: number;
  completedScripts: number;
  failedScripts: number;
  results: TestExecutionResult[];
}