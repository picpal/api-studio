package com.example.apitest.dto.pipeline.response;

import java.time.LocalDateTime;

public class PipelineStepDTO {
    private Long id;
    private Integer stepOrder;
    private String stepName;
    private String description;
    private String dataExtractions;
    private String dataInjections;
    private String executionCondition;
    private Integer delayAfter;
    private Boolean isActive;
    private ApiItemDTO apiItem;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public PipelineStepDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Integer getStepOrder() { return stepOrder; }
    public void setStepOrder(Integer stepOrder) { this.stepOrder = stepOrder; }

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
    
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public ApiItemDTO getApiItem() { return apiItem; }
    public void setApiItem(ApiItemDTO apiItem) { this.apiItem = apiItem; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}