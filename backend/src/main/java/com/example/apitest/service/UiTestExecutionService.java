package com.example.apitest.service;

import com.example.apitest.entity.UiTestExecution;
import com.example.apitest.entity.UiTestScript;
import com.example.apitest.entity.User;
import com.example.apitest.repository.UiTestExecutionRepository;
import com.example.apitest.repository.UiTestScriptRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UiTestExecutionService {

    @Autowired
    private UiTestExecutionRepository executionRepository;

    @Autowired
    private UiTestScriptRepository scriptRepository;

    @Autowired
    private RestTemplate restTemplate;

    private static final String RUNNER_SERVER_URL = "http://localhost:3002";

    public List<Map<String, Object>> getAllExecutions() {
        List<UiTestExecution> executions = executionRepository.findAll();
        return executions.stream().map(this::convertToMap).collect(Collectors.toList());
    }

    public Optional<Map<String, Object>> getExecution(Long id) {
        return executionRepository.findById(id)
                .map(this::convertToMap);
    }

    public Optional<Map<String, Object>> getExecutionByExecutionId(String executionId) {
        return executionRepository.findByExecutionId(executionId)
                .map(this::convertToMap);
    }

    public List<Map<String, Object>> getExecutionsByScript(Long scriptId) {
        Optional<UiTestScript> script = scriptRepository.findById(scriptId);
        if (script.isPresent()) {
            List<UiTestExecution> executions = executionRepository.findByScriptOrderByCreatedAtDesc(script.get());
            return executions.stream().map(this::convertToMap).collect(Collectors.toList());
        }
        return List.of();
    }

    public Page<Map<String, Object>> getExecutionsByScript(Long scriptId, int page, int size) {
        Optional<UiTestScript> script = scriptRepository.findById(scriptId);
        if (script.isPresent()) {
            Pageable pageable = PageRequest.of(page, size);
            Page<UiTestExecution> executions = executionRepository.findByScriptOrderByCreatedAtDesc(script.get(), pageable);
            return executions.map(this::convertToMap);
        }
        return Page.empty();
    }

    public List<Map<String, Object>> getExecutionsByUser(User user) {
        List<UiTestExecution> executions = executionRepository.findByExecutedByOrderByCreatedAtDesc(user);
        return executions.stream().map(this::convertToMap).collect(Collectors.toList());
    }

    public List<Map<String, Object>> getRunningExecutions() {
        List<UiTestExecution.ExecutionStatus> runningStatuses = List.of(
                UiTestExecution.ExecutionStatus.PENDING,
                UiTestExecution.ExecutionStatus.RUNNING
        );
        List<UiTestExecution> executions = executionRepository.findByStatusInOrderByCreatedAtDesc(runningStatuses);
        return executions.stream().map(this::convertToMap).collect(Collectors.toList());
    }

    public Map<String, Object> getExecutionStats() {
        Map<String, Object> stats = new HashMap<>();

        stats.put("totalExecutions", executionRepository.count());
        stats.put("completedExecutions", executionRepository.countByStatus(UiTestExecution.ExecutionStatus.COMPLETED));
        stats.put("failedExecutions", executionRepository.countByStatus(UiTestExecution.ExecutionStatus.FAILED));
        stats.put("runningExecutions", executionRepository.countByStatus(UiTestExecution.ExecutionStatus.RUNNING));
        stats.put("pendingExecutions", executionRepository.countByStatus(UiTestExecution.ExecutionStatus.PENDING));

        return stats;
    }

    @Transactional
    public Map<String, Object> updateExecutionStatus(String executionId, Map<String, Object> statusUpdate) {
        Optional<UiTestExecution> executionOpt = executionRepository.findByExecutionId(executionId);

        if (!executionOpt.isPresent()) {
            throw new RuntimeException("Execution not found: " + executionId);
        }

        UiTestExecution execution = executionOpt.get();

        if (statusUpdate.containsKey("status")) {
            String statusStr = (String) statusUpdate.get("status");
            execution.setStatus(UiTestExecution.ExecutionStatus.valueOf(statusStr.toUpperCase()));
        }

        if (statusUpdate.containsKey("startedAt")) {
            execution.setStartedAt(LocalDateTime.parse((String) statusUpdate.get("startedAt")));
        }

        if (statusUpdate.containsKey("finishedAt")) {
            execution.setFinishedAt(LocalDateTime.parse((String) statusUpdate.get("finishedAt")));
        }

        if (statusUpdate.containsKey("durationMs")) {
            execution.setDurationMs(Long.valueOf(statusUpdate.get("durationMs").toString()));
        }

        if (statusUpdate.containsKey("testResults")) {
            execution.setTestResults((String) statusUpdate.get("testResults"));
        }

        if (statusUpdate.containsKey("errorMessage")) {
            execution.setErrorMessage((String) statusUpdate.get("errorMessage"));
        }

        if (statusUpdate.containsKey("screenshotPaths")) {
            execution.setScreenshotPaths((String) statusUpdate.get("screenshotPaths"));
        }

        if (statusUpdate.containsKey("traceFilePath")) {
            execution.setTraceFilePath((String) statusUpdate.get("traceFilePath"));
        }

        if (statusUpdate.containsKey("browserLogs")) {
            execution.setBrowserLogs((String) statusUpdate.get("browserLogs"));
        }

        if (statusUpdate.containsKey("passedTests")) {
            execution.setPassedTests((Integer) statusUpdate.get("passedTests"));
        }

        if (statusUpdate.containsKey("failedTests")) {
            execution.setFailedTests((Integer) statusUpdate.get("failedTests"));
        }

        if (statusUpdate.containsKey("skippedTests")) {
            execution.setSkippedTests((Integer) statusUpdate.get("skippedTests"));
        }

        UiTestExecution updatedExecution = executionRepository.save(execution);
        return convertToMap(updatedExecution);
    }

    public boolean cancelExecution(String executionId) {
        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    RUNNER_SERVER_URL + "/api/test/cancel/" + executionId,
                    null,
                    Map.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                Optional<UiTestExecution> executionOpt = executionRepository.findByExecutionId(executionId);
                if (executionOpt.isPresent()) {
                    UiTestExecution execution = executionOpt.get();
                    execution.setStatus(UiTestExecution.ExecutionStatus.CANCELLED);
                    execution.setFinishedAt(LocalDateTime.now());
                    executionRepository.save(execution);
                }
                return true;
            }
            return false;
        } catch (Exception e) {
            return false;
        }
    }

    @Transactional
    public boolean deleteExecution(Long id) {
        if (executionRepository.existsById(id)) {
            executionRepository.deleteById(id);
            return true;
        }
        return false;
    }

    private Map<String, Object> convertToMap(UiTestExecution execution) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", execution.getId());
        map.put("executionId", execution.getExecutionId());
        map.put("status", execution.getStatus().name());
        map.put("startedAt", execution.getStartedAt());
        map.put("finishedAt", execution.getFinishedAt());
        map.put("durationMs", execution.getDurationMs());
        map.put("testResults", execution.getTestResults());
        map.put("errorMessage", execution.getErrorMessage());
        map.put("screenshotPaths", execution.getScreenshotPaths());
        map.put("traceFilePath", execution.getTraceFilePath());
        map.put("browserLogs", execution.getBrowserLogs());
        map.put("passedTests", execution.getPassedTests());
        map.put("failedTests", execution.getFailedTests());
        map.put("skippedTests", execution.getSkippedTests());
        map.put("createdAt", execution.getCreatedAt());

        if (execution.getScript() != null) {
            UiTestScript script = execution.getScript();
            map.put("scriptId", script.getId());
            map.put("scriptName", script.getName());
            map.put("scriptType", script.getScriptType().name());
            map.put("browserType", script.getBrowserType().name());
        }

        if (execution.getExecutedBy() != null) {
            map.put("executedBy", execution.getExecutedBy().getEmail());
        }

        return map;
    }
}