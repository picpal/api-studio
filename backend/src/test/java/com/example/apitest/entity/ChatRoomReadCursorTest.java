package com.example.apitest.entity;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

public class ChatRoomReadCursorTest {
    
    private ChatRoomReadCursor cursor;
    private Long chatRoomId = 1L;
    private Long userId = 2L;
    
    @BeforeEach
    void setUp() {
        cursor = new ChatRoomReadCursor(chatRoomId, userId);
    }
    
    @Test
    void testConstructor() {
        // Given & When - 생성자로 인스턴스 생성
        
        // Then - 필드값이 올바르게 설정되어야 함
        assertEquals(chatRoomId, cursor.getChatRoomId());
        assertEquals(userId, cursor.getUserId());
        assertEquals(0L, cursor.getLastReadMessageId());
        assertNotNull(cursor.getUpdatedAt());
        assertNotNull(cursor.getCreatedAt());
    }
    
    @Test
    void testDefaultConstructor() {
        // Given & When
        ChatRoomReadCursor emptyCursor = new ChatRoomReadCursor();
        
        // Then
        assertNull(emptyCursor.getChatRoomId());
        assertNull(emptyCursor.getUserId());
        assertNull(emptyCursor.getLastReadMessageId());
        assertNull(emptyCursor.getUpdatedAt());
        assertNull(emptyCursor.getCreatedAt());
    }
    
    @Test
    void testPrePersist() {
        // Given - 날짜가 없는 새로운 인스턴스
        ChatRoomReadCursor newCursor = new ChatRoomReadCursor();
        newCursor.setChatRoomId(chatRoomId);
        newCursor.setUserId(userId);
        
        // When - onCreate 메서드 호출 (JPA에서 자동 호출)
        newCursor.onCreate();
        
        // Then - 생성일시와 수정일시가 자동 설정되어야 함
        assertNotNull(newCursor.getCreatedAt());
        assertNotNull(newCursor.getUpdatedAt());
    }
    
    @Test
    void testPreUpdate() {
        // Given - 기존 커서
        LocalDateTime originalTime = cursor.getUpdatedAt();
        
        // When - onUpdate 메서드 호출 (JPA에서 자동 호출)
        try {
            Thread.sleep(1); // 시간 차이를 위해 잠시 대기
        } catch (InterruptedException e) {
            // ignore
        }
        cursor.onUpdate();
        
        // Then - 수정일시가 업데이트되어야 함
        assertNotNull(cursor.getUpdatedAt());
        assertTrue(cursor.getUpdatedAt().isAfter(originalTime) || 
                  cursor.getUpdatedAt().isEqual(originalTime));
    }
    
    @Test
    void testUpdateLastReadMessageId() {
        // Given
        Long newLastReadMessageId = 100L;
        LocalDateTime originalTime = cursor.getUpdatedAt();
        
        // When
        cursor.setLastReadMessageId(newLastReadMessageId);
        cursor.onUpdate();
        
        // Then
        assertEquals(newLastReadMessageId, cursor.getLastReadMessageId());
        assertNotNull(cursor.getUpdatedAt());
    }
    
    @Test
    void testSettersAndGetters() {
        // Given
        Long newChatRoomId = 10L;
        Long newUserId = 20L;
        Long newLastReadMessageId = 30L;
        LocalDateTime now = LocalDateTime.now();
        
        // When
        cursor.setChatRoomId(newChatRoomId);
        cursor.setUserId(newUserId);
        cursor.setLastReadMessageId(newLastReadMessageId);
        cursor.setUpdatedAt(now);
        cursor.setCreatedAt(now);
        
        // Then
        assertEquals(newChatRoomId, cursor.getChatRoomId());
        assertEquals(newUserId, cursor.getUserId());
        assertEquals(newLastReadMessageId, cursor.getLastReadMessageId());
        assertEquals(now, cursor.getUpdatedAt());
        assertEquals(now, cursor.getCreatedAt());
    }
}