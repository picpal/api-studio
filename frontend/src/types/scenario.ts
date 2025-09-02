export interface Scenario {
  id: number;
  name: string;
  description: string;
  steps: ScenarioStep[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ScenarioStep {
  id: number;
  scenarioId: number;
  apiItemId: number;
  order: number;
  variables?: Record<string, any>;
  assertions?: Assertion[];
}

export interface Assertion {
  field: string;
  operator: 'equals' | 'contains' | 'exists' | 'not_exists';
  value?: any;
}

export interface ScenarioExecution {
  id: number;
  scenarioId: number;
  status: 'pending' | 'running' | 'success' | 'failed';
  startTime: string;
  endTime?: string;
  results: StepExecutionResult[];
}

export interface StepExecutionResult {
  stepId: number;
  status: 'success' | 'failed' | 'skipped';
  response?: any;
  error?: string;
  duration?: number;
}