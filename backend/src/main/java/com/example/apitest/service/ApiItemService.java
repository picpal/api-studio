package com.example.apitest.service;

import com.example.apitest.entity.ApiFolder;
import com.example.apitest.entity.ApiItem;
import com.example.apitest.entity.User;
import com.example.apitest.entity.UserActivity;
import com.example.apitest.repository.ApiFolderRepository;
import com.example.apitest.repository.ApiItemHistoryRepository;
import com.example.apitest.repository.ApiItemRepository;
import com.example.apitest.repository.PipelineStepRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ApiItemService {

    @Autowired
    private ApiItemRepository itemRepository;
    
    @Autowired
    private ApiFolderRepository folderRepository;
    
    @Autowired
    private ApiItemHistoryRepository historyRepository;
    
    @Autowired
    private PipelineStepRepository pipelineStepRepository;

    public List<Map<String, Object>> getAllItems() {
        List<ApiItem> items = itemRepository.findAll();
        return items.stream().map(this::convertToMap).collect(Collectors.toList());
    }

    public Optional<Map<String, Object>> getItem(Long id) {
        return itemRepository.findById(id)
                .map(this::convertToMap);
    }

    public List<Map<String, Object>> getItemsByFolder(Long folderId) {
        List<ApiItem> items = itemRepository.findByFolderIdOrderByCreatedAtAsc(folderId);
        return items.stream().map(this::convertToMap).collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> createItem(Map<String, Object> itemData) {
        ApiItem item = new ApiItem();
        updateItemFromData(item, itemData);
        
        ApiItem savedItem = itemRepository.save(item);
        return convertToMap(savedItem);
    }

    @Transactional  
    public Optional<Map<String, Object>> updateItem(Long id, Map<String, Object> itemDetails) {
        return itemRepository.findById(id)
            .map(item -> {
                updateItemFromData(item, itemDetails);
                
                // 폴더 연결 처리
                if (itemDetails.containsKey("folderId") && itemDetails.get("folderId") != null) {
                    Long folderId = ((Number) itemDetails.get("folderId")).longValue();
                    Optional<ApiFolder> folder = folderRepository.findById(folderId);
                    folder.ifPresent(item::setFolder);
                }
                
                ApiItem savedItem = itemRepository.save(item);
                return convertToMap(savedItem);
            });
    }

    @Transactional(rollbackFor = Exception.class)
    public boolean deleteItem(Long id) {
        return itemRepository.findById(id)
            .map(item -> {
                try {
                    // 1. 먼저 관련된 파이프라인 스텝들을 삭제 (외래키 제약조건 해결)
                    pipelineStepRepository.deleteByApiItemId(id);
                    
                    // 2. 그 다음 관련된 히스토리들을 삭제 (외래키 제약조건 해결)
                    historyRepository.deleteByApiItemId(id);
                    
                    // 3. 그 다음 아이템 삭제 (커스텀 @Modifying 쿼리 사용)
                    int deletedCount = itemRepository.deleteByIdCustom(id);
                    
                    return deletedCount > 0;
                } catch (Exception e) {
                    e.printStackTrace();
                    throw e;
                }
            })
            .orElse(false);
    }

    private void updateItemFromData(ApiItem item, Map<String, Object> itemData) {
        if (itemData.containsKey("name") && itemData.get("name") != null) {
            item.setName((String) itemData.get("name"));
        }
        if (itemData.containsKey("method") && itemData.get("method") != null) {
            item.setMethod(ApiItem.HttpMethod.valueOf((String) itemData.get("method")));
        }
        if (itemData.containsKey("url") && itemData.get("url") != null) {
            item.setUrl((String) itemData.get("url"));
        }
        if (itemData.containsKey("description")) {
            item.setDescription((String) itemData.get("description"));
        }
        if (itemData.containsKey("requestParams")) {
            item.setRequestParams((String) itemData.get("requestParams"));
        }
        if (itemData.containsKey("requestHeaders")) {
            item.setRequestHeaders((String) itemData.get("requestHeaders"));
        }
        if (itemData.containsKey("requestBody")) {
            item.setRequestBody((String) itemData.get("requestBody"));
        }
        if (itemData.containsKey("validationEnabled")) {
            item.setValidationEnabled((Boolean) itemData.get("validationEnabled"));
        }
        if (itemData.containsKey("expectedValues")) {
            item.setExpectedValues((String) itemData.get("expectedValues"));
        }
        
        // 폴더 연결 처리 (생성 시에만)
        if (itemData.containsKey("folderId") && itemData.get("folderId") != null && item.getId() == null) {
            Long folderId = ((Number) itemData.get("folderId")).longValue();
            Optional<ApiFolder> folder = folderRepository.findById(folderId);
            folder.ifPresent(item::setFolder);
        }
    }

    private Map<String, Object> convertToMap(ApiItem item) {
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
    }
    
    public String getFolderName(Long folderId) {
        if (folderId == null) return "루트";
        return folderRepository.findById(folderId)
            .map(ApiFolder::getName)
            .orElse("알 수 없는 폴더");
    }
}