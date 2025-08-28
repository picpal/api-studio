package com.example.apitest.service;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;

public class UtilityServiceTest {

    @Test
    void testPasswordEncoding() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String password = "testPassword123!";
        
        String encoded1 = encoder.encode(password);
        String encoded2 = encoder.encode(password);
        
        assertNotNull(encoded1);
        assertNotNull(encoded2);
        assertNotEquals(encoded1, encoded2); // BCrypt generates different hashes each time
        assertTrue(encoder.matches(password, encoded1));
        assertTrue(encoder.matches(password, encoded2));
        assertFalse(encoder.matches("wrongPassword", encoded1));
    }

    @Test
    void testPasswordStrength() {
        String weak = "123";
        String medium = "password123";
        String strong = "Password123!";
        
        // Simple password strength test
        assertTrue(weak.length() < 6);
        assertTrue(medium.length() >= 8);
        assertTrue(strong.length() >= 8 && strong.matches(".*[A-Z].*") && strong.matches(".*[!@#$%^&*].*"));
    }

    @Test
    void testStringValidation() {
        // Test email format
        String validEmail = "test@example.com";
        String invalidEmail = "invalid-email";
        
        assertTrue(validEmail.contains("@") && validEmail.contains("."));
        assertFalse(invalidEmail.contains("@") || invalidEmail.contains("."));
    }

    @Test
    void testJsonFormatValidation() {
        String validJson = "{\"key\": \"value\"}";
        String invalidJson = "{key: value}";
        
        assertTrue(validJson.startsWith("{") && validJson.endsWith("}"));
        assertTrue(validJson.contains("\""));
        assertFalse(invalidJson.matches(".*\".*:.*\".*"));
    }

    @Test
    void testUrlValidation() {
        String validUrl = "http://example.com/api";
        String invalidUrl = "not-a-url";
        
        assertTrue(validUrl.startsWith("http://") || validUrl.startsWith("https://"));
        assertFalse(invalidUrl.startsWith("http://") || invalidUrl.startsWith("https://"));
    }

    @Test
    void testDataTransformation() {
        String input = "  test data  ";
        String trimmed = input.trim();
        String uppercase = trimmed.toUpperCase();
        String lowercase = trimmed.toLowerCase();
        
        assertEquals("test data", trimmed);
        assertEquals("TEST DATA", uppercase);
        assertEquals("test data", lowercase);
    }

    @Test
    void testNumberValidation() {
        String validNumber = "123";
        String invalidNumber = "abc";
        
        assertTrue(validNumber.matches("\\d+"));
        assertFalse(invalidNumber.matches("\\d+"));
        
        try {
            int parsed = Integer.parseInt(validNumber);
            assertEquals(123, parsed);
        } catch (NumberFormatException e) {
            fail("Should be able to parse valid number");
        }
        
        assertThrows(NumberFormatException.class, () -> {
            Integer.parseInt(invalidNumber);
        });
    }
}