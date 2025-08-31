package com.example.apitest.service;

import com.example.apitest.dto.MessageDTO;
import com.example.apitest.entity.Message;
import com.example.apitest.entity.User;
import com.example.apitest.repository.ChatRoomParticipantRepository;
import com.example.apitest.repository.MessageRepository;
import com.example.apitest.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class MessageService {

    private final MessageRepository messageRepository;
    private final ChatRoomParticipantRepository participantRepository;
    private final UserRepository userRepository;

    // === 메시지 조회 관련 (단일 책임) ===
    
    /**
     * 채팅방 메시지 목록 조회 (권한 체크 포함)
     */
    @Transactional(readOnly = true)
    public List<MessageDTO> getRoomMessages(Long roomId, Long userId) {
        validateRoomAccessPermission(roomId, userId);
        List<Message> messages = findMessagesByRoomId(roomId);
        return convertMessagesToDTO(messages);
    }

    // === 메시지 전송 관련 (단일 책임) ===
    
    /**
     * 메시지 전송 (메인 메서드)
     */
    public MessageDTO sendMessage(Long roomId, String content, Long senderId) {
        validateSendMessageRequest(roomId, content, senderId);
        validateRoomAccessPermission(roomId, senderId);
        
        Message message = createNewMessage(roomId, content, senderId);
        Message savedMessage = messageRepository.save(message);
        
        log.info("메시지 전송됨: roomId={}, senderId={}, messageId={}", roomId, senderId, savedMessage.getId());
        return convertMessageToDTO(savedMessage);
    }

    // === 검증 메서드들 (단일 책임) ===
    
    private void validateSendMessageRequest(Long roomId, String content, Long senderId) {
        validateRoomId(roomId);
        validateSenderId(senderId);
        validateMessageContent(content);
    }

    private void validateRoomId(Long roomId) {
        if (roomId == null || roomId <= 0) {
            throw new IllegalArgumentException("올바르지 않은 채팅방 ID입니다.");
        }
    }

    private void validateSenderId(Long senderId) {
        if (senderId == null || senderId <= 0) {
            throw new IllegalArgumentException("올바르지 않은 사용자 ID입니다.");
        }
    }

    private void validateMessageContent(String content) {
        if (!StringUtils.hasText(content)) {
            throw new IllegalArgumentException("메시지 내용이 비어있습니다.");
        }
        
        if (content.length() > 1000) {
            throw new IllegalArgumentException("메시지가 너무 깁니다. (최대 1000자)");
        }
    }

    private void validateRoomAccessPermission(Long roomId, Long userId) {
        if (!hasRoomAccessPermission(roomId, userId)) {
            throw new AccessDeniedException("채팅방에 접근할 권한이 없습니다.");
        }
    }

    // === 조회 메서드들 (단일 책임) ===
    
    private List<Message> findMessagesByRoomId(Long roomId) {
        return messageRepository.findByRoomIdOrderByCreatedAtAsc(roomId);
    }

    // === 상태 확인 메서드들 (단일 책임) ===
    
    private boolean hasRoomAccessPermission(Long roomId, Long userId) {
        return participantRepository.existsByRoomIdAndUserIdAndIsActive(roomId, userId, true);
    }

    // === 생성 메서드들 (단일 책임) ===
    
    private Message createNewMessage(Long roomId, String content, Long senderId) {
        return Message.builder()
            .roomId(roomId)
            .senderId(senderId)
            .content(content.trim())
            .messageType(Message.MessageType.TEXT)
            .build();
    }

    // === DTO 변환 메서드들 (단일 책임) ===
    
    private List<MessageDTO> convertMessagesToDTO(List<Message> messages) {
        return messages.stream()
            .map(this::convertMessageToDTO)
            .collect(Collectors.toList());
    }

    private MessageDTO convertMessageToDTO(Message message) {
        return MessageDTO.builder()
            .id(message.getId())
            .roomId(message.getRoomId())
            .senderId(message.getSenderId())
            .senderName(getSenderName(message.getSenderId()))
            .content(message.getContent())
            .messageType(message.getMessageType())
            .createdAt(message.getCreatedAt())
            .build();
    }

    // === 유틸리티 메서드들 (단일 책임) ===
    
    private String getSenderName(Long senderId) {
        if (senderId == null || senderId <= 0) {
            return "System";
        }
        
        return userRepository.findById(senderId)
            .map(User::getEmail)
            .orElse("Unknown User");
    }
}