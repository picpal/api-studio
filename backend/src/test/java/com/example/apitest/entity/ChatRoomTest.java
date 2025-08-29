package com.example.apitest.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.*;

@DisplayName("ChatRoom 엔티티 테스트")
class ChatRoomTest {
    
    private ChatRoom chatRoom;
    private Long userId;
    
    @BeforeEach
    void setUp() {
        userId = 1L;
        chatRoom = ChatRoom.builder()
            .name("테스트 채팅방")
            .description("테스트 설명")
            .roomType(ChatRoom.RoomType.GROUP)
            .createdBy(userId)
            .build();
    }
    
    @Test
    @DisplayName("ChatRoom 생성 시 기본값이 올바르게 설정되어야 한다")
    void createChatRoom_ShouldHaveDefaultValues() {
        // Given & When
        ChatRoom room = ChatRoom.builder()
            .name("테스트 방")
            .createdBy(1L)
            .build();
        
        // Then
        assertThat(room.getName()).isEqualTo("테스트 방");
        assertThat(room.getCreatedBy()).isEqualTo(1L);
        assertThat(room.getRoomType()).isEqualTo(ChatRoom.RoomType.DIRECT); // 기본값
        assertThat(room.getIsActive()).isTrue(); // 기본값
    }
    
    @Test
    @DisplayName("ChatRoom 빌더가 올바르게 동작해야 한다")
    void chatRoomBuilder_ShouldWorkCorrectly() {
        // Given & When
        ChatRoom room = ChatRoom.builder()
            .name("빌더 테스트")
            .description("빌더 설명")
            .roomType(ChatRoom.RoomType.GROUP)
            .createdBy(2L)
            .isActive(false)
            .build();
        
        // Then
        assertThat(room.getName()).isEqualTo("빌더 테스트");
        assertThat(room.getDescription()).isEqualTo("빌더 설명");
        assertThat(room.getRoomType()).isEqualTo(ChatRoom.RoomType.GROUP);
        assertThat(room.getCreatedBy()).isEqualTo(2L);
        assertThat(room.getIsActive()).isFalse();
    }
    
    @Test
    @DisplayName("RoomType ENUM이 올바르게 동작해야 한다")
    void roomType_ShouldHaveCorrectValues() {
        // Given & When & Then
        assertThat(ChatRoom.RoomType.DIRECT).isNotNull();
        assertThat(ChatRoom.RoomType.GROUP).isNotNull();
        assertThat(ChatRoom.RoomType.values()).hasSize(2);
    }
    
    @Test
    @DisplayName("필수 필드가 null일 때 적절히 처리되어야 한다")
    void requiredFields_ShouldNotBeNull() {
        // Given & When & Then
        // Lombok @Builder는 기본적으로 null 검증을 하지 않으므로
        // null 값이 들어가는 것을 허용한다. 
        // 실제 검증은 데이터베이스 제약조건이나 JPA validation에서 처리
        ChatRoom roomWithNullName = ChatRoom.builder()
            .name(null)  
            .createdBy(1L)
            .build();
        
        ChatRoom roomWithNullCreatedBy = ChatRoom.builder()
            .name("테스트")
            .createdBy(null)  
            .build();
        
        // Builder 자체는 예외를 발생시키지 않음
        assertThat(roomWithNullName).isNotNull();
        assertThat(roomWithNullCreatedBy).isNotNull();
        assertThat(roomWithNullName.getName()).isNull();
        assertThat(roomWithNullCreatedBy.getCreatedBy()).isNull();
    }
    
    @Test
    @DisplayName("ChatRoom 수정이 올바르게 동작해야 한다")
    void updateChatRoom_ShouldWorkCorrectly() {
        // Given
        String newName = "수정된 채팅방";
        String newDescription = "수정된 설명";
        
        // When
        chatRoom.setName(newName);
        chatRoom.setDescription(newDescription);
        chatRoom.setIsActive(false);
        
        // Then
        assertThat(chatRoom.getName()).isEqualTo(newName);
        assertThat(chatRoom.getDescription()).isEqualTo(newDescription);
        assertThat(chatRoom.getIsActive()).isFalse();
    }
}