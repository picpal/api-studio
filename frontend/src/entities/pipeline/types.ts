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
  apiItem: ApiItem;
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
}