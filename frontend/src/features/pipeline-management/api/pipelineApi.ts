import { PipelineStep, ApiItem, CreateStepRequest } from '@/entities/pipeline';

const API_BASE_URL = 'http://localhost:8080/api';

export const pipelineApi = {
  async fetchSteps(pipelineId: number): Promise<PipelineStep[]> {
    const response = await fetch(`${API_BASE_URL}/pipelines/${pipelineId}/steps`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch steps. Status: ${response.status}`);
    }
    
    return response.json();
  },

  async fetchApiItems(): Promise<ApiItem[]> {
    const response = await fetch(`${API_BASE_URL}/items`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch API items. Status: ${response.status}`);
    }
    
    return response.json();
  },

  async addStep(pipelineId: number, stepData: CreateStepRequest): Promise<PipelineStep> {
    const response = await fetch(`${API_BASE_URL}/pipelines/${pipelineId}/steps`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(stepData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to add step. Status: ${response.status}, Error: ${errorText}`);
    }

    return response.json();
  },

  async deleteStep(stepId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/pipelines/steps/${stepId}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Failed to delete step. Status: ${response.status}`);
    }
  }
};