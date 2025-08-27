package com.example.apitest.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Table(name = "api_keys")
public class ApiKey {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "key_value", unique = true, nullable = false, length = 64)
    private String keyValue;
    
    @Column(name = "key_name", nullable = false)
    private String keyName;
    
    @Column(name = "description")
    private String description;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(name = "is_active")
    private Boolean isActive = true;
    
    @Column(name = "last_used_at")
    private LocalDateTime lastUsedAt;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;
    
    // API 키가 접근할 수 있는 폴더들
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
        name = "api_key_folder_permissions",
        joinColumns = @JoinColumn(name = "api_key_id", 
            foreignKey = @ForeignKey(
                name = "fk_api_key_folder_permissions_api_key",
                foreignKeyDefinition = "FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE CASCADE"
            )
        )
    )
    @Column(name = "folder_id")
    private Set<Long> allowedFolderIds;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (expiresAt == null) {
            // 기본적으로 1년 후 만료
            expiresAt = LocalDateTime.now().plusYears(1);
        }
    }
    
    // Constructors
    public ApiKey() {}
    
    public ApiKey(String keyValue, String keyName, User user) {
        this.keyValue = keyValue;
        this.keyName = keyName;
        this.user = user;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getKeyValue() {
        return keyValue;
    }
    
    public void setKeyValue(String keyValue) {
        this.keyValue = keyValue;
    }
    
    public String getKeyName() {
        return keyName;
    }
    
    public void setKeyName(String keyName) {
        this.keyName = keyName;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
    }
    
    public Boolean getIsActive() {
        return isActive;
    }
    
    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
    
    public LocalDateTime getLastUsedAt() {
        return lastUsedAt;
    }
    
    public void setLastUsedAt(LocalDateTime lastUsedAt) {
        this.lastUsedAt = lastUsedAt;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }
    
    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }
    
    public Set<Long> getAllowedFolderIds() {
        return allowedFolderIds;
    }
    
    public void setAllowedFolderIds(Set<Long> allowedFolderIds) {
        this.allowedFolderIds = allowedFolderIds;
    }
    
    // 유틸리티 메소드들
    public boolean isExpired() {
        return expiresAt != null && LocalDateTime.now().isAfter(expiresAt);
    }
    
    public boolean isValid() {
        return isActive != null && isActive && !isExpired();
    }
    
    public boolean canAccessFolder(Long folderId) {
        if (allowedFolderIds == null || allowedFolderIds.isEmpty()) {
            return false; // 명시적으로 허용된 폴더가 없으면 접근 불가
        }
        return allowedFolderIds.contains(folderId);
    }
}