package com.example.apitest.entity;

import com.example.apitest.service.PasswordValidationService;
import jakarta.persistence.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import java.security.Principal;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User implements Principal {
    
    public enum Role {
        ADMIN, USER
    }
    
    public enum Status {
        PENDING, APPROVED, REJECTED
    }
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.USER;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.PENDING;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // 비밀번호 관련 필드 추가
    @Column(name = "password_changed_at")
    private LocalDateTime passwordChangedAt;

    @Column(name = "password_expires_at")
    private LocalDateTime passwordExpiresAt;

    @Column(name = "previous_password")
    private String previousPassword;

    @Column(name = "previous_password2")
    private String previousPassword2;

    @Column(name = "force_password_change")
    private Boolean forcePasswordChange = false;
    
    // 원시 비밀번호를 임시로 저장하는 transient 필드 (검증용)
    @Transient
    private String rawPassword;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        passwordChangedAt = LocalDateTime.now();
        // 3개월 후 만료
        passwordExpiresAt = LocalDateTime.now().plusMonths(3);
        
        // 비밀번호 검증 (admin 계정은 예외)
        validatePasswordBeforeSave();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        
        // 비밀번호가 변경된 경우에만 검증
        if (rawPassword != null && !rawPassword.isEmpty()) {
            validatePasswordBeforeSave();
        }
    }

    // Constructors
    public User() {}

    public User(String email, String password) {
        this.email = email;
        this.password = password;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
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

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    // 비밀번호 관련 getter/setter
    public LocalDateTime getPasswordChangedAt() {
        return passwordChangedAt;
    }

    public void setPasswordChangedAt(LocalDateTime passwordChangedAt) {
        this.passwordChangedAt = passwordChangedAt;
    }

    public LocalDateTime getPasswordExpiresAt() {
        return passwordExpiresAt;
    }

    public void setPasswordExpiresAt(LocalDateTime passwordExpiresAt) {
        this.passwordExpiresAt = passwordExpiresAt;
    }

    public String getPreviousPassword() {
        return previousPassword;
    }

    public void setPreviousPassword(String previousPassword) {
        this.previousPassword = previousPassword;
    }

    public String getPreviousPassword2() {
        return previousPassword2;
    }

    public void setPreviousPassword2(String previousPassword2) {
        this.previousPassword2 = previousPassword2;
    }

    public Boolean getForcePasswordChange() {
        return forcePasswordChange;
    }

    public void setForcePasswordChange(Boolean forcePasswordChange) {
        this.forcePasswordChange = forcePasswordChange;
    }

    // 비밀번호 만료 검사
    public boolean isPasswordExpired() {
        return passwordExpiresAt != null && LocalDateTime.now().isAfter(passwordExpiresAt);
    }

    // 비밀번호 만료 임박 검사 (7일 전)
    public boolean isPasswordExpiringSoon() {
        return passwordExpiresAt != null && 
               LocalDateTime.now().plusDays(7).isAfter(passwordExpiresAt);
    }
    
    // 원시 비밀번호 관련 메서드
    public String getRawPassword() {
        return rawPassword;
    }

    public void setRawPassword(String rawPassword) {
        this.rawPassword = rawPassword;
    }
    
    /**
     * Principal 인터페이스 구현 - WebSocket에서 사용자 식별용
     */
    @Override
    public String getName() {
        return this.email;
    }
    
    /**
     * 비밀번호 저장 전 검증 메서드
     */
    private void validatePasswordBeforeSave() {
        // admin 계정의 초기 생성은 예외 처리 (기존 시스템 호환성)
        if ("admin@blue.com".equals(this.email) && this.id == null) {
            return;
        }
        
        // rawPassword가 설정되어 있지 않으면 검증 건너뛰기
        if (rawPassword == null || rawPassword.isEmpty()) {
            return;
        }
        
        try {
            PasswordValidationService passwordValidationService = new PasswordValidationService();
            PasswordValidationService.ValidationResult result = 
                passwordValidationService.validatePassword(rawPassword, this.email);
            
            if (!result.isValid()) {
                throw new IllegalArgumentException("비밀번호 정책 위반: " + String.join(", ", result.getErrors()));
            }
            
            // 비밀번호 중복 검사는 setPasswordSafely 메서드에서 이미 수행됨
            // 여기서는 추가 검증만 필요시 수행
            
        } catch (Exception e) {
            if (e instanceof IllegalArgumentException) {
                throw e;
            }
            // 다른 예외는 로깅하고 기본 메시지 표시
            // 비밀번호 검증 중 오류
            throw new IllegalArgumentException("비밀번호 검증 중 오류가 발생했습니다.");
        }
    }
    
    /**
     * 안전한 비밀번호 설정 메서드 (검증과 암호화 포함)
     */
    public void setPasswordSafely(String rawPassword) {
        if (rawPassword == null || rawPassword.isEmpty()) {
            return;
        }
        
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        
        // 현재 비밀번호와 동일한지 먼저 검증 (암호화 전에)
        if (this.id != null && this.password != null) {
            if (encoder.matches(rawPassword, this.password)) {
                throw new IllegalArgumentException("현재 비밀번호와 동일한 비밀번호는 사용할 수 없습니다.");
            }
            
            // 이전 비밀번호와 동일한지 검사
            if (this.previousPassword != null && encoder.matches(rawPassword, this.previousPassword)) {
                throw new IllegalArgumentException("이전에 사용했던 비밀번호는 사용할 수 없습니다.");
            }
            
            if (this.previousPassword2 != null && encoder.matches(rawPassword, this.previousPassword2)) {
                throw new IllegalArgumentException("이전에 사용했던 비밀번호는 사용할 수 없습니다.");
            }
        }
        
        // rawPassword 설정 (검증용)
        this.rawPassword = rawPassword;
        
        // 비밀번호 이력 업데이트 (업데이트인 경우에만)
        if (this.id != null && this.password != null) {
            this.previousPassword2 = this.previousPassword;
            this.previousPassword = this.password;
            this.passwordChangedAt = LocalDateTime.now();
            this.passwordExpiresAt = LocalDateTime.now().plusMonths(3);
            this.forcePasswordChange = false;
        }
        
        // 새 비밀번호 암호화
        this.password = encoder.encode(rawPassword);
    }
}