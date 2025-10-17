package com.example.apitest.controller;

import com.example.apitest.entity.User;
import com.example.apitest.service.AuthService;
import com.example.apitest.service.UiTestScriptService;
import com.example.apitest.service.UiTestFolderService;
import com.example.apitest.service.UiTestExecutionService;
import com.example.apitest.service.UiTestFileService;
import com.example.apitest.service.ActivityLoggingService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
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
    public ResponseEntity<Map<String, Object>> createFolder(@RequestBody Map<String, Object> folderData,
                                                           HttpSession session, HttpServletRequest request) {
        try {
            User currentUser = getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(401).build();
            }

            Map<String, Object> response = folderService.createFolder(folderData, currentUser);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
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
    public ResponseEntity<Map<String, Object>> uploadFile(@PathVariable Long scriptId,
                                                          @RequestParam("file") MultipartFile file,
                                                          HttpSession session) {
        try {
            User currentUser = getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(401).build();
            }

            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
            }

            // 파일 확장자 검증
            String fileName = file.getOriginalFilename();
            if (fileName == null || !isValidTestFile(fileName)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid file type. Only .js, .ts, .spec.js, .spec.ts, .test.js, .test.ts files are allowed"));
            }

            Map<String, Object> response = fileService.uploadFile(scriptId, file, currentUser);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
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
    public ResponseEntity<Map<String, Object>> executeFile(@PathVariable Long id,
                                                           HttpSession session) {
        try {
            User currentUser = getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(401).build();
            }

            Map<String, Object> response = fileService.executeFile(id, currentUser);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
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

    private boolean isValidTestFile(String fileName) {
        String lowerCaseFileName = fileName.toLowerCase();
        return lowerCaseFileName.endsWith(".js") ||
               lowerCaseFileName.endsWith(".ts") ||
               lowerCaseFileName.endsWith(".spec.js") ||
               lowerCaseFileName.endsWith(".spec.ts") ||
               lowerCaseFileName.endsWith(".test.js") ||
               lowerCaseFileName.endsWith(".test.ts");
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