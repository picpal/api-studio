package com.example.apitest.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "api_item_history")
public class ApiItemHistory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "history_name", nullable = false, length = 100)
    private String historyName;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "api_item_id", nullable = false)
    @JsonIgnore
    private ApiItem apiItem;
    
    @Column(name = "api_item_id", insertable = false, updatable = false)
    private Long apiItemId;
    
    @Column(name = "api_item_name", nullable = false)
    private String apiItemName;
    
    @Column(name = "method_snapshot", nullable = false)
    private String methodSnapshot;
    
    @Column(name = "url_snapshot", nullable = false, columnDefinition = "TEXT")
    private String urlSnapshot;
    
    @Column(name = "description_snapshot", columnDefinition = "TEXT")
    private String descriptionSnapshot;
    
    @Column(name = "request_params_snapshot", columnDefinition = "TEXT")
    private String requestParamsSnapshot;
    
    @Column(name = "request_headers_snapshot", columnDefinition = "TEXT")
    private String requestHeadersSnapshot;
    
    @Column(name = "request_body_snapshot", columnDefinition = "TEXT")
    private String requestBodySnapshot;
    
    @Column(name = "parameters_snapshot", columnDefinition = "TEXT")
    private String parametersSnapshot; // JSON string으로 저장
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    @JsonIgnore
    private User createdByUser;
    
    @Column(name = "created_by_user_id", insertable = false, updatable = false)
    private Long createdByUserId;
    
    @Column(name = "created_by_user_email", nullable = false)
    private String createdByUserEmail;
    
    @Column(name = "saved_at", nullable = false)
    private LocalDateTime savedAt;
    
    @PrePersist
    protected void onCreate() {
        this.savedAt = LocalDateTime.now();
    }
    
    // 기본 생성자
    public ApiItemHistory() {}
    
    // 생성자
    public ApiItemHistory(String historyName, ApiItem apiItem, String apiItemName,
                         String methodSnapshot, String urlSnapshot, String descriptionSnapshot,
                         String requestParamsSnapshot, String requestHeadersSnapshot, 
                         String requestBodySnapshot, String parametersSnapshot,
                         User createdByUser) {
        this.historyName = historyName;
        this.apiItem = apiItem;
        this.apiItemName = apiItemName;
        this.methodSnapshot = methodSnapshot;
        this.urlSnapshot = urlSnapshot;
        this.descriptionSnapshot = descriptionSnapshot;
        this.requestParamsSnapshot = requestParamsSnapshot;
        this.requestHeadersSnapshot = requestHeadersSnapshot;
        this.requestBodySnapshot = requestBodySnapshot;
        this.parametersSnapshot = parametersSnapshot;
        this.createdByUser = createdByUser;
        this.createdByUserEmail = createdByUser.getEmail();
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getHistoryName() {
        return historyName;
    }
    
    public void setHistoryName(String historyName) {
        this.historyName = historyName;
    }
    
    public ApiItem getApiItem() {
        return apiItem;
    }
    
    public void setApiItem(ApiItem apiItem) {
        this.apiItem = apiItem;
    }
    
    public Long getApiItemId() {
        return apiItemId;
    }
    
    public void setApiItemId(Long apiItemId) {
        this.apiItemId = apiItemId;
    }
    
    public String getApiItemName() {
        return apiItemName;
    }
    
    public void setApiItemName(String apiItemName) {
        this.apiItemName = apiItemName;
    }
    
    public String getMethodSnapshot() {
        return methodSnapshot;
    }
    
    public void setMethodSnapshot(String methodSnapshot) {
        this.methodSnapshot = methodSnapshot;
    }
    
    public String getUrlSnapshot() {
        return urlSnapshot;
    }
    
    public void setUrlSnapshot(String urlSnapshot) {
        this.urlSnapshot = urlSnapshot;
    }
    
    public String getDescriptionSnapshot() {
        return descriptionSnapshot;
    }
    
    public void setDescriptionSnapshot(String descriptionSnapshot) {
        this.descriptionSnapshot = descriptionSnapshot;
    }
    
    public String getRequestParamsSnapshot() {
        return requestParamsSnapshot;
    }
    
    public void setRequestParamsSnapshot(String requestParamsSnapshot) {
        this.requestParamsSnapshot = requestParamsSnapshot;
    }
    
    public String getRequestHeadersSnapshot() {
        return requestHeadersSnapshot;
    }
    
    public void setRequestHeadersSnapshot(String requestHeadersSnapshot) {
        this.requestHeadersSnapshot = requestHeadersSnapshot;
    }
    
    public String getRequestBodySnapshot() {
        return requestBodySnapshot;
    }
    
    public void setRequestBodySnapshot(String requestBodySnapshot) {
        this.requestBodySnapshot = requestBodySnapshot;
    }
    
    public String getParametersSnapshot() {
        return parametersSnapshot;
    }
    
    public void setParametersSnapshot(String parametersSnapshot) {
        this.parametersSnapshot = parametersSnapshot;
    }
    
    public User getCreatedByUser() {
        return createdByUser;
    }
    
    public void setCreatedByUser(User createdByUser) {
        this.createdByUser = createdByUser;
        if (createdByUser != null) {
            this.createdByUserEmail = createdByUser.getEmail();
        }
    }
    
    public Long getCreatedByUserId() {
        return createdByUserId;
    }
    
    public void setCreatedByUserId(Long createdByUserId) {
        this.createdByUserId = createdByUserId;
    }
    
    public String getCreatedByUserEmail() {
        return createdByUserEmail;
    }
    
    public void setCreatedByUserEmail(String createdByUserEmail) {
        this.createdByUserEmail = createdByUserEmail;
    }
    
    public LocalDateTime getSavedAt() {
        return savedAt;
    }
    
    public void setSavedAt(LocalDateTime savedAt) {
        this.savedAt = savedAt;
    }
}