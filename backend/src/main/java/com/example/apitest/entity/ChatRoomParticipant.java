package com.example.apitest.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "chat_room_participant", 
    indexes = {
        @Index(name = "idx_user_active", columnList = "user_id, is_active"),
        @Index(name = "idx_room_active", columnList = "room_id, is_active")
    },
    uniqueConstraints = {
        @UniqueConstraint(name = "unique_room_user_active", columnNames = {"room_id", "user_id", "is_active"})
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatRoomParticipant {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "room_id", nullable = false)
    private Long roomId;
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @CreationTimestamp
    @Column(name = "joined_at", updatable = false)
    private LocalDateTime joinedAt;
    
    @Column(name = "left_at")
    private LocalDateTime leftAt;
    
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
    
    @Column(name = "last_read_message_id")
    @Builder.Default
    private Long lastReadMessageId = 0L;
    
    // 비즈니스 로직 메서드
    public void leave() {
        this.isActive = false;
        this.leftAt = LocalDateTime.now();
    }
    
    public void updateLastReadMessage(Long messageId) {
        if (messageId != null && messageId > this.lastReadMessageId) {
            this.lastReadMessageId = messageId;
        }
    }
    
    public boolean isActiveMember() {
        return this.isActive && this.leftAt == null;
    }
    
    public boolean hasLeft() {
        return !this.isActive && this.leftAt != null;
    }
    
    public long getUnreadCountSince(Long latestMessageId) {
        if (latestMessageId == null || latestMessageId <= this.lastReadMessageId) {
            return 0L;
        }
        return latestMessageId - this.lastReadMessageId;
    }
    
    // 생성 전 유효성 검사
    @PrePersist
    @PreUpdate
    private void validate() {
        if (roomId == null || roomId <= 0) {
            throw new IllegalArgumentException("올바른 채팅방 ID가 필요합니다.");
        }
        
        if (userId == null || userId <= 0) {
            throw new IllegalArgumentException("올바른 사용자 ID가 필요합니다.");
        }
        
        if (lastReadMessageId == null) {
            this.lastReadMessageId = 0L;
        }
        
        if (isActive == null) {
            this.isActive = true;
        }
    }
}