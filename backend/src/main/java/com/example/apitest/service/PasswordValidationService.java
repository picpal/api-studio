package com.example.apitest.service;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class PasswordValidationService {
    
    // ISMS 비밀번호 정책 상수
    private static final int MIN_LENGTH = 8;
    private static final int MAX_LENGTH = 20;
    private static final int MIN_CHAR_TYPES = 3;
    
    // 정규식 패턴
    private static final Pattern UPPERCASE = Pattern.compile("[A-Z]");
    private static final Pattern LOWERCASE = Pattern.compile("[a-z]");
    private static final Pattern DIGITS = Pattern.compile("[0-9]");
    private static final Pattern SPECIAL_CHARS = Pattern.compile("[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?]");
    
    public static class ValidationResult {
        private boolean valid;
        private List<String> errors;
        
        public ValidationResult() {
            this.errors = new ArrayList<>();
            this.valid = true;
        }
        
        public void addError(String error) {
            this.errors.add(error);
            this.valid = false;
        }
        
        public boolean isValid() { return valid; }
        public List<String> getErrors() { return errors; }
    }
    
    /**
     * ISMS 규격에 따른 비밀번호 유효성 검증
     */
    public ValidationResult validatePassword(String password, String email) {
        ValidationResult result = new ValidationResult();
        
        if (password == null || password.isEmpty()) {
            result.addError("비밀번호를 입력해주세요.");
            return result;
        }
        
        // 1. 길이 검증 (8-20자)
        if (password.length() < MIN_LENGTH) {
            result.addError("비밀번호는 최소 " + MIN_LENGTH + "자 이상이어야 합니다.");
        }
        if (password.length() > MAX_LENGTH) {
            result.addError("비밀번호는 최대 " + MAX_LENGTH + "자 이하여야 합니다.");
        }
        
        // 2. 문자 조합 검증 (영문 대소문자, 숫자, 특수문자 중 3종류 이상)
        int charTypeCount = 0;
        List<String> missingTypes = new ArrayList<>();
        
        if (UPPERCASE.matcher(password).find()) {
            charTypeCount++;
        } else {
            missingTypes.add("영문 대문자");
        }
        
        if (LOWERCASE.matcher(password).find()) {
            charTypeCount++;
        } else {
            missingTypes.add("영문 소문자");
        }
        
        if (DIGITS.matcher(password).find()) {
            charTypeCount++;
        } else {
            missingTypes.add("숫자");
        }
        
        if (SPECIAL_CHARS.matcher(password).find()) {
            charTypeCount++;
        } else {
            missingTypes.add("특수문자(!@#$%^&*()_+-=[]{};':\"\\|,.<>/?)");
        }
        
        if (charTypeCount < MIN_CHAR_TYPES) {
            result.addError("비밀번호는 영문 대소문자, 숫자, 특수문자 중 " + MIN_CHAR_TYPES + "종류 이상 조합해야 합니다.");
        }
        
        // 3. 연속된 문자/숫자 3개 이상 금지
        if (hasConsecutiveChars(password, 3)) {
            result.addError("연속된 문자나 숫자를 3개 이상 사용할 수 없습니다. (예: abc, 123)");
        }
        
        // 4. 반복된 문자/숫자 3개 이상 금지
        if (hasRepeatingChars(password, 3)) {
            result.addError("같은 문자나 숫자를 3개 이상 반복할 수 없습니다. (예: aaa, 111)");
        }
        
        // 5. 사용자 ID(이메일)와 유사한 비밀번호 금지
        if (email != null && isSimilarToEmail(password, email)) {
            result.addError("비밀번호에 이메일과 유사한 내용을 포함할 수 없습니다.");
        }
        
        // 6. 일반적인 약한 비밀번호 패턴 검증
        if (isCommonWeakPassword(password)) {
            result.addError("너무 단순한 비밀번호입니다. 더 복잡한 비밀번호를 사용해주세요.");
        }
        
        return result;
    }
    
    /**
     * 연속된 문자/숫자 검증
     */
    private boolean hasConsecutiveChars(String password, int maxConsecutive) {
        for (int i = 0; i <= password.length() - maxConsecutive; i++) {
            boolean isConsecutive = true;
            for (int j = 1; j < maxConsecutive; j++) {
                char current = password.charAt(i + j - 1);
                char next = password.charAt(i + j);
                if (next != current + 1) {
                    isConsecutive = false;
                    break;
                }
            }
            if (isConsecutive) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * 반복된 문자 검증
     */
    private boolean hasRepeatingChars(String password, int maxRepeating) {
        for (int i = 0; i <= password.length() - maxRepeating; i++) {
            char firstChar = password.charAt(i);
            boolean isRepeating = true;
            for (int j = 1; j < maxRepeating; j++) {
                if (password.charAt(i + j) != firstChar) {
                    isRepeating = false;
                    break;
                }
            }
            if (isRepeating) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * 이메일과 유사성 검증
     */
    private boolean isSimilarToEmail(String password, String email) {
        String emailLocal = email.toLowerCase().split("@")[0];
        String passwordLower = password.toLowerCase();
        
        // 이메일 로컬 부분이 비밀번호에 포함되어 있으면 유사함
        if (emailLocal.length() >= 3 && passwordLower.contains(emailLocal)) {
            return true;
        }
        
        // 비밀번호가 이메일 로컬 부분에 포함되어 있으면 유사함
        if (password.length() >= 3 && emailLocal.contains(passwordLower)) {
            return true;
        }
        
        return false;
    }
    
    /**
     * 일반적인 약한 비밀번호 패턴 검증
     */
    private boolean isCommonWeakPassword(String password) {
        String[] commonPasswords = {
            "password", "123456", "12345678", "qwerty", "abc123",
            "password123", "admin", "test", "user", "guest",
            "123qwe", "qwe123", "asdf1234", "zxcv1234"
        };
        
        String passwordLower = password.toLowerCase();
        for (String common : commonPasswords) {
            if (passwordLower.equals(common) || passwordLower.contains(common)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * 비밀번호 강도 평가 (선택사항)
     */
    public enum PasswordStrength {
        WEAK, MEDIUM, STRONG, VERY_STRONG
    }
    
    public PasswordStrength evaluatePasswordStrength(String password) {
        int score = 0;
        
        // 길이 점수
        if (password.length() >= 12) score += 2;
        else if (password.length() >= 8) score += 1;
        
        // 문자 종류 점수
        if (UPPERCASE.matcher(password).find()) score += 1;
        if (LOWERCASE.matcher(password).find()) score += 1;
        if (DIGITS.matcher(password).find()) score += 1;
        if (SPECIAL_CHARS.matcher(password).find()) score += 2;
        
        // 복잡성 점수
        if (!hasConsecutiveChars(password, 3)) score += 1;
        if (!hasRepeatingChars(password, 3)) score += 1;
        
        if (score >= 8) return PasswordStrength.VERY_STRONG;
        if (score >= 6) return PasswordStrength.STRONG;
        if (score >= 4) return PasswordStrength.MEDIUM;
        return PasswordStrength.WEAK;
    }
}