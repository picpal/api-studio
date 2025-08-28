package com.example.apitest.service;

import com.example.apitest.entity.User;
import com.example.apitest.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SimpleServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AuthService authService;

    @Test
    void testFindByEmail() {
        User testUser = new User();
        testUser.setEmail("test@example.com");
        
        when(userRepository.findByEmail("test@example.com"))
                .thenReturn(Optional.of(testUser));

        Optional<User> result = authService.findByEmail("test@example.com");

        assertTrue(result.isPresent());
        assertEquals("test@example.com", result.get().getEmail());
        verify(userRepository).findByEmail("test@example.com");
    }

    @Test
    void testPasswordEncoder() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String password = "testPassword123";
        String encoded = encoder.encode(password);
        
        assertNotNull(encoded);
        assertTrue(encoder.matches(password, encoded));
        assertFalse(encoder.matches("wrongPassword", encoded));
    }

    @Test
    void testUserEntity() {
        User user = new User();
        user.setId(1L);
        user.setEmail("test@example.com");
        user.setPassword("password");
        user.setRole(User.Role.USER);
        user.setStatus(User.Status.APPROVED);

        assertEquals(1L, user.getId());
        assertEquals("test@example.com", user.getEmail());
        assertEquals("password", user.getPassword());
        assertEquals(User.Role.USER, user.getRole());
        assertEquals(User.Status.APPROVED, user.getStatus());
    }
}