package com.example.apitest.controller;

import com.example.apitest.entity.ApiItem;
import com.example.apitest.entity.ApiFolder;
import com.example.apitest.entity.User;
import com.example.apitest.entity.UserActivity;
import com.example.apitest.repository.ApiItemRepository;
import com.example.apitest.repository.ApiFolderRepository;
import com.example.apitest.service.ActivityLoggingService;
import com.example.apitest.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;

@RestController
@RequestMapping("/api/items")
@CrossOrigin(origins = {"http://localhost:3001", "http://localhost:3003"}, allowCredentials = "true")
public class ApiItemController {

    @Autowired
    private ApiItemRepository itemRepository;
    
    @Autowired
    private ApiFolderRepository folderRepository;
    
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
     * 폴더 이름 가져오기
     */
    private String getFolderName(Long folderId) {
        if (folderId == null) return "루트";
        return folderRepository.findById(folderId)
            .map(ApiFolder::getName)
            .orElse("알 수 없는 폴더");
    }

    @GetMapping
    public List<ApiItem> getAllItems() {
        return itemRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiItem> getItem(@PathVariable Long id) {
        return itemRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/folder/{folderId}")
    public List<ApiItem> getItemsByFolder(@PathVariable Long folderId) {
        return itemRepository.findByFolderId(folderId);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createItem(@RequestBody Map<String, Object> itemData, 
                                                         HttpSession session, HttpServletRequest request) {
        try {
            User currentUser = getCurrentUser(session);
        ApiItem item = new ApiItem();
        item.setName((String) itemData.get("name"));
        item.setMethod(ApiItem.HttpMethod.valueOf((String) itemData.get("method")));
        item.setUrl((String) itemData.get("url"));
        item.setDescription((String) itemData.get("description"));
        item.setRequestParams((String) itemData.get("requestParams"));
        item.setRequestHeaders((String) itemData.get("requestHeaders"));
        item.setRequestBody((String) itemData.get("requestBody"));
        
        // 폴더 연결 처리
        Long folderId = null;
        if (itemData.get("folderId") != null) {
            folderId = ((Number) itemData.get("folderId")).longValue();
            ApiFolder folder = folderRepository.findById(folderId).orElse(null);
            if (folder != null) {
                item.setFolder(folder);
            }
        }
        
            ApiItem savedItem = itemRepository.save(item);
            
            // API 아이템 생성 로깅
            if (currentUser != null) {
                String folderName = getFolderName(folderId);
                activityLoggingService.logItemCreate(currentUser, savedItem.getName(), folderName,
                    request.getRequestURI(), request.getMethod());
            }
            
            // 응답 Map 생성 (folderId 포함)
            Map<String, Object> response = new HashMap<>();
            response.put("id", savedItem.getId());
            response.put("name", savedItem.getName());
            response.put("method", savedItem.getMethod());
            response.put("url", savedItem.getUrl());
            response.put("description", savedItem.getDescription());
            response.put("requestParams", savedItem.getRequestParams());
            response.put("requestHeaders", savedItem.getRequestHeaders());
            response.put("requestBody", savedItem.getRequestBody());
            response.put("createdAt", savedItem.getCreatedAt());
            response.put("updatedAt", savedItem.getUpdatedAt());
            response.put("folderId", folderId);
            
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
    @Transactional  
    public ResponseEntity<Map<String, Object>> updateItem(@PathVariable Long id, @RequestBody Map<String, Object> itemDetails,
                                                         HttpSession session, HttpServletRequest request) {
        try {
            User currentUser = getCurrentUser(session);
        return itemRepository.findById(id)
            .map(item -> {
                if (itemDetails.containsKey("name") && itemDetails.get("name") != null) {
                    item.setName((String) itemDetails.get("name"));
                }
                if (itemDetails.containsKey("method") && itemDetails.get("method") != null) {
                    item.setMethod(ApiItem.HttpMethod.valueOf((String) itemDetails.get("method")));
                }
                if (itemDetails.containsKey("url") && itemDetails.get("url") != null) {
                    item.setUrl((String) itemDetails.get("url"));
                }
                if (itemDetails.containsKey("description")) {
                    item.setDescription((String) itemDetails.get("description"));
                }
                if (itemDetails.containsKey("requestParams")) {
                    item.setRequestParams((String) itemDetails.get("requestParams"));
                }
                if (itemDetails.containsKey("requestHeaders")) {
                    item.setRequestHeaders((String) itemDetails.get("requestHeaders"));
                }
                if (itemDetails.containsKey("requestBody")) {
                    item.setRequestBody((String) itemDetails.get("requestBody"));
                }
                
                // folderId 처리 추가
                if (itemDetails.containsKey("folderId") && itemDetails.get("folderId") != null) {
                    Long folderId = ((Number) itemDetails.get("folderId")).longValue();
                    ApiFolder folder = folderRepository.findById(folderId).orElse(null);
                    if (folder != null) {
                        item.setFolder(folder);
                    }
                }
                
                ApiItem savedItem = itemRepository.save(item);
                
                // API 아이템 수정 로깅
                if (currentUser != null) {
                    String folderName = getFolderName(savedItem.getFolderId());
                    activityLoggingService.logItemUpdate(currentUser, savedItem.getName(), folderName,
                        request.getRequestURI(), request.getMethod());
                }
                
                // 응답 Map 생성 (folderId 포함)
                Map<String, Object> response = new HashMap<>();
                response.put("id", savedItem.getId());
                response.put("name", savedItem.getName());
                response.put("method", savedItem.getMethod());
                response.put("url", savedItem.getUrl());
                response.put("description", savedItem.getDescription());
                response.put("requestParams", savedItem.getRequestParams());
                response.put("requestHeaders", savedItem.getRequestHeaders());
                response.put("requestBody", savedItem.getRequestBody());
                response.put("createdAt", savedItem.getCreatedAt());
                response.put("updatedAt", savedItem.getUpdatedAt());
                response.put("folderId", savedItem.getFolderId());
                
                return ResponseEntity.ok(response);
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
            
            return itemRepository.findById(id)
                .map(item -> {
                    String itemName = item.getName();
                    String folderName = getFolderName(item.getFolderId());
                    itemRepository.delete(item);
                    
                    // API 아이템 삭제 로깅
                    if (currentUser != null) {
                        activityLoggingService.logItemDelete(currentUser, itemName, folderName,
                            request.getRequestURI(), request.getMethod());
                    }
                    
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
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