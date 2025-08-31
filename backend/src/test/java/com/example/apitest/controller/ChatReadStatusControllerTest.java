package com.example.apitest.controller;

import com.example.apitest.entity.MessageReadStatus;
import com.example.apitest.entity.User;
import com.example.apitest.service.ChatReadStatusService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.security.Principal;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ChatReadStatusController.class)
public class ChatReadStatusControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @MockBean
    private ChatReadStatusService chatReadStatusService;
    
    private Long chatRoomId = 100L;
    private Long userId = 10L;
    private Long messageId = 50L;
    
    @BeforeEach
    void setUp() {
        // Mock Principal to return user ID
        // 실제 테스트에서는 SecurityContext를 통해 사용자 정보를 얻음
    }
    
    @Test
    @WithMockUser(username = "test@example.com")
    void testMarkMessagesAsRead() throws Exception {
        // Given
        Map<String, Object> request = new HashMap<>();
        request.put("lastReadMessageId", 50L);
        
        doNothing().when(chatReadStatusService)
            .markMessagesAsRead(eq(chatRoomId), anyLong(), eq(50L));
        
        // When & Then
        mockMvc.perform(post("/api/chat/rooms/{roomId}/messages/read", chatRoomId)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
        
        verify(chatReadStatusService).markMessagesAsRead(eq(chatRoomId), anyLong(), eq(50L));
    }
    
    @Test
    @WithMockUser(username = "test@example.com")
    void testMarkMessagesAsRead_InvalidRequest() throws Exception {
        // Given - lastReadMessageId가 없는 잘못된 요청
        Map<String, Object> request = new HashMap<>();
        
        // When & Then
        mockMvc.perform(post("/api/chat/rooms/{roomId}/messages/read", chatRoomId)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
    
    @Test
    @WithMockUser(username = "test@example.com")
    void testGetUnreadCount() throws Exception {
        // Given
        when(chatReadStatusService.getUnreadMessageCount(eq(chatRoomId), anyLong()))
            .thenReturn(5);
        
        // When & Then
        mockMvc.perform(get("/api/chat/rooms/{roomId}/unread-count", chatRoomId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount").value(5));
        
        verify(chatReadStatusService).getUnreadMessageCount(eq(chatRoomId), anyLong());
    }
    
    @Test
    @WithMockUser(username = "test@example.com")
    void testGetMessageReadStatus() throws Exception {
        // Given
        List<MessageReadStatus> readStatuses = Arrays.asList(
            new MessageReadStatus(messageId, 10L, chatRoomId),
            new MessageReadStatus(messageId, 11L, chatRoomId)
        );
        
        when(chatReadStatusService.getMessageReadStatus(messageId))
            .thenReturn(readStatuses);
        
        // When & Then
        mockMvc.perform(get("/api/chat/messages/{messageId}/read-status", messageId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.readStatuses").isArray())
                .andExpect(jsonPath("$.readStatuses.length()").value(2));
        
        verify(chatReadStatusService).getMessageReadStatus(messageId);
    }
    
    @Test
    @WithMockUser(username = "test@example.com")
    void testGetMessageReadCount() throws Exception {
        // Given
        when(chatReadStatusService.getMessageReadCount(messageId))
            .thenReturn(3);
        
        // When & Then
        mockMvc.perform(get("/api/chat/messages/{messageId}/read-count", messageId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.readCount").value(3));
        
        verify(chatReadStatusService).getMessageReadCount(messageId);
    }
    
    @Test
    @WithMockUser(username = "test@example.com")
    void testGetMultipleMessageReadCounts() throws Exception {
        // Given
        Map<String, Object> request = new HashMap<>();
        request.put("messageIds", Arrays.asList(50L, 51L, 52L));
        
        Map<Long, Integer> readCounts = new HashMap<>();
        readCounts.put(50L, 2);
        readCounts.put(51L, 1);
        readCounts.put(52L, 0);
        
        when(chatReadStatusService.getMessageReadCounts(anyList()))
            .thenReturn(readCounts);
        
        // When & Then
        mockMvc.perform(post("/api/chat/messages/read-counts")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.readCounts").isMap())
                .andExpect(jsonPath("$.readCounts.50").value(2))
                .andExpect(jsonPath("$.readCounts.51").value(1))
                .andExpect(jsonPath("$.readCounts.52").value(0));
        
        verify(chatReadStatusService).getMessageReadCounts(anyList());
    }
    
    @Test
    @WithMockUser(username = "test@example.com")
    void testHasUserReadMessage() throws Exception {
        // Given
        when(chatReadStatusService.hasUserReadMessage(eq(messageId), anyLong()))
            .thenReturn(true);
        
        // When & Then
        mockMvc.perform(get("/api/chat/messages/{messageId}/read-by-me", messageId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasRead").value(true));
        
        verify(chatReadStatusService).hasUserReadMessage(eq(messageId), anyLong());
    }
    
    @Test
    void testMarkMessagesAsRead_Unauthorized() throws Exception {
        // Given - 인증되지 않은 요청
        Map<String, Object> request = new HashMap<>();
        request.put("lastReadMessageId", 50L);
        
        // When & Then
        mockMvc.perform(post("/api/chat/rooms/{roomId}/messages/read", chatRoomId)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
        
        verifyNoInteractions(chatReadStatusService);
    }
}