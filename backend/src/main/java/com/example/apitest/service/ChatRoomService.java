package com.example.apitest.service;

import com.example.apitest.dto.ChatRoomDTO;
import com.example.apitest.dto.CreateRoomRequest;
import com.example.apitest.dto.MessageDTO;
import com.example.apitest.dto.ParticipantDTO;
import com.example.apitest.entity.ChatRoom;
import com.example.apitest.entity.ChatRoomParticipant;
import com.example.apitest.entity.Message;
import com.example.apitest.entity.User;
import com.example.apitest.repository.ChatRoomRepository;
import com.example.apitest.repository.ChatRoomParticipantRepository;
import com.example.apitest.repository.MessageRepository;
import com.example.apitest.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class ChatRoomService {
    
    private final ChatRoomRepository chatRoomRepository;
    private final ChatRoomParticipantRepository participantRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    
    // === 채팅방 조회 관련 (단일 책임) ===
    
    /**
     * 사용자의 채팅방 목록 조회
     */
    @Transactional(readOnly = true)
    public List<ChatRoomDTO> getUserRooms(Long userId) {
        validateUserId(userId);
        List<ChatRoom> rooms = findActiveRoomsByUser(userId);
        return convertRoomsToDTO(rooms, userId);
    }
    
    /**
     * 특정 채팅방 조회 (권한 체크 포함)
     */
    @Transactional(readOnly = true)
    public ChatRoomDTO getRoomById(Long roomId, Long userId) {
        validateUserId(userId);
        validateRoomId(roomId);
        ChatRoom room = findRoomWithPermissionCheck(roomId, userId);
        return convertRoomToDTO(room, userId);
    }
    
    // === 채팅방 생성 관련 (단일 책임) ===
    
    /**
     * 채팅방 생성 (메인 메서드)
     */
    public ChatRoomDTO createRoom(CreateRoomRequest request, Long userId) {
        validateCreateRoomRequest(request, userId);
        
        // DM방 중복 체크
        if (isDirectRoomRequest(request)) {
            Optional<ChatRoom> existingRoom = findExistingDirectRoom(userId, request.getParticipantIds().get(0));
            if (existingRoom.isPresent()) {
                return convertRoomToDTO(existingRoom.get(), userId);
            }
        }
        
        ChatRoom room = createNewRoom(request, userId);
        addRoomCreator(room.getId(), userId);
        addRoomParticipants(room.getId(), request.getParticipantIds(), userId);
        
        return convertRoomToDTO(room, userId);
    }
    
    /**
     * 새 채팅방 엔티티 생성
     */
    private ChatRoom createNewRoom(CreateRoomRequest request, Long userId) {
        ChatRoom room = ChatRoom.builder()
            .name(generateRoomName(request))
            .description(request.getDescription())
            .roomType(request.getRoomType())
            .createdBy(userId)
            .build();
        
        return chatRoomRepository.save(room);
    }
    
    /**
     * 채팅방 이름 생성 로직
     */
    private String generateRoomName(CreateRoomRequest request) {
        if (StringUtils.hasText(request.getName())) {
            return request.getName().trim();
        }
        
        // DM방의 경우 참여자 이름으로 자동 생성
        if (request.getRoomType() == ChatRoom.RoomType.DIRECT && 
            request.getParticipantIds() != null && !request.getParticipantIds().isEmpty()) {
            return generateDirectRoomName(request.getParticipantIds());
        }
        
        return "새 채팅방";
    }
    
    /**
     * DM방 이름 자동 생성
     */
    private String generateDirectRoomName(List<Long> participantIds) {
        List<String> userNames = participantIds.stream()
            .map(this::getUserName)
            .collect(Collectors.toList());
        return String.join(", ", userNames);
    }
    
    // === 참여자 관리 관련 (단일 책임) ===
    
    /**
     * 사용자 초대 (메인 메서드)
     */
    public void inviteUser(Long roomId, Long targetUserId, Long requesterId) {
        validateInviteRequest(roomId, targetUserId, requesterId);
        
        if (isUserAlreadyParticipant(roomId, targetUserId)) {
            throw new IllegalStateException("이미 참여중인 사용자입니다.");
        }
        
        addParticipant(roomId, targetUserId);
        createUserInvitedSystemMessage(roomId, targetUserId);
        updateRoomLastActivity(roomId);
    }
    
    /**
     * 채팅방 나가기 (메인 메서드)
     */
    public void leaveRoom(Long roomId, Long userId) {
        validateLeaveRoomRequest(roomId, userId);
        
        deactivateParticipant(roomId, userId);
        createUserLeftSystemMessage(roomId, userId);
        
        if (hasNoActiveParticipants(roomId)) {
            deactivateRoom(roomId);
        } else {
            updateRoomLastActivity(roomId);
        }
    }
    
    /**
     * 참여자 추가 (단일 책임)
     */
    private void addParticipant(Long roomId, Long userId) {
        ChatRoomParticipant participant = ChatRoomParticipant.builder()
            .roomId(roomId)
            .userId(userId)
            .build();
        
        participantRepository.save(participant);
        log.info("참여자 추가됨: roomId={}, userId={}", roomId, userId);
    }
    
    /**
     * 참여자 비활성화 (단일 책임)
     */
    private void deactivateParticipant(Long roomId, Long userId) {
        ChatRoomParticipant participant = findActiveParticipant(roomId, userId);
        participant.leave(); // 엔티티의 비즈니스 메서드 사용
        participantRepository.save(participant);
        
        log.info("참여자 비활성화됨: roomId={}, userId={}", roomId, userId);
    }
    
    // === 검증 메서드들 (단일 책임) ===
    
    private void validateUserId(Long userId) {
        if (userId == null || userId <= 0) {
            throw new IllegalArgumentException("올바르지 않은 사용자 ID입니다.");
        }
    }
    
    private void validateRoomId(Long roomId) {
        if (roomId == null || roomId <= 0) {
            throw new IllegalArgumentException("올바르지 않은 채팅방 ID입니다.");
        }
    }
    
    private void validateCreateRoomRequest(CreateRoomRequest request, Long userId) {
        if (request == null) {
            throw new IllegalArgumentException("채팅방 생성 요청이 비어있습니다.");
        }
        
        validateUserId(userId);
        validateRoomType(request.getRoomType());
        validateParticipantIds(request.getParticipantIds(), userId);
        validateRoomName(request.getName(), request.getRoomType());
    }
    
    private void validateRoomType(ChatRoom.RoomType roomType) {
        if (roomType == null) {
            throw new IllegalArgumentException("채팅방 타입이 필요합니다.");
        }
    }
    
    private void validateParticipantIds(List<Long> participantIds, Long userId) {
        if (participantIds != null) {
            if (participantIds.contains(userId)) {
                throw new IllegalArgumentException("자기 자신을 참여자로 추가할 수 없습니다.");
            }
            
            if (participantIds.size() > 100) { // 최대 참여자 수 제한
                throw new IllegalArgumentException("참여자 수가 너무 많습니다. (최대 100명)");
            }
        }
    }
    
    private void validateRoomName(String name, ChatRoom.RoomType roomType) {
        if (roomType == ChatRoom.RoomType.GROUP && !StringUtils.hasText(name)) {
            throw new IllegalArgumentException("그룹 채팅방은 이름이 필요합니다.");
        }
        
        if (StringUtils.hasText(name) && name.length() > 100) {
            throw new IllegalArgumentException("채팅방 이름이 너무 깁니다. (최대 100자)");
        }
    }
    
    private void validateInviteRequest(Long roomId, Long targetUserId, Long requesterId) {
        validateRoomId(roomId);
        validateUserId(targetUserId);
        validateUserId(requesterId);
        
        if (targetUserId.equals(requesterId)) {
            throw new IllegalArgumentException("자기 자신을 초대할 수 없습니다.");
        }
        
        validateUserHasRoomPermission(roomId, requesterId);
        validateUserExists(targetUserId);
    }
    
    private void validateLeaveRoomRequest(Long roomId, Long userId) {
        validateRoomId(roomId);
        validateUserId(userId);
    }
    
    // === 조회 메서드들 (단일 책임) ===
    
    private List<ChatRoom> findActiveRoomsByUser(Long userId) {
        return chatRoomRepository.findActiveRoomsByUserId(userId);
    }
    
    private ChatRoom findRoomWithPermissionCheck(Long roomId, Long userId) {
        return chatRoomRepository.findRoomByIdAndUserId(roomId, userId)
            .orElseThrow(() -> new AccessDeniedException("채팅방에 접근할 수 없습니다."));
    }
    
    private Optional<ChatRoom> findExistingDirectRoom(Long userId1, Long userId2) {
        return chatRoomRepository.findDirectRoomBetweenUsers(userId1, userId2);
    }
    
    private ChatRoomParticipant findActiveParticipant(Long roomId, Long userId) {
        return participantRepository.findByRoomIdAndUserIdAndIsActive(roomId, userId, true)
            .orElseThrow(() -> new IllegalStateException("참여중이지 않은 채팅방입니다."));
    }
    
    // === 상태 확인 메서드들 (단일 책임) ===
    
    private boolean isDirectRoomRequest(CreateRoomRequest request) {
        return request.getRoomType() == ChatRoom.RoomType.DIRECT && 
               request.getParticipantIds() != null && 
               request.getParticipantIds().size() == 1;
    }
    
    private boolean isUserAlreadyParticipant(Long roomId, Long userId) {
        return participantRepository.existsByRoomIdAndUserIdAndIsActive(roomId, userId, true);
    }
    
    private boolean hasNoActiveParticipants(Long roomId) {
        return participantRepository.countByRoomIdAndIsActive(roomId, true) == 0;
    }
    
    private void validateUserExists(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new IllegalArgumentException("사용자를 찾을 수 없습니다.");
        }
    }
    
    private void validateUserHasRoomPermission(Long roomId, Long userId) {
        if (!participantRepository.existsByRoomIdAndUserIdAndIsActive(roomId, userId, true)) {
            throw new AccessDeniedException("채팅방 접근 권한이 없습니다.");
        }
    }
    
    // === 업데이트 메서드들 (단일 책임) ===
    
    private void updateRoomLastActivity(Long roomId) {
        // Repository에 업데이트 메서드가 있다면 사용, 없다면 엔티티를 통해 처리
        ChatRoom room = chatRoomRepository.findById(roomId).orElse(null);
        if (room != null) {
            room.setUpdatedAt(LocalDateTime.now());
            chatRoomRepository.save(room);
        }
    }
    
    private void deactivateRoom(Long roomId) {
        ChatRoom room = chatRoomRepository.findById(roomId).orElse(null);
        if (room != null) {
            room.deactivate(); // 엔티티의 비즈니스 메서드 사용
            chatRoomRepository.save(room);
        }
    }
    
    // === 시스템 메시지 생성 메서드들 (단일 책임) ===
    
    private void createUserInvitedSystemMessage(Long roomId, Long userId) {
        String userName = getUserName(userId);
        String content = userName + "님이 초대되었습니다.";
        createSystemMessage(roomId, content);
    }
    
    private void createUserLeftSystemMessage(Long roomId, Long userId) {
        String userName = getUserName(userId);
        String content = userName + "님이 채팅방을 나갔습니다.";
        createSystemMessage(roomId, content);
    }
    
    private void createSystemMessage(Long roomId, String content) {
        Message systemMessage = Message.builder()
            .roomId(roomId)
            .senderId(0L) // 시스템 사용자 ID
            .content(content)
            .messageType(Message.MessageType.SYSTEM)
            .build();
        
        messageRepository.save(systemMessage);
    }
    
    // === 유틸리티 메서드들 (단일 책임) ===
    
    private String getUserName(Long userId) {
        return userRepository.findById(userId)
            .map(User::getEmail) // username 대신 email 사용
            .orElse("Unknown User");
    }
    
    private void addRoomCreator(Long roomId, Long userId) {
        addParticipant(roomId, userId);
    }
    
    private void addRoomParticipants(Long roomId, List<Long> participantIds, Long creatorId) {
        if (participantIds != null) {
            participantIds.stream()
                .filter(id -> !id.equals(creatorId))
                .forEach(participantId -> {
                    validateUserExists(participantId);
                    addParticipant(roomId, participantId);
                });
        }
    }
    
    // === DTO 변환 메서드들 (단일 책임) ===
    
    private List<ChatRoomDTO> convertRoomsToDTO(List<ChatRoom> rooms, Long currentUserId) {
        return rooms.stream()
            .map(room -> convertRoomToDTO(room, currentUserId))
            .collect(Collectors.toList());
    }
    
    private ChatRoomDTO convertRoomToDTO(ChatRoom room, Long currentUserId) {
        return ChatRoomDTO.builder()
            .id(room.getId())
            .name(room.getName())
            .description(room.getDescription())
            .roomType(room.getRoomType())
            .participants(getActiveParticipants(room.getId()))
            .lastMessage(getLastMessage(room.getId()))
            .unreadCount(calculateUnreadCount(room.getId(), currentUserId))
            .createdAt(room.getCreatedAt())
            .updatedAt(room.getUpdatedAt())
            .build();
    }
    
    private List<ParticipantDTO> getActiveParticipants(Long roomId) {
        List<ChatRoomParticipant> participants = participantRepository.findActiveParticipantsWithUserInfo(roomId);
        return participants.stream()
            .map(p -> ParticipantDTO.builder()
                .userId(p.getUserId())
                .userName(getUserName(p.getUserId()))
                .email(getUserEmail(p.getUserId()))
                .joinedAt(p.getJoinedAt())
                .lastReadMessageId(p.getLastReadMessageId())
                .build())
            .collect(Collectors.toList());
    }
    
    private String getUserEmail(Long userId) {
        return userRepository.findById(userId)
            .map(User::getEmail)
            .orElse("unknown@example.com");
    }
    
    private MessageDTO getLastMessage(Long roomId) {
        return messageRepository.findLastMessageByRoomId(roomId)
            .map(this::convertMessageToDTO)
            .orElse(null);
    }
    
    private Long calculateUnreadCount(Long roomId, Long userId) {
        ChatRoomParticipant participant = participantRepository
            .findByRoomIdAndUserIdAndIsActive(roomId, userId, true)
            .orElse(null);
        
        if (participant == null) {
            return 0L;
        }
        
        return messageRepository.countUnreadMessages(roomId, participant.getLastReadMessageId());
    }
    
    private MessageDTO convertMessageToDTO(Message message) {
        return MessageDTO.builder()
            .id(message.getId())
            .senderId(message.getSenderId())
            .senderName(message.getSenderId() > 0 ? getUserName(message.getSenderId()) : "System")
            .content(message.getContent())
            .messageType(message.getMessageType())
            .createdAt(message.getCreatedAt())
            .build();
    }
}