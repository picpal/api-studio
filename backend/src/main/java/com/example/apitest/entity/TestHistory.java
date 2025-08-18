package com.example.apitest.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "test_history")
public class TestHistory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "created_by", nullable = false)
    private String createdBy;
    
    @Column(name = "total_tests", nullable = false)
    private Integer totalTests;
    
    @Column(name = "success_count", nullable = false)
    private Integer successCount;
    
    @Column(name = "failure_count", nullable = false)
    private Integer failureCount;
    
    @Column(name = "total_time", nullable = false)
    private Long totalTime;
    
    @Column(name = "execution_results", columnDefinition = "TEXT")
    private String executionResults; // JSON으로 저장
    
    // 기본 생성자
    public TestHistory() {
        this.createdAt = LocalDateTime.now();
    }
    
    // 생성자
    public TestHistory(String name, String createdBy, Integer totalTests, 
                      Integer successCount, Integer failureCount, Long totalTime,
                      String executionResults) {
        this();
        this.name = name;
        this.createdBy = createdBy;
        this.totalTests = totalTests;
        this.successCount = successCount;
        this.failureCount = failureCount;
        this.totalTime = totalTime;
        this.executionResults = executionResults;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public String getCreatedBy() {
        return createdBy;
    }
    
    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }
    
    public Integer getTotalTests() {
        return totalTests;
    }
    
    public void setTotalTests(Integer totalTests) {
        this.totalTests = totalTests;
    }
    
    public Integer getSuccessCount() {
        return successCount;
    }
    
    public void setSuccessCount(Integer successCount) {
        this.successCount = successCount;
    }
    
    public Integer getFailureCount() {
        return failureCount;
    }
    
    public void setFailureCount(Integer failureCount) {
        this.failureCount = failureCount;
    }
    
    public Long getTotalTime() {
        return totalTime;
    }
    
    public void setTotalTime(Long totalTime) {
        this.totalTime = totalTime;
    }
    
    public String getExecutionResults() {
        return executionResults;
    }
    
    public void setExecutionResults(String executionResults) {
        this.executionResults = executionResults;
    }
}