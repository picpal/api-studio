package com.example.apitest.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "ui_test_scripts")
public class UiTestScript {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(length = 1000)
    private String description;

    @Column(name = "script_content", columnDefinition = "TEXT")
    private String scriptContent;

    @Column(name = "script_type")
    @Enumerated(EnumType.STRING)
    private ScriptType scriptType = ScriptType.PLAYWRIGHT;

    @Column(name = "browser_type")
    @Enumerated(EnumType.STRING)
    private BrowserType browserType = BrowserType.CHROMIUM;

    @Column(name = "timeout_seconds")
    private Integer timeoutSeconds = 30;

    @Column(name = "headless_mode")
    private Boolean headlessMode = true;

    @Column(name = "screenshot_on_failure")
    private Boolean screenshotOnFailure = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @JsonIgnore
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "folder_id")
    @JsonIgnore
    private UiTestFolder folder;

    @OneToMany(mappedBy = "script", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<UiTestExecution> executions;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public enum ScriptType {
        PLAYWRIGHT, SELENIUM, CYPRESS
    }

    public enum BrowserType {
        CHROMIUM, FIREFOX, WEBKIT, CHROME, SAFARI
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getScriptContent() {
        return scriptContent;
    }

    public void setScriptContent(String scriptContent) {
        this.scriptContent = scriptContent;
    }

    public ScriptType getScriptType() {
        return scriptType;
    }

    public void setScriptType(ScriptType scriptType) {
        this.scriptType = scriptType;
    }

    public BrowserType getBrowserType() {
        return browserType;
    }

    public void setBrowserType(BrowserType browserType) {
        this.browserType = browserType;
    }

    public Integer getTimeoutSeconds() {
        return timeoutSeconds;
    }

    public void setTimeoutSeconds(Integer timeoutSeconds) {
        this.timeoutSeconds = timeoutSeconds;
    }

    public Boolean getHeadlessMode() {
        return headlessMode;
    }

    public void setHeadlessMode(Boolean headlessMode) {
        this.headlessMode = headlessMode;
    }

    public Boolean getScreenshotOnFailure() {
        return screenshotOnFailure;
    }

    public void setScreenshotOnFailure(Boolean screenshotOnFailure) {
        this.screenshotOnFailure = screenshotOnFailure;
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

    public User getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
    }

    public UiTestFolder getFolder() {
        return folder;
    }

    public void setFolder(UiTestFolder folder) {
        this.folder = folder;
    }

    public List<UiTestExecution> getExecutions() {
        return executions;
    }

    public void setExecutions(List<UiTestExecution> executions) {
        this.executions = executions;
    }
}