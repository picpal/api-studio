package com.example.apitest.repository;

import com.example.apitest.entity.ChatRoom;
import com.example.apitest.entity.ChatRoomParticipant;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;

@DataJpaTest
@DisplayName("ChatRoomRepository 테스트")
class ChatRoomRepositoryTest {
    
    @Autowired
    private TestEntityManager entityManager;
    
    @Autowired
    private ChatRoomRepository chatRoomRepository;
    
    @Autowired
    private ChatRoomParticipantRepository participantRepository;
    
    private Long userId1;
    private Long userId2;
    private ChatRoom directRoom;
    private ChatRoom groupRoom;
    
    @BeforeEach
    void setUp() {
        userId1 = 1L;
        userId2 = 2L;
        
        // DM 채팅방 생성
        directRoom = ChatRoom.builder()
            .name("DM Room")
            .roomType(ChatRoom.RoomType.DIRECT)
            .createdBy(userId1)
            .build();
        entityManager.persist(directRoom);
        
        // 그룹 채팅방 생성
        groupRoom = ChatRoom.builder()
            .name("Group Room")
            .roomType(ChatRoom.RoomType.GROUP)
            .createdBy(userId1)
            .build();
        entityManager.persist(groupRoom);
        
        // 참여자 추가
        ChatRoomParticipant participant1 = ChatRoomParticipant.builder()
            .roomId(directRoom.getId())
            .userId(userId1)
            .build();
        entityManager.persist(participant1);
        
        ChatRoomParticipant participant2 = ChatRoomParticipant.builder()
            .roomId(directRoom.getId())
            .userId(userId2)
            .build();
        entityManager.persist(participant2);
        
        ChatRoomParticipant groupParticipant = ChatRoomParticipant.builder()
            .roomId(groupRoom.getId())
            .userId(userId1)
            .build();
        entityManager.persist(groupParticipant);
        
        entityManager.flush();
    }
    
    @Test
    @DisplayName("사용자가 참여중인 활성 채팅방 목록을 조회할 수 있어야 한다")
    void findActiveRoomsByUserId_ShouldReturnActiveRooms() {
        // Given & When
        List<ChatRoom> rooms = chatRoomRepository.findActiveRoomsByUserId(userId1);
        
        // Then
        assertThat(rooms).hasSize(2);
        assertThat(rooms).extracting(ChatRoom::getName)
            .containsExactlyInAnyOrder("DM Room", "Group Room");
    }
    
    @Test
    @DisplayName("비활성 채팅방은 조회되지 않아야 한다")
    void findActiveRoomsByUserId_ShouldNotReturnInactiveRooms() {
        // Given
        directRoom.setIsActive(false);
        entityManager.merge(directRoom);
        entityManager.flush();
        
        // When
        List<ChatRoom> rooms = chatRoomRepository.findActiveRoomsByUserId(userId1);
        
        // Then
        assertThat(rooms).hasSize(1);
        assertThat(rooms.get(0).getName()).isEqualTo("Group Room");
    }
    
    @Test
    @DisplayName("참여하지 않은 채팅방은 조회되지 않아야 한다")
    void findActiveRoomsByUserId_ShouldNotReturnNonParticipatingRooms() {
        // Given
        Long nonParticipantUserId = 999L;
        
        // When
        List<ChatRoom> rooms = chatRoomRepository.findActiveRoomsByUserId(nonParticipantUserId);
        
        // Then
        assertThat(rooms).isEmpty();
    }
    
    @Test
    @DisplayName("특정 채팅방을 사용자 권한과 함께 조회할 수 있어야 한다")
    void findRoomByIdAndUserId_ShouldReturnRoomWithPermission() {
        // Given & When
        Optional<ChatRoom> room = chatRoomRepository.findRoomByIdAndUserId(directRoom.getId(), userId1);
        
        // Then
        assertThat(room).isPresent();
        assertThat(room.get().getName()).isEqualTo("DM Room");
    }
    
    @Test
    @DisplayName("권한이 없는 사용자는 채팅방을 조회할 수 없어야 한다")
    void findRoomByIdAndUserId_ShouldReturnEmptyForUnauthorizedUser() {
        // Given
        Long unauthorizedUserId = 999L;
        
        // When
        Optional<ChatRoom> room = chatRoomRepository.findRoomByIdAndUserId(directRoom.getId(), unauthorizedUserId);
        
        // Then
        assertThat(room).isEmpty();
    }
    
    @Test
    @DisplayName("두 사용자 간의 DM방을 찾을 수 있어야 한다")
    void findDirectRoomBetweenUsers_ShouldReturnDirectRoom() {
        // Given & When
        Optional<ChatRoom> room = chatRoomRepository.findDirectRoomBetweenUsers(userId1, userId2);
        
        // Then
        assertThat(room).isPresent();
        assertThat(room.get().getRoomType()).isEqualTo(ChatRoom.RoomType.DIRECT);
        assertThat(room.get().getName()).isEqualTo("DM Room");
    }
    
    @Test
    @DisplayName("존재하지 않는 DM방은 조회되지 않아야 한다")
    void findDirectRoomBetweenUsers_ShouldReturnEmptyWhenNoDirectRoom() {
        // Given
        Long userId3 = 3L;
        
        // When
        Optional<ChatRoom> room = chatRoomRepository.findDirectRoomBetweenUsers(userId1, userId3);
        
        // Then
        assertThat(room).isEmpty();
    }
    
    @Test
    @DisplayName("그룹 채팅방은 DM방 검색에서 제외되어야 한다")
    void findDirectRoomBetweenUsers_ShouldNotReturnGroupRoom() {
        // Given
        // userId1이 그룹방에만 참여하고 있는 상황에서
        // DM방 검색을 했을 때 그룹방이 반환되지 않아야 함
        
        // userId2를 그룹방에도 추가
        ChatRoomParticipant groupParticipant2 = ChatRoomParticipant.builder()
            .roomId(groupRoom.getId())
            .userId(userId2)
            .build();
        entityManager.persist(groupParticipant2);
        
        // 기존 DM방 삭제
        directRoom.setIsActive(false);
        entityManager.merge(directRoom);
        entityManager.flush();
        
        // When
        Optional<ChatRoom> room = chatRoomRepository.findDirectRoomBetweenUsers(userId1, userId2);
        
        // Then
        assertThat(room).isEmpty(); // 그룹방은 DM방 검색에서 제외
    }
}