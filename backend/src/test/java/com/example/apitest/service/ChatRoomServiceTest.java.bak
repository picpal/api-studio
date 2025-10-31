package com.example.apitest.service;

import com.example.apitest.entity.ChatRoom;
import com.example.apitest.entity.ChatRoomParticipant;
import com.example.apitest.entity.Message;
import com.example.apitest.entity.User;
import com.example.apitest.repository.ChatRoomRepository;
import com.example.apitest.repository.ChatRoomParticipantRepository;
import com.example.apitest.repository.MessageRepository;
import com.example.apitest.repository.UserRepository;
import com.example.apitest.dto.ChatRoomDTO;
import com.example.apitest.dto.CreateRoomRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
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
@DisplayName("ChatRoomService 테스트")
class ChatRoomServiceTest {
    
    @Mock
    private ChatRoomRepository chatRoomRepository;
    
    @Mock
    private ChatRoomParticipantRepository participantRepository;
    
    @Mock
    private MessageRepository messageRepository;
    
    @Mock
    private UserRepository userRepository;
    
    @InjectMocks
    private ChatRoomService chatRoomService;
    
    private Long userId;
    private Long otherUserId;
    private ChatRoom testRoom;
    private ChatRoomParticipant testParticipant;
    private User testUser;
    
    @BeforeEach
    void setUp() {
        userId = 1L;
        otherUserId = 2L;
        
        testUser = new User();
        testUser.setId(userId);
        testUser.setEmail("test@example.com");
        
        testRoom = ChatRoom.builder()
            .id(1L)
            .name("테스트 채팅방")
            .roomType(ChatRoom.RoomType.DIRECT)
            .createdBy(userId)
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .isActive(true)
            .build();
        
        testParticipant = ChatRoomParticipant.builder()
            .id(1L)
            .roomId(testRoom.getId())
            .userId(userId)
            .isActive(true)
            .lastReadMessageId(0L)
            .build();
    }
    
    @Test
    @DisplayName("사용자의 채팅방 목록을 조회할 수 있어야 한다")
    void getUserRooms_ShouldReturnUserRooms() {
        // Given
        List<ChatRoom> rooms = Arrays.asList(testRoom);
        when(chatRoomRepository.findActiveRoomsByUserId(userId)).thenReturn(rooms);
        when(participantRepository.findActiveParticipantsWithUserInfo(testRoom.getId()))
            .thenReturn(Arrays.asList(testParticipant));
        when(messageRepository.findLastMessageByRoomId(testRoom.getId()))
            .thenReturn(Optional.empty());
        when(participantRepository.findByRoomIdAndUserIdAndIsActive(testRoom.getId(), userId, true))
            .thenReturn(Optional.of(testParticipant));
        when(messageRepository.countUnreadMessages(testRoom.getId(), 0L))
            .thenReturn(0L);
        
        // When
        List<ChatRoomDTO> result = chatRoomService.getUserRooms(userId);
        
        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("테스트 채팅방");
        verify(chatRoomRepository).findActiveRoomsByUserId(userId);
    }
    
    @Test
    @DisplayName("잘못된 사용자 ID로 조회 시 예외가 발생해야 한다")
    void getUserRooms_WithInvalidUserId_ShouldThrowException() {
        // Given
        Long invalidUserId = null;
        
        // When & Then
        assertThatThrownBy(() -> chatRoomService.getUserRooms(invalidUserId))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("올바르지 않은 사용자 ID입니다.");
    }
    
    @Test
    @DisplayName("새 DM 채팅방을 생성할 수 있어야 한다")
    void createRoom_DirectRoom_ShouldCreateNewRoom() {
        // Given
        CreateRoomRequest request = CreateRoomRequest.builder()
            .name("DM with User")
            .roomType(ChatRoom.RoomType.DIRECT)
            .participantIds(Arrays.asList(otherUserId))
            .build();
        
        when(chatRoomRepository.findDirectRoomBetweenUsers(userId, otherUserId))
            .thenReturn(Optional.empty());
        when(chatRoomRepository.save(any(ChatRoom.class))).thenReturn(testRoom);
        when(participantRepository.save(any(ChatRoomParticipant.class))).thenReturn(testParticipant);
        when(userRepository.existsById(otherUserId)).thenReturn(true);
        
        // Mock 추가 설정
        when(participantRepository.findActiveParticipantsWithUserInfo(testRoom.getId()))
            .thenReturn(Arrays.asList(testParticipant));
        when(messageRepository.findLastMessageByRoomId(testRoom.getId()))
            .thenReturn(Optional.empty());
        when(participantRepository.findByRoomIdAndUserIdAndIsActive(testRoom.getId(), userId, true))
            .thenReturn(Optional.of(testParticipant));
        when(messageRepository.countUnreadMessages(testRoom.getId(), 0L))
            .thenReturn(0L);
        
        // When
        ChatRoomDTO result = chatRoomService.createRoom(request, userId);
        
        // Then
        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("테스트 채팅방");
        verify(chatRoomRepository).save(any(ChatRoom.class));
        verify(participantRepository, times(2)).save(any(ChatRoomParticipant.class)); // 생성자 + 참여자
    }
    
    @Test
    @DisplayName("이미 존재하는 DM 채팅방이 있으면 기존 방을 반환해야 한다")
    void createRoom_ExistingDirectRoom_ShouldReturnExistingRoom() {
        // Given
        CreateRoomRequest request = CreateRoomRequest.builder()
            .name("DM with User")
            .roomType(ChatRoom.RoomType.DIRECT)
            .participantIds(Arrays.asList(otherUserId))
            .build();
        
        when(chatRoomRepository.findDirectRoomBetweenUsers(userId, otherUserId))
            .thenReturn(Optional.of(testRoom));
        
        // Mock 추가 설정
        when(participantRepository.findActiveParticipantsWithUserInfo(testRoom.getId()))
            .thenReturn(Arrays.asList(testParticipant));
        when(messageRepository.findLastMessageByRoomId(testRoom.getId()))
            .thenReturn(Optional.empty());
        when(participantRepository.findByRoomIdAndUserIdAndIsActive(testRoom.getId(), userId, true))
            .thenReturn(Optional.of(testParticipant));
        when(messageRepository.countUnreadMessages(testRoom.getId(), 0L))
            .thenReturn(0L);
        
        // When
        ChatRoomDTO result = chatRoomService.createRoom(request, userId);
        
        // Then
        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("테스트 채팅방");
        verify(chatRoomRepository, never()).save(any(ChatRoom.class)); // 새로 저장하지 않음
    }
    
    @Test
    @DisplayName("그룹 채팅방을 생성할 수 있어야 한다")
    void createRoom_GroupRoom_ShouldCreateNewRoom() {
        // Given
        CreateRoomRequest request = CreateRoomRequest.builder()
            .name("그룹 채팅방")
            .roomType(ChatRoom.RoomType.GROUP)
            .participantIds(Arrays.asList(otherUserId, 3L))
            .build();
        
        ChatRoom groupRoom = ChatRoom.builder()
            .id(2L)
            .name("그룹 채팅방")
            .roomType(ChatRoom.RoomType.GROUP)
            .createdBy(userId)
            .build();
        
        when(chatRoomRepository.save(any(ChatRoom.class))).thenReturn(groupRoom);
        when(participantRepository.save(any(ChatRoomParticipant.class))).thenReturn(testParticipant);
        when(userRepository.existsById(anyLong())).thenReturn(true);
        
        // Mock 추가 설정
        when(participantRepository.findActiveParticipantsWithUserInfo(groupRoom.getId()))
            .thenReturn(Arrays.asList(testParticipant));
        when(messageRepository.findLastMessageByRoomId(groupRoom.getId()))
            .thenReturn(Optional.empty());
        when(participantRepository.findByRoomIdAndUserIdAndIsActive(groupRoom.getId(), userId, true))
            .thenReturn(Optional.of(testParticipant));
        when(messageRepository.countUnreadMessages(groupRoom.getId(), 0L))
            .thenReturn(0L);
        
        // When
        ChatRoomDTO result = chatRoomService.createRoom(request, userId);
        
        // Then
        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("그룹 채팅방");
        verify(chatRoomRepository).save(any(ChatRoom.class));
        verify(participantRepository, times(3)).save(any(ChatRoomParticipant.class)); // 생성자 + 2명 참여자
    }
    
    @Test
    @DisplayName("잘못된 요청으로 채팅방 생성 시 예외가 발생해야 한다")
    void createRoom_WithInvalidRequest_ShouldThrowException() {
        // Given
        CreateRoomRequest invalidRequest = null;
        
        // When & Then
        assertThatThrownBy(() -> chatRoomService.createRoom(invalidRequest, userId))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("채팅방 생성 요청이 비어있습니다.");
    }
    
    @Test
    @DisplayName("사용자를 채팅방에 초대할 수 있어야 한다")
    void inviteUser_ShouldAddUserToRoom() {
        // Given
        Long targetUserId = 3L;
        when(participantRepository.existsByRoomIdAndUserIdAndIsActive(testRoom.getId(), userId, true))
            .thenReturn(true);
        when(userRepository.existsById(targetUserId)).thenReturn(true);
        when(participantRepository.existsByRoomIdAndUserIdAndIsActive(testRoom.getId(), targetUserId, true))
            .thenReturn(false);
        when(participantRepository.save(any(ChatRoomParticipant.class))).thenReturn(testParticipant);
        when(messageRepository.save(any(Message.class))).thenReturn(mock(Message.class));
        User newUser = new User();
        newUser.setId(targetUserId);
        newUser.setEmail("newuser@test.com");
        when(userRepository.findById(targetUserId)).thenReturn(Optional.of(newUser));
        
        // When
        chatRoomService.inviteUser(testRoom.getId(), targetUserId, userId);
        
        // Then
        verify(participantRepository).save(any(ChatRoomParticipant.class));
        verify(messageRepository).save(any(Message.class)); // 시스템 메시지 생성
    }
    
    @Test
    @DisplayName("권한 없는 사용자가 초대 시도 시 예외가 발생해야 한다")
    void inviteUser_WithoutPermission_ShouldThrowException() {
        // Given
        Long targetUserId = 3L;
        when(participantRepository.existsByRoomIdAndUserIdAndIsActive(testRoom.getId(), userId, true))
            .thenReturn(false);
        
        // When & Then
        assertThatThrownBy(() -> chatRoomService.inviteUser(testRoom.getId(), targetUserId, userId))
            .isInstanceOf(AccessDeniedException.class)
            .hasMessage("채팅방 접근 권한이 없습니다.");
    }
    
    @Test
    @DisplayName("사용자가 채팅방을 나갈 수 있어야 한다")
    void leaveRoom_ShouldDeactivateParticipant() {
        // Given
        when(participantRepository.findByRoomIdAndUserIdAndIsActive(testRoom.getId(), userId, true))
            .thenReturn(Optional.of(testParticipant));
        when(participantRepository.save(any(ChatRoomParticipant.class))).thenReturn(testParticipant);
        when(participantRepository.countByRoomIdAndIsActive(testRoom.getId(), true))
            .thenReturn(1L); // 나간 후에도 다른 참여자가 있음
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(messageRepository.save(any(Message.class))).thenReturn(mock(Message.class));
        
        // When
        chatRoomService.leaveRoom(testRoom.getId(), userId);
        
        // Then
        verify(participantRepository).save(testParticipant);
        assertThat(testParticipant.getIsActive()).isFalse();
        assertThat(testParticipant.getLeftAt()).isNotNull();
        verify(messageRepository).save(any(Message.class)); // 시스템 메시지 생성
    }
    
    @Test
    @DisplayName("마지막 참여자가 나가면 채팅방이 비활성화되어야 한다")
    void leaveRoom_LastParticipant_ShouldDeactivateRoom() {
        // Given
        when(participantRepository.findByRoomIdAndUserIdAndIsActive(testRoom.getId(), userId, true))
            .thenReturn(Optional.of(testParticipant));
        when(participantRepository.save(any(ChatRoomParticipant.class))).thenReturn(testParticipant);
        when(participantRepository.countByRoomIdAndIsActive(testRoom.getId(), true))
            .thenReturn(0L); // 나간 후 참여자 없음
        when(chatRoomRepository.findById(testRoom.getId())).thenReturn(Optional.of(testRoom));
        when(chatRoomRepository.save(any(ChatRoom.class))).thenReturn(testRoom);
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(messageRepository.save(any(Message.class))).thenReturn(mock(Message.class));
        
        // When
        chatRoomService.leaveRoom(testRoom.getId(), userId);
        
        // Then
        verify(chatRoomRepository).save(testRoom);
        assertThat(testRoom.getIsActive()).isFalse();
    }
    
    @Test
    @DisplayName("참여하지 않은 채팅방을 나가려고 하면 예외가 발생해야 한다")
    void leaveRoom_NotParticipating_ShouldThrowException() {
        // Given
        when(participantRepository.findByRoomIdAndUserIdAndIsActive(testRoom.getId(), userId, true))
            .thenReturn(Optional.empty());
        
        // When & Then
        assertThatThrownBy(() -> chatRoomService.leaveRoom(testRoom.getId(), userId))
            .isInstanceOf(IllegalStateException.class)
            .hasMessage("참여중이지 않은 채팅방입니다.");
    }
}