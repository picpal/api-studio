package com.example.apitest.service;

import com.example.apitest.entity.User;
import com.example.apitest.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService 테스트")
class AuthServiceTest {

    @InjectMocks
    private AuthService authService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordValidationService passwordValidationService;

    private BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setPassword(passwordEncoder.encode("ValidPassword123!"));
        testUser.setStatus(User.Status.APPROVED);
        testUser.setPasswordChangedAt(LocalDateTime.now().minusDays(10));
    }

    // === 회원가입 테스트 ===

    @Test
    @DisplayName("정상적으로 회원가입을 할 수 있어야 함")
    void shouldRegisterNewUser() {
        // given
        String email = "newuser@example.com";
        String password = "ValidPassword123!";

        when(userRepository.existsByEmail(email)).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(1L);
            return user;
        });

        // when
        User result = authService.register(email, password);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getEmail()).isEqualTo(email);

        verify(userRepository).existsByEmail(email);
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("이미 존재하는 이메일로 회원가입을 시도하면 예외가 발생해야 함")
    void shouldThrowExceptionWhenEmailAlreadyExists() {
        // given
        String email = "existing@example.com";
        String password = "ValidPassword123!";

        when(userRepository.existsByEmail(email)).thenReturn(true);

        // when & then
        assertThatThrownBy(() -> authService.register(email, password))
            .isInstanceOf(RuntimeException.class)
            .hasMessage("이미 존재하는 이메일입니다.");

        verify(userRepository).existsByEmail(email);
        verify(userRepository, never()).save(any(User.class));
    }

    // === 로그인 테스트 ===

    @Test
    @DisplayName("APPROVED 상태의 사용자는 정상적으로 로그인할 수 있어야 함")
    void shouldLoginApprovedUser() {
        // given
        String email = "test@example.com";
        String password = "ValidPassword123!";

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(testUser));

        // when
        Optional<User> result = authService.login(email, password);

        // then
        assertThat(result).isPresent();
        assertThat(result.get().getEmail()).isEqualTo(email);

        verify(userRepository).findByEmail(email);
    }

    @Test
    @DisplayName("잘못된 비밀번호로 로그인 시 빈 Optional을 반환해야 함")
    void shouldReturnEmptyOptionalForInvalidPassword() {
        // given
        String email = "test@example.com";
        String password = "WrongPassword123!";

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(testUser));

        // when
        Optional<User> result = authService.login(email, password);

        // then
        assertThat(result).isEmpty();
        verify(userRepository).findByEmail(email);
    }

    @Test
    @DisplayName("존재하지 않는 사용자로 로그인 시 빈 Optional을 반환해야 함")
    void shouldReturnEmptyOptionalForNonExistentUser() {
        // given
        String email = "nonexistent@example.com";
        String password = "ValidPassword123!";

        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());

        // when
        Optional<User> result = authService.login(email, password);

        // then
        assertThat(result).isEmpty();
        verify(userRepository).findByEmail(email);
    }

    @Test
    @DisplayName("PENDING 상태의 사용자는 로그인할 수 없어야 함")
    void shouldNotLoginPendingUser() {
        // given
        String email = "pending@example.com";
        String password = "ValidPassword123!";

        User pendingUser = new User();
        pendingUser.setId(2L);
        pendingUser.setEmail(email);
        pendingUser.setPassword(passwordEncoder.encode(password));
        pendingUser.setStatus(User.Status.PENDING);

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(pendingUser));

        // when & then
        assertThatThrownBy(() -> authService.login(email, password))
            .isInstanceOf(RuntimeException.class)
            .hasMessage("계정이 승인 대기 중입니다. 관리자 승인을 기다려주세요.");

        verify(userRepository).findByEmail(email);
    }

    @Test
    @DisplayName("REJECTED 상태의 사용자는 로그인할 수 없어야 함")
    void shouldNotLoginRejectedUser() {
        // given
        String email = "rejected@example.com";
        String password = "ValidPassword123!";

        User rejectedUser = new User();
        rejectedUser.setId(3L);
        rejectedUser.setEmail(email);
        rejectedUser.setPassword(passwordEncoder.encode(password));
        rejectedUser.setStatus(User.Status.REJECTED);

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(rejectedUser));

        // when & then
        assertThatThrownBy(() -> authService.login(email, password))
            .isInstanceOf(RuntimeException.class)
            .hasMessage("계정이 거부되었습니다. 관리자에게 문의하세요.");

        verify(userRepository).findByEmail(email);
    }

    @Test
    @DisplayName("비밀번호가 만료된 사용자는 로그인할 수 없어야 함")
    void shouldNotLoginExpiredPasswordUser() {
        // given
        String email = "expired@example.com";
        String password = "ValidPassword123!";

        User expiredUser = new User();
        expiredUser.setId(4L);
        expiredUser.setEmail(email);
        expiredUser.setPassword(passwordEncoder.encode(password));
        expiredUser.setStatus(User.Status.APPROVED);
        expiredUser.setPasswordChangedAt(LocalDateTime.now().minusDays(100)); // 90일 이상 경과

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(expiredUser));

        // when & then
        assertThatThrownBy(() -> authService.login(email, password))
            .isInstanceOf(RuntimeException.class)
            .hasMessage("비밀번호가 만료되었습니다. 비밀번호를 변경해주세요.");

        verify(userRepository).findByEmail(email);
    }

    @Test
    @DisplayName("강제 비밀번호 변경 플래그가 설정된 사용자는 로그인할 수 없어야 함")
    void shouldNotLoginForcedPasswordChangeUser() {
        // given
        String email = "forced@example.com";
        String password = "ValidPassword123!";

        User forcedChangeUser = new User();
        forcedChangeUser.setId(5L);
        forcedChangeUser.setEmail(email);
        forcedChangeUser.setPassword(passwordEncoder.encode(password));
        forcedChangeUser.setStatus(User.Status.APPROVED);
        forcedChangeUser.setForcePasswordChange(true);
        forcedChangeUser.setPasswordChangedAt(LocalDateTime.now());

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(forcedChangeUser));

        // when & then
        assertThatThrownBy(() -> authService.login(email, password))
            .isInstanceOf(RuntimeException.class)
            .hasMessage("비밀번호가 만료되었습니다. 비밀번호를 변경해주세요.");

        verify(userRepository).findByEmail(email);
    }

    // === 이메일로 사용자 조회 테스트 ===

    @Test
    @DisplayName("이메일로 사용자를 조회해야 함")
    void shouldFindUserByEmail() {
        // given
        String email = "test@example.com";
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(testUser));

        // when
        Optional<User> result = authService.findByEmail(email);

        // then
        assertThat(result).isPresent();
        assertThat(result.get().getEmail()).isEqualTo(email);

        verify(userRepository).findByEmail(email);
    }

    @Test
    @DisplayName("존재하지 않는 이메일로 조회 시 빈 Optional을 반환해야 함")
    void shouldReturnEmptyOptionalForNonExistentEmail() {
        // given
        String email = "nonexistent@example.com";
        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());

        // when
        Optional<User> result = authService.findByEmail(email);

        // then
        assertThat(result).isEmpty();
        verify(userRepository).findByEmail(email);
    }

    // === 비밀번호 변경 테스트 ===

    @Test
    @DisplayName("정상적으로 비밀번호를 변경할 수 있어야 함")
    void shouldChangePassword() {
        // given
        String email = "test@example.com";
        String oldPassword = "ValidPassword123!";
        String newPassword = "NewValidPassword456!";

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        authService.changePassword(email, oldPassword, newPassword);

        // then
        verify(userRepository).findByEmail(email);
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("현재 비밀번호가 틀린 경우 비밀번호 변경에 실패해야 함")
    void shouldFailToChangePasswordWithWrongOldPassword() {
        // given
        String email = "test@example.com";
        String oldPassword = "WrongPassword123!";
        String newPassword = "NewValidPassword456!";

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(testUser));

        // when & then
        assertThatThrownBy(() -> authService.changePassword(email, oldPassword, newPassword))
            .isInstanceOf(RuntimeException.class)
            .hasMessage("현재 비밀번호가 올바르지 않습니다.");

        verify(userRepository).findByEmail(email);
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("존재하지 않는 사용자의 비밀번호 변경 시 예외가 발생해야 함")
    void shouldThrowExceptionWhenChangingPasswordForNonExistentUser() {
        // given
        String email = "nonexistent@example.com";
        String oldPassword = "ValidPassword123!";
        String newPassword = "NewValidPassword456!";

        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> authService.changePassword(email, oldPassword, newPassword))
            .isInstanceOf(RuntimeException.class)
            .hasMessage("사용자를 찾을 수 없습니다.");

        verify(userRepository).findByEmail(email);
        verify(userRepository, never()).save(any(User.class));
    }

    // === 강제 비밀번호 변경 테스트 ===

    @Test
    @DisplayName("관리자가 강제로 비밀번호 변경을 요청할 수 있어야 함")
    void shouldForcePasswordChange() {
        // given
        String email = "test@example.com";

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        authService.forcePasswordChange(email);

        // then
        verify(userRepository).findByEmail(email);
        verify(userRepository).save(argThat(user ->
            user.getForcePasswordChange() != null && user.getForcePasswordChange()
        ));
    }

    @Test
    @DisplayName("존재하지 않는 사용자에게 강제 비밀번호 변경 시 예외가 발생해야 함")
    void shouldThrowExceptionWhenForcingPasswordChangeForNonExistentUser() {
        // given
        String email = "nonexistent@example.com";

        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> authService.forcePasswordChange(email))
            .isInstanceOf(RuntimeException.class)
            .hasMessage("사용자를 찾을 수 없습니다.");

        verify(userRepository).findByEmail(email);
        verify(userRepository, never()).save(any(User.class));
    }

    // === 비밀번호 만료 확인 테스트 ===

    @Test
    @DisplayName("비밀번호가 만료된 사용자는 true를 반환해야 함")
    void shouldReturnTrueForExpiredPassword() {
        // given
        String email = "expired@example.com";

        User expiredUser = new User();
        expiredUser.setId(4L);
        expiredUser.setEmail(email);
        expiredUser.setPasswordChangedAt(LocalDateTime.now().minusDays(100)); // 90일 이상 경과

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(expiredUser));

        // when
        boolean result = authService.isPasswordExpired(email);

        // then
        assertThat(result).isTrue();
        verify(userRepository).findByEmail(email);
    }

    @Test
    @DisplayName("강제 비밀번호 변경 플래그가 설정된 사용자는 true를 반환해야 함")
    void shouldReturnTrueForForcedPasswordChange() {
        // given
        String email = "forced@example.com";

        User forcedUser = new User();
        forcedUser.setId(5L);
        forcedUser.setEmail(email);
        forcedUser.setForcePasswordChange(true);
        forcedUser.setPasswordChangedAt(LocalDateTime.now());

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(forcedUser));

        // when
        boolean result = authService.isPasswordExpired(email);

        // then
        assertThat(result).isTrue();
        verify(userRepository).findByEmail(email);
    }

    @Test
    @DisplayName("비밀번호가 만료되지 않은 사용자는 false를 반환해야 함")
    void shouldReturnFalseForValidPassword() {
        // given
        String email = "test@example.com";

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(testUser));

        // when
        boolean result = authService.isPasswordExpired(email);

        // then
        assertThat(result).isFalse();
        verify(userRepository).findByEmail(email);
    }

    @Test
    @DisplayName("존재하지 않는 사용자의 비밀번호 만료 확인 시 false를 반환해야 함")
    void shouldReturnFalseForNonExistentUser() {
        // given
        String email = "nonexistent@example.com";

        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());

        // when
        boolean result = authService.isPasswordExpired(email);

        // then
        assertThat(result).isFalse();
        verify(userRepository).findByEmail(email);
    }

    // === 모든 사용자 조회 테스트 ===

    @Test
    @DisplayName("모든 사용자를 조회할 수 있어야 함")
    void shouldGetAllUsers() {
        // given
        User user1 = new User();
        user1.setId(1L);
        user1.setEmail("user1@example.com");

        User user2 = new User();
        user2.setId(2L);
        user2.setEmail("user2@example.com");

        List<User> allUsers = Arrays.asList(user1, user2);

        when(userRepository.findAll()).thenReturn(allUsers);

        // when
        List<User> result = authService.getAllUsers();

        // then
        assertThat(result).hasSize(2);
        assertThat(result).containsExactly(user1, user2);

        verify(userRepository).findAll();
    }

    @Test
    @DisplayName("사용자가 없는 경우 빈 목록을 반환해야 함")
    void shouldReturnEmptyListWhenNoUsers() {
        // given
        when(userRepository.findAll()).thenReturn(Arrays.asList());

        // when
        List<User> result = authService.getAllUsers();

        // then
        assertThat(result).isEmpty();
        verify(userRepository).findAll();
    }
}
