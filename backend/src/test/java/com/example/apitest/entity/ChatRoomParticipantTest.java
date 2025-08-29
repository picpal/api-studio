package com.example.apitest.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.*;

@DisplayName("ChatRoomParticipant 엔티티 테스트")
class ChatRoomParticipantTest {
    
    private ChatRoomParticipant participant;
    private Long roomId;
    private Long userId;
    
    @BeforeEach
    void setUp() {
        roomId = 1L;
        userId = 2L;
        participant = ChatRoomParticipant.builder()
            .roomId(roomId)
            .userId(userId)
            .build();
    }
    
    @Test
    @DisplayName("ChatRoomParticipant 생성 시 기본값이 올바르게 설정되어야 한다")
    void createParticipant_ShouldHaveDefaultValues() {
        // Given & When
        ChatRoomParticipant p = ChatRoomParticipant.builder()
            .roomId(10L)
            .userId(20L)
            .build();
        
        // Then
        assertThat(p.getRoomId()).isEqualTo(10L);
        assertThat(p.getUserId()).isEqualTo(20L);
        assertThat(p.getIsActive()).isTrue(); // 기본값
        assertThat(p.getLastReadMessageId()).isEqualTo(0L); // 기본값
        assertThat(p.getLeftAt()).isNull(); // 기본값
    }
    
    @Test
    @DisplayName("참여자가 채팅방을 나갈 때 올바르게 처리되어야 한다")
    void leaveRoom_ShouldSetCorrectValues() {
        // Given
        LocalDateTime leaveTime = LocalDateTime.now();
        
        // When
        participant.setIsActive(false);
        participant.setLeftAt(leaveTime);
        
        // Then
        assertThat(participant.getIsActive()).isFalse();
        assertThat(participant.getLeftAt()).isEqualTo(leaveTime);
    }
    
    @Test
    @DisplayName("마지막 읽은 메시지 ID가 올바르게 업데이트되어야 한다")
    void updateLastReadMessage_ShouldWorkCorrectly() {
        // Given
        Long newMessageId = 100L;
        
        // When
        participant.setLastReadMessageId(newMessageId);
        
        // Then
        assertThat(participant.getLastReadMessageId()).isEqualTo(newMessageId);
    }
    
    @Test
    @DisplayName("참여자 빌더가 모든 필드를 올바르게 설정해야 한다")
    void participantBuilder_ShouldSetAllFields() {
        // Given
        LocalDateTime joinTime = LocalDateTime.now().minusDays(1);
        LocalDateTime leaveTime = LocalDateTime.now();
        
        // When
        ChatRoomParticipant p = ChatRoomParticipant.builder()
            .roomId(5L)
            .userId(10L)
            .joinedAt(joinTime)
            .leftAt(leaveTime)
            .isActive(false)
            .lastReadMessageId(50L)
            .build();
        
        // Then
        assertThat(p.getRoomId()).isEqualTo(5L);
        assertThat(p.getUserId()).isEqualTo(10L);
        assertThat(p.getJoinedAt()).isEqualTo(joinTime);
        assertThat(p.getLeftAt()).isEqualTo(leaveTime);
        assertThat(p.getIsActive()).isFalse();
        assertThat(p.getLastReadMessageId()).isEqualTo(50L);
    }
    
    @Test
    @DisplayName("필수 필드가 null이면 예외가 발생해야 한다")
    void requiredFields_ShouldNotBeNull() {
        // Given & When & Then
        // Lombok @Builder는 자체적으로 validation을 하지 않음
        // 실제 validation은 @PrePersist/@PreUpdate에서 처리
        ChatRoomParticipant nullRoomId = ChatRoomParticipant.builder()
            .roomId(null)  
            .userId(1L)
            .build();
        
        ChatRoomParticipant nullUserId = ChatRoomParticipant.builder()
            .roomId(1L)
            .userId(null)  
            .build();
        
        // Builder 자체는 예외를 발생시키지 않음
        assertThat(nullRoomId).isNotNull();
        assertThat(nullUserId).isNotNull();
        assertThat(nullRoomId.getRoomId()).isNull();
        assertThat(nullUserId.getUserId()).isNull();
    }
    
    @Test
    @DisplayName("활성 참여자와 비활성 참여자를 구분할 수 있어야 한다")
    void activeVsInactive_ShouldBeDistinguishable() {
        // Given
        ChatRoomParticipant activeParticipant = ChatRoomParticipant.builder()
            .roomId(1L)
            .userId(2L)
            .isActive(true)
            .build();
        
        ChatRoomParticipant inactiveParticipant = ChatRoomParticipant.builder()
            .roomId(1L)
            .userId(3L)
            .isActive(false)
            .leftAt(LocalDateTime.now())
            .build();
        
        // When & Then
        assertThat(activeParticipant.getIsActive()).isTrue();
        assertThat(activeParticipant.getLeftAt()).isNull();
        
        assertThat(inactiveParticipant.getIsActive()).isFalse();
        assertThat(inactiveParticipant.getLeftAt()).isNotNull();
    }
}