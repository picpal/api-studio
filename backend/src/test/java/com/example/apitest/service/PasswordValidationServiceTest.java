package com.example.apitest.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class PasswordValidationServiceTest {

    private PasswordValidationService service;

    @BeforeEach
    void setUp() {
        service = new PasswordValidationService();
    }

    // --- validatePassword tests ---

    @Test
    @DisplayName("비밀번호 유효성 검사 - null 또는 빈 비밀번호")
    void validatePassword_nullOrEmpty() {
        PasswordValidationService.ValidationResult result = service.validatePassword(null, "test@example.com");
        assertFalse(result.isValid());
        assertTrue(result.getErrors().contains("비밀번호를 입력해주세요."));

        result = service.validatePassword("", "test@example.com");
        assertFalse(result.isValid());
        assertTrue(result.getErrors().contains("비밀번호를 입력해주세요."));
    }

    @Test
    @DisplayName("비밀번호 유효성 검사 - 길이 부족")
    void validatePassword_tooShort() {
        PasswordValidationService.ValidationResult result = service.validatePassword("short", "test@example.com");
        assertFalse(result.isValid());
        assertTrue(result.getErrors().contains("비밀번호는 최소 8자 이상이어야 합니다."));
    }

    @Test
    @DisplayName("비밀번호 유효성 검사 - 길이 초과")
    void validatePassword_tooLong() {
        PasswordValidationService.ValidationResult result = service.validatePassword("thisisverylongpasswordthatshouldexceedthemaximumlength", "test@example.com");
        assertFalse(result.isValid());
        assertTrue(result.getErrors().contains("비밀번호는 최대 20자 이하여야 합니다."));
    }

    @Test
    @DisplayName("비밀번호 유효성 검사 - 문자 조합 부족 (2종류)")
    void validatePassword_insufficientCharTypes_twoTypes() {
        PasswordValidationService.ValidationResult result = service.validatePassword("password123", "test@example.com"); // lowercase, digits
        assertFalse(result.isValid());
        assertTrue(result.getErrors().contains("비밀번호는 영문 대소문자, 숫자, 특수문자 중 3종류 이상 조합해야 합니다."));
    }

    @Test
    @DisplayName("비밀번호 유효성 검사 - 문자 조합 부족 (1종류)")
    void validatePassword_insufficientCharTypes_oneType() {
        PasswordValidationService.ValidationResult result = service.validatePassword("password", "test@example.com"); // lowercase
        assertFalse(result.isValid());
        assertTrue(result.getErrors().contains("비밀번호는 영문 대소문자, 숫자, 특수문자 중 3종류 이상 조합해야 합니다."));
    }

    @Test
    @DisplayName("비밀번호 유효성 검사 - 연속된 문자/숫자")
    void validatePassword_consecutiveChars() {
        PasswordValidationService.ValidationResult result = service.validatePassword("passwordabc123!@#", "test@example.com");
        assertFalse(result.isValid());
        assertTrue(result.getErrors().contains("연속된 문자나 숫자를 3개 이상 사용할 수 없습니다. (예: abc, 123)"));
    }

    @Test
    @DisplayName("비밀번호 유효성 검사 - 반복된 문자/숫자")
    void validatePassword_repeatingChars() {
        PasswordValidationService.ValidationResult result = service.validatePassword("passwordaaa111!@#", "test@example.com");
        assertFalse(result.isValid());
        assertTrue(result.getErrors().contains("같은 문자나 숫자를 3개 이상 반복할 수 없습니다. (예: aaa, 111)"));
    }

    @Test
    @DisplayName("비밀번호 유효성 검사 - 이메일과 유사")
    void validatePassword_similarToEmail() {
        PasswordValidationService.ValidationResult result = service.validatePassword("mypasswordtest123!", "test@example.com");
        assertFalse(result.isValid());
        assertTrue(result.getErrors().contains("비밀번호에 이메일과 유사한 내용을 포함할 수 없습니다."));

        result = service.validatePassword("test", "test@example.com");
        assertFalse(result.isValid());
        assertTrue(result.getErrors().contains("비밀번호에 이메일과 유사한 내용을 포함할 수 없습니다."));
    }

    @Test
    @DisplayName("비밀번호 유효성 검사 - 일반적인 약한 비밀번호")
    void validatePassword_commonWeakPassword() {
        PasswordValidationService.ValidationResult result = service.validatePassword("password", "user@example.com");
        assertFalse(result.isValid());
        assertTrue(result.getErrors().contains("너무 단순한 비밀번호입니다. 더 복잡한 비밀번호를 사용해주세요."));
    }

    @Test
    @DisplayName("비밀번호 유효성 검사 - 모든 규칙 통과")
    void validatePassword_allRulesPass() {
        PasswordValidationService.ValidationResult result = service.validatePassword("StrongP@ssw0rd123", "user@example.com");
        assertTrue(result.isValid());
        assertTrue(result.getErrors().isEmpty());
    }

    // --- evaluatePasswordStrength tests ---

    @Test
    @DisplayName("비밀번호 강도 평가 - WEAK")
    void evaluatePasswordStrength_weak() {
        assertEquals(PasswordValidationService.PasswordStrength.WEAK, service.evaluatePasswordStrength("short"));
        assertEquals(PasswordValidationService.PasswordStrength.WEAK, service.evaluatePasswordStrength("password"));
    }

    @Test
    @DisplayName("비밀번호 강도 평가 - MEDIUM")
    void evaluatePasswordStrength_medium() {
        assertEquals(PasswordValidationService.PasswordStrength.MEDIUM, service.evaluatePasswordStrength("Pass123!"));
        assertEquals(PasswordValidationService.PasswordStrength.MEDIUM, service.evaluatePasswordStrength("pass123456"));
    }

    @Test
    @DisplayName("비밀번호 강도 평가 - STRONG")
    void evaluatePasswordStrength_strong() {
        assertEquals(PasswordValidationService.PasswordStrength.STRONG, service.evaluatePasswordStrength("StrongP@ss1"));
        assertEquals(PasswordValidationService.PasswordStrength.STRONG, service.evaluatePasswordStrength("MyPassw0rd!"));
    }

    @Test
    @DisplayName("비밀번호 강도 평가 - VERY_STRONG")
    void evaluatePasswordStrength_veryStrong() {
        assertEquals(PasswordValidationService.PasswordStrength.VERY_STRONG, service.evaluatePasswordStrength("VeryStrongP@ssw0rd123"));
        assertEquals(PasswordValidationService.PasswordStrength.VERY_STRONG, service.evaluatePasswordStrength("An0therV3ryStr0ngP@ss!"));
    }
}