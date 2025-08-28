package com.example.apitest.repository;

import com.example.apitest.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
public class UserRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private UserRepository userRepository;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setEmail("test@example.com");
        testUser.setPassword("password123");
        testUser.setRole(User.Role.USER);
        testUser.setStatus(User.Status.APPROVED);
        testUser = entityManager.persistAndFlush(testUser);
    }

    @Test
    void testFindByEmail() {
        Optional<User> found = userRepository.findByEmail("test@example.com");

        assertTrue(found.isPresent());
        assertEquals("test@example.com", found.get().getEmail());
        assertEquals("password123", found.get().getPassword());
    }

    @Test
    void testFindByEmailNotFound() {
        Optional<User> found = userRepository.findByEmail("nonexistent@example.com");

        assertFalse(found.isPresent());
    }

    @Test
    void testExistsByEmail() {
        boolean exists = userRepository.existsByEmail("test@example.com");

        assertTrue(exists);
    }

    @Test
    void testExistsByEmailNotExists() {
        boolean exists = userRepository.existsByEmail("nonexistent@example.com");

        assertFalse(exists);
    }

    @Test
    void testSaveUser() {
        User newUser = new User();
        newUser.setEmail("new@example.com");
        newUser.setPassword("newpassword");
        newUser.setRole(User.Role.ADMIN);
        newUser.setStatus(User.Status.PENDING);

        User saved = userRepository.save(newUser);

        assertNotNull(saved.getId());
        assertEquals("new@example.com", saved.getEmail());
        assertEquals(User.Role.ADMIN, saved.getRole());
        assertEquals(User.Status.PENDING, saved.getStatus());
    }

    @Test
    void testFindAll() {
        User anotherUser = new User();
        anotherUser.setEmail("another@example.com");
        anotherUser.setPassword("password");
        entityManager.persistAndFlush(anotherUser);

        List<User> users = userRepository.findAll();

        assertTrue(users.size() >= 2);
    }

    @Test
    void testUpdateUser() {
        testUser.setStatus(User.Status.REJECTED);
        testUser.setRole(User.Role.ADMIN);

        User updated = userRepository.save(testUser);

        assertEquals(User.Status.REJECTED, updated.getStatus());
        assertEquals(User.Role.ADMIN, updated.getRole());
    }

    @Test
    void testDeleteUser() {
        Long userId = testUser.getId();
        
        userRepository.delete(testUser);
        entityManager.flush();

        Optional<User> deleted = userRepository.findById(userId);
        assertFalse(deleted.isPresent());
    }



}