package com.example.apitest.service;

import com.example.apitest.entity.ChatRoomReadCursor;
import com.example.apitest.entity.Message;
import com.example.apitest.entity.MessageReadStatus;
import com.example.apitest.repository.ChatRoomReadCursorRepository;
import com.example.apitest.repository.MessageReadStatusRepository;
import com.example.apitest.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ChatReadStatusService {
    
    private final MessageReadStatusRepository messageReadStatusRepository;
    private final ChatRoomReadCursorRepository chatRoomReadCursorRepository;
    private final MessageRepository messageRepository;
    private final SimpMessagingTemplate messagingTemplate;
    
    /**
     * 메시지들을 읽음 처리
     */
    public void markMessagesAsRead(Long chatRoomId, Long userId, Long lastVisibleMessageId) {
        log.debug("Marking messages as read - roomId: {}, userId: {}, lastVisibleMessageId: {}", 
                 chatRoomId, userId, lastVisibleMessageId);
        
        // 1. 현재 사용자의 읽음 커서 조회 또는 생성
        ChatRoomReadCursor cursor = chatRoomReadCursorRepository
            .findByChatRoomIdAndUserId(chatRoomId, userId)
            .orElse(new ChatRoomReadCursor(chatRoomId, userId));
        
        Long previousLastReadMessageId = cursor.getLastReadMessageId();
        
        // 2. 이전 커서 위치 이후의 읽지 않은 메시지들 조회
        List<Message> unreadMessages = messageRepository
            .findUnreadMessages(chatRoomId, userId, previousLastReadMessageId);
        
        // 3. lastVisibleMessageId 이하의 메시지들만 읽음 처리
        List<MessageReadStatus> readStatuses = unreadMessages.stream()
            .filter(msg -> msg.getId() <= lastVisibleMessageId)
            .map(msg -> new MessageReadStatus(msg.getId(), userId, chatRoomId))
            .collect(Collectors.toList());
        
        // 4. 배치로 읽음 상태 저장 (중복 방지)
        if (!readStatuses.isEmpty()) {
            try {
                messageReadStatusRepository.saveAll(readStatuses);
                log.debug("Saved {} read statuses", readStatuses.size());
            } catch (Exception e) {
                // 중복 키 에러 등은 무시 (이미 읽음 처리된 경우)
                log.warn("Failed to save some read statuses (possibly duplicates): {}", e.getMessage());
            }
        }
        
        // 5. 읽음 커서 업데이트
        cursor.setLastReadMessageId(lastVisibleMessageId);
        cursor.setUpdatedAt(LocalDateTime.now());
        chatRoomReadCursorRepository.save(cursor);
        
        // 6. WebSocket으로 실시간 동기화
        Map<String, Object> readStatusUpdate = new HashMap<>();
        readStatusUpdate.put("userId", userId);
        readStatusUpdate.put("lastReadMessageId", lastVisibleMessageId);
        readStatusUpdate.put("chatRoomId", chatRoomId);
        readStatusUpdate.put("timestamp", LocalDateTime.now());
        
        String topic = "/topic/room/" + chatRoomId + "/read-status";
        messagingTemplate.convertAndSend(topic, readStatusUpdate);
        
        log.debug("Read status updated and broadcasted to topic: {}", topic);
    }
    
    /**
     * 특정 채팅방에서 사용자의 안읽은 메시지 수 조회
     */
    @Transactional(readOnly = true)
    public int getUnreadMessageCount(Long chatRoomId, Long userId) {
        log.debug("Getting unread message count for roomId: {}, userId: {}", chatRoomId, userId);
        
        ChatRoomReadCursor cursor = chatRoomReadCursorRepository
            .findByChatRoomIdAndUserId(chatRoomId, userId)
            .orElse(null);
        
        Long lastReadMessageId = cursor != null ? cursor.getLastReadMessageId() : 0L;
        
        log.debug("Using lastReadMessageId: {} for roomId: {}, userId: {}", 
                 lastReadMessageId, chatRoomId, userId);
        
        int count = messageRepository.countUnreadMessagesForUser(chatRoomId, userId, lastReadMessageId);
        
        log.debug("Unread message count: {} for roomId: {}, userId: {}", count, chatRoomId, userId);
        
        return count;
    }
    
    /**
     * 특정 메시지의 읽음 상태 조회
     */
    @Transactional(readOnly = true)
    public List<MessageReadStatus> getMessageReadStatus(Long messageId) {
        return messageReadStatusRepository.findByMessageId(messageId);
    }
    
    /**
     * 메시지의 읽은 사용자 수 조회
     */
    @Transactional(readOnly = true)
    public int getMessageReadCount(Long messageId) {
        return messageReadStatusRepository.countByMessageId(messageId);
    }
    
    /**
     * 여러 메시지의 읽음 상태를 한번에 조회
     */
    @Transactional(readOnly = true)
    public Map<Long, Integer> getMessageReadCounts(List<Long> messageIds) {
        List<Object[]> results = messageReadStatusRepository.countReadStatusByMessageIds(messageIds);
        
        Map<Long, Integer> readCounts = new HashMap<>();
        for (Object[] result : results) {
            Long messageId = (Long) result[0];
            Long count = (Long) result[1];
            readCounts.put(messageId, count.intValue());
        }
        
        // 읽음 상태가 없는 메시지들은 0으로 설정
        for (Long messageId : messageIds) {
            readCounts.putIfAbsent(messageId, 0);
        }
        
        return readCounts;
    }
    
    /**
     * 사용자가 특정 메시지를 읽었는지 확인
     */
    @Transactional(readOnly = true)
    public boolean hasUserReadMessage(Long messageId, Long userId) {
        return messageReadStatusRepository.existsByMessageIdAndUserId(messageId, userId);
    }
    
    /**
     * 채팅방 삭제 시 관련된 읽음 상태 정보 정리
     */
    public void cleanupReadStatusForRoom(Long chatRoomId) {
        log.info("Cleaning up read status for room: {}", chatRoomId);
        
        messageReadStatusRepository.deleteByChatRoomId(chatRoomId);
        chatRoomReadCursorRepository.deleteByChatRoomId(chatRoomId);
        
        log.info("Read status cleanup completed for room: {}", chatRoomId);
    }
    
    /**
     * 사용자가 채팅방에서 나갈 때 해당 사용자의 읽음 커서 정리
     */
    public void cleanupReadStatusForUser(Long chatRoomId, Long userId) {
        log.info("Cleaning up read status for user {} in room {}", userId, chatRoomId);
        
        chatRoomReadCursorRepository.deleteByChatRoomIdAndUserId(chatRoomId, userId);
        
        log.info("Read status cleanup completed for user {} in room {}", userId, chatRoomId);
    }
}