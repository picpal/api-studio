package com.example.apitest.dto.pipeline.response;

import java.time.LocalDateTime;
import java.util.List;

public class PipelineFolderDTO {
    private Long id;
    private String name;
    private String description;
    private List<PipelineDTO> pipelines;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public PipelineFolderDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public List<PipelineDTO> getPipelines() { return pipelines; }
    public void setPipelines(List<PipelineDTO> pipelines) { this.pipelines = pipelines; }
    
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}