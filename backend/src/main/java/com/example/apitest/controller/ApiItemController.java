package com.example.apitest.controller;

import com.example.apitest.entity.ApiItem;
import com.example.apitest.entity.ApiFolder;
import com.example.apitest.repository.ApiItemRepository;
import com.example.apitest.repository.ApiFolderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/items")
@CrossOrigin(origins = "http://localhost:3000")
public class ApiItemController {

    @Autowired
    private ApiItemRepository itemRepository;
    
    @Autowired
    private ApiFolderRepository folderRepository;

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
    public Map<String, Object> createItem(@RequestBody Map<String, Object> itemData) {
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
        
        return response;
    }

    @PutMapping("/{id}")
    @Transactional  
    public ResponseEntity<Map<String, Object>> updateItem(@PathVariable Long id, @RequestBody Map<String, Object> itemDetails) {
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
                
                ApiItem savedItem = itemRepository.save(item);
                
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
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteItem(@PathVariable Long id) {
        return itemRepository.findById(id)
            .map(item -> {
                itemRepository.delete(item);
                return ResponseEntity.ok().build();
            })
            .orElse(ResponseEntity.notFound().build());
    }
}