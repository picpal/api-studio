package com.example.apitest.service;

import com.example.apitest.dto.UserDTO;
import com.example.apitest.entity.User;
import com.example.apitest.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserService 테스트")
class UserServiceTest {

    @InjectMocks
    private UserService userService;

    @Mock
    private UserRepository userRepository;

    private User testUser1;
    private User testUser2;
    private User testUser3;

    @BeforeEach
    void setUp() {
        testUser1 = new User();
        testUser1.setId(1L);
        testUser1.setEmail("user1@example.com");
        testUser1.setRole(User.Role.USER);
        testUser1.setStatus(User.Status.APPROVED);
        testUser1.setCreatedAt(LocalDateTime.now());

        testUser2 = new User();
        testUser2.setId(2L);
        testUser2.setEmail("user2@example.com");
        testUser2.setRole(User.Role.USER);
        testUser2.setStatus(User.Status.APPROVED);
        testUser2.setCreatedAt(LocalDateTime.now());

        testUser3 = new User();
        testUser3.setId(3L);
        testUser3.setEmail("pending@example.com");
        testUser3.setRole(User.Role.USER);
        testUser3.setStatus(User.Status.PENDING);
        testUser3.setCreatedAt(LocalDateTime.now());
    }

    @Test
    @DisplayName("채팅 가능한 사용자 목록을 조회해야 함")
    void shouldGetAvailableUsersForChat() {
        // given
        Long currentUserId = 1L;
        List<User> allUsers = Arrays.asList(testUser1, testUser2, testUser3);

        when(userRepository.findAll()).thenReturn(allUsers);

        // when
        List<UserDTO> result = userService.getAvailableUsersForChat(currentUserId);

        // then
        assertThat(result).hasSize(1); // testUser2만 포함 (현재 사용자 제외, APPROVED만)
        assertThat(result.get(0).getId()).isEqualTo(2L);
        assertThat(result.get(0).getEmail()).isEqualTo("user2@example.com");
        assertThat(result.get(0).getStatus()).isEqualTo(User.Status.APPROVED);

        verify(userRepository).findAll();
    }


    @Test
    @DisplayName("사용자가 없는 경우 빈 목록을 반환해야 함")
    void shouldReturnEmptyListWhenNoUsers() {
        // given
        Long currentUserId = 1L;
        when(userRepository.findAll()).thenReturn(Arrays.asList(testUser1));

        // when
        List<UserDTO> result = userService.getAvailableUsersForChat(currentUserId);

        // then
        assertThat(result).isEmpty();
        verify(userRepository).findAll();
    }

    @Test
    @DisplayName("다수의 APPROVED 사용자가 있는 경우 모두 조회해야 함")
    void shouldReturnMultipleApprovedUsers() {
        // given
        Long currentUserId = 1L;

        User user4 = new User();
        user4.setId(4L);
        user4.setEmail("user4@example.com");
        user4.setRole(User.Role.USER);
        user4.setStatus(User.Status.APPROVED);
        user4.setCreatedAt(LocalDateTime.now());

        User user5 = new User();
        user5.setId(5L);
        user5.setEmail("user5@example.com");
        user5.setRole(User.Role.USER);
        user5.setStatus(User.Status.APPROVED);
        user5.setCreatedAt(LocalDateTime.now());

        List<User> allUsers = Arrays.asList(testUser1, testUser2, user4, user5);

        when(userRepository.findAll()).thenReturn(allUsers);

        // when
        List<UserDTO> result = userService.getAvailableUsersForChat(currentUserId);

        // then
        assertThat(result).hasSize(3); // user2, user4, user5
        verify(userRepository).findAll();
    }

    @Test
    @DisplayName("ID로 사용자를 조회해야 함")
    void shouldFindUserById() {
        // given
        Long userId = 1L;
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser1));

        // when
        Optional<User> result = userService.findById(userId);

        // then
        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(userId);
        assertThat(result.get().getEmail()).isEqualTo("user1@example.com");

        verify(userRepository).findById(userId);
    }

    @Test
    @DisplayName("존재하지 않는 ID로 조회 시 빈 Optional을 반환해야 함")
    void shouldReturnEmptyOptionalWhenUserNotFound() {
        // given
        Long userId = 999L;
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        // when
        Optional<User> result = userService.findById(userId);

        // then
        assertThat(result).isEmpty();
        verify(userRepository).findById(userId);
    }


    @Test
    @DisplayName("ADMIN 역할 사용자도 APPROVED 상태면 채팅 가능 목록에 포함되어야 함")
    void shouldIncludeApprovedAdminUsers() {
        // given
        Long currentUserId = 1L;

        User adminUser = new User();
        adminUser.setId(10L);
        adminUser.setEmail("admin@example.com");
        adminUser.setRole(User.Role.ADMIN);
        adminUser.setStatus(User.Status.APPROVED);
        adminUser.setCreatedAt(LocalDateTime.now());

        List<User> allUsers = Arrays.asList(testUser1, adminUser);

        when(userRepository.findAll()).thenReturn(allUsers);

        // when
        List<UserDTO> result = userService.getAvailableUsersForChat(currentUserId);

        // then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo(10L);
        assertThat(result.get(0).getRole()).isEqualTo(User.Role.ADMIN);

        verify(userRepository).findAll();
    }
}
