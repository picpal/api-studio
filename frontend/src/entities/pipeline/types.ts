export interface Pipeline {
  id: number;
  name: string;
  description: string;
  folderId: number | null;
  stepCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PipelineStep {
  id: number;
  stepOrder: number;
  stepName: string;
  description?: string;
  dataExtractions?: string;
  dataInjections?: string;
  executionCondition?: string;
  delayAfter?: number;
  isActive?: boolean;
  apiItem: ApiItem;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ApiItem {
  id: number;
  name: string;
  method: string;
  url: string;
  description?: string;
}

export interface CreateStepRequest {
  apiItemId: number;
  stepName: string;
  description?: string;
  dataExtractions?: string;
  dataInjections?: string;
  executionCondition?: string;
  delayAfter?: number;
}

export interface PipelineExecution {
  id: number;
  pipelineId: number;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  totalSteps: number;
  completedSteps: number;
  successfulSteps: number;
  failedSteps: number;
  startedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
  sessionCookies?: string;
}

export interface StepExecution {
  id: number;
  executionId: number;
  stepOrder: number;
  stepName: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';
  httpStatus?: number;
  requestData?: string;
  responseData?: string;
  extractedData?: string;
  responseTime?: number;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
}