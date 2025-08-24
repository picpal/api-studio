package com.example.apitest.controller;

import com.example.apitest.entity.User;
import com.example.apitest.entity.FolderPermission;
import com.example.apitest.entity.ApiFolder;
import com.example.apitest.repository.UserRepository;
import com.example.apitest.repository.FolderPermissionRepository;
import com.example.apitest.repository.ApiFolderRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = {"http://localhost:3001", "http://localhost:3002"}, allowCredentials = "true")
public class AdminController {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private FolderPermissionRepository folderPermissionRepository;
    
    @Autowired
    private ApiFolderRepository folderRepository;

    // 관리자 권한 체크 helper method
    private boolean isAdmin(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return false;
        
        Optional<User> userOpt = userRepository.findById(userId);
        return userOpt.isPresent() && userOpt.get().getRole() == User.Role.ADMIN;
    }

    // 모든 사용자 목록 조회
    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> getAllUsers(HttpSession session) {
        if (!isAdmin(session)) {
            return ResponseEntity.status(403).build();
        }

        List<User> users = userRepository.findAll();
        List<Map<String, Object>> response = new ArrayList<>();
        
        for (User user : users) {
            Map<String, Object> userMap = new HashMap<>();
            userMap.put("id", user.getId());
            userMap.put("email", user.getEmail());
            userMap.put("role", user.getRole());
            userMap.put("status", user.getStatus());
            userMap.put("createdAt", user.getCreatedAt());
            response.add(userMap);
        }
        
        return ResponseEntity.ok(response);
    }

    // 사용자 승인/거부
    @PutMapping("/users/{userId}/status")
    public ResponseEntity<Map<String, String>> updateUserStatus(
            @PathVariable Long userId,
            @RequestBody Map<String, String> request,
            HttpSession session) {
        
        if (!isAdmin(session)) {
            return ResponseEntity.status(403).body(Map.of("error", "관리자 권한이 필요합니다."));
        }

        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        String status = request.get("status");
        
        try {
            user.setStatus(User.Status.valueOf(status.toUpperCase()));
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "사용자 상태가 업데이트되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "유효하지 않은 상태값입니다."));
        }
    }

    // 사용자 역할 변경
    @PutMapping("/users/{userId}/role")
    public ResponseEntity<Map<String, String>> updateUserRole(
            @PathVariable Long userId,
            @RequestBody Map<String, String> request,
            HttpSession session) {
        
        if (!isAdmin(session)) {
            return ResponseEntity.status(403).body(Map.of("error", "관리자 권한이 필요합니다."));
        }

        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        String role = request.get("role");
        
        try {
            user.setRole(User.Role.valueOf(role.toUpperCase()));
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "사용자 역할이 업데이트되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "유효하지 않은 역할값입니다."));
        }
    }

    // 폴더 권한 부여
    @PostMapping("/folders/{folderId}/permissions")
    public ResponseEntity<Map<String, String>> grantFolderPermission(
            @PathVariable Long folderId,
            @RequestBody Map<String, Object> request,
            HttpSession session) {
        
        if (!isAdmin(session)) {
            return ResponseEntity.status(403).body(Map.of("error", "관리자 권한이 필요합니다."));
        }

        Long userId = ((Number) request.get("userId")).longValue();
        String permission = (String) request.get("permission");

        Optional<User> userOpt = userRepository.findById(userId);
        Optional<ApiFolder> folderOpt = folderRepository.findById(folderId);

        if (userOpt.isEmpty() || folderOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        ApiFolder folder = folderOpt.get();

        // 기존 권한이 있으면 업데이트, 없으면 생성
        Optional<FolderPermission> existingPermission = folderPermissionRepository.findByUserAndFolder(user, folder);
        
        FolderPermission folderPermission;
        if (existingPermission.isPresent()) {
            folderPermission = existingPermission.get();
        } else {
            folderPermission = new FolderPermission(user, folder, null);
        }

        try {
            folderPermission.setPermission(FolderPermission.Permission.valueOf(permission.toUpperCase()));
            folderPermissionRepository.save(folderPermission);
            return ResponseEntity.ok(Map.of("message", "폴더 권한이 설정되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "유효하지 않은 권한값입니다."));
        }
    }

    // 폴더별 권한 목록 조회
    @GetMapping("/folders/{folderId}/permissions")
    public ResponseEntity<List<Map<String, Object>>> getFolderPermissions(
            @PathVariable Long folderId, HttpSession session) {
        
        if (!isAdmin(session)) {
            return ResponseEntity.status(403).build();
        }

        List<FolderPermission> permissions = folderPermissionRepository.findByFolderId(folderId);
        List<Map<String, Object>> response = new ArrayList<>();
        
        for (FolderPermission permission : permissions) {
            Map<String, Object> permissionMap = new HashMap<>();
            permissionMap.put("id", permission.getId());
            permissionMap.put("userId", permission.getUser().getId());
            permissionMap.put("userEmail", permission.getUser().getEmail());
            permissionMap.put("permission", permission.getPermission());
            permissionMap.put("createdAt", permission.getCreatedAt());
            response.add(permissionMap);
        }
        
        return ResponseEntity.ok(response);
    }

    // 폴더 권한 삭제
    @DeleteMapping("/folders/{folderId}/permissions/{userId}")
    public ResponseEntity<Map<String, String>> revokeFolderPermission(
            @PathVariable Long folderId,
            @PathVariable Long userId,
            HttpSession session) {
        
        if (!isAdmin(session)) {
            return ResponseEntity.status(403).body(Map.of("error", "관리자 권한이 필요합니다."));
        }

        Optional<User> userOpt = userRepository.findById(userId);
        Optional<ApiFolder> folderOpt = folderRepository.findById(folderId);

        if (userOpt.isEmpty() || folderOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        ApiFolder folder = folderOpt.get();

        Optional<FolderPermission> existingPermission = folderPermissionRepository.findByUserAndFolder(user, folder);
        
        if (existingPermission.isPresent()) {
            folderPermissionRepository.delete(existingPermission.get());
            return ResponseEntity.ok(Map.of("message", "폴더 권한이 삭제되었습니다."));
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    // 모든 폴더 목록 조회 (관리자용)
    @GetMapping("/folders")
    public ResponseEntity<List<Map<String, Object>>> getAllFolders(HttpSession session) {
        System.out.println("DEBUG: AdminController.getAllFolders called");
        
        if (!isAdmin(session)) {
            System.out.println("DEBUG: User is not admin, returning 403");
            return ResponseEntity.status(403).build();
        }

        List<ApiFolder> folders = folderRepository.findAll();
        System.out.println("DEBUG: Found " + folders.size() + " folders for admin");
        
        List<Map<String, Object>> response = new ArrayList<>();
        
        for (ApiFolder folder : folders) {
            Map<String, Object> folderMap = new HashMap<>();
            folderMap.put("id", folder.getId());
            folderMap.put("name", folder.getName());
            folderMap.put("createdAt", folder.getCreatedAt());
            response.add(folderMap);
        }
        
        System.out.println("DEBUG: Returning " + response.size() + " folders to admin frontend");
        return ResponseEntity.ok(response);
    }
    
    // 임시 비밀번호 재설정 엔드포인트 (보안상 임시로만 사용)
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String newPassword = request.get("password");
        
        if (email == null || newPassword == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "이메일과 비밀번호가 필요합니다."));
        }
        
        try {
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            User user = userOpt.get();
            user.setPasswordSafely(newPassword);
            userRepository.save(user);
            
            return ResponseEntity.ok(Map.of("message", "비밀번호가 성공적으로 변경되었습니다."));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}