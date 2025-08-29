package com.example.apitest.controller;

import com.example.apitest.annotation.CurrentUser;
import com.example.apitest.dto.ChatRoomDTO;
import com.example.apitest.dto.CreateRoomRequest;
import com.example.apitest.dto.MessageDTO;
import com.example.apitest.dto.SendMessageRequest;
import com.example.apitest.dto.UserDTO;
import com.example.apitest.entity.User;
import com.example.apitest.service.ChatRoomService;
import com.example.apitest.service.MessageService;
import com.example.apitest.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Slf4j
public class MeetingController {

    private final ChatRoomService chatRoomService;
    private final MessageService messageService;
    private final UserService userService;
    private final SimpMessagingTemplate messagingTemplate;

    @GetMapping("/rooms")
    public ResponseEntity<List<ChatRoomDTO>> getUserRooms(@CurrentUser User user) {
        try {
            log.info("사용자 채팅방 목록 조회 요청: userId={}", user.getId());
            List<ChatRoomDTO> rooms = chatRoomService.getUserRooms(user.getId());
            return ResponseEntity.ok(rooms);
        } catch (Exception e) {
            log.error("채팅방 목록 조회 중 오류 발생: userId={}, error={}", user.getId(), e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/rooms/{roomId}")
    public ResponseEntity<ChatRoomDTO> getRoomById(
            @PathVariable Long roomId,
            @CurrentUser User user) {
        try {
            log.info("특정 채팅방 조회 요청: roomId={}, userId={}", roomId, user.getId());
            ChatRoomDTO room = chatRoomService.getRoomById(roomId, user.getId());
            return ResponseEntity.ok(room);
        } catch (AccessDeniedException e) {
            log.warn("채팅방 접근 권한 없음: roomId={}, userId={}", roomId, user.getId());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (IllegalArgumentException e) {
            log.warn("존재하지 않는 채팅방 접근: roomId={}, userId={}", roomId, user.getId());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("채팅방 조회 중 오류 발생: roomId={}, userId={}, error={}", roomId, user.getId(), e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/rooms")
    public ResponseEntity<ChatRoomDTO> createRoom(
            @Valid @RequestBody CreateRoomRequest request,
            BindingResult bindingResult,
            @CurrentUser User user) {
        
        if (bindingResult.hasErrors()) {
            log.warn("채팅방 생성 요청 검증 실패: userId={}, errors={}", user.getId(), bindingResult.getAllErrors());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        try {
            log.info("새 채팅방 생성 요청: userId={}, roomType={}", user.getId(), request.getRoomType());
            ChatRoomDTO room = chatRoomService.createRoom(request, user.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(room);
        } catch (IllegalArgumentException e) {
            log.warn("채팅방 생성 요청 데이터 오류: userId={}, error={}", user.getId(), e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            log.error("채팅방 생성 중 오류 발생: userId={}, error={}", user.getId(), e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/rooms/{roomId}/invite/{targetUserId}")
    public ResponseEntity<String> inviteUser(
            @PathVariable Long roomId,
            @PathVariable Long targetUserId,
            @CurrentUser User user) {
        try {
            log.info("사용자 초대 요청: roomId={}, targetUserId={}, requesterId={}", roomId, targetUserId, user.getId());
            chatRoomService.inviteUser(roomId, targetUserId, user.getId());
            
            // 초대된 사용자에게 실시간으로 채팅방 정보 전송
            ChatRoomDTO updatedRoom = chatRoomService.getRoomById(roomId, targetUserId);
            String targetUserEmail = userService.findById(targetUserId)
                    .map(User::getEmail)
                    .orElse(null);
            
            if (targetUserEmail != null) {
                log.info("초대 알림 전송: targetUserEmail={}, roomId={}", targetUserEmail, roomId);
                messagingTemplate.convertAndSendToUser(
                    targetUserEmail,
                    "/queue/room-invitation",
                    updatedRoom
                );
            }
            
            return ResponseEntity.ok("사용자가 성공적으로 초대되었습니다.");
        } catch (AccessDeniedException e) {
            log.warn("사용자 초대 권한 없음: roomId={}, requesterId={}", roomId, user.getId());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("초대 권한이 없습니다.");
        } catch (IllegalArgumentException e) {
            log.warn("사용자 초대 요청 데이터 오류: roomId={}, targetUserId={}, error={}", roomId, targetUserId, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (IllegalStateException e) {
            log.warn("사용자 초대 상태 오류: roomId={}, targetUserId={}, error={}", roomId, targetUserId, e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (Exception e) {
            log.error("사용자 초대 중 오류 발생: roomId={}, targetUserId={}, requesterId={}, error={}", 
                     roomId, targetUserId, user.getId(), e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("초대 중 오류가 발생했습니다.");
        }
    }

    @PostMapping("/rooms/{roomId}/leave")
    public ResponseEntity<String> leaveRoom(
            @PathVariable Long roomId,
            @CurrentUser User user) {
        try {
            log.info("채팅방 나가기 요청: roomId={}, userId={}", roomId, user.getId());
            chatRoomService.leaveRoom(roomId, user.getId());
            return ResponseEntity.ok("채팅방을 나갔습니다.");
        } catch (IllegalArgumentException e) {
            log.warn("채팅방 나가기 요청 데이터 오류: roomId={}, userId={}, error={}", roomId, user.getId(), e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (IllegalStateException e) {
            log.warn("채팅방 나가기 상태 오류: roomId={}, userId={}, error={}", roomId, user.getId(), e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (Exception e) {
            log.error("채팅방 나가기 중 오류 발생: roomId={}, userId={}, error={}", roomId, user.getId(), e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("나가기 중 오류가 발생했습니다.");
        }
    }

    @GetMapping("/rooms/{roomId}/messages")
    public ResponseEntity<List<MessageDTO>> getRoomMessages(
            @PathVariable Long roomId,
            @CurrentUser User user) {
        try {
            log.info("채팅방 메시지 조회 요청: roomId={}, userId={}", roomId, user.getId());
            List<MessageDTO> messages = messageService.getRoomMessages(roomId, user.getId());
            return ResponseEntity.ok(messages);
        } catch (AccessDeniedException e) {
            log.warn("메시지 조회 권한 없음: roomId={}, userId={}", roomId, user.getId());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (IllegalArgumentException e) {
            log.warn("메시지 조회 요청 데이터 오류: roomId={}, userId={}, error={}", roomId, user.getId(), e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("메시지 조회 중 오류 발생: roomId={}, userId={}, error={}", roomId, user.getId(), e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/rooms/{roomId}/messages")
    public ResponseEntity<MessageDTO> sendMessage(
            @PathVariable Long roomId,
            @Valid @RequestBody SendMessageRequest request,
            BindingResult bindingResult,
            @CurrentUser User user) {
        
        if (bindingResult.hasErrors()) {
            log.warn("메시지 전송 요청 검증 실패: roomId={}, userId={}, errors={}", roomId, user.getId(), bindingResult.getAllErrors());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        try {
            log.info("메시지 전송 요청: roomId={}, userId={}, contentLength={}", roomId, user.getId(), request.getContent().length());
            MessageDTO message = messageService.sendMessage(roomId, request.getContent(), user.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(message);
        } catch (AccessDeniedException e) {
            log.warn("메시지 전송 권한 없음: roomId={}, userId={}", roomId, user.getId());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (IllegalArgumentException e) {
            log.warn("메시지 전송 요청 데이터 오류: roomId={}, userId={}, error={}", roomId, user.getId(), e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            log.error("메시지 전송 중 오류 발생: roomId={}, userId={}, error={}", roomId, user.getId(), e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 채팅 가능한 사용자 목록 조회 (승인된 사용자만, 현재 사용자 제외)
     */
    @GetMapping("/available-users")
    public ResponseEntity<List<UserDTO>> getAvailableUsers(@CurrentUser User currentUser) {
        try {
            log.info("채팅 가능한 사용자 목록 조회: requesterId={}", currentUser.getId());
            List<UserDTO> users = userService.getAvailableUsersForChat(currentUser.getId());
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            log.error("사용자 목록 조회 중 오류 발생: requesterId={}, error={}", currentUser.getId(), e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}