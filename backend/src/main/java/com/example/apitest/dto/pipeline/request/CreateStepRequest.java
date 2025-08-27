package com.example.apitest.dto.pipeline.request;

public class CreateStepRequest {
    private Long apiItemId;
    private String stepName;
    private String description;
    private String dataExtractions;
    private String dataInjections;
    private String executionCondition;
    private Integer delayAfter;

    public CreateStepRequest() {}

    public Long getApiItemId() { return apiItemId; }
    public void setApiItemId(Long apiItemId) { this.apiItemId = apiItemId; }
    
    public String getStepName() { return stepName; }
    public void setStepName(String stepName) { this.stepName = stepName; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public String getDataExtractions() { return dataExtractions; }
    public void setDataExtractions(String dataExtractions) { this.dataExtractions = dataExtractions; }
    
    public String getDataInjections() { return dataInjections; }
    public void setDataInjections(String dataInjections) { this.dataInjections = dataInjections; }
    
    public String getExecutionCondition() { return executionCondition; }
    public void setExecutionCondition(String executionCondition) { this.executionCondition = executionCondition; }
    
    public Integer getDelayAfter() { return delayAfter; }
    public void setDelayAfter(Integer delayAfter) { this.delayAfter = delayAfter; }
}