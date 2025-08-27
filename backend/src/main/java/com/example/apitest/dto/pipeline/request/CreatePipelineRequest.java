package com.example.apitest.dto.pipeline.request;

public class CreatePipelineRequest {
    private String name;
    private String description;
    private Long folderId;

    public CreatePipelineRequest() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public Long getFolderId() { return folderId; }
    public void setFolderId(Long folderId) { this.folderId = folderId; }
}