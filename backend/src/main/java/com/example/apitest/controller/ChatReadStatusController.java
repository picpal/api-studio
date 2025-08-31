package com.example.apitest.controller;

import com.example.apitest.entity.MessageReadStatus;
import com.example.apitest.entity.User;
import com.example.apitest.service.ChatReadStatusService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Slf4j
public class ChatReadStatusController {
    
    private final ChatReadStatusService chatReadStatusService;
    
    /**
     * 메시지 읽음 처리
     */
    @PostMapping("/rooms/{roomId}/messages/read")
    public ResponseEntity<Void> markMessagesAsRead(
            @PathVariable Long roomId,
            @RequestBody MarkAsReadRequest request,
            Authentication authentication) {
        
        if (request.getLastReadMessageId() == null) {
            return ResponseEntity.badRequest().build();
        }
        
        Long userId = getCurrentUserId(authentication);
        
        log.debug("Marking messages as read - roomId: {}, userId: {}, lastReadMessageId: {}", 
                 roomId, userId, request.getLastReadMessageId());
        
        chatReadStatusService.markMessagesAsRead(
            roomId, userId, request.getLastReadMessageId());
        
        return ResponseEntity.ok().build();
    }
    
    /**
     * 특정 채팅방의 안읽은 메시지 수 조회
     */
    @GetMapping("/rooms/{roomId}/unread-count")
    public ResponseEntity<UnreadCountResponse> getUnreadCount(
            @PathVariable Long roomId,
            Authentication authentication) {
        
        Long userId = getCurrentUserId(authentication);
        int count = chatReadStatusService.getUnreadMessageCount(roomId, userId);
        
        return ResponseEntity.ok(new UnreadCountResponse(count));
    }
    
    /**
     * 특정 메시지의 읽음 상태 조회
     */
    @GetMapping("/messages/{messageId}/read-status")
    public ResponseEntity<MessageReadStatusResponse> getMessageReadStatus(
            @PathVariable Long messageId) {
        
        List<MessageReadStatus> readStatuses = chatReadStatusService.getMessageReadStatus(messageId);
        
        return ResponseEntity.ok(new MessageReadStatusResponse(readStatuses));
    }
    
    /**
     * 특정 메시지의 읽은 사용자 수 조회
     */
    @GetMapping("/messages/{messageId}/read-count")
    public ResponseEntity<ReadCountResponse> getMessageReadCount(
            @PathVariable Long messageId) {
        
        int readCount = chatReadStatusService.getMessageReadCount(messageId);
        
        return ResponseEntity.ok(new ReadCountResponse(readCount));
    }
    
    /**
     * 여러 메시지의 읽음 상태를 한번에 조회
     */
    @PostMapping("/messages/read-counts")
    public ResponseEntity<MessageReadCountsResponse> getMultipleMessageReadCounts(
            @RequestBody MessageReadCountsRequest request) {
        
        if (request.getMessageIds() == null || request.getMessageIds().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        Map<Long, Integer> readCounts = chatReadStatusService.getMessageReadCounts(request.getMessageIds());
        
        return ResponseEntity.ok(new MessageReadCountsResponse(readCounts));
    }
    
    /**
     * 사용자가 특정 메시지를 읽었는지 확인
     */
    @GetMapping("/messages/{messageId}/read-by-me")
    public ResponseEntity<HasReadResponse> hasUserReadMessage(
            @PathVariable Long messageId,
            Authentication authentication) {
        
        Long userId = getCurrentUserId(authentication);
        boolean hasRead = chatReadStatusService.hasUserReadMessage(messageId, userId);
        
        return ResponseEntity.ok(new HasReadResponse(hasRead));
    }
    
    /**
     * 현재 인증된 사용자의 ID 조회
     */
    private Long getCurrentUserId(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            User user = (User) authentication.getPrincipal();
            return user.getId();
        }
        throw new IllegalArgumentException("인증된 사용자 정보를 찾을 수 없습니다.");
    }
    
    // DTO 클래스들
    
    public static class MarkAsReadRequest {
        private Long lastReadMessageId;
        
        public Long getLastReadMessageId() {
            return lastReadMessageId;
        }
        
        public void setLastReadMessageId(Long lastReadMessageId) {
            this.lastReadMessageId = lastReadMessageId;
        }
    }
    
    public static class UnreadCountResponse {
        private final int unreadCount;
        
        public UnreadCountResponse(int unreadCount) {
            this.unreadCount = unreadCount;
        }
        
        public int getUnreadCount() {
            return unreadCount;
        }
    }
    
    public static class MessageReadStatusResponse {
        private final List<MessageReadStatus> readStatuses;
        
        public MessageReadStatusResponse(List<MessageReadStatus> readStatuses) {
            this.readStatuses = readStatuses;
        }
        
        public List<MessageReadStatus> getReadStatuses() {
            return readStatuses;
        }
    }
    
    public static class ReadCountResponse {
        private final int readCount;
        
        public ReadCountResponse(int readCount) {
            this.readCount = readCount;
        }
        
        public int getReadCount() {
            return readCount;
        }
    }
    
    public static class MessageReadCountsRequest {
        private List<Long> messageIds;
        
        public List<Long> getMessageIds() {
            return messageIds;
        }
        
        public void setMessageIds(List<Long> messageIds) {
            this.messageIds = messageIds;
        }
    }
    
    public static class MessageReadCountsResponse {
        private final Map<Long, Integer> readCounts;
        
        public MessageReadCountsResponse(Map<Long, Integer> readCounts) {
            this.readCounts = readCounts;
        }
        
        public Map<Long, Integer> getReadCounts() {
            return readCounts;
        }
    }
    
    public static class HasReadResponse {
        private final boolean hasRead;
        
        public HasReadResponse(boolean hasRead) {
            this.hasRead = hasRead;
        }
        
        public boolean isHasRead() {
            return hasRead;
        }
    }
}