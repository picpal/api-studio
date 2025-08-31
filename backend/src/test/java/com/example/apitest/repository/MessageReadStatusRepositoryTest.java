package com.example.apitest.repository;

import com.example.apitest.entity.MessageReadStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@SpringJUnitConfig
public class MessageReadStatusRepositoryTest {
    
    @Autowired
    private MessageReadStatusRepository messageReadStatusRepository;
    
    private MessageReadStatus readStatus1;
    private MessageReadStatus readStatus2;
    private MessageReadStatus readStatus3;
    
    @BeforeEach
    void setUp() {
        messageReadStatusRepository.deleteAll();
        
        // 테스트 데이터 생성
        readStatus1 = new MessageReadStatus(1L, 10L, 100L); // message1, user10, room100
        readStatus2 = new MessageReadStatus(1L, 11L, 100L); // message1, user11, room100
        readStatus3 = new MessageReadStatus(2L, 10L, 100L); // message2, user10, room100
        
        messageReadStatusRepository.saveAll(Arrays.asList(readStatus1, readStatus2, readStatus3));
    }
    
    @Test
    void testFindByMessageId() {
        // Given & When
        List<MessageReadStatus> results = messageReadStatusRepository.findByMessageId(1L);
        
        // Then
        assertEquals(2, results.size());
        assertTrue(results.stream().allMatch(rs -> rs.getMessageId().equals(1L)));
    }
    
    @Test
    void testFindByChatRoomIdAndUserId() {
        // Given & When
        List<MessageReadStatus> results = messageReadStatusRepository.findByChatRoomIdAndUserId(100L, 10L);
        
        // Then
        assertEquals(2, results.size());
        assertTrue(results.stream().allMatch(rs -> 
            rs.getChatRoomId().equals(100L) && rs.getUserId().equals(10L)));
    }
    
    @Test
    void testCountByMessageId() {
        // Given & When
        int count = messageReadStatusRepository.countByMessageId(1L);
        
        // Then
        assertEquals(2, count);
    }
    
    @Test
    void testCountReadStatusByMessageIds() {
        // Given
        List<Long> messageIds = Arrays.asList(1L, 2L);
        
        // When
        List<Object[]> results = messageReadStatusRepository.countReadStatusByMessageIds(messageIds);
        
        // Then
        assertEquals(2, results.size());
        
        // message1의 읽음 상태 수 확인
        Object[] message1Result = results.stream()
            .filter(result -> result[0].equals(1L))
            .findFirst()
            .orElseThrow();
        assertEquals(2L, message1Result[1]);
        
        // message2의 읽음 상태 수 확인
        Object[] message2Result = results.stream()
            .filter(result -> result[0].equals(2L))
            .findFirst()
            .orElseThrow();
        assertEquals(1L, message2Result[1]);
    }
    
    @Test
    void testFindByChatRoomIdAndMessageIds() {
        // Given
        List<Long> messageIds = Arrays.asList(1L, 2L);
        
        // When
        List<MessageReadStatus> results = messageReadStatusRepository
            .findByChatRoomIdAndMessageIds(100L, messageIds);
        
        // Then
        assertEquals(3, results.size());
        assertTrue(results.stream().allMatch(rs -> rs.getChatRoomId().equals(100L)));
        assertTrue(results.stream().allMatch(rs -> messageIds.contains(rs.getMessageId())));
    }
    
    @Test
    void testExistsByMessageIdAndUserId() {
        // Given & When & Then
        assertTrue(messageReadStatusRepository.existsByMessageIdAndUserId(1L, 10L));
        assertTrue(messageReadStatusRepository.existsByMessageIdAndUserId(1L, 11L));
        assertFalse(messageReadStatusRepository.existsByMessageIdAndUserId(3L, 10L));
    }
    
    @Test
    void testDeleteByChatRoomId() {
        // Given - 다른 채팅방의 읽음 상태 추가
        MessageReadStatus otherRoomStatus = new MessageReadStatus(5L, 12L, 200L);
        messageReadStatusRepository.save(otherRoomStatus);
        
        // When
        messageReadStatusRepository.deleteByChatRoomId(100L);
        
        // Then
        List<MessageReadStatus> remaining = messageReadStatusRepository.findAll();
        assertEquals(1, remaining.size());
        assertEquals(200L, remaining.get(0).getChatRoomId());
    }
    
    @Test
    void testUniqueConstraint() {
        // Given - 동일한 메시지ID와 사용자ID로 중복 생성 시도
        MessageReadStatus duplicate = new MessageReadStatus(1L, 10L, 100L);
        
        // When & Then - 실제 DB에서는 unique constraint 에러가 발생해야 함
        // 이 테스트에서는 중복 데이터가 생성되지 않음을 확인
        long beforeCount = messageReadStatusRepository.count();
        
        try {
            messageReadStatusRepository.save(duplicate);
            messageReadStatusRepository.flush(); // 즉시 DB에 반영
            fail("Unique constraint violation expected");
        } catch (Exception e) {
            // 예상되는 예외 - unique constraint 위반
            assertTrue(e.getMessage().contains("ConstraintViolationException") || 
                      e.getCause() != null);
        }
        
        long afterCount = messageReadStatusRepository.count();
        assertEquals(beforeCount, afterCount);
    }
}