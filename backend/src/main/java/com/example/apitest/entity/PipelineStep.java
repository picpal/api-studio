package com.example.apitest.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDateTime;

@Entity
@Table(name = "pipeline_steps")
public class PipelineStep {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pipeline_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Pipeline pipeline;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "api_item_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private ApiItem apiItem;

    @Column(name = "step_order", nullable = false)
    private Integer stepOrder;

    @Column(name = "step_name")
    private String stepName;

    @Column(columnDefinition = "TEXT")
    private String description;

    // 데이터 추출 규칙 (JSON 형태로 저장)
    @Column(name = "data_extractions", columnDefinition = "TEXT")
    private String dataExtractions;

    // 데이터 주입 규칙 (JSON 형태로 저장)
    @Column(name = "data_injections", columnDefinition = "TEXT")
    private String dataInjections;

    // 실행 조건 (JSON 형태로 저장)
    @Column(name = "execution_condition", columnDefinition = "TEXT")
    private String executionCondition;

    // 단계 실행 후 대기 시간 (밀리초)
    @Column(name = "delay_after")
    private Integer delayAfter;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Constructors
    public PipelineStep() {}

    public PipelineStep(Pipeline pipeline, ApiItem apiItem, Integer stepOrder) {
        this.pipeline = pipeline;
        this.apiItem = apiItem;
        this.stepOrder = stepOrder;
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

    public ApiItem getApiItem() {
        return apiItem;
    }

    public void setApiItem(ApiItem apiItem) {
        this.apiItem = apiItem;
    }

    public Integer getStepOrder() {
        return stepOrder;
    }

    public void setStepOrder(Integer stepOrder) {
        this.stepOrder = stepOrder;
    }

    public String getStepName() {
        return stepName;
    }

    public void setStepName(String stepName) {
        this.stepName = stepName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getDataExtractions() {
        return dataExtractions;
    }

    public void setDataExtractions(String dataExtractions) {
        this.dataExtractions = dataExtractions;
    }

    public String getDataInjections() {
        return dataInjections;
    }

    public void setDataInjections(String dataInjections) {
        this.dataInjections = dataInjections;
    }

    public String getExecutionCondition() {
        return executionCondition;
    }

    public void setExecutionCondition(String executionCondition) {
        this.executionCondition = executionCondition;
    }

    public Integer getDelayAfter() {
        return delayAfter;
    }

    public void setDelayAfter(Integer delayAfter) {
        this.delayAfter = delayAfter;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}