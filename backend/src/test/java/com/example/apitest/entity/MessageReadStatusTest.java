package com.example.apitest.entity;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

public class MessageReadStatusTest {
    
    private MessageReadStatus messageReadStatus;
    private Long messageId = 1L;
    private Long userId = 2L;
    private Long chatRoomId = 3L;
    
    @BeforeEach
    void setUp() {
        messageReadStatus = new MessageReadStatus(messageId, userId, chatRoomId);
    }
    
    @Test
    void testConstructor() {
        // Given & When - 생성자로 인스턴스 생성
        
        // Then - 필드값이 올바르게 설정되어야 함
        assertEquals(messageId, messageReadStatus.getMessageId());
        assertEquals(userId, messageReadStatus.getUserId());
        assertEquals(chatRoomId, messageReadStatus.getChatRoomId());
        assertNotNull(messageReadStatus.getReadAt());
        assertNotNull(messageReadStatus.getCreatedAt());
    }
    
    @Test
    void testPrePersist() {
        // Given - 날짜가 없는 새로운 인스턴스
        MessageReadStatus newStatus = new MessageReadStatus();
        newStatus.setMessageId(messageId);
        newStatus.setUserId(userId);
        newStatus.setChatRoomId(chatRoomId);
        
        // When - onCreate 메서드 호출 (JPA에서 자동 호출)
        newStatus.onCreate();
        
        // Then - 생성일시와 읽음일시가 자동 설정되어야 함
        assertNotNull(newStatus.getCreatedAt());
        assertNotNull(newStatus.getReadAt());
    }
    
    @Test
    void testUniqueConstraint() {
        // Given - 동일한 메시지ID와 사용자ID로 생성
        MessageReadStatus duplicate = new MessageReadStatus(messageId, userId, chatRoomId);
        
        // Then - 동일한 값들이 설정되어야 함 (실제 DB 제약조건 테스트는 repository 테스트에서)
        assertEquals(messageReadStatus.getMessageId(), duplicate.getMessageId());
        assertEquals(messageReadStatus.getUserId(), duplicate.getUserId());
        assertEquals(messageReadStatus.getChatRoomId(), duplicate.getChatRoomId());
    }
    
    @Test
    void testSettersAndGetters() {
        // Given
        Long newMessageId = 10L;
        Long newUserId = 20L;
        Long newChatRoomId = 30L;
        LocalDateTime now = LocalDateTime.now();
        
        // When
        messageReadStatus.setMessageId(newMessageId);
        messageReadStatus.setUserId(newUserId);
        messageReadStatus.setChatRoomId(newChatRoomId);
        messageReadStatus.setReadAt(now);
        messageReadStatus.setCreatedAt(now);
        
        // Then
        assertEquals(newMessageId, messageReadStatus.getMessageId());
        assertEquals(newUserId, messageReadStatus.getUserId());
        assertEquals(newChatRoomId, messageReadStatus.getChatRoomId());
        assertEquals(now, messageReadStatus.getReadAt());
        assertEquals(now, messageReadStatus.getCreatedAt());
    }
}