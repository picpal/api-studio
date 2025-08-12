package com.example.apitest.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_activities")
public class UserActivity {
    
    public enum ActivityType {
        LOGIN,           // 로그인
        LOGOUT,          // 로그아웃
        API_CALL,        // API 호출
        PASSWORD_CHANGE, // 비밀번호 변경
        FOLDER_CREATE,   // 폴더 생성
        FOLDER_UPDATE,   // 폴더 수정
        FOLDER_DELETE,   // 폴더 삭제
        ITEM_CREATE,     // API 아이템 생성
        ITEM_UPDATE,     // API 아이템 수정
        ITEM_DELETE,     // API 아이템 삭제
        ADMIN_ACTION     // 관리자 액션
    }
    
    public enum ActionResult {
        SUCCESS,  // 성공
        FAILURE,  // 실패
        BLOCKED   // 차단됨
    }
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = true) // null 허용 (비로그인 시도)
    private User user;
    
    @Column(name = "user_email")
    private String userEmail; // 사용자 이메일 (중복 저장으로 데이터 무결성 보장)
    
    @Enumerated(EnumType.STRING)
    @Column(name = "activity_type", nullable = false)
    private ActivityType activityType;
    
    @Column(name = "action_description")
    private String actionDescription; // 구체적인 액션 설명
    
    @Column(name = "request_uri")
    private String requestUri; // 요청 URI
    
    @Column(name = "http_method")
    private String httpMethod; // HTTP 메소드 (GET, POST, etc.)
    
    @Column(name = "ip_address")
    private String ipAddress; // 클라이언트 IP
    
    @Column(name = "user_agent", length = 512)
    private String userAgent; // 브라우저 정보
    
    @Enumerated(EnumType.STRING)
    @Column(name = "result", nullable = false)
    private ActionResult result;
    
    @Column(name = "error_message")
    private String errorMessage; // 실패/차단 시 에러 메시지
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "session_id")
    private String sessionId; // 세션 ID
    
    // Constructors
    public UserActivity() {
        this.createdAt = LocalDateTime.now();
    }
    
    public UserActivity(User user, ActivityType activityType, String actionDescription, ActionResult result) {
        this();
        this.user = user;
        this.userEmail = user != null ? user.getEmail() : null;
        this.activityType = activityType;
        this.actionDescription = actionDescription;
        this.result = result;
    }
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
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
        this.userEmail = user != null ? user.getEmail() : null;
    }
    
    public String getUserEmail() {
        return userEmail;
    }
    
    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }
    
    public ActivityType getActivityType() {
        return activityType;
    }
    
    public void setActivityType(ActivityType activityType) {
        this.activityType = activityType;
    }
    
    public String getActionDescription() {
        return actionDescription;
    }
    
    public void setActionDescription(String actionDescription) {
        this.actionDescription = actionDescription;
    }
    
    public String getRequestUri() {
        return requestUri;
    }
    
    public void setRequestUri(String requestUri) {
        this.requestUri = requestUri;
    }
    
    public String getHttpMethod() {
        return httpMethod;
    }
    
    public void setHttpMethod(String httpMethod) {
        this.httpMethod = httpMethod;
    }
    
    public String getIpAddress() {
        return ipAddress;
    }
    
    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }
    
    public String getUserAgent() {
        return userAgent;
    }
    
    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }
    
    public ActionResult getResult() {
        return result;
    }
    
    public void setResult(ActionResult result) {
        this.result = result;
    }
    
    public String getErrorMessage() {
        return errorMessage;
    }
    
    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public String getSessionId() {
        return sessionId;
    }
    
    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }
}