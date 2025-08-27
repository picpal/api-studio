package com.example.apitest.service;

import com.example.apitest.entity.ApiKey;
import com.example.apitest.entity.User;
import com.example.apitest.repository.ApiKeyRepository;
import com.example.apitest.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class ApiKeyService {
    
    private static final String API_KEY_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int API_KEY_LENGTH = 48;
    private static final SecureRandom random = new SecureRandom();
    
    @Autowired
    private ApiKeyRepository apiKeyRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    /**
     * 새 API 키 생성
     */
    @Transactional
    public ApiKey generateApiKey(Long userId, String keyName, String description, 
                                Set<Long> allowedFolderIds, LocalDateTime expiresAt) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("사용자를 찾을 수 없습니다.");
        }
        
        User user = userOpt.get();
        String keyValue = generateSecureApiKey();
        
        // 중복 체크 (매우 낮은 확률이지만)
        while (apiKeyRepository.existsByKeyValue(keyValue)) {
            keyValue = generateSecureApiKey();
        }
        
        ApiKey apiKey = new ApiKey(keyValue, keyName, user);
        apiKey.setDescription(description);
        apiKey.setAllowedFolderIds(allowedFolderIds);
        
        if (expiresAt != null) {
            apiKey.setExpiresAt(expiresAt);
        }
        
        return apiKeyRepository.save(apiKey);
    }
    
    /**
     * API 키로 사용자 인증 및 권한 확인
     */
    public Optional<ApiKey> validateAndGetApiKey(String keyValue, Long folderId) {
        Optional<ApiKey> apiKeyOpt = apiKeyRepository.findByKeyValueAndIsActiveTrue(keyValue);
        
        if (apiKeyOpt.isEmpty()) {
            return Optional.empty();
        }
        
        ApiKey apiKey = apiKeyOpt.get();
        
        // 만료 체크
        if (apiKey.isExpired()) {
            return Optional.empty();
        }
        
        // 폴더 접근 권한 체크 (folderId가 제공된 경우)
        if (folderId != null && !apiKey.canAccessFolder(folderId)) {
            return Optional.empty();
        }
        
        // 마지막 사용 시간 업데이트는 제거 - Filter 컨텍스트에서 트랜잭션 문제 발생
        // 필요시 Controller 레벨에서 별도 처리
        
        return Optional.of(apiKey);
    }
    
    /**
     * API 키 유효성 검사 (폴더 체크 없이)
     */
    @Transactional
    public Optional<ApiKey> validateApiKey(String keyValue) {
        return validateAndGetApiKey(keyValue, null);
    }
    
    /**
     * 사용자의 모든 API 키 조회
     */
    public List<ApiKey> getUserApiKeys(Long userId) {
        return apiKeyRepository.findByUserIdAndIsActiveTrueOrderByCreatedAtDesc(userId);
    }
    
    /**
     * 사용자 이메일로 API 키 조회
     */
    public List<ApiKey> getApiKeysByUserEmail(String userEmail) {
        return apiKeyRepository.findByUserEmailAndIsActiveTrue(userEmail);
    }
    
    /**
     * 모든 활성 API 키 조회 (관리자용)
     */
    public List<ApiKey> getAllApiKeys() {
        return apiKeyRepository.findByIsActiveTrueOrderByCreatedAtDesc();
    }
    
    /**
     * API 키 삭제 (하드 삭제)
     */
    @Transactional
    public boolean deleteApiKey(Long apiKeyId) {
        Optional<ApiKey> apiKeyOpt = apiKeyRepository.findById(apiKeyId);
        if (apiKeyOpt.isPresent()) {
            apiKeyRepository.deleteById(apiKeyId);
            return true;
        }
        return false;
    }
    
    /**
     * API 키 마지막 사용 시간 업데이트
     */
    @Transactional
    public void updateLastUsedAt(Long apiKeyId) {
        apiKeyRepository.updateLastUsedAt(apiKeyId, LocalDateTime.now());
    }
    
    /**
     * API 키 마지막 사용 시간 업데이트 (비동기 처리용)
     */
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void updateLastUsedAtAsync(Long apiKeyId) {
        apiKeyRepository.updateLastUsedAt(apiKeyId, LocalDateTime.now());
    }
    
    /**
     * 보안 API 키 생성
     */
    private String generateSecureApiKey() {
        StringBuilder sb = new StringBuilder(API_KEY_LENGTH);
        for (int i = 0; i < API_KEY_LENGTH; i++) {
            sb.append(API_KEY_CHARS.charAt(random.nextInt(API_KEY_CHARS.length())));
        }
        return "ak_" + sb.toString(); // API 키 식별을 위한 prefix
    }
    
    /**
     * API 키를 마스킹된 형태로 반환 (보안)
     */
    public String getMaskedApiKey(String apiKey) {
        if (apiKey == null || apiKey.length() < 10) {
            return "****";
        }
        return apiKey.substring(0, 8) + "****" + apiKey.substring(apiKey.length() - 4);
    }
}