package com.example.apitest.service;

import com.example.apitest.entity.UiTestFile;
import com.example.apitest.entity.UiTestScript;
import com.example.apitest.entity.User;
import com.example.apitest.repository.UiTestFileRepository;
import com.example.apitest.repository.UiTestScriptRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class UiTestFileService {

    @Autowired
    private UiTestFileRepository fileRepository;

    @Autowired
    private UiTestScriptRepository scriptRepository;

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    @org.springframework.beans.factory.annotation.Qualifier("uiTestExecutor")
    private java.util.concurrent.Executor uiTestExecutor;

    private static final String RUNNER_SERVER_URL = "http://localhost:3030";
    private static final String UPLOAD_DIR = "uploads/ui-tests";

    public List<Map<String, Object>> getFilesByScript(Long scriptId) {
        List<UiTestFile> files = fileRepository.findByScript_IdOrderByUploadedAtDesc(scriptId);
        return files.stream().map(this::convertToMap).collect(Collectors.toList());
    }

    public Optional<Map<String, Object>> getFile(Long fileId) {
        return fileRepository.findById(fileId)
                .map(this::convertToMap);
    }

    @Transactional
    public Map<String, Object> uploadFile(Long scriptId, MultipartFile file, User uploadedBy) {
        try {
            Optional<UiTestScript> scriptOpt = scriptRepository.findById(scriptId);
            if (!scriptOpt.isPresent()) {
                throw new RuntimeException("Script not found with id: " + scriptId);
            }

            UiTestScript script = scriptOpt.get();
            String fileName = file.getOriginalFilename();
            if (fileName == null) {
                throw new RuntimeException("File name is null");
            }

            // 업로드 디렉토리 생성 (script별로 분리)
            Path uploadPath = Paths.get(UPLOAD_DIR, "script-" + scriptId);
            Files.createDirectories(uploadPath);

            // 파일명 중복 방지를 위해 타임스탬프 추가
            String timestamp = String.valueOf(System.currentTimeMillis());
            String uniqueFileName = timestamp + "_" + fileName;
            Path filePath = uploadPath.resolve(uniqueFileName);

            // 파일을 실제 파일 시스템에 저장
            Files.write(filePath, file.getBytes());

            // UiTestFile 엔티티 생성 (파일 경로만 저장)
            UiTestFile testFile = new UiTestFile();
            testFile.setScript(script);
            testFile.setFileName(fileName);
            testFile.setFilePath(filePath.toString()); // 절대 경로 저장
            testFile.setFileSize(file.getSize());
            testFile.setStatus(UiTestFile.FileStatus.UPLOADED);
            testFile.setUploadedBy(uploadedBy);
            testFile.setUploadedAt(LocalDateTime.now());
            testFile.setUpdatedAt(LocalDateTime.now());

            UiTestFile savedFile = fileRepository.save(testFile);

            System.out.println("File saved to: " + filePath.toString());

            return convertToMap(savedFile);

        } catch (IOException e) {
            throw new RuntimeException("Failed to save file: " + e.getMessage());
        } catch (Exception e) {
            throw new RuntimeException("Failed to upload file: " + e.getMessage());
        }
    }

    @Transactional
    public boolean deleteFile(Long fileId) {
        Optional<UiTestFile> fileOpt = fileRepository.findById(fileId);
        if (fileOpt.isPresent()) {
            UiTestFile testFile = fileOpt.get();
            String fileName = testFile.getFileName();

            // 물리적 파일 삭제
            try {
                Path filePath = Paths.get(testFile.getFilePath());
                if (Files.exists(filePath)) {
                    Files.delete(filePath);
                    System.out.println("Physical file deleted: " + filePath.toString());
                }
            } catch (IOException e) {
                System.err.println("Failed to delete physical file: " + e.getMessage());
                // 물리적 파일 삭제 실패해도 DB 레코드는 삭제
            }

            // Runner에 결과 파일 삭제 요청 (비동기)
            try {
                restTemplate.delete(RUNNER_SERVER_URL + "/api/results/by-filename/" + fileName);
                System.out.println("Requested result cleanup for file: " + fileName);
            } catch (Exception e) {
                System.err.println("Failed to request result cleanup: " + e.getMessage());
                // 결과 삭제 실패해도 파일 삭제는 진행
            }

            // DB 레코드 삭제
            fileRepository.deleteById(fileId);
            return true;
        }
        return false;
    }

    public Map<String, Object> executeFile(Long fileId, User executedBy) {
        Optional<UiTestFile> fileOpt = fileRepository.findById(fileId);
        if (!fileOpt.isPresent()) {
            throw new RuntimeException("File not found with id: " + fileId);
        }

        UiTestFile testFile = fileOpt.get();
        UiTestScript script = testFile.getScript();
        String executionId = UUID.randomUUID().toString();

        try {
            // 실제 파일 경로를 직접 사용 (임시 파일 생성 불필요)
            Path filePath = Paths.get(testFile.getFilePath());
            // 절대 경로로 변환
            Path absolutePath = filePath.toAbsolutePath();

            // 파일 존재 여부 확인
            if (!Files.exists(absolutePath)) {
                throw new RuntimeException("File not found at path: " + absolutePath.toString());
            }

            // CRITICAL: script의 lazy-loaded 필드를 미리 읽어야 함 (async 스레드에서는 Session이 없음)
            Boolean headless = script.getHeadlessMode();
            Integer timeout = script.getTimeoutSeconds();
            String browser = script.getBrowserType().name().toLowerCase();
            String fileName = testFile.getFileName();

            // 실행 상태 업데이트 (executionId 저장) - 트랜잭션 분리
            updateFileStatusToRunning(fileId, executionId);

            // WebSocket으로 RUNNING 상태 즉시 브로드캐스트
            Map<String, Object> wsMessage = Map.of(
                "fileId", fileId,
                "status", "RUNNING",
                "result", "Execution ID: " + executionId,
                "timestamp", System.currentTimeMillis()
            );
            messagingTemplate.convertAndSend("/topic/ui-test-updates", wsMessage);
            System.out.println("WebSocket message sent (RUNNING): " + wsMessage);

            // 비동기로 Runner 실행 (Executor를 직접 사용)
            String finalAbsolutePath = absolutePath.toString();
            uiTestExecutor.execute(() -> {
                executeFileAsync(fileId, executionId, finalAbsolutePath, fileName, headless, timeout, browser);
            });

            // 즉시 응답 반환
            Map<String, Object> result = new HashMap<>();
            result.put("executionId", executionId);
            result.put("fileId", fileId);
            result.put("fileName", testFile.getFileName());
            result.put("status", "started");

            return result;

        } catch (Exception e) {
            updateFileStatusToFailed(fileId, "Error: " + e.getMessage());
            throw new RuntimeException("Failed to execute file: " + e.getMessage());
        }
    }

    @Transactional
    public void updateFileStatusToRunning(Long fileId, String executionId) {
        Optional<UiTestFile> fileOpt = fileRepository.findById(fileId);
        if (fileOpt.isPresent()) {
            UiTestFile testFile = fileOpt.get();
            testFile.setStatus(UiTestFile.FileStatus.RUNNING);
            testFile.setLastExecutedAt(LocalDateTime.now());
            testFile.setLastExecutionResult("Execution ID: " + executionId);
            fileRepository.save(testFile);
        }
    }

    @Transactional
    public void updateFileStatusToFailed(Long fileId, String errorMessage) {
        Optional<UiTestFile> fileOpt = fileRepository.findById(fileId);
        if (fileOpt.isPresent()) {
            UiTestFile testFile = fileOpt.get();
            testFile.setStatus(UiTestFile.FileStatus.FAILED);
            testFile.setLastExecutionResult(errorMessage);
            fileRepository.save(testFile);
        }
    }

    public void executeFileAsync(Long fileId, String executionId, String absolutePath, String fileName,
                                 Boolean headless, Integer timeoutSeconds, String browser) {
        try {
            // Runner에 실행 요청
            Map<String, Object> request = new HashMap<>();
            request.put("scriptId", executionId);
            request.put("scriptPath", absolutePath);
            request.put("fileName", fileName);
            request.put("fileId", fileId);
            request.put("callbackUrl", "http://localhost:3020/api/ui-tests/files/" + fileId + "/callback");

            Map<String, Object> options = new HashMap<>();
            options.put("headless", headless);
            options.put("timeout", timeoutSeconds * 1000);
            options.put("browser", browser);
            request.put("options", options);

            // 디버그 로그 추가
            System.out.println("=== [Async Thread] Sending request to Runner ===");
            System.out.println("Request data: " + request);
            System.out.println("Using absolute file path: " + absolutePath);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    RUNNER_SERVER_URL + "/api/execute",
                    entity,
                    Map.class
            );

            System.out.println("Runner response: " + response.getBody());

        } catch (Exception e) {
            System.err.println("Failed to execute file async: " + e.getMessage());
            updateFileStatusToFailed(fileId, "Error: " + e.getMessage());

            // WebSocket으로 FAILED 상태 브로드캐스트
            Map<String, Object> wsMessage = Map.of(
                "fileId", fileId,
                "status", "FAILED",
                "result", "Error: " + e.getMessage(),
                "timestamp", System.currentTimeMillis()
            );
            messagingTemplate.convertAndSend("/topic/ui-test-updates", wsMessage);
        }
    }

    @Transactional
    public boolean stopFile(Long fileId) {
        Optional<UiTestFile> fileOpt = fileRepository.findById(fileId);
        if (!fileOpt.isPresent()) {
            return false;
        }

        UiTestFile testFile = fileOpt.get();

        // executionId 추출 (lastExecutionResult에서)
        String executionId = extractExecutionId(testFile.getLastExecutionResult());

        if (executionId != null) {
            try {
                // Runner에 중지 요청
                restTemplate.delete(RUNNER_SERVER_URL + "/api/execute/" + executionId);
                System.out.println("Sent stop request to Runner for executionId: " + executionId);
            } catch (Exception e) {
                System.err.println("Failed to stop Runner execution: " + e.getMessage());
                // Runner 중지 실패해도 DB 상태는 업데이트
            }
        }

        // DB 상태 업데이트
        testFile.setStatus(UiTestFile.FileStatus.UPLOADED);
        testFile.setLastExecutionResult("Execution stopped by user");
        fileRepository.save(testFile);

        return true;
    }

    private String extractExecutionId(String lastExecutionResult) {
        if (lastExecutionResult != null && lastExecutionResult.startsWith("Execution ID: ")) {
            return lastExecutionResult.substring("Execution ID: ".length()).split("\n")[0].trim();
        }
        return null;
    }

    @Transactional
    public void updateFileStatus(Long fileId, UiTestFile.FileStatus status, String result) {
        Optional<UiTestFile> fileOpt = fileRepository.findById(fileId);
        if (fileOpt.isPresent()) {
            UiTestFile testFile = fileOpt.get();
            testFile.setStatus(status);
            if (result != null) {
                testFile.setLastExecutionResult(result);
            }
            fileRepository.save(testFile);
        }
    }

    @Transactional
    public int stopAllRunningFiles(Long scriptId) {
        List<UiTestFile> runningFiles = fileRepository.findByScript_IdOrderByUploadedAtDesc(scriptId)
                .stream()
                .filter(file -> file.getStatus() == UiTestFile.FileStatus.RUNNING)
                .collect(Collectors.toList());

        for (UiTestFile file : runningFiles) {
            // executionId 추출 (lastExecutionResult에서)
            String executionId = extractExecutionId(file.getLastExecutionResult());

            if (executionId != null) {
                try {
                    // Runner에 중지 요청
                    restTemplate.delete(RUNNER_SERVER_URL + "/api/execute/" + executionId);
                    System.out.println("Sent stop request to Runner for executionId: " + executionId);
                } catch (Exception e) {
                    System.err.println("Failed to stop Runner execution for fileId " + file.getId() + ": " + e.getMessage());
                    // Runner 중지 실패해도 DB 상태는 업데이트
                }
            }

            // DB 상태 업데이트
            file.setStatus(UiTestFile.FileStatus.UPLOADED);
            file.setLastExecutionResult("Execution stopped by user");
            fileRepository.save(file);
        }

        System.out.println("Stopped " + runningFiles.size() + " running files for script " + scriptId);
        return runningFiles.size();
    }

    private Map<String, Object> convertToMap(UiTestFile file) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", file.getId());
        map.put("scriptId", file.getScript().getId());
        map.put("fileName", file.getFileName());
        map.put("fileSize", file.getFileSize());
        map.put("status", file.getStatus().name());
        map.put("lastExecutionResult", file.getLastExecutionResult());
        map.put("lastExecutedAt", file.getLastExecutedAt());
        map.put("uploadedAt", file.getUploadedAt());
        map.put("updatedAt", file.getUpdatedAt());

        if (file.getUploadedBy() != null) {
            map.put("uploadedBy", file.getUploadedBy().getEmail());
        }

        return map;
    }
}
