package com.example.apitest.controller;

import com.example.apitest.entity.TestHistory;
import com.example.apitest.repository.TestHistoryRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/test-history")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003", "http://localhost:3004"}, allowCredentials = "true")
public class TestHistoryController {

    @Autowired
    private TestHistoryRepository testHistoryRepository;

    // 테스트 히스토리 저장
    @PostMapping
    public ResponseEntity<Map<String, Object>> saveTestHistory(@RequestBody Map<String, Object> request, HttpSession session) {
        try {
            // 세션에서 사용자 정보 가져오기
            String userEmail = (String) session.getAttribute("userEmail");
            if (userEmail == null) {
                return ResponseEntity.status(401).body(Map.of("error", "인증되지 않은 사용자입니다."));
            }

            // 요청 데이터 추출
            String name = (String) request.get("name");
            Integer totalTests = (Integer) request.get("totalTests");
            Integer successCount = (Integer) request.get("successCount");
            Integer failureCount = (Integer) request.get("failureCount");
            Long totalTime = Long.valueOf(request.get("totalTime").toString());
            String executionResults = (String) request.get("executionResults");

            // 이름이 없으면 자동 생성
            if (name == null || name.trim().isEmpty()) {
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
                name = "Test Run " + LocalDateTime.now().format(formatter);
            }

            // TestHistory 엔티티 생성 및 저장
            TestHistory testHistory = new TestHistory(
                name.trim(),
                userEmail,
                totalTests,
                successCount,
                failureCount,
                totalTime,
                executionResults
            );

            TestHistory savedHistory = testHistoryRepository.save(testHistory);

            // 응답 데이터 구성
            Map<String, Object> response = new HashMap<>();
            response.put("id", savedHistory.getId());
            response.put("name", savedHistory.getName());
            response.put("createdAt", savedHistory.getCreatedAt());
            response.put("createdBy", savedHistory.getCreatedBy());
            response.put("totalTests", savedHistory.getTotalTests());
            response.put("successCount", savedHistory.getSuccessCount());
            response.put("failureCount", savedHistory.getFailureCount());
            response.put("totalTime", savedHistory.getTotalTime());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "테스트 히스토리 저장 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }

    // 테스트 히스토리 목록 조회
    @GetMapping
    public ResponseEntity<List<TestHistory>> getTestHistoryList() {
        try {
            List<TestHistory> histories = testHistoryRepository.findAllByOrderByCreatedAtDesc();
            return ResponseEntity.ok(histories);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // 특정 테스트 히스토리 상세 조회
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getTestHistoryDetail(@PathVariable Long id) {
        try {
            Optional<TestHistory> historyOpt = testHistoryRepository.findById(id);
            
            if (historyOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            TestHistory history = historyOpt.get();
            
            Map<String, Object> response = new HashMap<>();
            response.put("id", history.getId());
            response.put("name", history.getName());
            response.put("createdAt", history.getCreatedAt());
            response.put("createdBy", history.getCreatedBy());
            response.put("totalTests", history.getTotalTests());
            response.put("successCount", history.getSuccessCount());
            response.put("failureCount", history.getFailureCount());
            response.put("totalTime", history.getTotalTime());
            response.put("executionResults", history.getExecutionResults());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "테스트 히스토리 조회 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }

    // 테스트 히스토리 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteTestHistory(@PathVariable Long id, HttpSession session) {
        try {
            // 세션에서 사용자 정보 가져오기
            String userEmail = (String) session.getAttribute("userEmail");
            if (userEmail == null) {
                return ResponseEntity.status(401).body(Map.of("error", "인증되지 않은 사용자입니다."));
            }

            Optional<TestHistory> historyOpt = testHistoryRepository.findById(id);
            
            if (historyOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            TestHistory history = historyOpt.get();
            
            // 본인이 생성한 히스토리만 삭제 가능 (또는 관리자)
            // 여기서는 일단 누구나 삭제 가능하도록 설정
            
            testHistoryRepository.delete(history);
            
            return ResponseEntity.ok(Map.of("message", "테스트 히스토리가 삭제되었습니다."));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "테스트 히스토리 삭제 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }
}