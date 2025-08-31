package com.example.apitest.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "message_read_status", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"message_id", "user_id"}))
public class MessageReadStatus {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "message_id", nullable = false)
    private Long messageId;
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @Column(name = "chat_room_id", nullable = false)
    private Long chatRoomId;
    
    @Column(name = "read_at", nullable = false)
    private LocalDateTime readAt;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    public MessageReadStatus() {}
    
    public MessageReadStatus(Long messageId, Long userId, Long chatRoomId) {
        this.messageId = messageId;
        this.userId = userId;
        this.chatRoomId = chatRoomId;
        this.readAt = LocalDateTime.now();
        this.createdAt = LocalDateTime.now();
    }
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (readAt == null) {
            readAt = LocalDateTime.now();
        }
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getMessageId() {
        return messageId;
    }
    
    public void setMessageId(Long messageId) {
        this.messageId = messageId;
    }
    
    public Long getUserId() {
        return userId;
    }
    
    public void setUserId(Long userId) {
        this.userId = userId;
    }
    
    public Long getChatRoomId() {
        return chatRoomId;
    }
    
    public void setChatRoomId(Long chatRoomId) {
        this.chatRoomId = chatRoomId;
    }
    
    public LocalDateTime getReadAt() {
        return readAt;
    }
    
    public void setReadAt(LocalDateTime readAt) {
        this.readAt = readAt;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}