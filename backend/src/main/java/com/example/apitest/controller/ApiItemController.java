package com.example.apitest.controller;

import com.example.apitest.entity.User;
import com.example.apitest.entity.UserActivity;
import com.example.apitest.service.ApiItemService;
import com.example.apitest.service.ActivityLoggingService;
import com.example.apitest.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/items")
@CrossOrigin(origins = {"http://localhost:3001", "http://localhost:3003"}, allowCredentials = "true")
public class ApiItemController {

    @Autowired
    private ApiItemService apiItemService;
    
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
    

    @GetMapping
    public List<Map<String, Object>> getAllItems() {
        return apiItemService.getAllItems();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getItem(@PathVariable Long id) {
        return apiItemService.getItem(id)
                .map(item -> ResponseEntity.ok(item))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/folder/{folderId}")
    public List<Map<String, Object>> getItemsByFolder(@PathVariable Long folderId) {
        return apiItemService.getItemsByFolder(folderId);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createItem(@RequestBody Map<String, Object> itemData, 
                                                         HttpSession session, HttpServletRequest request) {
        try {
            User currentUser = getCurrentUser(session);
            Map<String, Object> response = apiItemService.createItem(itemData);
            
            // API 아이템 생성 로깅
            if (currentUser != null) {
                String itemName = (String) response.get("name");
                Long folderId = (Long) response.get("folderId");
                String folderName = apiItemService.getFolderName(folderId);
                activityLoggingService.logItemCreate(currentUser, itemName, folderName,
                    request.getRequestURI(), request.getMethod());
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            // 실패 로깅
            User currentUser = getCurrentUser(session);
            if (currentUser != null) {
                String itemName = (String) itemData.get("name");
                activityLoggingService.logCrudFailure(currentUser, UserActivity.ActivityType.ITEM_CREATE,
                    "API 아이템 생성 실패: " + (itemName != null ? itemName : "unknown"), 
                    e.getMessage(), request.getRequestURI(), request.getMethod());
            }
            throw e;
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateItem(@PathVariable Long id, @RequestBody Map<String, Object> itemDetails,
                                                         HttpSession session, HttpServletRequest request) {
        try {
            User currentUser = getCurrentUser(session);
            return apiItemService.updateItem(id, itemDetails)
                .map(item -> {
                    // API 아이템 수정 로깅
                    if (currentUser != null) {
                        String itemName = (String) item.get("name");
                        Long folderId = (Long) item.get("folderId");
                        String folderName = apiItemService.getFolderName(folderId);
                        activityLoggingService.logItemUpdate(currentUser, itemName, folderName,
                            request.getRequestURI(), request.getMethod());
                    }
                    return ResponseEntity.ok(item);
                })
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            // 실패 로깅
            User currentUser = getCurrentUser(session);
            if (currentUser != null) {
                activityLoggingService.logCrudFailure(currentUser, UserActivity.ActivityType.ITEM_UPDATE,
                    "API 아이템 수정 실패 (ID: " + id + ")", 
                    e.getMessage(), request.getRequestURI(), request.getMethod());
            }
            throw e;
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteItem(@PathVariable Long id, HttpSession session, HttpServletRequest request) {
        try {
            User currentUser = getCurrentUser(session);
            
            // Get item name and folder before deletion for logging
            Optional<Map<String, Object>> itemOpt = apiItemService.getItem(id);
            if (!itemOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            String itemName = (String) itemOpt.get().get("name");
            Long folderId = (Long) itemOpt.get().get("folderId");
            String folderName = apiItemService.getFolderName(folderId);
            
            boolean deleted = apiItemService.deleteItem(id);
            
            if (deleted) {
                // API 아이템 삭제 로깅
                if (currentUser != null) {
                    activityLoggingService.logItemDelete(currentUser, itemName, folderName,
                        request.getRequestURI(), request.getMethod());
                }
                return ResponseEntity.ok().build();
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            // Exception in deleteItem
            e.printStackTrace();
            
            // 실패 로깅
            User currentUser = getCurrentUser(session);
            if (currentUser != null) {
                activityLoggingService.logCrudFailure(currentUser, UserActivity.ActivityType.ITEM_DELETE,
                    "API 아이템 삭제 실패 (ID: " + id + ")", 
                    e.getMessage(), request.getRequestURI(), request.getMethod());
            }
            throw e;
        }
    }
}