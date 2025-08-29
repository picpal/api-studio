package com.example.apitest.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "message", indexes = {
    @Index(name = "idx_room_created", columnList = "room_id, created_at"),
    @Index(name = "idx_sender", columnList = "sender_id"),
    @Index(name = "idx_not_deleted", columnList = "is_deleted")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "room_id", nullable = false)
    private Long roomId;
    
    @Column(name = "sender_id", nullable = false)
    private Long senderId;
    
    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "message_type", nullable = false)
    @Builder.Default
    private MessageType messageType = MessageType.TEXT;
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;
    
    public enum MessageType {
        TEXT,    // 일반 텍스트
        IMAGE,   // 이미지 (향후 확장)
        FILE,    // 파일 (향후 확장)
        SYSTEM   // 시스템 메시지 (입장/퇴장 알림 등)
    }
    
    // 비즈니스 로직 메서드
    public void softDelete() {
        this.isDeleted = true;
    }
    
    public boolean isSystemMessage() {
        return this.messageType == MessageType.SYSTEM;
    }
    
    public boolean isUserMessage() {
        return this.senderId != null && this.senderId > 0;
    }
    
    public boolean isSentBy(Long userId) {
        return this.senderId.equals(userId);
    }
    
    // 생성 전 유효성 검사
    @PrePersist
    @PreUpdate
    private void validate() {
        if (content == null || content.trim().isEmpty()) {
            throw new IllegalArgumentException("메시지 내용은 비어있을 수 없습니다.");
        }
        
        if (content.length() > 1000) {
            throw new IllegalArgumentException("메시지는 1000자를 초과할 수 없습니다.");
        }
        
        if (roomId == null || roomId <= 0) {
            throw new IllegalArgumentException("올바른 채팅방 ID가 필요합니다.");
        }
        
        if (senderId == null) {
            throw new IllegalArgumentException("발신자 ID가 필요합니다.");
        }
    }
}