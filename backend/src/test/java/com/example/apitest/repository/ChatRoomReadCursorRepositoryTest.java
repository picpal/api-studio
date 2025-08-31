package com.example.apitest.repository;

import com.example.apitest.entity.ChatRoomReadCursor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@SpringJUnitConfig
public class ChatRoomReadCursorRepositoryTest {
    
    @Autowired
    private ChatRoomReadCursorRepository chatRoomReadCursorRepository;
    
    private ChatRoomReadCursor cursor1;
    private ChatRoomReadCursor cursor2;
    private ChatRoomReadCursor cursor3;
    
    @BeforeEach
    void setUp() {
        chatRoomReadCursorRepository.deleteAll();
        
        // 테스트 데이터 생성
        cursor1 = new ChatRoomReadCursor(100L, 10L); // room100, user10
        cursor1.setLastReadMessageId(50L);
        
        cursor2 = new ChatRoomReadCursor(100L, 11L); // room100, user11
        cursor2.setLastReadMessageId(45L);
        
        cursor3 = new ChatRoomReadCursor(200L, 10L); // room200, user10
        cursor3.setLastReadMessageId(30L);
        
        chatRoomReadCursorRepository.saveAll(Arrays.asList(cursor1, cursor2, cursor3));
    }
    
    @Test
    void testFindByChatRoomIdAndUserId() {
        // Given & When
        Optional<ChatRoomReadCursor> result = chatRoomReadCursorRepository
            .findByChatRoomIdAndUserId(100L, 10L);
        
        // Then
        assertTrue(result.isPresent());
        assertEquals(100L, result.get().getChatRoomId());
        assertEquals(10L, result.get().getUserId());
        assertEquals(50L, result.get().getLastReadMessageId());
    }
    
    @Test
    void testFindByChatRoomIdAndUserId_NotFound() {
        // Given & When
        Optional<ChatRoomReadCursor> result = chatRoomReadCursorRepository
            .findByChatRoomIdAndUserId(999L, 999L);
        
        // Then
        assertFalse(result.isPresent());
    }
    
    @Test
    void testFindByUserId() {
        // Given & When
        List<ChatRoomReadCursor> results = chatRoomReadCursorRepository.findByUserId(10L);
        
        // Then
        assertEquals(2, results.size());
        assertTrue(results.stream().allMatch(cursor -> cursor.getUserId().equals(10L)));
        
        // 채팅방 ID 확인
        assertTrue(results.stream().anyMatch(cursor -> cursor.getChatRoomId().equals(100L)));
        assertTrue(results.stream().anyMatch(cursor -> cursor.getChatRoomId().equals(200L)));
    }
    
    @Test
    void testFindByChatRoomId() {
        // Given & When
        List<ChatRoomReadCursor> results = chatRoomReadCursorRepository.findByChatRoomId(100L);
        
        // Then
        assertEquals(2, results.size());
        assertTrue(results.stream().allMatch(cursor -> cursor.getChatRoomId().equals(100L)));
        
        // 사용자 ID 확인
        assertTrue(results.stream().anyMatch(cursor -> cursor.getUserId().equals(10L)));
        assertTrue(results.stream().anyMatch(cursor -> cursor.getUserId().equals(11L)));
    }
    
    @Test
    void testDeleteByChatRoomId() {
        // Given - 삭제 전 데이터 확인
        assertEquals(3, chatRoomReadCursorRepository.count());
        
        // When
        chatRoomReadCursorRepository.deleteByChatRoomId(100L);
        
        // Then
        List<ChatRoomReadCursor> remaining = chatRoomReadCursorRepository.findAll();
        assertEquals(1, remaining.size());
        assertEquals(200L, remaining.get(0).getChatRoomId());
        assertEquals(10L, remaining.get(0).getUserId());
    }
    
    @Test
    void testDeleteByChatRoomIdAndUserId() {
        // Given - 삭제 전 데이터 확인
        assertEquals(3, chatRoomReadCursorRepository.count());
        
        // When
        chatRoomReadCursorRepository.deleteByChatRoomIdAndUserId(100L, 10L);
        
        // Then
        assertEquals(2, chatRoomReadCursorRepository.count());
        
        // 삭제된 커서가 없는지 확인
        Optional<ChatRoomReadCursor> deleted = chatRoomReadCursorRepository
            .findByChatRoomIdAndUserId(100L, 10L);
        assertFalse(deleted.isPresent());
        
        // 다른 커서들은 여전히 존재하는지 확인
        assertTrue(chatRoomReadCursorRepository.findByChatRoomIdAndUserId(100L, 11L).isPresent());
        assertTrue(chatRoomReadCursorRepository.findByChatRoomIdAndUserId(200L, 10L).isPresent());
    }
    
    @Test
    void testUpdateLastReadMessageId() {
        // Given
        Long newLastReadMessageId = 100L;
        
        // When
        ChatRoomReadCursor cursor = chatRoomReadCursorRepository
            .findByChatRoomIdAndUserId(100L, 10L)
            .orElseThrow();
        
        cursor.setLastReadMessageId(newLastReadMessageId);
        ChatRoomReadCursor saved = chatRoomReadCursorRepository.save(cursor);
        
        // Then
        assertEquals(newLastReadMessageId, saved.getLastReadMessageId());
        assertNotNull(saved.getUpdatedAt());
    }
    
    @Test
    void testUniqueConstraint() {
        // Given - 동일한 채팅방ID와 사용자ID로 중복 생성 시도
        ChatRoomReadCursor duplicate = new ChatRoomReadCursor(100L, 10L);
        
        // When & Then - unique constraint 위반으로 예외 발생해야 함
        long beforeCount = chatRoomReadCursorRepository.count();
        
        try {
            chatRoomReadCursorRepository.save(duplicate);
            chatRoomReadCursorRepository.flush(); // 즉시 DB에 반영
            fail("Unique constraint violation expected");
        } catch (Exception e) {
            // 예상되는 예외 - unique constraint 위반
            assertTrue(e.getMessage().contains("ConstraintViolationException") || 
                      e.getCause() != null);
        }
        
        long afterCount = chatRoomReadCursorRepository.count();
        assertEquals(beforeCount, afterCount);
    }
}