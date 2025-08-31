package com.example.apitest.service;

import com.example.apitest.entity.ChatRoomReadCursor;
import com.example.apitest.entity.Message;
import com.example.apitest.entity.MessageReadStatus;
import com.example.apitest.repository.ChatRoomReadCursorRepository;
import com.example.apitest.repository.MessageReadStatusRepository;
import com.example.apitest.repository.MessageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ChatReadStatusServiceTest {
    
    @Mock
    private MessageReadStatusRepository messageReadStatusRepository;
    
    @Mock
    private ChatRoomReadCursorRepository chatRoomReadCursorRepository;
    
    @Mock
    private MessageRepository messageRepository;
    
    @Mock
    private SimpMessagingTemplate messagingTemplate;
    
    @InjectMocks
    private ChatReadStatusService chatReadStatusService;
    
    private Long chatRoomId = 100L;
    private Long userId = 10L;
    private Long lastVisibleMessageId = 50L;
    
    @BeforeEach
    void setUp() {
        // 테스트 시작 전 mocking 설정은 각 테스트 메서드에서 수행
    }
    
    @Test
    void testMarkMessagesAsRead_WithExistingCursor() {
        // Given
        ChatRoomReadCursor existingCursor = new ChatRoomReadCursor(chatRoomId, userId);
        existingCursor.setLastReadMessageId(30L);
        
        List<Message> unreadMessages = Arrays.asList(
            createMessage(35L, 11L, "Message 1"),
            createMessage(40L, 12L, "Message 2"),
            createMessage(45L, 11L, "Message 3")
        );
        
        when(chatRoomReadCursorRepository.findByChatRoomIdAndUserId(chatRoomId, userId))
            .thenReturn(Optional.of(existingCursor));
        when(messageRepository.findUnreadMessages(chatRoomId, userId, 30L))
            .thenReturn(unreadMessages);
        when(messageReadStatusRepository.saveAll(anyList()))
            .thenReturn(Arrays.asList());
        when(chatRoomReadCursorRepository.save(any(ChatRoomReadCursor.class)))
            .thenReturn(existingCursor);
        
        // When
        chatReadStatusService.markMessagesAsRead(chatRoomId, userId, lastVisibleMessageId);
        
        // Then
        verify(messageReadStatusRepository).saveAll(argThat(list -> {
            List<MessageReadStatus> statusList = (List<MessageReadStatus>) list;
            return statusList.size() == 3 &&
                   statusList.stream().allMatch(status -> 
                       status.getChatRoomId().equals(chatRoomId) &&
                       status.getUserId().equals(userId));
        }));
        
        verify(chatRoomReadCursorRepository).save(argThat(cursor -> 
            cursor.getLastReadMessageId().equals(lastVisibleMessageId)));
        
        verify(messagingTemplate).convertAndSend(
            eq("/topic/room/" + chatRoomId + "/read-status"),
            any(Map.class)
        );
    }
    
    @Test
    void testMarkMessagesAsRead_WithNewCursor() {
        // Given
        List<Message> unreadMessages = Arrays.asList(
            createMessage(10L, 11L, "Message 1"),
            createMessage(20L, 12L, "Message 2")
        );
        
        when(chatRoomReadCursorRepository.findByChatRoomIdAndUserId(chatRoomId, userId))
            .thenReturn(Optional.empty());
        when(messageRepository.findUnreadMessages(eq(chatRoomId), eq(userId), eq(0L)))
            .thenReturn(unreadMessages);
        when(messageReadStatusRepository.saveAll(anyList()))
            .thenReturn(Arrays.asList());
        when(chatRoomReadCursorRepository.save(any(ChatRoomReadCursor.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));
        
        // When
        chatReadStatusService.markMessagesAsRead(chatRoomId, userId, lastVisibleMessageId);
        
        // Then
        verify(chatRoomReadCursorRepository).save(argThat(cursor -> 
            cursor.getChatRoomId().equals(chatRoomId) &&
            cursor.getUserId().equals(userId) &&
            cursor.getLastReadMessageId().equals(lastVisibleMessageId)));
    }
    
    @Test
    void testMarkMessagesAsRead_FiltersByLastVisibleMessageId() {
        // Given
        Long lastVisibleMessageId = 35L;
        
        ChatRoomReadCursor existingCursor = new ChatRoomReadCursor(chatRoomId, userId);
        existingCursor.setLastReadMessageId(20L);
        
        List<Message> unreadMessages = Arrays.asList(
            createMessage(25L, 11L, "Message 1"), // 읽음 처리 됨 (25 <= 35)
            createMessage(30L, 12L, "Message 2"), // 읽음 처리 됨 (30 <= 35)
            createMessage(40L, 11L, "Message 3")  // 읽음 처리 안됨 (40 > 35)
        );
        
        when(chatRoomReadCursorRepository.findByChatRoomIdAndUserId(chatRoomId, userId))
            .thenReturn(Optional.of(existingCursor));
        when(messageRepository.findUnreadMessages(chatRoomId, userId, 20L))
            .thenReturn(unreadMessages);
        
        // When
        chatReadStatusService.markMessagesAsRead(chatRoomId, userId, lastVisibleMessageId);
        
        // Then
        verify(messageReadStatusRepository).saveAll(argThat(list -> {
            List<MessageReadStatus> statusList = (List<MessageReadStatus>) list;
            return statusList.size() == 2 &&
                   statusList.stream().allMatch(status -> status.getMessageId() <= lastVisibleMessageId);
        }));
    }
    
    @Test
    void testGetUnreadMessageCount_WithExistingCursor() {
        // Given
        ChatRoomReadCursor cursor = new ChatRoomReadCursor(chatRoomId, userId);
        cursor.setLastReadMessageId(30L);
        
        when(chatRoomReadCursorRepository.findByChatRoomIdAndUserId(chatRoomId, userId))
            .thenReturn(Optional.of(cursor));
        when(messageRepository.countUnreadMessagesForUser(chatRoomId, userId, 30L))
            .thenReturn(5);
        
        // When
        int count = chatReadStatusService.getUnreadMessageCount(chatRoomId, userId);
        
        // Then
        assertEquals(5, count);
        verify(messageRepository).countUnreadMessagesForUser(chatRoomId, userId, 30L);
    }
    
    @Test
    void testGetUnreadMessageCount_WithoutCursor() {
        // Given
        when(chatRoomReadCursorRepository.findByChatRoomIdAndUserId(chatRoomId, userId))
            .thenReturn(Optional.empty());
        when(messageRepository.countUnreadMessagesForUser(chatRoomId, userId, 0L))
            .thenReturn(10);
        
        // When
        int count = chatReadStatusService.getUnreadMessageCount(chatRoomId, userId);
        
        // Then
        assertEquals(10, count);
        verify(messageRepository).countUnreadMessagesForUser(chatRoomId, userId, 0L);
    }
    
    @Test
    void testGetMessageReadStatus() {
        // Given
        Long messageId = 100L;
        List<MessageReadStatus> readStatuses = Arrays.asList(
            new MessageReadStatus(messageId, 10L, chatRoomId),
            new MessageReadStatus(messageId, 11L, chatRoomId)
        );
        
        when(messageReadStatusRepository.findByMessageId(messageId))
            .thenReturn(readStatuses);
        
        // When
        List<MessageReadStatus> result = chatReadStatusService.getMessageReadStatus(messageId);
        
        // Then
        assertEquals(2, result.size());
        assertTrue(result.stream().allMatch(status -> status.getMessageId().equals(messageId)));
    }
    
    private Message createMessage(Long id, Long senderId, String content) {
        Message message = new Message();
        message.setId(id);
        message.setSenderId(senderId);
        message.setContent(content);
        message.setRoomId(chatRoomId);
        message.setCreatedAt(LocalDateTime.now());
        return message;
    }
}