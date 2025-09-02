package com.example.apitest.controller;

import com.example.apitest.annotation.CurrentUser;
import com.example.apitest.dto.MessageDTO;
import com.example.apitest.dto.SendMessageRequest;
import com.example.apitest.entity.Message;
import com.example.apitest.entity.User;
import com.example.apitest.service.AuthService;
import com.example.apitest.service.MessageService;
import com.example.apitest.service.ChatRoomService;
import com.example.apitest.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class ChatWebSocketController {

    private final MessageService messageService;
    private final AuthService authService;
    private final ChatRoomService chatRoomService;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * 채팅방에 메시지 전송
     * 클라이언트는 /app/chat/{roomId}/send 로 메시지를 보냄
     * 모든 구독자에게 /topic/room/{roomId} 로 메시지 브로드캐스트
     */
    @MessageMapping("/chat/{roomId}/send")
    public void sendMessage(@DestinationVariable Long roomId, 
                          SendMessageRequest request,
                          Principal principal) {
        try {
            // Principal에서 사용자 정보 추출
            User user = getUserFromPrincipal(principal);
            
            log.info("WebSocket 메시지 수신: roomId={}, userId={}, email={}, content={}", 
                    roomId, user.getId(), user.getEmail(), request.getContent());
            
            // 메시지 저장
            MessageDTO savedMessage = messageService.sendMessage(roomId, request.getContent(), user.getId());
            
            // 해당 채팅방을 구독하는 모든 클라이언트에게 메시지 전송 (기존 방식 유지)
            messagingTemplate.convertAndSend("/topic/room/" + roomId, savedMessage);
            
            // 채팅방의 모든 참여자에게 개인 큐로 메시지 전송 (시스템 알림용)
            // 현재 채팅방에 접속하지 않은 사용자들에게만 알림 전송
            try {
                var roomInfo = chatRoomService.getRoomById(roomId, user.getId());
                log.info("채팅방 참여자 수: {}, 채팅방 ID: {}", roomInfo.getParticipants().size(), roomId);
                
                for (var participant : roomInfo.getParticipants()) {
                    String participantEmail = getUserEmail(participant.getUserId());
                    if (participantEmail != null && !participantEmail.equals("unknown@example.com")) {
                        // 본인에게는 전송하지 않음
                        if (!participant.getUserId().equals(user.getId())) {
                            // 시스템 알림: 로그인되어 있지만 현재 채팅방에 접속하지 않은 사용자들에게 전송
                            messagingTemplate.convertAndSendToUser(
                                participantEmail,
                                "/queue/notifications",
                                createNotificationMessage(savedMessage, roomInfo.getName())
                            );
                            log.info("시스템 알림 전송: participantEmail={}, messageId={}, roomName={}", 
                                     participantEmail, savedMessage.getId(), roomInfo.getName());
                        }
                    }
                }
            } catch (Exception e) {
                log.error("시스템 알림 전송 중 오류: ", e);
            }
            
            log.info("메시지 브로드캐스트 완료: roomId={}, messageId={}", roomId, savedMessage.getId());
        } catch (Exception e) {
            log.error("WebSocket 메시지 처리 중 오류: ", e);
            // 에러 메시지를 발신자에게만 전송 (user가 null일 수 있으므로 principal 사용)
            messagingTemplate.convertAndSendToUser(
                principal.getName(), 
                "/queue/errors", 
                "메시지 전송 실패: " + e.getMessage()
            );
        }
    }
    
    // Principal에서 User 객체를 추출하는 헬퍼 메서드
    private User getUserFromPrincipal(Principal principal) {
        if (principal == null) {
            log.error("Principal is null");
            throw new IllegalArgumentException("Principal is null");
        }
        
        // Principal이 Authentication 타입인 경우
        if (principal instanceof Authentication) {
            Authentication auth = (Authentication) principal;
            Object principalObj = auth.getPrincipal();
            
            if (principalObj instanceof User) {
                return (User) principalObj;
            }
        }
        
        // SecurityContext에서 가져오기
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof User) {
            return (User) auth.getPrincipal();
        }
        
        // Principal name으로 사용자 조회
        String email = principal.getName();
        if (email != null && !email.contains("@")) {
            // Principal.getName()이 User 객체의 toString()을 반환하는 경우
            log.error("Invalid principal name: {}", email);
            throw new IllegalArgumentException("Cannot extract user from principal");
        }
        
        return authService.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));
    }
    
    private String getUserEmail(Long userId) {
        return userRepository.findById(userId)
            .map(User::getEmail)
            .orElse("unknown@example.com");
    }
    
    // 시스템 알림 메시지 생성
    private java.util.Map<String, Object> createNotificationMessage(MessageDTO message, String roomName) {
        java.util.Map<String, Object> notification = new java.util.HashMap<>();
        notification.put("type", "CHAT_MESSAGE");
        notification.put("roomId", message.getRoomId());
        notification.put("roomName", roomName);
        notification.put("senderName", message.getSenderName());
        notification.put("content", message.getContent());
        notification.put("messageId", message.getId());
        notification.put("timestamp", java.time.LocalDateTime.now());
        return notification;
    }

    /**
     * 사용자가 채팅방에 입장했음을 알림
     */
    @MessageMapping("/chat/{roomId}/join")
    @SendTo("/topic/room/{roomId}")
    public MessageDTO userJoinedRoom(@DestinationVariable Long roomId, 
                                    Principal principal) {
        User user = getUserFromPrincipal(principal);
        log.info("사용자 입장: roomId={}, userId={}, email={}", roomId, user.getId(), user.getEmail());
        
        return MessageDTO.builder()
                .roomId(roomId)
                .senderId(0L)
                .senderName("System")
                .content(user.getEmail() + "님이 입장하셨습니다.")
                .messageType(Message.MessageType.SYSTEM)
                .createdAt(java.time.LocalDateTime.now())
                .build();
    }

    /**
     * 사용자가 채팅방을 나갔음을 알림
     */
    @MessageMapping("/chat/{roomId}/leave")
    @SendTo("/topic/room/{roomId}")
    public MessageDTO userLeftRoom(@DestinationVariable Long roomId, 
                                 Principal principal) {
        User user = getUserFromPrincipal(principal);
        log.info("사용자 퇴장: roomId={}, userId={}, email={}", roomId, user.getId(), user.getEmail());
        
        return MessageDTO.builder()
                .roomId(roomId)
                .senderId(0L)
                .senderName("System")
                .content(user.getEmail() + "님이 퇴장하셨습니다.")
                .messageType(Message.MessageType.SYSTEM)
                .createdAt(java.time.LocalDateTime.now())
                .build();
    }

    /**
     * 타이핑 중 표시
     */
    @MessageMapping("/chat/{roomId}/typing")
    @SendTo("/topic/room/{roomId}/typing")
    public String userTyping(@DestinationVariable Long roomId, 
                            Principal principal) {
        User user = getUserFromPrincipal(principal);
        return user.getEmail();
    }
}