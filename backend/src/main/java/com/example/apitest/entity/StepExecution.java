package com.example.apitest.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "step_executions")
public class StepExecution {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pipeline_execution_id", nullable = false)
    private PipelineExecution pipelineExecution;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pipeline_step_id", nullable = false)
    private PipelineStep pipelineStep;

    @Column(name = "step_order", nullable = false)
    private Integer stepOrder;
    
    @Column(name = "step_name")
    private String stepName;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private StepStatus status = StepStatus.PENDING;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    // Request data sent to API
    @Column(name = "request_data", columnDefinition = "TEXT")
    private String requestData;

    // Response received from API
    @Column(name = "response_data", columnDefinition = "TEXT")
    private String responseData;

    // HTTP status code
    @Column(name = "http_status")
    private Integer httpStatus;

    // Response time in milliseconds
    @Column(name = "response_time")
    private Long responseTime;

    // Error message if failed
    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    // Data extracted from this step for next steps
    @Column(name = "extracted_data", columnDefinition = "TEXT")
    private String extractedData;

    @PrePersist
    protected void onCreate() {
        if (startedAt == null) {
            startedAt = LocalDateTime.now();
        }
    }

    public enum StepStatus {
        PENDING,
        RUNNING,
        SUCCESS,
        FAILED,
        SKIPPED
    }

    // Constructors
    public StepExecution() {}

    public StepExecution(PipelineExecution pipelineExecution, PipelineStep pipelineStep) {
        this.pipelineExecution = pipelineExecution;
        this.pipelineStep = pipelineStep;
        this.stepOrder = pipelineStep.getStepOrder();
        this.stepName = pipelineStep.getStepName();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public PipelineExecution getPipelineExecution() {
        return pipelineExecution;
    }

    public void setPipelineExecution(PipelineExecution pipelineExecution) {
        this.pipelineExecution = pipelineExecution;
    }

    public PipelineStep getPipelineStep() {
        return pipelineStep;
    }

    public void setPipelineStep(PipelineStep pipelineStep) {
        this.pipelineStep = pipelineStep;
    }

    public Integer getStepOrder() {
        return stepOrder;
    }

    public void setStepOrder(Integer stepOrder) {
        this.stepOrder = stepOrder;
    }

    public StepStatus getStatus() {
        return status;
    }

    public void setStatus(StepStatus status) {
        this.status = status;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(LocalDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public String getRequestData() {
        return requestData;
    }

    public void setRequestData(String requestData) {
        this.requestData = requestData;
    }

    public String getResponseData() {
        return responseData;
    }

    public void setResponseData(String responseData) {
        this.responseData = responseData;
    }

    public Integer getHttpStatus() {
        return httpStatus;
    }

    public void setHttpStatus(Integer httpStatus) {
        this.httpStatus = httpStatus;
    }

    public Long getResponseTime() {
        return responseTime;
    }

    public void setResponseTime(Long responseTime) {
        this.responseTime = responseTime;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public String getExtractedData() {
        return extractedData;
    }

    public void setExtractedData(String extractedData) {
        this.extractedData = extractedData;
    }
    
    public String getStepName() {
        return stepName;
    }
    
    public void setStepName(String stepName) {
        this.stepName = stepName;
    }
}