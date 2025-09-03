package com.example.apitest.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "pipeline_folder_permissions")
public class PipelineFolderPermission {
    
    public enum Permission {
        READ, WRITE, ADMIN
    }
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pipeline_folder_id", nullable = false)
    private PipelineFolder pipelineFolder;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Permission permission;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Constructors
    public PipelineFolderPermission() {}

    public PipelineFolderPermission(User user, PipelineFolder pipelineFolder, Permission permission) {
        this.user = user;
        this.pipelineFolder = pipelineFolder;
        this.permission = permission;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public PipelineFolder getPipelineFolder() {
        return pipelineFolder;
    }

    public void setPipelineFolder(PipelineFolder pipelineFolder) {
        this.pipelineFolder = pipelineFolder;
    }

    public Permission getPermission() {
        return permission;
    }

    public void setPermission(Permission permission) {
        this.permission = permission;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}