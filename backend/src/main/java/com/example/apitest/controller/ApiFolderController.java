package com.example.apitest.controller;

import com.example.apitest.entity.ApiFolder;
import com.example.apitest.entity.User;
import com.example.apitest.entity.UserActivity;
import com.example.apitest.entity.FolderPermission;
import com.example.apitest.repository.ApiFolderRepository;
import com.example.apitest.repository.FolderPermissionRepository;
import com.example.apitest.service.ActivityLoggingService;
import com.example.apitest.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/folders")
@CrossOrigin(origins = {"http://localhost:3001", "http://localhost:3002", "http://localhost:3003"}, allowCredentials = "true")
public class ApiFolderController {

    @Autowired
    private ApiFolderRepository folderRepository;
    
    @Autowired
    private FolderPermissionRepository folderPermissionRepository;
    
    @Autowired
    private ActivityLoggingService activityLoggingService;
    
    @Autowired
    private AuthService authService;
    
    /**
     * 현재 로그인한 사용자 정보 가져오기
     */
    private User getCurrentUser(HttpSession session) {
        String userEmail = (String) session.getAttribute("userEmail");
        if (userEmail != null) {
            Optional<User> userOpt = authService.findByEmail(userEmail);
            return userOpt.orElse(null);
        }
        return null;
    }
    
    /**
     * 사용자가 폴더에 대한 특정 권한을 가지고 있는지 확인
     */
    private boolean hasPermission(User user, ApiFolder folder, FolderPermission.Permission requiredPermission) {
        if (user == null) return false;
        
        // 관리자는 모든 권한을 가짐
        if (user.getRole() == User.Role.ADMIN) {
            return true;
        }
        
        Optional<FolderPermission> permission = folderPermissionRepository.findByUserAndFolder(user, folder);
        if (permission.isEmpty()) {
            return false;
        }
        
        FolderPermission.Permission userPermission = permission.get().getPermission();
        
        // 권한 계층: ADMIN > WRITE > READ
        switch (requiredPermission) {
            case READ:
                return userPermission == FolderPermission.Permission.READ || 
                       userPermission == FolderPermission.Permission.WRITE ||
                       userPermission == FolderPermission.Permission.ADMIN;
            case WRITE:
                return userPermission == FolderPermission.Permission.WRITE ||
                       userPermission == FolderPermission.Permission.ADMIN;
            case ADMIN:
                return userPermission == FolderPermission.Permission.ADMIN;
            default:
                return false;
        }
    }

    @GetMapping
    public List<ApiFolder> getAllFolders(HttpSession session) {
        User currentUser = getCurrentUser(session);
        if (currentUser == null) {
            System.out.println("DEBUG: No current user found");
            return List.of(); // 로그인하지 않은 사용자에게는 빈 목록 반환
        }
        
        System.out.println("DEBUG: Current user: " + currentUser.getEmail() + ", Role: " + currentUser.getRole());
        
        List<ApiFolder> allFolders = folderRepository.findAll();
        System.out.println("DEBUG: Total folders in DB: " + allFolders.size());
        
        // 관리자는 모든 폴더를 볼 수 있음
        if (currentUser.getRole() == User.Role.ADMIN) {
            System.out.println("DEBUG: User is admin, returning all folders");
            return allFolders;
        }
        
        // 일반 사용자는 권한이 있는 폴더만 볼 수 있음
        List<ApiFolder> permittedFolders = allFolders.stream()
                .filter(folder -> {
                    boolean hasAccess = hasPermission(currentUser, folder, FolderPermission.Permission.READ);
                    System.out.println("DEBUG: Folder '" + folder.getName() + "' access for user " + currentUser.getEmail() + ": " + hasAccess);
                    return hasAccess;
                })
                .toList();
        
        System.out.println("DEBUG: User has access to " + permittedFolders.size() + " folders");
        return permittedFolders;
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiFolder> getFolder(@PathVariable Long id, HttpSession session) {
        User currentUser = getCurrentUser(session);
        if (currentUser == null) {
            return ResponseEntity.status(401).build();
        }
        
        Optional<ApiFolder> folderOpt = folderRepository.findById(id);
        if (folderOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        ApiFolder folder = folderOpt.get();
        if (!hasPermission(currentUser, folder, FolderPermission.Permission.READ)) {
            return ResponseEntity.status(403).build();
        }
        
        return ResponseEntity.ok(folder);
    }

    @PostMapping
    public ResponseEntity<ApiFolder> createFolder(@RequestBody ApiFolder folder, HttpSession session, HttpServletRequest request) {
        try {
            User currentUser = getCurrentUser(session);
            
            // 로그인한 사용자만 폴더 생성 가능
            if (currentUser == null) {
                return ResponseEntity.status(401).build();
            }
            
            ApiFolder savedFolder = folderRepository.save(folder);
            
            // 폴더 생성자에게 자동으로 ADMIN 권한 부여 (관리자가 아닌 경우)
            if (currentUser.getRole() != User.Role.ADMIN) {
                FolderPermission permission = new FolderPermission(currentUser, savedFolder, FolderPermission.Permission.ADMIN);
                folderPermissionRepository.save(permission);
            }
            
            // 폴더 생성 로깅
            activityLoggingService.logFolderCreate(currentUser, savedFolder.getName(), 
                request.getRequestURI(), request.getMethod());
            
            return ResponseEntity.ok(savedFolder);
        } catch (Exception e) {
            // 실패 로깅
            User currentUser = getCurrentUser(session);
            if (currentUser != null) {
                activityLoggingService.logCrudFailure(currentUser, UserActivity.ActivityType.FOLDER_CREATE,
                    "폴더 생성 실패: " + (folder != null ? folder.getName() : "unknown"), 
                    e.getMessage(), request.getRequestURI(), request.getMethod());
            }
            throw e;
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiFolder> updateFolder(@PathVariable Long id, @RequestBody ApiFolder folderDetails, 
                                                 HttpSession session, HttpServletRequest request) {
        try {
            User currentUser = getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(401).build();
            }
            
            Optional<ApiFolder> folderOpt = folderRepository.findById(id);
            if (folderOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            ApiFolder folder = folderOpt.get();
            if (!hasPermission(currentUser, folder, FolderPermission.Permission.WRITE)) {
                return ResponseEntity.status(403).build();
            }
            
            String oldName = folder.getName();
            if (folderDetails.getName() != null) {
                folder.setName(folderDetails.getName());
            }
            folder.setExpanded(folderDetails.isExpanded());
            ApiFolder savedFolder = folderRepository.save(folder);
            
            // 폴더 수정 로깅
            if (currentUser != null) {
                activityLoggingService.logFolderUpdate(currentUser, 
                    savedFolder.getName() + (oldName.equals(savedFolder.getName()) ? "" : " (이전: " + oldName + ")"),
                    request.getRequestURI(), request.getMethod());
            }
            
            return ResponseEntity.ok(savedFolder);
        } catch (Exception e) {
            // 실패 로깅
            User currentUser = getCurrentUser(session);
            if (currentUser != null) {
                activityLoggingService.logCrudFailure(currentUser, UserActivity.ActivityType.FOLDER_UPDATE,
                    "폴더 수정 실패 (ID: " + id + ")", 
                    e.getMessage(), request.getRequestURI(), request.getMethod());
            }
            throw e;
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteFolder(@PathVariable Long id, HttpSession session, HttpServletRequest request) {
        try {
            User currentUser = getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(401).build();
            }
            
            Optional<ApiFolder> folderOpt = folderRepository.findById(id);
            if (folderOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            ApiFolder folder = folderOpt.get();
            
            // 폴더 삭제는 관리자만 가능 (또는 ADMIN 권한 보유자)
            if (!hasPermission(currentUser, folder, FolderPermission.Permission.ADMIN) && 
                currentUser.getRole() != User.Role.ADMIN) {
                return ResponseEntity.status(403).build();
            }
            
            String folderName = folder.getName();
            folderRepository.delete(folder);
            
            // 폴더 삭제 로깅
            if (currentUser != null) {
                activityLoggingService.logFolderDelete(currentUser, folderName,
                    request.getRequestURI(), request.getMethod());
            }
            
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            // 실패 로깅
            User currentUser = getCurrentUser(session);
            if (currentUser != null) {
                activityLoggingService.logCrudFailure(currentUser, UserActivity.ActivityType.FOLDER_DELETE,
                    "폴더 삭제 실패 (ID: " + id + ")", 
                    e.getMessage(), request.getRequestURI(), request.getMethod());
            }
            throw e;
        }
    }
}