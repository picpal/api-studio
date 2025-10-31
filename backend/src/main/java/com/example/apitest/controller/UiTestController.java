package com.example.apitest.controller;

import com.example.apitest.dto.ErrorResponse;
import com.example.apitest.entity.User;
import com.example.apitest.service.AuthService;
import com.example.apitest.service.UiTestScriptService;
import com.example.apitest.service.UiTestFolderService;
import com.example.apitest.service.UiTestExecutionService;
import com.example.apitest.service.UiTestFileService;
import com.example.apitest.service.ActivityLoggingService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/ui-tests")
@CrossOrigin(origins = {"http://localhost:3001", "http://localhost:3003"}, allowCredentials = "true")
public class UiTestController {

    private static final Logger logger = LoggerFactory.getLogger(UiTestController.class);

    @Autowired
    private UiTestScriptService scriptService;

    @Autowired
    private UiTestFolderService folderService;

    @Autowired
    private UiTestExecutionService executionService;

    @Autowired
    private UiTestFileService fileService;

    @Autowired
    private ActivityLoggingService activityLoggingService;

    @Autowired
    private AuthService authService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    private User getCurrentUser(HttpSession session) {
        String userEmail = (String) session.getAttribute("userEmail");
        if (userEmail != null) {
            Optional<User> userOpt = authService.findByEmail(userEmail);
            return userOpt.orElse(null);
        }
        return null;
    }

    // Folder endpoints
    @GetMapping("/folders")
    public List<Map<String, Object>> getAllFolders() {
        return folderService.getRootFolders();
    }

    @GetMapping("/folders/structure")
    public List<Map<String, Object>> getFolderStructure() {
        return folderService.getFolderStructure();
    }

    @GetMapping("/folders/{id}")
    public ResponseEntity<Map<String, Object>> getFolder(@PathVariable Long id) {
        return folderService.getFolder(id)
                .map(folder -> ResponseEntity.ok(folder))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/folders/{id}/children")
    public List<Map<String, Object>> getChildFolders(@PathVariable Long id) {
        return folderService.getChildFolders(id);
    }

    @PostMapping("/folders")
    public ResponseEntity<?> createFolder(@RequestBody Map<String, Object> folderData,
                                         HttpSession session, HttpServletRequest request) {
        try {
            User currentUser = getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            Map<String, Object> response = folderService.createFolder(folderData, currentUser);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid folder creation request: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("UI_TEST_001", "Invalid folder data"));
        } catch (Exception e) {
            logger.error("Failed to create folder", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("INTERNAL_ERROR", "Failed to create folder"));
        }
    }

    @PutMapping("/folders/{id}")
    public ResponseEntity<Map<String, Object>> updateFolder(@PathVariable Long id,
                                                           @RequestBody Map<String, Object> folderDetails,
                                                           HttpSession session) {
        try {
            User currentUser = getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(401).build();
            }

            return folderService.updateFolder(id, folderDetails)
                    .map(folder -> ResponseEntity.ok(folder))
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/folders/{id}")
    public ResponseEntity<?> deleteFolder(@PathVariable Long id, HttpSession session) {
        try {
            User currentUser = getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(401).build();
            }

            boolean deleted = folderService.deleteFolder(id);
            if (deleted) {
                return ResponseEntity.ok().build();
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Script endpoints
    @GetMapping("/scripts")
    public List<Map<String, Object>> getAllScripts() {
        return scriptService.getAllScripts();
    }

    @GetMapping("/scripts/{id}")
    public ResponseEntity<Map<String, Object>> getScript(@PathVariable Long id) {
        return scriptService.getScript(id)
                .map(script -> ResponseEntity.ok(script))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/folders/{folderId}/scripts")
    public List<Map<String, Object>> getScriptsByFolder(@PathVariable Long folderId) {
        return scriptService.getScriptsByFolder(folderId);
    }

    @GetMapping("/scripts/search")
    public List<Map<String, Object>> searchScripts(@RequestParam String keyword) {
        return scriptService.searchScripts(keyword);
    }

    @PostMapping("/scripts")
    public ResponseEntity<Map<String, Object>> createScript(@RequestBody Map<String, Object> scriptData,
                                                           HttpSession session, HttpServletRequest request) {
        try {
            User currentUser = getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(401).build();
            }

            Map<String, Object> response = scriptService.createScript(scriptData, currentUser);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/scripts/{id}")
    public ResponseEntity<Map<String, Object>> updateScript(@PathVariable Long id,
                                                           @RequestBody Map<String, Object> scriptDetails,
                                                           HttpSession session) {
        try {
            User currentUser = getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(401).build();
            }

            return scriptService.updateScript(id, scriptDetails)
                    .map(script -> ResponseEntity.ok(script))
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/scripts/{id}")
    public ResponseEntity<?> deleteScript(@PathVariable Long id, HttpSession session) {
        try {
            User currentUser = getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(401).build();
            }

            boolean deleted = scriptService.deleteScript(id);
            if (deleted) {
                return ResponseEntity.ok().build();
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // File endpoints
    @GetMapping("/scripts/{scriptId}/files")
    public List<Map<String, Object>> getFilesByScript(@PathVariable Long scriptId) {
        return fileService.getFilesByScript(scriptId);
    }

    @GetMapping("/files/{id}")
    public ResponseEntity<Map<String, Object>> getFile(@PathVariable Long id) {
        return fileService.getFile(id)
                .map(file -> ResponseEntity.ok(file))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/scripts/{scriptId}/files/upload")
    public ResponseEntity<?> uploadFile(@PathVariable Long scriptId,
                                       @RequestParam("file") MultipartFile file,
                                       HttpSession session) {
        try {
            User currentUser = getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            if (file.isEmpty()) {
                logger.warn("Empty file upload attempt for script ID: {}", scriptId);
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse("UI_TEST_002", "File is empty"));
            }

            // 파일 보안 검증 (경로 트래버설, 확장자, MIME 타입)
            if (!isValidAndSafeFile(file)) {
                logger.warn("Invalid file upload attempt: {}", file.getOriginalFilename());
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse("UI_TEST_003", "Invalid file type or security check failed"));
            }

            Map<String, Object> response = fileService.uploadFile(scriptId, file, currentUser);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid upload request for script {}: {}", scriptId, e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("UI_TEST_004", "Invalid request"));
        } catch (Exception e) {
            logger.error("Failed to upload file for script {}", scriptId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("INTERNAL_ERROR", "Failed to upload file"));
        }
    }

    @DeleteMapping("/files/{id}")
    public ResponseEntity<?> deleteFile(@PathVariable Long id, HttpSession session) {
        try {
            User currentUser = getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(401).build();
            }

            boolean deleted = fileService.deleteFile(id);
            if (deleted) {
                return ResponseEntity.ok().build();
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/files/{id}/execute")
    public ResponseEntity<?> executeFile(@PathVariable Long id,
                                        HttpSession session) {
        try {
            User currentUser = getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            Map<String, Object> response = fileService.executeFile(id, currentUser);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid file execution request for file {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("UI_TEST_005", "Invalid execution request"));
        } catch (Exception e) {
            logger.error("Failed to execute file {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("INTERNAL_ERROR", "Failed to execute file"));
        }
    }

    @PostMapping("/files/{id}/callback")
    public ResponseEntity<Map<String, Object>> fileExecutionCallback(@PathVariable Long id,
                                                                     @RequestBody Map<String, Object> result) {
        try {
            String status = (String) result.get("status");
            String resultData = (String) result.get("result");

            com.example.apitest.entity.UiTestFile.FileStatus fileStatus;
            if ("completed".equalsIgnoreCase(status)) {
                fileStatus = com.example.apitest.entity.UiTestFile.FileStatus.COMPLETED;
            } else if ("failed".equalsIgnoreCase(status)) {
                fileStatus = com.example.apitest.entity.UiTestFile.FileStatus.FAILED;
            } else {
                fileStatus = com.example.apitest.entity.UiTestFile.FileStatus.RUNNING;
            }

            fileService.updateFileStatus(id, fileStatus, resultData);

            // WebSocket으로 실시간 상태 업데이트 브로드캐스트
            Map<String, Object> wsMessage = Map.of(
                "fileId", id,
                "status", fileStatus.name(),
                "result", resultData != null ? resultData : "",
                "timestamp", System.currentTimeMillis()
            );
            messagingTemplate.convertAndSend("/topic/ui-test-updates", wsMessage);
            System.out.println("WebSocket message sent to /topic/ui-test-updates: " + wsMessage);

            return ResponseEntity.ok(Map.of("message", "Status updated"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/files/{id}/stop")
    public ResponseEntity<Map<String, Object>> stopFileExecution(@PathVariable Long id,
                                                                 HttpSession session) {
        try {
            User currentUser = getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(401).build();
            }

            // 파일 실행 중지 (Runner 프로세스도 종료)
            boolean stopped = fileService.stopFile(id);

            if (stopped) {
                // WebSocket으로 상태 업데이트 브로드캐스트
                Map<String, Object> wsMessage = Map.of(
                    "fileId", id,
                    "status", "UPLOADED",
                    "result", "Execution stopped by user",
                    "timestamp", System.currentTimeMillis()
                );
                messagingTemplate.convertAndSend("/topic/ui-test-updates", wsMessage);

                return ResponseEntity.ok(Map.of("message", "File execution stopped", "fileId", id));
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/scripts/{scriptId}/files/stop-all")
    public ResponseEntity<Map<String, Object>> stopAllFileExecutions(@PathVariable Long scriptId,
                                                                     HttpSession session) {
        try {
            User currentUser = getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(401).build();
            }

            int stoppedCount = fileService.stopAllRunningFiles(scriptId);

            // WebSocket으로 전체 리프레시 알림
            Map<String, Object> wsMessage = Map.of(
                "scriptId", scriptId,
                "action", "stop-all",
                "stoppedCount", stoppedCount,
                "timestamp", System.currentTimeMillis()
            );
            messagingTemplate.convertAndSend("/topic/ui-test-updates", wsMessage);

            return ResponseEntity.ok(Map.of(
                "message", "All running files stopped",
                "stoppedCount", stoppedCount
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * 파일 보안 검증: 경로 트래버설, 파일명, 확장자, MIME 타입 검사
     */
    private boolean isValidAndSafeFile(MultipartFile file) {
        String fileName = file.getOriginalFilename();

        // 파일명 null 체크
        if (fileName == null || fileName.trim().isEmpty()) {
            return false;
        }

        // 경로 트래버설 공격 방어: .., /, \ 문자 차단
        if (fileName.contains("..") || fileName.contains("/") || fileName.contains("\\")) {
            return false;
        }

        // 파일 확장자 검증
        if (!isValidTestFile(fileName)) {
            return false;
        }

        // MIME 타입 검증
        String contentType = file.getContentType();
        if (!isValidContentType(contentType)) {
            return false;
        }

        return true;
    }

    /**
     * 허용된 테스트 파일 확장자 검증
     */
    private boolean isValidTestFile(String fileName) {
        String lowerCaseFileName = fileName.toLowerCase();
        return lowerCaseFileName.endsWith(".js") ||
               lowerCaseFileName.endsWith(".ts") ||
               lowerCaseFileName.endsWith(".spec.js") ||
               lowerCaseFileName.endsWith(".spec.ts") ||
               lowerCaseFileName.endsWith(".test.js") ||
               lowerCaseFileName.endsWith(".test.ts");
    }

    /**
     * 허용된 MIME 타입 검증
     */
    private boolean isValidContentType(String contentType) {
        if (contentType == null) {
            return false;
        }

        // JavaScript/TypeScript 파일의 일반적인 MIME 타입들
        return contentType.equals("application/javascript") ||
               contentType.equals("application/x-javascript") ||
               contentType.equals("text/javascript") ||
               contentType.equals("text/plain") ||
               contentType.equals("application/typescript") ||
               contentType.equals("text/typescript") ||
               contentType.equals("application/octet-stream"); // 일부 브라우저에서 사용
    }

    @PostMapping("/scripts/{id}/execute")
    public ResponseEntity<Map<String, Object>> executeScript(@PathVariable Long id,
                                                            HttpSession session) {
        try {
            User currentUser = getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(401).build();
            }

            Map<String, Object> response = scriptService.executeScript(id, currentUser);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Execution endpoints
    @GetMapping("/executions")
    public List<Map<String, Object>> getAllExecutions() {
        return executionService.getAllExecutions();
    }

    @GetMapping("/executions/{id}")
    public ResponseEntity<Map<String, Object>> getExecution(@PathVariable Long id) {
        return executionService.getExecution(id)
                .map(execution -> ResponseEntity.ok(execution))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/executions/by-execution-id/{executionId}")
    public ResponseEntity<Map<String, Object>> getExecutionByExecutionId(@PathVariable String executionId) {
        return executionService.getExecutionByExecutionId(executionId)
                .map(execution -> ResponseEntity.ok(execution))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/scripts/{scriptId}/executions")
    public List<Map<String, Object>> getExecutionsByScript(@PathVariable Long scriptId) {
        return executionService.getExecutionsByScript(scriptId);
    }

    @GetMapping("/executions/running")
    public List<Map<String, Object>> getRunningExecutions() {
        return executionService.getRunningExecutions();
    }

    @GetMapping("/executions/stats")
    public Map<String, Object> getExecutionStats() {
        return executionService.getExecutionStats();
    }

    @PostMapping("/executions/{executionId}/cancel")
    public ResponseEntity<?> cancelExecution(@PathVariable String executionId, HttpSession session) {
        try {
            User currentUser = getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(401).build();
            }

            boolean cancelled = executionService.cancelExecution(executionId);
            if (cancelled) {
                return ResponseEntity.ok(Map.of("message", "Execution cancelled", "executionId", executionId));
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/executions/by-execution-id/{executionId}")
    public ResponseEntity<Map<String, Object>> updateExecutionStatus(@PathVariable String executionId,
                                                                    @RequestBody Map<String, Object> statusUpdate) {
        try {
            Map<String, Object> response = executionService.updateExecutionStatus(executionId, statusUpdate);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/executions/{id}")
    public ResponseEntity<?> deleteExecution(@PathVariable Long id, HttpSession session) {
        try {
            User currentUser = getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(401).build();
            }

            boolean deleted = executionService.deleteExecution(id);
            if (deleted) {
                return ResponseEntity.ok().build();
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> health = Map.of(
                "status", "healthy",
                "timestamp", System.currentTimeMillis(),
                "service", "UI Testing API"
        );
        return ResponseEntity.ok(health);
    }
}