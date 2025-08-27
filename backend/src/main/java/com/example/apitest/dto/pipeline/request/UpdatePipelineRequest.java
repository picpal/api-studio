package com.example.apitest.dto.pipeline.request;

public class UpdatePipelineRequest {
    private String name;
    private String description;

    public UpdatePipelineRequest() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}