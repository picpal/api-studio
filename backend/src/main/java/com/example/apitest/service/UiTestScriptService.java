package com.example.apitest.service;

import com.example.apitest.entity.UiTestScript;
import com.example.apitest.entity.UiTestFolder;
import com.example.apitest.entity.UiTestExecution;
import com.example.apitest.entity.User;
import com.example.apitest.repository.UiTestScriptRepository;
import com.example.apitest.repository.UiTestFolderRepository;
import com.example.apitest.repository.UiTestExecutionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class UiTestScriptService {

    @Autowired
    private UiTestScriptRepository scriptRepository;

    @Autowired
    private UiTestFolderRepository folderRepository;

    @Autowired
    private UiTestExecutionRepository executionRepository;

    @Autowired
    private RestTemplate restTemplate;

    private static final String RUNNER_SERVER_URL = "http://localhost:3002";

    public List<Map<String, Object>> getAllScripts() {
        List<UiTestScript> scripts = scriptRepository.findAll();
        return scripts.stream().map(this::convertToMap).collect(Collectors.toList());
    }

    public Optional<Map<String, Object>> getScript(Long id) {
        return scriptRepository.findById(id)
                .map(this::convertToMap);
    }

    public List<Map<String, Object>> getScriptsByFolder(Long folderId) {
        List<UiTestScript> scripts = scriptRepository.findByFolderIdOrderByNameAsc(folderId);
        return scripts.stream().map(this::convertToMap).collect(Collectors.toList());
    }

    public List<Map<String, Object>> searchScripts(String keyword) {
        List<UiTestScript> scripts = scriptRepository.findByKeyword(keyword);
        return scripts.stream().map(this::convertToMap).collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> createScript(Map<String, Object> scriptData, User createdBy) {
        UiTestScript script = new UiTestScript();
        script.setName((String) scriptData.get("name"));
        script.setDescription((String) scriptData.get("description"));
        script.setScriptContent((String) scriptData.get("scriptContent"));
        script.setCreatedBy(createdBy);

        // Set folder
        Object folderIdObj = scriptData.get("folderId");
        if (folderIdObj != null) {
            Long folderId = Long.valueOf(folderIdObj.toString());
            Optional<UiTestFolder> folder = folderRepository.findById(folderId);
            folder.ifPresent(script::setFolder);
        }

        // Set optional fields
        if (scriptData.containsKey("scriptType")) {
            script.setScriptType(UiTestScript.ScriptType.valueOf((String) scriptData.get("scriptType")));
        }
        if (scriptData.containsKey("browserType")) {
            script.setBrowserType(UiTestScript.BrowserType.valueOf((String) scriptData.get("browserType")));
        }
        if (scriptData.containsKey("timeoutSeconds")) {
            script.setTimeoutSeconds((Integer) scriptData.get("timeoutSeconds"));
        }
        if (scriptData.containsKey("headlessMode")) {
            script.setHeadlessMode((Boolean) scriptData.get("headlessMode"));
        }
        if (scriptData.containsKey("screenshotOnFailure")) {
            script.setScreenshotOnFailure((Boolean) scriptData.get("screenshotOnFailure"));
        }

        UiTestScript savedScript = scriptRepository.save(script);
        return convertToMap(savedScript);
    }

    @Transactional
    public Optional<Map<String, Object>> updateScript(Long id, Map<String, Object> scriptDetails) {
        return scriptRepository.findById(id)
                .map(script -> {
                    if (scriptDetails.containsKey("name")) {
                        script.setName((String) scriptDetails.get("name"));
                    }
                    if (scriptDetails.containsKey("description")) {
                        script.setDescription((String) scriptDetails.get("description"));
                    }
                    if (scriptDetails.containsKey("scriptContent")) {
                        script.setScriptContent((String) scriptDetails.get("scriptContent"));
                    }
                    if (scriptDetails.containsKey("folderId")) {
                        Long folderId = Long.valueOf(scriptDetails.get("folderId").toString());
                        Optional<UiTestFolder> folder = folderRepository.findById(folderId);
                        folder.ifPresent(script::setFolder);
                    }
                    if (scriptDetails.containsKey("scriptType")) {
                        script.setScriptType(UiTestScript.ScriptType.valueOf((String) scriptDetails.get("scriptType")));
                    }
                    if (scriptDetails.containsKey("browserType")) {
                        script.setBrowserType(UiTestScript.BrowserType.valueOf((String) scriptDetails.get("browserType")));
                    }
                    if (scriptDetails.containsKey("timeoutSeconds")) {
                        script.setTimeoutSeconds((Integer) scriptDetails.get("timeoutSeconds"));
                    }
                    if (scriptDetails.containsKey("headlessMode")) {
                        script.setHeadlessMode((Boolean) scriptDetails.get("headlessMode"));
                    }
                    if (scriptDetails.containsKey("screenshotOnFailure")) {
                        script.setScreenshotOnFailure((Boolean) scriptDetails.get("screenshotOnFailure"));
                    }

                    UiTestScript updatedScript = scriptRepository.save(script);
                    return convertToMap(updatedScript);
                });
    }

    @Transactional
    public boolean deleteScript(Long id) {
        if (scriptRepository.existsById(id)) {
            Optional<UiTestScript> script = scriptRepository.findById(id);
            if (script.isPresent()) {
                executionRepository.deleteByScript(script.get());
            }
            scriptRepository.deleteById(id);
            return true;
        }
        return false;
    }

    @Transactional
    public Map<String, Object> uploadScript(MultipartFile file, Long folderId, User createdBy) {
        try {
            String fileName = file.getOriginalFilename();
            if (fileName == null) {
                throw new RuntimeException("File name is null");
            }

            // 파일 내용을 읽어옴
            String scriptContent = new String(file.getBytes(), StandardCharsets.UTF_8);

            // 새로운 스크립트 엔티티 생성
            UiTestScript script = new UiTestScript();
            script.setName(fileName);
            script.setDescription("Uploaded script: " + fileName);
            script.setScriptContent(scriptContent);
            script.setScriptType(determineScriptType(fileName));
            script.setBrowserType(UiTestScript.BrowserType.CHROMIUM); // 기본값
            script.setTimeoutSeconds(30); // 기본값
            script.setHeadlessMode(true); // 기본값
            script.setScreenshotOnFailure(true); // 기본값
            script.setCreatedBy(createdBy);
            script.setCreatedAt(LocalDateTime.now());
            script.setUpdatedAt(LocalDateTime.now());

            // 폴더 설정 (선택사항)
            if (folderId != null) {
                Optional<UiTestFolder> folder = folderRepository.findById(folderId);
                folder.ifPresent(script::setFolder);
            }

            // 스크립트 저장
            UiTestScript savedScript = scriptRepository.save(script);

            return convertToMap(savedScript);

        } catch (IOException e) {
            throw new RuntimeException("Failed to read file content: " + e.getMessage());
        } catch (Exception e) {
            throw new RuntimeException("Failed to upload script: " + e.getMessage());
        }
    }

    private UiTestScript.ScriptType determineScriptType(String fileName) {
        String lowerCaseFileName = fileName.toLowerCase();

        // Playwright 파일 패턴
        if (lowerCaseFileName.contains("playwright") ||
            lowerCaseFileName.endsWith(".spec.js") ||
            lowerCaseFileName.endsWith(".spec.ts")) {
            return UiTestScript.ScriptType.PLAYWRIGHT;
        }

        // Cypress 파일 패턴
        if (lowerCaseFileName.contains("cypress") ||
            lowerCaseFileName.contains("cy.")) {
            return UiTestScript.ScriptType.CYPRESS;
        }

        // Selenium 파일 패턴
        if (lowerCaseFileName.contains("selenium") ||
            lowerCaseFileName.contains("webdriver")) {
            return UiTestScript.ScriptType.SELENIUM;
        }

        // 기본값은 Playwright
        return UiTestScript.ScriptType.PLAYWRIGHT;
    }

    @Transactional
    public Map<String, Object> executeScript(Long scriptId, User executedBy) {
        Optional<UiTestScript> scriptOpt = scriptRepository.findById(scriptId);
        if (!scriptOpt.isPresent()) {
            throw new RuntimeException("Script not found with id: " + scriptId);
        }

        UiTestScript script = scriptOpt.get();
        String executionId = UUID.randomUUID().toString();

        UiTestExecution execution = new UiTestExecution();
        execution.setExecutionId(executionId);
        execution.setScript(script);
        execution.setExecutedBy(executedBy);
        execution.setStatus(UiTestExecution.ExecutionStatus.PENDING);
        execution.setStartedAt(LocalDateTime.now());

        UiTestExecution savedExecution = executionRepository.save(execution);

        try {
            Map<String, Object> request = new HashMap<>();
            request.put("scriptId", executionId);
            request.put("scriptPath", "/tmp/ui_test_" + executionId + ".js");
            request.put("fileName", script.getName());

            Map<String, Object> options = new HashMap<>();
            options.put("headless", script.getHeadlessMode());
            options.put("timeout", script.getTimeoutSeconds() * 1000);
            options.put("browserName", script.getBrowserType().name().toLowerCase());
            options.put("screenshot", script.getScreenshotOnFailure());
            request.put("options", options);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    RUNNER_SERVER_URL + "/api/test/execute",
                    entity,
                    Map.class
            );

            Map<String, Object> result = new HashMap<>();
            result.put("executionId", executionId);
            result.put("scriptId", scriptId);
            result.put("status", "started");
            result.put("runnerResponse", response.getBody());

            return result;

        } catch (Exception e) {
            execution.setStatus(UiTestExecution.ExecutionStatus.FAILED);
            execution.setErrorMessage(e.getMessage());
            execution.setFinishedAt(LocalDateTime.now());
            executionRepository.save(execution);
            throw new RuntimeException("Failed to execute script: " + e.getMessage());
        }
    }

    public String getFolderName(Long folderId) {
        if (folderId == null) {
            return "Root";
        }
        return folderRepository.findById(folderId)
                .map(UiTestFolder::getName)
                .orElse("Unknown");
    }

    private Map<String, Object> convertToMap(UiTestScript script) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", script.getId());
        map.put("name", script.getName());
        map.put("description", script.getDescription());
        map.put("scriptContent", script.getScriptContent());
        map.put("scriptType", script.getScriptType().name());
        map.put("browserType", script.getBrowserType().name());
        map.put("timeoutSeconds", script.getTimeoutSeconds());
        map.put("headlessMode", script.getHeadlessMode());
        map.put("screenshotOnFailure", script.getScreenshotOnFailure());
        map.put("createdAt", script.getCreatedAt());
        map.put("updatedAt", script.getUpdatedAt());

        if (script.getFolder() != null) {
            map.put("folderId", script.getFolder().getId());
            map.put("folderName", script.getFolder().getName());
        }

        if (script.getCreatedBy() != null) {
            map.put("createdBy", script.getCreatedBy().getEmail());
        }

        return map;
    }
}