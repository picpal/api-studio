package com.example.apitest.controller;

import com.example.apitest.entity.ApiItem;
import com.example.apitest.entity.ApiItemHistory;
import com.example.apitest.entity.User;
import com.example.apitest.repository.ApiItemRepository;
import com.example.apitest.repository.ApiItemHistoryRepository;
import com.example.apitest.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.Optional;

@RestController
@RequestMapping("/api/history")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://localhost:3002"}, allowCredentials = "true")
public class ApiItemHistoryController {

    private static final Logger logger = LoggerFactory.getLogger(ApiItemHistoryController.class);

    @Autowired
    private ApiItemHistoryRepository historyRepository;
    
    @Autowired
    private ApiItemRepository itemRepository;
    
    @Autowired
    private AuthService authService;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
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
     * API 아이템 히스토리 저장
     */
    @PostMapping("/items/{itemId}")
    @Transactional
    public ResponseEntity<Map<String, Object>> saveHistory(
            @PathVariable Long itemId, 
            @RequestBody Map<String, Object> historyData,
            HttpSession session) {
        
        logger.info("히스토리 저장 요청 시작 - itemId: {}, historyData: {}", itemId, historyData);
        
        try {
            User currentUser = getCurrentUser(session);
            if (currentUser == null) {
                logger.warn("인증되지 않은 사용자의 히스토리 저장 요청 - itemId: {}", itemId);
                return ResponseEntity.status(401).body(Map.of("error", "로그인이 필요합니다."));
            }
            
            logger.debug("현재 사용자: {}", currentUser.getEmail());
            
            // API 아이템 조회
            Optional<ApiItem> itemOpt = itemRepository.findById(itemId);
            if (!itemOpt.isPresent()) {
                logger.warn("존재하지 않는 API 아이템 - itemId: {}", itemId);
                return ResponseEntity.notFound().build();
            }
            
            ApiItem apiItem = itemOpt.get();
            logger.debug("API 아이템 조회 완료 - name: {}, method: {}", apiItem.getName(), apiItem.getMethod());
            
            String historyName = (String) historyData.get("historyName");
            
            if (historyName == null || historyName.trim().isEmpty()) {
                logger.warn("히스토리 이름이 비어있음 - itemId: {}", itemId);
                return ResponseEntity.badRequest().body(Map.of("error", "히스토리 이름은 필수입니다."));
            }
            
            // 현재 API 아이템의 파라미터 정보 (requestParams에서 가져옴)
            String parametersJson = apiItem.getRequestParams();
            if (parametersJson == null || parametersJson.trim().isEmpty()) {
                parametersJson = "[]"; // 빈 배열로 초기화
            }
            logger.debug("API 파라미터 JSON: {}", parametersJson);
            
            // 히스토리 엔티티 생성
            ApiItemHistory history = new ApiItemHistory(
                historyName.trim(),
                apiItem,
                apiItem.getName(),
                apiItem.getMethod().toString(),
                apiItem.getUrl(),
                apiItem.getDescription(),
                apiItem.getRequestParams(),
                apiItem.getRequestHeaders(),
                apiItem.getRequestBody(),
                parametersJson,
                currentUser
            );
            
            logger.debug("히스토리 엔티티 생성 완료 - historyName: {}", historyName.trim());
            
            // 히스토리 저장
            ApiItemHistory savedHistory = historyRepository.save(history);
            logger.info("히스토리 저장 완료 - historyId: {}, historyName: {}", savedHistory.getId(), savedHistory.getHistoryName());
            
            // 10개 초과시 오래된 히스토리 삭제
            long count = historyRepository.countByApiItemId(itemId);
            if (count > 10) {
                historyRepository.deleteOldHistories(itemId);
            }
            
            // 응답 데이터 생성
            Map<String, Object> response = new HashMap<>();
            response.put("id", savedHistory.getId());
            response.put("historyName", savedHistory.getHistoryName());
            response.put("apiItemId", savedHistory.getApiItemId());
            response.put("apiItemName", savedHistory.getApiItemName());
            response.put("savedAt", savedHistory.getSavedAt());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("히스토리 저장 중 오류 발생 - itemId: {}, error: {}", itemId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", "히스토리 저장 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }

    /**
     * API 아이템의 히스토리 목록 조회
     */
    @GetMapping("/items/{itemId}")
    public ResponseEntity<List<Map<String, Object>>> getHistoryList(@PathVariable Long itemId, HttpSession session) {
        try {
            User currentUser = getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(401).build();
            }
            
            List<ApiItemHistory> histories = historyRepository.findByApiItemIdOrderBySavedAtDesc(itemId);
            
            List<Map<String, Object>> response = new ArrayList<>();
            for (ApiItemHistory history : histories) {
                Map<String, Object> historyMap = new HashMap<>();
                historyMap.put("id", history.getId());
                historyMap.put("historyName", history.getHistoryName());
                historyMap.put("apiItemId", history.getApiItemId());
                historyMap.put("apiItemName", history.getApiItemName());
                historyMap.put("savedAt", history.getSavedAt());
                historyMap.put("createdByUserId", history.getCreatedByUserId());
                historyMap.put("createdByUserEmail", history.getCreatedByUserEmail());
                response.add(historyMap);
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 특정 히스토리 상세 정보 조회
     */
    @GetMapping("/items/{itemId}/{historyId}")
    public ResponseEntity<Map<String, Object>> getHistoryDetail(
            @PathVariable Long itemId, 
            @PathVariable Long historyId, 
            HttpSession session) {
        
        try {
            User currentUser = getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(401).build();
            }
            
            Optional<ApiItemHistory> historyOpt = historyRepository.findById(historyId);
            if (!historyOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            ApiItemHistory history = historyOpt.get();
            
            // 보안 체크: 요청한 itemId와 히스토리의 itemId가 일치하는지 확인
            if (!history.getApiItemId().equals(itemId)) {
                return ResponseEntity.badRequest().build();
            }
            
            // 응답 데이터 생성
            Map<String, Object> response = new HashMap<>();
            response.put("id", history.getId());
            response.put("historyName", history.getHistoryName());
            response.put("apiItemId", history.getApiItemId());
            response.put("apiItemName", history.getApiItemName());
            response.put("savedAt", history.getSavedAt());
            response.put("createdByUserId", history.getCreatedByUserId());
            response.put("createdByUserEmail", history.getCreatedByUserEmail());
            
            // 스냅샷 데이터
            Map<String, Object> snapshot = new HashMap<>();
            snapshot.put("method", history.getMethodSnapshot());
            snapshot.put("url", history.getUrlSnapshot());
            snapshot.put("description", history.getDescriptionSnapshot());
            snapshot.put("requestParams", history.getRequestParamsSnapshot());
            snapshot.put("requestHeaders", history.getRequestHeadersSnapshot());
            snapshot.put("requestBody", history.getRequestBodySnapshot());
            
            // 파라미터 JSON 파싱
            try {
                List<Map<String, Object>> parameters = objectMapper.readValue(
                    history.getParametersSnapshot(), 
                    objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class)
                );
                snapshot.put("parameters", parameters);
            } catch (Exception e) {
                snapshot.put("parameters", new ArrayList<>());
            }
            
            response.put("snapshot", snapshot);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }


    /**
     * 히스토리 삭제
     */
    @DeleteMapping("/items/{itemId}/{historyId}")
    @Transactional
    public ResponseEntity<?> deleteHistory(
            @PathVariable Long itemId, 
            @PathVariable Long historyId, 
            HttpSession session) {
        
        try {
            User currentUser = getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(401).build();
            }
            
            Optional<ApiItemHistory> historyOpt = historyRepository.findById(historyId);
            if (!historyOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            ApiItemHistory history = historyOpt.get();
            
            // 보안 체크
            if (!history.getApiItemId().equals(itemId)) {
                return ResponseEntity.badRequest().build();
            }
            
            historyRepository.delete(history);
            
            return ResponseEntity.ok().build();
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}