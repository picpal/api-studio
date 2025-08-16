package com.example.apitest.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
@Table(name = "api_item")
public class ApiItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private HttpMethod method = HttpMethod.GET;
    
    private String url;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "request_params", columnDefinition = "TEXT")
    private String requestParams; // JSON 문자열로 저장 (PARAMETERS_SNAPSHOT과 동일한 구조)
    
    @Column(name = "request_headers", columnDefinition = "TEXT")
    private String requestHeaders; // JSON 문자열로 저장
    
    @Column(name = "request_body", columnDefinition = "TEXT")
    private String requestBody;
    
    @Column(name = "validation_enabled")
    private Boolean validationEnabled = false; // 응답 검증 사용 여부
    
    @Column(name = "expected_values", columnDefinition = "TEXT")
    private String expectedValues; // JSON 형태로 키-값 쌍 저장 [{"key": "status", "value": "success"}]
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "folder_id")
    @JsonIgnore
    private ApiFolder folder;
    
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
    
    // 기본 생성자
    public ApiItem() {}
    
    // 생성자
    public ApiItem(String name, HttpMethod method, String url) {
        this.name = name;
        this.method = method;
        this.url = url;
    }
    
    // HTTP Method Enum
    public enum HttpMethod {
        GET, POST, PUT, DELETE, PATCH
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
    
    public HttpMethod getMethod() {
        return method;
    }
    
    public void setMethod(HttpMethod method) {
        this.method = method;
    }
    
    public String getUrl() {
        return url;
    }
    
    public void setUrl(String url) {
        this.url = url;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public String getRequestParams() {
        return requestParams;
    }
    
    public void setRequestParams(String requestParams) {
        this.requestParams = requestParams;
    }
    
    public String getRequestHeaders() {
        return requestHeaders;
    }
    
    public void setRequestHeaders(String requestHeaders) {
        this.requestHeaders = requestHeaders;
    }
    
    public String getRequestBody() {
        return requestBody;
    }
    
    public void setRequestBody(String requestBody) {
        this.requestBody = requestBody;
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
    
    public ApiFolder getFolder() {
        return folder;
    }
    
    public void setFolder(ApiFolder folder) {
        this.folder = folder;
    }
    
    @JsonProperty("folderId")
    public Long getFolderId() {
        return folder != null ? folder.getId() : null;
    }
    
    public Boolean getValidationEnabled() {
        return validationEnabled;
    }
    
    public void setValidationEnabled(Boolean validationEnabled) {
        this.validationEnabled = validationEnabled;
    }
    
    public String getExpectedValues() {
        return expectedValues;
    }
    
    public void setExpectedValues(String expectedValues) {
        this.expectedValues = expectedValues;
    }
    
}