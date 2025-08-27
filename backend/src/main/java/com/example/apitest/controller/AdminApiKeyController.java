package com.example.apitest.controller;

import com.example.apitest.annotation.RequireAuth;
import com.example.apitest.entity.ApiKey;
import com.example.apitest.entity.User;
import com.example.apitest.service.ApiKeyService;
import com.example.apitest.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/api-keys")
@CrossOrigin(origins = {"http://localhost:3001", "http://localhost:3002"}, allowCredentials = "true")
public class AdminApiKeyController {
    
    @Autowired
    private ApiKeyService apiKeyService;
    
    @Autowired
    private AuthService authService;
    
    /**
     * 모든 API 키 조회 (관리자용)
     */
    @GetMapping
    @RequireAuth(adminOnly = true)
    public ResponseEntity<List<Map<String, Object>>> getAllApiKeys() {
        List<ApiKey> apiKeys = apiKeyService.getAllApiKeys();
        
        List<Map<String, Object>> response = apiKeys.stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
            
        return ResponseEntity.ok(response);
    }
    
    /**
     * 특정 사용자의 API 키 조회
     */
    @GetMapping("/user/{userId}")
    @RequireAuth(adminOnly = true)
    public ResponseEntity<List<Map<String, Object>>> getUserApiKeys(@PathVariable Long userId) {
        List<ApiKey> apiKeys = apiKeyService.getUserApiKeys(userId);
        
        List<Map<String, Object>> response = apiKeys.stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
            
        return ResponseEntity.ok(response);
    }
    
    /**
     * API 키 생성
     */
    @PostMapping
    @RequireAuth(adminOnly = true)
    public ResponseEntity<Map<String, Object>> createApiKey(@RequestBody Map<String, Object> request) {
        try {
            Long userId = ((Number) request.get("userId")).longValue();
            String keyName = (String) request.get("keyName");
            String description = (String) request.get("description");
            
            // 허용된 폴더 ID들
            Set<Long> allowedFolderIds = new HashSet<>();
            if (request.get("allowedFolderIds") != null) {
                @SuppressWarnings("unchecked")
                List<Number> folderIds = (List<Number>) request.get("allowedFolderIds");
                allowedFolderIds = folderIds.stream()
                    .map(Number::longValue)
                    .collect(Collectors.toSet());
            }
            
            // 만료 날짜
            LocalDateTime expiresAt = null;
            if (request.get("expiresAt") != null) {
                String expiresAtStr = (String) request.get("expiresAt");
                expiresAt = LocalDateTime.parse(expiresAtStr);
            }
            
            ApiKey apiKey = apiKeyService.generateApiKey(userId, keyName, description, allowedFolderIds, expiresAt);
            
            Map<String, Object> response = convertToResponse(apiKey);
            // 새로 생성된 API 키는 전체 값을 반환 (한 번만)
            response.put("keyValue", apiKey.getKeyValue());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "API 키 생성 실패: " + e.getMessage()));
        }
    }
    
    /**
     * API 키 삭제 (하드 삭제)
     */
    @DeleteMapping("/{apiKeyId}")
    @RequireAuth(adminOnly = true)
    public ResponseEntity<Map<String, Object>> deleteApiKey(@PathVariable Long apiKeyId) {
        boolean success = apiKeyService.deleteApiKey(apiKeyId);
        
        if (success) {
            return ResponseEntity.ok(Map.of("message", "API 키가 삭제되었습니다."));
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * 사용자 목록 조회 (API 키 생성 시 사용)
     */
    @GetMapping("/users")
    @RequireAuth(adminOnly = true)
    public ResponseEntity<List<Map<String, Object>>> getUsers() {
        List<User> users = authService.getAllUsers();
        
        List<Map<String, Object>> response = users.stream()
            .map(user -> {
                Map<String, Object> userMap = new HashMap<>();
                userMap.put("id", user.getId());
                userMap.put("email", user.getEmail());
                userMap.put("role", user.getRole().toString());
                return userMap;
            })
            .collect(Collectors.toList());
            
        return ResponseEntity.ok(response);
    }
    
    /**
     * ApiKey를 응답 형태로 변환
     */
    private Map<String, Object> convertToResponse(ApiKey apiKey) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", apiKey.getId());
        response.put("keyName", apiKey.getKeyName());
        response.put("description", apiKey.getDescription());
        response.put("maskedKey", apiKeyService.getMaskedApiKey(apiKey.getKeyValue()));
        response.put("isActive", apiKey.getIsActive());
        response.put("createdAt", apiKey.getCreatedAt());
        response.put("expiresAt", apiKey.getExpiresAt());
        response.put("lastUsedAt", apiKey.getLastUsedAt());
        response.put("allowedFolderIds", apiKey.getAllowedFolderIds());
        
        // 사용자 정보
        if (apiKey.getUser() != null) {
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("id", apiKey.getUser().getId());
            userInfo.put("email", apiKey.getUser().getEmail());
            userInfo.put("role", apiKey.getUser().getRole().toString());
            response.put("user", userInfo);
        }
        
        return response;
    }
}