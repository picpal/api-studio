package com.example.apitest.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "pipeline_executions")
public class PipelineExecution {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pipeline_id", nullable = false)
    private Pipeline pipeline;

    @OneToMany(mappedBy = "pipelineExecution", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<StepExecution> stepExecutions = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ExecutionStatus status = ExecutionStatus.RUNNING;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "total_steps")
    private Integer totalSteps;

    @Column(name = "completed_steps")
    private Integer completedSteps = 0;

    @Column(name = "successful_steps")
    private Integer successfulSteps = 0;

    @Column(name = "failed_steps")
    private Integer failedSteps = 0;

    // Execution context for data passing between steps
    @Column(name = "execution_context", columnDefinition = "TEXT")
    private String executionContext;
    
    // Session cookies for maintaining login state across steps
    @Column(name = "session_cookies", columnDefinition = "TEXT")
    private String sessionCookies;

    @PrePersist
    protected void onCreate() {
        startedAt = LocalDateTime.now();
    }

    public enum ExecutionStatus {
        RUNNING,
        COMPLETED,
        FAILED,
        CANCELLED
    }

    // Constructors
    public PipelineExecution() {}

    public PipelineExecution(Pipeline pipeline) {
        this.pipeline = pipeline;
        this.totalSteps = pipeline.getSteps() != null ? pipeline.getSteps().size() : 0;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Pipeline getPipeline() {
        return pipeline;
    }

    public void setPipeline(Pipeline pipeline) {
        this.pipeline = pipeline;
    }

    public List<StepExecution> getStepExecutions() {
        return stepExecutions;
    }

    public void setStepExecutions(List<StepExecution> stepExecutions) {
        this.stepExecutions = stepExecutions;
    }

    public ExecutionStatus getStatus() {
        return status;
    }

    public void setStatus(ExecutionStatus status) {
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

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public Integer getTotalSteps() {
        return totalSteps;
    }

    public void setTotalSteps(Integer totalSteps) {
        this.totalSteps = totalSteps;
    }

    public Integer getCompletedSteps() {
        return completedSteps;
    }

    public void setCompletedSteps(Integer completedSteps) {
        this.completedSteps = completedSteps;
    }

    public Integer getSuccessfulSteps() {
        return successfulSteps;
    }

    public void setSuccessfulSteps(Integer successfulSteps) {
        this.successfulSteps = successfulSteps;
    }

    public Integer getFailedSteps() {
        return failedSteps;
    }

    public void setFailedSteps(Integer failedSteps) {
        this.failedSteps = failedSteps;
    }

    public String getExecutionContext() {
        return executionContext;
    }

    public void setExecutionContext(String executionContext) {
        this.executionContext = executionContext;
    }
    
    public String getSessionCookies() {
        return sessionCookies;
    }
    
    public void setSessionCookies(String sessionCookies) {
        this.sessionCookies = sessionCookies;
    }
}