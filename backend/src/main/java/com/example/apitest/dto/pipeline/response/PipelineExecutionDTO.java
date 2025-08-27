package com.example.apitest.dto.pipeline.response;

import java.time.LocalDateTime;

public class PipelineExecutionDTO {
    private Long id;
    private Long pipelineId;
    private String pipelineName;
    private String status;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private String errorMessage;
    private Integer totalSteps;
    private Integer completedSteps;
    private Integer successfulSteps;
    private Integer failedSteps;
    private String sessionCookies;

    public PipelineExecutionDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getPipelineId() { return pipelineId; }
    public void setPipelineId(Long pipelineId) { this.pipelineId = pipelineId; }

    public String getPipelineName() { return pipelineName; }
    public void setPipelineName(String pipelineName) { this.pipelineName = pipelineName; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public Integer getTotalSteps() { return totalSteps; }
    public void setTotalSteps(Integer totalSteps) { this.totalSteps = totalSteps; }

    public Integer getCompletedSteps() { return completedSteps; }
    public void setCompletedSteps(Integer completedSteps) { this.completedSteps = completedSteps; }

    public Integer getSuccessfulSteps() { return successfulSteps; }
    public void setSuccessfulSteps(Integer successfulSteps) { this.successfulSteps = successfulSteps; }

    public Integer getFailedSteps() { return failedSteps; }
    public void setFailedSteps(Integer failedSteps) { this.failedSteps = failedSteps; }

    public String getSessionCookies() { return sessionCookies; }
    public void setSessionCookies(String sessionCookies) { this.sessionCookies = sessionCookies; }
}