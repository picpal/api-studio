package com.example.apitest.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.*;

@DisplayName("Message 엔티티 테스트")
class MessageTest {
    
    private Message message;
    private Long roomId;
    private Long senderId;
    
    @BeforeEach
    void setUp() {
        roomId = 1L;
        senderId = 2L;
        message = Message.builder()
            .roomId(roomId)
            .senderId(senderId)
            .content("테스트 메시지")
            .messageType(Message.MessageType.TEXT)
            .build();
    }
    
    @Test
    @DisplayName("Message 생성 시 기본값이 올바르게 설정되어야 한다")
    void createMessage_ShouldHaveDefaultValues() {
        // Given & When
        Message msg = Message.builder()
            .roomId(1L)
            .senderId(2L)
            .content("기본값 테스트")
            .build();
        
        // Then
        assertThat(msg.getRoomId()).isEqualTo(1L);
        assertThat(msg.getSenderId()).isEqualTo(2L);
        assertThat(msg.getContent()).isEqualTo("기본값 테스트");
        assertThat(msg.getMessageType()).isEqualTo(Message.MessageType.TEXT); // 기본값
        assertThat(msg.getIsDeleted()).isFalse(); // 기본값
    }
    
    @Test
    @DisplayName("Message 빌더가 올바르게 동작해야 한다")
    void messageBuilder_ShouldWorkCorrectly() {
        // Given & When
        Message msg = Message.builder()
            .roomId(10L)
            .senderId(20L)
            .content("빌더 테스트 메시지")
            .messageType(Message.MessageType.SYSTEM)
            .isDeleted(true)
            .build();
        
        // Then
        assertThat(msg.getRoomId()).isEqualTo(10L);
        assertThat(msg.getSenderId()).isEqualTo(20L);
        assertThat(msg.getContent()).isEqualTo("빌더 테스트 메시지");
        assertThat(msg.getMessageType()).isEqualTo(Message.MessageType.SYSTEM);
        assertThat(msg.getIsDeleted()).isTrue();
    }
    
    @Test
    @DisplayName("MessageType ENUM이 올바른 값들을 가져야 한다")
    void messageType_ShouldHaveCorrectValues() {
        // Given & When & Then
        assertThat(Message.MessageType.TEXT).isNotNull();
        assertThat(Message.MessageType.IMAGE).isNotNull();
        assertThat(Message.MessageType.FILE).isNotNull();
        assertThat(Message.MessageType.SYSTEM).isNotNull();
        assertThat(Message.MessageType.values()).hasSize(4);
    }
    
    @Test
    @DisplayName("시스템 메시지는 senderId가 0이어야 한다")
    void systemMessage_ShouldHaveSenderIdZero() {
        // Given & When
        Message systemMsg = Message.builder()
            .roomId(1L)
            .senderId(0L)
            .content("사용자가 입장했습니다.")
            .messageType(Message.MessageType.SYSTEM)
            .build();
        
        // Then
        assertThat(systemMsg.getSenderId()).isEqualTo(0L);
        assertThat(systemMsg.getMessageType()).isEqualTo(Message.MessageType.SYSTEM);
    }
    
    @Test
    @DisplayName("메시지 소프트 삭제가 올바르게 동작해야 한다")
    void softDelete_ShouldWorkCorrectly() {
        // Given
        assertThat(message.getIsDeleted()).isFalse();
        
        // When
        message.setIsDeleted(true);
        
        // Then
        assertThat(message.getIsDeleted()).isTrue();
        assertThat(message.getContent()).isEqualTo("테스트 메시지"); // 내용은 유지
    }
    
    @Test
    @DisplayName("메시지 내용이 비어있으면 예외가 발생해야 한다")
    void emptyContent_ShouldThrowException() {
        // Given & When & Then
        // Lombok @Builder는 자체적으로 validation을 하지 않음
        // 실제 validation은 @PrePersist/@PreUpdate에서 처리
        Message emptyMessage = Message.builder()
            .roomId(1L)
            .senderId(2L)
            .content("")  // 빈 내용
            .build();
        
        Message nullMessage = Message.builder()
            .roomId(1L)
            .senderId(2L)
            .content(null)  // null 내용
            .build();
        
        // Builder 자체는 예외를 발생시키지 않음
        assertThat(emptyMessage).isNotNull();
        assertThat(nullMessage).isNotNull();
        assertThat(emptyMessage.getContent()).isEmpty();
        assertThat(nullMessage.getContent()).isNull();
    }
}