package com.example.apitest.controller;

import com.example.apitest.entity.User;
import com.example.apitest.service.AuthService;
import com.example.apitest.service.UiTestScriptService;
import com.example.apitest.service.UiTestFolderService;
import com.example.apitest.service.UiTestExecutionService;
import com.example.apitest.service.ActivityLoggingService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
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
    private ActivityLoggingService activityLoggingService;

    @Autowired
    private AuthService authService;

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

    @PostMapping("/scripts/upload")
    public ResponseEntity<Map<String, Object>> uploadScript(@RequestParam("file") MultipartFile file,
                                                           @RequestParam(value = "folderId", required = false) Long folderId,
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

            Map<String, Object> response = scriptService.uploadScript(file, folderId, currentUser);
            return ResponseEntity.ok(response);
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