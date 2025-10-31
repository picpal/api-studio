package com.example.apitest.service;

import com.example.apitest.dto.ChatRoomDTO;
import com.example.apitest.dto.CreateRoomRequest;
import com.example.apitest.entity.ChatRoom;
import com.example.apitest.entity.ChatRoomParticipant;
import com.example.apitest.entity.Message;
import com.example.apitest.entity.User;
import com.example.apitest.repository.ChatRoomRepository;
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
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ChatRoomService 테스트")
class ChatRoomServiceTest {

    @InjectMocks
    private ChatRoomService chatRoomService;

    @Mock
    private ChatRoomRepository chatRoomRepository;

    @Mock
    private ChatRoomParticipantRepository participantRepository;

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Mock
    private ChatReadStatusService chatReadStatusService;

    private User testUser1;
    private User testUser2;
    private ChatRoom testRoom;
    private ChatRoomParticipant testParticipant;

    @BeforeEach
    void setUp() {
        testUser1 = new User();
        testUser1.setId(1L);
        testUser1.setEmail("user1@example.com");

        testUser2 = new User();
        testUser2.setId(2L);
        testUser2.setEmail("user2@example.com");

        testRoom = ChatRoom.builder()
            .id(1L)
            .name("Test Room")
            .roomType(ChatRoom.RoomType.GROUP)
            .createdBy(1L)
            .build();

        testParticipant = ChatRoomParticipant.builder()
            .id(1L)
            .roomId(1L)
            .userId(1L)
            .isActive(true)
            .build();
    }

    // === 채팅방 조회 테스트 ===

    @Test
    @DisplayName("사용자의 채팅방 목록을 조회해야 함")
    void shouldGetUserRooms() {
        // given
        Long userId = 1L;
        List<ChatRoom> rooms = Arrays.asList(testRoom);

        when(chatRoomRepository.findActiveRoomsByUserId(userId)).thenReturn(rooms);
        when(participantRepository.findActiveParticipantsWithUserInfo(1L)).thenReturn(Arrays.asList(testParticipant));
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser1));
        when(messageRepository.findFirstByRoomIdAndIsDeletedFalseOrderByCreatedAtDesc(1L)).thenReturn(Optional.empty());
        when(chatReadStatusService.getUnreadMessageCount(1L, userId)).thenReturn(0);

        // when
        List<ChatRoomDTO> result = chatRoomService.getUserRooms(userId);

        // then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo(1L);

        verify(chatRoomRepository).findActiveRoomsByUserId(userId);
    }

    @Test
    @DisplayName("유효하지 않은 사용자 ID로 조회 시 예외가 발생해야 함")
    void shouldThrowExceptionForInvalidUserId() {
        // when & then
        assertThatThrownBy(() -> chatRoomService.getUserRooms(null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("올바르지 않은 사용자 ID입니다.");

        assertThatThrownBy(() -> chatRoomService.getUserRooms(0L))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("올바르지 않은 사용자 ID입니다.");

        assertThatThrownBy(() -> chatRoomService.getUserRooms(-1L))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("올바르지 않은 사용자 ID입니다.");
    }

    @Test
    @DisplayName("특정 채팅방을 권한 체크와 함께 조회해야 함")
    void shouldGetRoomByIdWithPermissionCheck() {
        // given
        Long roomId = 1L;
        Long userId = 1L;

        when(chatRoomRepository.findRoomByIdAndUserId(roomId, userId)).thenReturn(Optional.of(testRoom));
        when(participantRepository.findActiveParticipantsWithUserInfo(roomId)).thenReturn(Arrays.asList(testParticipant));
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser1));
        when(messageRepository.findFirstByRoomIdAndIsDeletedFalseOrderByCreatedAtDesc(roomId)).thenReturn(Optional.empty());
        when(chatReadStatusService.getUnreadMessageCount(roomId, userId)).thenReturn(0);

        // when
        ChatRoomDTO result = chatRoomService.getRoomById(roomId, userId);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);

        verify(chatRoomRepository).findRoomByIdAndUserId(roomId, userId);
    }

    @Test
    @DisplayName("권한이 없는 채팅방 조회 시 예외가 발생해야 함")
    void shouldThrowExceptionWhenAccessingUnauthorizedRoom() {
        // given
        Long roomId = 1L;
        Long userId = 2L;

        when(chatRoomRepository.findRoomByIdAndUserId(roomId, userId)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> chatRoomService.getRoomById(roomId, userId))
            .isInstanceOf(AccessDeniedException.class)
            .hasMessage("채팅방에 접근할 수 없습니다.");

        verify(chatRoomRepository).findRoomByIdAndUserId(roomId, userId);
    }

    // === 채팅방 생성 테스트 ===

    @Test
    @DisplayName("그룹 채팅방을 생성해야 함")
    void shouldCreateGroupRoom() {
        // given
        Long userId = 1L;
        CreateRoomRequest request = new CreateRoomRequest();
        request.setName("New Group");
        request.setDescription("Test Description");
        request.setRoomType(ChatRoom.RoomType.GROUP);
        request.setParticipantIds(Arrays.asList(2L));

        when(chatRoomRepository.save(any(ChatRoom.class))).thenAnswer(invocation -> {
            ChatRoom room = invocation.getArgument(0);
            room.setId(2L);
            return room;
        });
        when(participantRepository.save(any(ChatRoomParticipant.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userRepository.existsById(2L)).thenReturn(true);
        when(participantRepository.findActiveParticipantsWithUserInfo(2L)).thenReturn(Arrays.asList());
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser1));
        when(userRepository.findById(2L)).thenReturn(Optional.of(testUser2));
        when(messageRepository.findFirstByRoomIdAndIsDeletedFalseOrderByCreatedAtDesc(2L)).thenReturn(Optional.empty());
        when(chatReadStatusService.getUnreadMessageCount(anyLong(), anyLong())).thenReturn(0);

        // when
        ChatRoomDTO result = chatRoomService.createRoom(request, userId);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(2L);

        verify(chatRoomRepository).save(any(ChatRoom.class));
        verify(participantRepository, atLeast(2)).save(any(ChatRoomParticipant.class)); // creator + participant
    }

    @Test
    @DisplayName("DM 채팅방을 생성해야 함")
    void shouldCreateDirectRoom() {
        // given
        Long userId = 1L;
        CreateRoomRequest request = new CreateRoomRequest();
        request.setRoomType(ChatRoom.RoomType.DIRECT);
        request.setParticipantIds(Arrays.asList(2L));

        when(chatRoomRepository.findDirectRoomBetweenUsers(userId, 2L)).thenReturn(Optional.empty());
        when(chatRoomRepository.save(any(ChatRoom.class))).thenAnswer(invocation -> {
            ChatRoom room = invocation.getArgument(0);
            room.setId(2L);
            return room;
        });
        when(participantRepository.save(any(ChatRoomParticipant.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userRepository.existsById(2L)).thenReturn(true);
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser1));
        when(userRepository.findById(2L)).thenReturn(Optional.of(testUser2));
        when(participantRepository.findActiveParticipantsWithUserInfo(2L)).thenReturn(Arrays.asList());
        when(messageRepository.findFirstByRoomIdAndIsDeletedFalseOrderByCreatedAtDesc(2L)).thenReturn(Optional.empty());
        when(chatReadStatusService.getUnreadMessageCount(anyLong(), anyLong())).thenReturn(0);

        // when
        ChatRoomDTO result = chatRoomService.createRoom(request, userId);

        // then
        assertThat(result).isNotNull();
        verify(chatRoomRepository).findDirectRoomBetweenUsers(userId, 2L);
        verify(chatRoomRepository).save(any(ChatRoom.class));
    }

    @Test
    @DisplayName("이미 존재하는 DM방이 있으면 새로 생성하지 않고 기존 방을 반환해야 함")
    void shouldReturnExistingDirectRoom() {
        // given
        Long userId = 1L;
        CreateRoomRequest request = new CreateRoomRequest();
        request.setRoomType(ChatRoom.RoomType.DIRECT);
        request.setParticipantIds(Arrays.asList(2L));

        ChatRoom existingRoom = ChatRoom.builder()
            .id(10L)
            .roomType(ChatRoom.RoomType.DIRECT)
            .createdBy(userId)
            .build();

        when(chatRoomRepository.findDirectRoomBetweenUsers(userId, 2L)).thenReturn(Optional.of(existingRoom));
        when(participantRepository.findActiveParticipantsWithUserInfo(10L)).thenReturn(Arrays.asList());
        when(messageRepository.findFirstByRoomIdAndIsDeletedFalseOrderByCreatedAtDesc(10L)).thenReturn(Optional.empty());
        when(chatReadStatusService.getUnreadMessageCount(10L, userId)).thenReturn(0);

        // when
        ChatRoomDTO result = chatRoomService.createRoom(request, userId);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(10L);

        verify(chatRoomRepository).findDirectRoomBetweenUsers(userId, 2L);
        verify(chatRoomRepository, never()).save(any(ChatRoom.class)); // 새로 생성하지 않음
    }

    @Test
    @DisplayName("그룹방 생성 시 이름이 없으면 예외가 발생해야 함")
    void shouldThrowExceptionWhenGroupRoomHasNoName() {
        // given
        Long userId = 1L;
        CreateRoomRequest request = new CreateRoomRequest();
        request.setRoomType(ChatRoom.RoomType.GROUP);
        request.setParticipantIds(Arrays.asList(2L));

        // when & then
        assertThatThrownBy(() -> chatRoomService.createRoom(request, userId))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("그룹 채팅방은 이름이 필요합니다.");
    }

    @Test
    @DisplayName("자기 자신을 참여자로 추가 시 예외가 발생해야 함")
    void shouldThrowExceptionWhenAddingSelfAsParticipant() {
        // given
        Long userId = 1L;
        CreateRoomRequest request = new CreateRoomRequest();
        request.setName("Test Room");
        request.setRoomType(ChatRoom.RoomType.GROUP);
        request.setParticipantIds(Arrays.asList(1L, 2L)); // 자기 자신 포함

        // when & then
        assertThatThrownBy(() -> chatRoomService.createRoom(request, userId))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("자기 자신을 참여자로 추가할 수 없습니다.");
    }

    @Test
    @DisplayName("참여자 수가 100명을 초과하면 예외가 발생해야 함")
    void shouldThrowExceptionWhenTooManyParticipants() {
        // given
        Long userId = 1L;
        CreateRoomRequest request = new CreateRoomRequest();
        request.setName("Test Room");
        request.setRoomType(ChatRoom.RoomType.GROUP);

        List<Long> participants = new ArrayList<>();
        for (long i = 2; i <= 102; i++) {
            participants.add(i);
        }
        request.setParticipantIds(participants);

        // when & then
        assertThatThrownBy(() -> chatRoomService.createRoom(request, userId))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("참여자 수가 너무 많습니다. (최대 100명)");
    }

    // === 참여자 관리 테스트 ===

    @Test
    @DisplayName("채팅방에 사용자를 초대해야 함")
    void shouldInviteUser() {
        // given
        Long roomId = 1L;
        Long targetUserId = 2L;
        Long requesterId = 1L;

        when(participantRepository.existsByRoomIdAndUserIdAndIsActive(roomId, requesterId, true)).thenReturn(true);
        when(userRepository.existsById(targetUserId)).thenReturn(true);
        when(participantRepository.existsByRoomIdAndUserIdAndIsActive(roomId, targetUserId, true)).thenReturn(false);
        when(participantRepository.save(any(ChatRoomParticipant.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userRepository.findById(targetUserId)).thenReturn(Optional.of(testUser2));
        when(messageRepository.save(any(Message.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(chatRoomRepository.findById(roomId)).thenReturn(Optional.of(testRoom));

        // when
        chatRoomService.inviteUser(roomId, targetUserId, requesterId);

        // then
        verify(participantRepository).save(any(ChatRoomParticipant.class));
        verify(messageRepository).save(argThat(msg ->
            msg.getMessageType() == Message.MessageType.SYSTEM
        ));
    }

    @Test
    @DisplayName("이미 참여중인 사용자 초대 시 예외가 발생해야 함")
    void shouldThrowExceptionWhenInvitingExistingParticipant() {
        // given
        Long roomId = 1L;
        Long targetUserId = 2L;
        Long requesterId = 1L;

        when(participantRepository.existsByRoomIdAndUserIdAndIsActive(roomId, requesterId, true)).thenReturn(true);
        when(userRepository.existsById(targetUserId)).thenReturn(true);
        when(participantRepository.existsByRoomIdAndUserIdAndIsActive(roomId, targetUserId, true)).thenReturn(true);

        // when & then
        assertThatThrownBy(() -> chatRoomService.inviteUser(roomId, targetUserId, requesterId))
            .isInstanceOf(IllegalStateException.class)
            .hasMessage("이미 참여중인 사용자입니다.");

        verify(participantRepository, never()).save(any(ChatRoomParticipant.class));
    }

    @Test
    @DisplayName("자기 자신을 초대할 수 없어야 함")
    void shouldNotInviteSelf() {
        // given
        Long roomId = 1L;
        Long userId = 1L;

        // when & then
        assertThatThrownBy(() -> chatRoomService.inviteUser(roomId, userId, userId))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("자기 자신을 초대할 수 없습니다.");

        verifyNoInteractions(participantRepository);
    }

    @Test
    @DisplayName("채팅방을 나가야 함")
    void shouldLeaveRoom() {
        // given
        Long roomId = 1L;
        Long userId = 1L;

        when(participantRepository.findByRoomIdAndUserIdAndIsActive(roomId, userId, true)).thenReturn(Optional.of(testParticipant));
        when(participantRepository.save(any(ChatRoomParticipant.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser1));
        when(messageRepository.save(any(Message.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(participantRepository.countByRoomIdAndIsActive(roomId, true)).thenReturn(0);
        when(chatRoomRepository.findById(roomId)).thenReturn(Optional.of(testRoom));
        doNothing().when(chatReadStatusService).cleanupReadStatusForUser(roomId, userId);
        doNothing().when(chatReadStatusService).cleanupReadStatusForRoom(roomId);

        // when
        chatRoomService.leaveRoom(roomId, userId);

        // then
        verify(participantRepository).save(argThat(participant ->
            !participant.getIsActive()
        ));
        verify(messageRepository).save(argThat(msg ->
            msg.getMessageType() == Message.MessageType.SYSTEM
        ));
    }

    @Test
    @DisplayName("마지막 참여자가 나가면 채팅방이 비활성화되어야 함")
    void shouldDeactivateRoomWhenLastParticipantLeaves() {
        // given
        Long roomId = 1L;
        Long userId = 1L;

        when(participantRepository.findByRoomIdAndUserIdAndIsActive(roomId, userId, true)).thenReturn(Optional.of(testParticipant));
        when(participantRepository.save(any(ChatRoomParticipant.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser1));
        when(messageRepository.save(any(Message.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(participantRepository.countByRoomIdAndIsActive(roomId, true)).thenReturn(0);
        when(chatRoomRepository.findById(roomId)).thenReturn(Optional.of(testRoom));
        when(chatRoomRepository.save(any(ChatRoom.class))).thenAnswer(invocation -> invocation.getArgument(0));
        doNothing().when(chatReadStatusService).cleanupReadStatusForUser(roomId, userId);
        doNothing().when(chatReadStatusService).cleanupReadStatusForRoom(roomId);

        // when
        chatRoomService.leaveRoom(roomId, userId);

        // then
        verify(chatRoomRepository).save(argThat(room ->
            !room.getIsActive()
        ));
        verify(chatReadStatusService).cleanupReadStatusForRoom(roomId);
    }

    // === 검증 테스트 ===

    @Test
    @DisplayName("null 방 ID는 거부되어야 함")
    void shouldRejectNullRoomId() {
        // when & then
        assertThatThrownBy(() -> chatRoomService.getRoomById(null, 1L))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("올바르지 않은 채팅방 ID입니다.");
    }

    @Test
    @DisplayName("null 생성 요청은 거부되어야 함")
    void shouldRejectNullCreateRequest() {
        // when & then
        assertThatThrownBy(() -> chatRoomService.createRoom(null, 1L))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("채팅방 생성 요청이 비어있습니다.");
    }

    @Test
    @DisplayName("채팅방 이름이 100자를 초과하면 예외가 발생해야 함")
    void shouldRejectTooLongRoomName() {
        // given
        Long userId = 1L;
        CreateRoomRequest request = new CreateRoomRequest();
        request.setName("a".repeat(101));
        request.setRoomType(ChatRoom.RoomType.GROUP);
        request.setParticipantIds(Arrays.asList(2L));

        // when & then
        assertThatThrownBy(() -> chatRoomService.createRoom(request, userId))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("채팅방 이름이 너무 깁니다. (최대 100자)");
    }
}
