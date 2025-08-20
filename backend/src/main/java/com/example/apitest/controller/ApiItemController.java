package com.example.apitest.controller;

import com.example.apitest.entity.ApiItem;
import com.example.apitest.entity.ApiFolder;
import com.example.apitest.entity.User;
import com.example.apitest.entity.UserActivity;
import com.example.apitest.repository.ApiItemRepository;
import com.example.apitest.repository.ApiFolderRepository;
import com.example.apitest.repository.ApiItemHistoryRepository;
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
import java.util.stream.Collectors;
import java.util.Optional;
import java.util.ArrayList;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;

@RestController
@RequestMapping("/api/items")
@CrossOrigin(origins = {"http://localhost:3001", "http://localhost:3003"}, allowCredentials = "true")
public class ApiItemController {

    @Autowired
    private ApiItemRepository itemRepository;
    
    @Autowired
    private ApiFolderRepository folderRepository;
    
    @Autowired
    private ApiItemHistoryRepository historyRepository;
    
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
    public List<Map<String, Object>> getAllItems() {
        List<ApiItem> items = itemRepository.findAll();
        return items.stream().map(item -> {
            Map<String, Object> itemMap = new HashMap<>();
            itemMap.put("id", item.getId());
            itemMap.put("name", item.getName());
            itemMap.put("method", item.getMethod());
            itemMap.put("url", item.getUrl());
            itemMap.put("description", item.getDescription());
            itemMap.put("requestParams", item.getRequestParams());
            itemMap.put("requestHeaders", item.getRequestHeaders());
            itemMap.put("requestBody", item.getRequestBody());
            itemMap.put("createdAt", item.getCreatedAt());
            itemMap.put("updatedAt", item.getUpdatedAt());
            itemMap.put("folderId", item.getFolderId());
            itemMap.put("validationEnabled", item.getValidationEnabled());
            itemMap.put("expectedValues", item.getExpectedValues());
            return itemMap;
        }).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getItem(@PathVariable Long id) {
        return itemRepository.findById(id)
                .map(item -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("id", item.getId());
                    response.put("name", item.getName());
                    response.put("method", item.getMethod());
                    response.put("url", item.getUrl());
                    response.put("description", item.getDescription());
                    response.put("requestParams", item.getRequestParams());
                    response.put("requestHeaders", item.getRequestHeaders());
                    response.put("requestBody", item.getRequestBody());
                    response.put("createdAt", item.getCreatedAt());
                    response.put("updatedAt", item.getUpdatedAt());
                    response.put("folderId", item.getFolderId());
                    response.put("validationEnabled", item.getValidationEnabled());
                    response.put("expectedValues", item.getExpectedValues());
                    
                    // requestParams 사용 - 별도 파라미터 처리 불필요
                    
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/folder/{folderId}")
    public List<Map<String, Object>> getItemsByFolder(@PathVariable Long folderId) {
        List<ApiItem> items = itemRepository.findByFolderIdOrderByCreatedAtAsc(folderId);
        return items.stream().map(item -> {
            Map<String, Object> itemMap = new HashMap<>();
            itemMap.put("id", item.getId());
            itemMap.put("name", item.getName());
            itemMap.put("method", item.getMethod());
            itemMap.put("url", item.getUrl());
            itemMap.put("description", item.getDescription());
            itemMap.put("requestParams", item.getRequestParams());
            itemMap.put("requestHeaders", item.getRequestHeaders());
            itemMap.put("requestBody", item.getRequestBody());
            itemMap.put("createdAt", item.getCreatedAt());
            itemMap.put("updatedAt", item.getUpdatedAt());
            itemMap.put("folderId", item.getFolderId());
            itemMap.put("validationEnabled", item.getValidationEnabled());
            itemMap.put("expectedValues", item.getExpectedValues());
            return itemMap;
        }).collect(Collectors.toList());
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
        
        // Validation 필드 처리
        if (itemData.containsKey("validationEnabled")) {
            item.setValidationEnabled((Boolean) itemData.get("validationEnabled"));
        }
        if (itemData.containsKey("expectedValues")) {
            item.setExpectedValues((String) itemData.get("expectedValues"));
        }
        
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
            
            // 파라미터는 이제 requestParams JSON 필드에서 관리됨
            
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
            response.put("validationEnabled", savedItem.getValidationEnabled());
            response.put("expectedValues", savedItem.getExpectedValues());
            
            // 파라미터는 이제 requestParams JSON 필드에서 관리됨
            
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
            System.err.println("=== UPDATE ITEM REQUEST START ===");
            System.err.println("Item ID: " + id);
            System.err.println("Request body keys: " + itemDetails.keySet());
            System.err.println("Full itemDetails: " + itemDetails);
            System.err.println("Parameters field: " + itemDetails.get("parameters"));
            System.err.println("Parameters class: " + (itemDetails.get("parameters") != null ? itemDetails.get("parameters").getClass() : "null"));
            
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
                if (itemDetails.containsKey("validationEnabled")) {
                    item.setValidationEnabled((Boolean) itemDetails.get("validationEnabled"));
                }
                if (itemDetails.containsKey("expectedValues")) {
                    item.setExpectedValues((String) itemDetails.get("expectedValues"));
                }
                
                // 먼저 아이템을 저장
                ApiItem savedItem = itemRepository.save(item);
                
                // 파라미터는 이제 requestParams JSON 필드에서 관리됨
                
                // 파라미터 처리 완료 후 다시 조회하여 반환
                item = itemRepository.findById(id).orElse(savedItem);
                
                // folderId 처리 추가
                if (itemDetails.containsKey("folderId") && itemDetails.get("folderId") != null) {
                    Long folderId = ((Number) itemDetails.get("folderId")).longValue();
                    ApiFolder folder = folderRepository.findById(folderId).orElse(null);
                    if (folder != null) {
                        item.setFolder(folder);
                        // folderId가 변경된 경우 다시 저장
                        item = itemRepository.save(item);
                    }
                }
                
                // API 아이템 수정 로깅
                if (currentUser != null) {
                    String folderName = getFolderName(item.getFolderId());
                    activityLoggingService.logItemUpdate(currentUser, item.getName(), folderName,
                        request.getRequestURI(), request.getMethod());
                }
                
                // 응답 Map 생성 (folderId 포함)
                Map<String, Object> response = new HashMap<>();
                response.put("id", item.getId());
                response.put("name", item.getName());
                response.put("method", item.getMethod());
                response.put("url", item.getUrl());
                response.put("description", item.getDescription());
                response.put("requestParams", item.getRequestParams());
                response.put("requestHeaders", item.getRequestHeaders());
                response.put("requestBody", item.getRequestBody());
                response.put("createdAt", item.getCreatedAt());
                response.put("updatedAt", item.getUpdatedAt());
                response.put("folderId", item.getFolderId());
                response.put("validationEnabled", item.getValidationEnabled());
                response.put("expectedValues", item.getExpectedValues());
                
                // 파라미터는 이제 requestParams JSON 필드에서 관리됨
                
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
    @Transactional(rollbackFor = Exception.class)
    public ResponseEntity<?> deleteItem(@PathVariable Long id, HttpSession session, HttpServletRequest request) {
        try {
            User currentUser = getCurrentUser(session);
            
            return itemRepository.findById(id)
                .map(item -> {
                    String itemName = item.getName();
                    String folderName = getFolderName(item.getFolderId());
                    
                    // 관련된 히스토리들을 먼저 삭제
                    historyRepository.deleteByApiItemId(id);
                    
                    // 아이템 삭제
                    itemRepository.deleteById(id);
                    
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