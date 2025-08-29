package com.example.apitest.service;

import com.example.apitest.dto.MessageDTO;
import com.example.apitest.entity.ChatRoom;
import com.example.apitest.entity.ChatRoomParticipant;
import com.example.apitest.entity.Message;
import com.example.apitest.entity.User;
import com.example.apitest.repository.ChatRoomParticipantRepository;
import com.example.apitest.repository.MessageRepository;
import com.example.apitest.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("MessageService 테스트")
class MessageServiceTest {

    @InjectMocks
    private MessageService messageService;

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private ChatRoomParticipantRepository participantRepository;

    @Mock
    private UserRepository userRepository;

    private User testUser;
    private Message testMessage;
    private ChatRoomParticipant testParticipant;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");

        testMessage = Message.builder()
            .id(1L)
            .roomId(1L)
            .senderId(1L)
            .content("Test message")
            .messageType(Message.MessageType.TEXT)
            .createdAt(LocalDateTime.now())
            .build();

        testParticipant = ChatRoomParticipant.builder()
            .id(1L)
            .roomId(1L)
            .userId(1L)
            .isActive(true)
            .joinedAt(LocalDateTime.now())
            .build();
    }

    @Test
    @DisplayName("채팅방의 메시지 목록을 조회해야 함")
    void shouldGetRoomMessages() {
        // given
        Long roomId = 1L;
        Long userId = 1L;
        List<Message> messages = Arrays.asList(testMessage);

        when(participantRepository.existsByRoomIdAndUserIdAndIsActive(roomId, userId, true)).thenReturn(true);
        when(messageRepository.findByRoomIdOrderByCreatedAtAsc(roomId)).thenReturn(messages);
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        // when
        List<MessageDTO> result = messageService.getRoomMessages(roomId, userId);

        // then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo(1L);
        assertThat(result.get(0).getContent()).isEqualTo("Test message");
        assertThat(result.get(0).getSenderName()).isEqualTo("test@example.com");

        verify(participantRepository).existsByRoomIdAndUserIdAndIsActive(roomId, userId, true);
        verify(messageRepository).findByRoomIdOrderByCreatedAtAsc(roomId);
    }

    @Test
    @DisplayName("권한이 없는 사용자의 메시지 조회 요청을 거부해야 함")
    void shouldRejectUnauthorizedMessageAccess() {
        // given
        Long roomId = 1L;
        Long userId = 1L;

        when(participantRepository.existsByRoomIdAndUserIdAndIsActive(roomId, userId, true)).thenReturn(false);

        // when & then
        assertThatThrownBy(() -> messageService.getRoomMessages(roomId, userId))
            .isInstanceOf(AccessDeniedException.class)
            .hasMessage("채팅방에 접근할 권한이 없습니다.");

        verify(participantRepository).existsByRoomIdAndUserIdAndIsActive(roomId, userId, true);
        verifyNoInteractions(messageRepository);
    }

    @Test
    @DisplayName("메시지를 전송해야 함")
    void shouldSendMessage() {
        // given
        Long roomId = 1L;
        String content = "New message";
        Long senderId = 1L;

        when(participantRepository.existsByRoomIdAndUserIdAndIsActive(roomId, senderId, true)).thenReturn(true);
        when(messageRepository.save(any(Message.class))).thenReturn(testMessage);
        when(userRepository.findById(senderId)).thenReturn(Optional.of(testUser));

        // when
        MessageDTO result = messageService.sendMessage(roomId, content, senderId);

        // then
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getSenderId()).isEqualTo(1L);
        assertThat(result.getSenderName()).isEqualTo("test@example.com");

        verify(participantRepository).existsByRoomIdAndUserIdAndIsActive(roomId, senderId, true);
        verify(messageRepository).save(any(Message.class));
    }

    @Test
    @DisplayName("권한이 없는 사용자의 메시지 전송을 거부해야 함")
    void shouldRejectUnauthorizedMessageSend() {
        // given
        Long roomId = 1L;
        String content = "Unauthorized message";
        Long senderId = 1L;

        when(participantRepository.existsByRoomIdAndUserIdAndIsActive(roomId, senderId, true)).thenReturn(false);

        // when & then
        assertThatThrownBy(() -> messageService.sendMessage(roomId, content, senderId))
            .isInstanceOf(AccessDeniedException.class)
            .hasMessage("채팅방에 접근할 권한이 없습니다.");

        verify(participantRepository).existsByRoomIdAndUserIdAndIsActive(roomId, senderId, true);
        verifyNoInteractions(messageRepository);
    }

    @Test
    @DisplayName("빈 메시지 전송을 거부해야 함")
    void shouldRejectEmptyMessage() {
        // given
        Long roomId = 1L;
        String content = "";
        Long senderId = 1L;

        // when & then
        assertThatThrownBy(() -> messageService.sendMessage(roomId, content, senderId))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("메시지 내용이 비어있습니다.");

        verifyNoInteractions(participantRepository);
        verifyNoInteractions(messageRepository);
    }

    @Test
    @DisplayName("null 메시지 전송을 거부해야 함")
    void shouldRejectNullMessage() {
        // given
        Long roomId = 1L;
        String content = null;
        Long senderId = 1L;

        // when & then
        assertThatThrownBy(() -> messageService.sendMessage(roomId, content, senderId))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("메시지 내용이 비어있습니다.");

        verifyNoInteractions(participantRepository);
        verifyNoInteractions(messageRepository);
    }

    @Test
    @DisplayName("유효하지 않은 roomId 입력을 거부해야 함")
    void shouldRejectInvalidRoomId() {
        // given
        Long roomId = null;
        String content = "Test message";
        Long senderId = 1L;

        // when & then
        assertThatThrownBy(() -> messageService.sendMessage(roomId, content, senderId))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("올바르지 않은 채팅방 ID입니다.");

        verifyNoInteractions(participantRepository);
        verifyNoInteractions(messageRepository);
    }

    @Test
    @DisplayName("유효하지 않은 senderId 입력을 거부해야 함")
    void shouldRejectInvalidSenderId() {
        // given
        Long roomId = 1L;
        String content = "Test message";
        Long senderId = null;

        // when & then
        assertThatThrownBy(() -> messageService.sendMessage(roomId, content, senderId))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("올바르지 않은 사용자 ID입니다.");

        verifyNoInteractions(participantRepository);
        verifyNoInteractions(messageRepository);
    }

    @Test
    @DisplayName("존재하지 않는 사용자의 메시지를 처리해야 함")
    void shouldHandleMessageFromNonExistentUser() {
        // given
        Long roomId = 1L;
        String content = "Test message";
        Long senderId = 999L;

        Message nonExistentUserMessage = Message.builder()
            .id(2L)
            .roomId(roomId)
            .senderId(senderId)
            .content(content)
            .messageType(Message.MessageType.TEXT)
            .createdAt(LocalDateTime.now())
            .build();

        when(participantRepository.existsByRoomIdAndUserIdAndIsActive(roomId, senderId, true)).thenReturn(true);
        when(messageRepository.save(any(Message.class))).thenReturn(nonExistentUserMessage);
        when(userRepository.findById(senderId)).thenReturn(Optional.empty());

        // when
        MessageDTO result = messageService.sendMessage(roomId, content, senderId);

        // then
        assertThat(result.getSenderName()).isEqualTo("Unknown User");
        assertThat(result.getSenderId()).isEqualTo(senderId);
        verify(userRepository).findById(senderId);
    }

    @Test
    @DisplayName("시스템 메시지의 발신자 이름을 올바르게 표시해야 함")
    void shouldDisplaySystemMessageSenderCorrectly() {
        // given
        Long roomId = 1L;
        Long userId = 1L;
        Message systemMessage = Message.builder()
            .id(2L)
            .roomId(1L)
            .senderId(0L) // 시스템 사용자
            .content("사용자가 입장했습니다.")
            .messageType(Message.MessageType.SYSTEM)
            .createdAt(LocalDateTime.now())
            .build();

        when(participantRepository.existsByRoomIdAndUserIdAndIsActive(roomId, userId, true)).thenReturn(true);
        when(messageRepository.findByRoomIdOrderByCreatedAtAsc(roomId)).thenReturn(Arrays.asList(systemMessage));

        // when
        List<MessageDTO> result = messageService.getRoomMessages(roomId, userId);

        // then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getSenderName()).isEqualTo("System");
        verifyNoInteractions(userRepository);
    }

    @Test
    @DisplayName("메시지 길이 제한을 초과하는 메시지를 거부해야 함")
    void shouldRejectTooLongMessage() {
        // given
        Long roomId = 1L;
        String content = "a".repeat(1001); // 1001자 메시지
        Long senderId = 1L;

        // when & then
        assertThatThrownBy(() -> messageService.sendMessage(roomId, content, senderId))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("메시지가 너무 깁니다. (최대 1000자)");

        verifyNoInteractions(participantRepository);
        verifyNoInteractions(messageRepository);
    }
}