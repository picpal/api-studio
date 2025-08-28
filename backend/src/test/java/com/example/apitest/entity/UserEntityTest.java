package com.example.apitest.entity;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

public class UserEntityTest {

    @Test
    void testUserCreation() {
        User user = new User();
        user.setId(1L);
        user.setEmail("test@example.com");
        user.setPassword("password123");
        user.setRole(User.Role.USER);
        user.setStatus(User.Status.APPROVED);

        assertEquals(1L, user.getId());
        assertEquals("test@example.com", user.getEmail());
        assertEquals("password123", user.getPassword());
        assertEquals(User.Role.USER, user.getRole());
        assertEquals(User.Status.APPROVED, user.getStatus());
    }

    @Test
    void testUserConstructor() {
        User user = new User("test@example.com", "password123");

        assertEquals("test@example.com", user.getEmail());
        assertEquals("password123", user.getPassword());
    }

    @Test
    void testDefaultValues() {
        User user = new User();

        assertEquals(User.Role.USER, user.getRole());
        assertEquals(User.Status.PENDING, user.getStatus());
        assertEquals(false, user.getForcePasswordChange());
    }

    @Test
    void testUserRoleEnum() {
        assertEquals("ADMIN", User.Role.ADMIN.name());
        assertEquals("USER", User.Role.USER.name());
    }

    @Test
    void testUserStatusEnum() {
        assertEquals("PENDING", User.Status.PENDING.name());
        assertEquals("APPROVED", User.Status.APPROVED.name());
        assertEquals("REJECTED", User.Status.REJECTED.name());
    }

    @Test
    void testPasswordChangeDates() {
        User user = new User();
        LocalDateTime now = LocalDateTime.now();
        
        user.setPasswordChangedAt(now);
        user.setPasswordExpiresAt(now.plusMonths(3));

        assertEquals(now, user.getPasswordChangedAt());
        assertEquals(now.plusMonths(3), user.getPasswordExpiresAt());
    }

    @Test
    void testTimestamps() {
        User user = new User();
        LocalDateTime now = LocalDateTime.now();
        
        user.setCreatedAt(now);
        user.setUpdatedAt(now);

        assertEquals(now, user.getCreatedAt());
        assertEquals(now, user.getUpdatedAt());
    }

    @Test
    void testPreviousPasswords() {
        User user = new User();
        
        user.setPreviousPassword("prev1");
        user.setPreviousPassword2("prev2");

        assertEquals("prev1", user.getPreviousPassword());
        assertEquals("prev2", user.getPreviousPassword2());
    }
}