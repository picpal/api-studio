package com.example.apitest.service;

import com.example.apitest.entity.*;
import com.example.apitest.repository.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.web.client.RestTemplate;

import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.CookieManager;
import java.net.CookiePolicy;
import java.net.URI;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@Transactional
public class PipelineExecutionService {
    
    private static final Logger logger = LoggerFactory.getLogger(PipelineExecutionService.class);

    @Autowired
    private PipelineRepository pipelineRepository;

    @Autowired
    private PipelineStepRepository pipelineStepRepository;

    @Autowired
    private PipelineExecutionRepository pipelineExecutionRepository;

    @Autowired
    private StepExecutionRepository stepExecutionRepository;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient;
    
    public PipelineExecutionService() {
        // Initialize HttpClient with cookie management
        CookieManager cookieManager = new CookieManager();
        cookieManager.setCookiePolicy(CookiePolicy.ACCEPT_ALL);
        this.httpClient = HttpClient.newBuilder()
                .cookieHandler(cookieManager)
                .build();
    }

    @Transactional
    public PipelineExecution startExecution(Long pipelineId) {
        
        // Get pipeline and its steps
        Optional<Pipeline> pipelineOpt = pipelineRepository.findById(pipelineId);
        if (!pipelineOpt.isPresent()) {
            throw new RuntimeException("Pipeline not found: " + pipelineId);
        }

        Pipeline pipeline = pipelineOpt.get();
        List<PipelineStep> steps = pipelineStepRepository.findByIsActiveTrueAndPipelineIdOrderByStepOrderAsc(pipelineId);
        
        // Force initialization of ApiItem proxies to avoid lazy loading issues
        for (PipelineStep step : steps) {
            if (step.getApiItem() != null) {
                // Force complete initialization by accessing multiple properties
                ApiItem apiItem = step.getApiItem();
                apiItem.getId();
                apiItem.getUrl();
                apiItem.getMethod();
                apiItem.getRequestHeaders();
                apiItem.getRequestBody();
            }
        }
        
        if (steps.isEmpty()) {
            throw new RuntimeException("No active steps found for pipeline: " + pipelineId);
        }

        // Create execution record with proper transaction
        PipelineExecution execution = new PipelineExecution(pipeline);
        execution.setTotalSteps(steps.size());
        execution = pipelineExecutionRepository.save(execution);
        
        // Ensure the execution is properly saved before using it
        pipelineExecutionRepository.flush();


        // Execute steps synchronously for now to test core functionality
        try {
            executeStepsWithId(execution.getId(), steps);
        } catch (Exception e) {
            // Pipeline execution failed, log error and clean up
            e.printStackTrace();
            execution.setStatus(PipelineExecution.ExecutionStatus.FAILED);
            execution.setErrorMessage(e.getMessage());
            execution.setCompletedAt(LocalDateTime.now());
            pipelineExecutionRepository.save(execution);
            
            // Clean up any remaining session data on failure
        }

        return execution;
    }


    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void executeStepsWithId(Long executionId, List<PipelineStep> steps) {
        
        // Get execution entity from database
        PipelineExecution execution = pipelineExecutionRepository.findById(executionId)
            .orElseThrow(() -> new RuntimeException("Pipeline execution not found: " + executionId));
        
        // Create dedicated HttpClient for this pipeline execution to maintain session
        CookieManager cookieManager = new CookieManager();
        cookieManager.setCookiePolicy(CookiePolicy.ACCEPT_ALL);
        HttpClient sessionHttpClient = HttpClient.newBuilder()
                .cookieHandler(cookieManager)
                .build();
        
        // Initialize with empty context for first step
        Map<String, Object> stepContext = new HashMap<>();
        stepContext.put("httpClient", sessionHttpClient);
        
        for (PipelineStep step : steps) {
            
            // Skip step if it's marked as skip
            if (step.getIsSkip() != null && step.getIsSkip()) {
                // Create step execution record but mark it as skipped
                StepExecution stepExecution = new StepExecution(execution, step);
                stepExecution.setStatus(StepExecution.StepStatus.SKIPPED);
                stepExecution.setStartedAt(LocalDateTime.now());
                stepExecution.setCompletedAt(LocalDateTime.now());
                stepExecutionRepository.save(stepExecution);
                
                // Update counters
                execution.setCompletedSteps(execution.getCompletedSteps() + 1);
                continue;
            }
            
            // Create step execution record
            StepExecution stepExecution = new StepExecution(execution, step);
            stepExecution.setStatus(StepExecution.StepStatus.RUNNING);
            stepExecution = stepExecutionRepository.save(stepExecution);

            try {
                // Execute the step with current context
                Map<String, Object> extractedData = executeStep(stepExecution, stepContext);
                
                // Update counters
                execution.setCompletedSteps(execution.getCompletedSteps() + 1);
                execution.setSuccessfulSteps(execution.getSuccessfulSteps() + 1);
                
                // Create new context for next step with only extracted data and httpClient
                Map<String, Object> nextStepContext = new HashMap<>();
                nextStepContext.put("httpClient", sessionHttpClient);
                if (extractedData != null && !extractedData.isEmpty()) {
                    nextStepContext.putAll(extractedData);
                }
                stepContext = nextStepContext;
                
            } catch (Exception e) {
                // Step failed, mark as failed and continue cleanup
                
                // Mark step as failed
                stepExecution.setStatus(StepExecution.StepStatus.FAILED);
                stepExecution.setErrorMessage(e.getMessage());
                stepExecution.setCompletedAt(LocalDateTime.now());
                stepExecutionRepository.save(stepExecution);
                
                // Update counters
                execution.setCompletedSteps(execution.getCompletedSteps() + 1);
                execution.setFailedSteps(execution.getFailedSteps() + 1);
                
                // Fail entire pipeline if any step fails
                execution.setStatus(PipelineExecution.ExecutionStatus.FAILED);
                execution.setErrorMessage("Step " + step.getStepOrder() + " failed: " + e.getMessage());
                execution.setCompletedAt(LocalDateTime.now());
                pipelineExecutionRepository.save(execution);
                
                // Clean up cookies on step failure
                try {
                    CookieManager stepFailureCookieManager = (CookieManager) sessionHttpClient.cookieHandler().orElse(null);
                    if (stepFailureCookieManager != null) {
                        stepFailureCookieManager.getCookieStore().removeAll();
                    }
                } catch (Exception cleanupError) {
                    // Failed to clean up cookies after step failure
                }
                return;
            }
            
            pipelineExecutionRepository.save(execution);
            
            // Add delay if specified
            if (step.getDelayAfter() != null && step.getDelayAfter() > 0) {
                try {
                    Thread.sleep(step.getDelayAfter());
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    return;
                }
            }
        }
        
        // Save session cookies for debugging purposes only (optional)
        try {
            CookieManager executionCookieManager = (CookieManager) sessionHttpClient.cookieHandler().orElse(null);
            if (executionCookieManager != null) {
                // Extract and store cookies temporarily for debugging
                StringBuilder cookiesString = new StringBuilder();
                executionCookieManager.getCookieStore().getCookies().forEach(cookie -> {
                    if (cookiesString.length() > 0) {
                        cookiesString.append("; ");
                    }
                    cookiesString.append(cookie.getName()).append("=").append(cookie.getValue());
                });
                
                if (cookiesString.length() > 0) {
                    // Only save if needed for debugging - normally we clean up after execution
                    // execution.setSessionCookies(cookiesString.toString());
                }
                
                // Clean up cookies from memory after execution completion
                executionCookieManager.getCookieStore().removeAll();
            }
        } catch (Exception e) {
            // Failed to handle session cookies
        }
        
        // Mark as completed
        execution.setStatus(PipelineExecution.ExecutionStatus.COMPLETED);
        execution.setCompletedAt(LocalDateTime.now());
        pipelineExecutionRepository.save(execution);
        
    }

    private Map<String, Object> executeStep(StepExecution stepExecution, Map<String, Object> executionContext) throws Exception {
        PipelineStep step = stepExecution.getPipelineStep();
        ApiItem apiItem = step.getApiItem();
        HttpClient sessionHttpClient = (HttpClient) executionContext.get("httpClient");
        
        
        long startTime = System.currentTimeMillis();
        
        try {
            // Prepare request
            logger.info("=== URL TEMPLATE PROCESSING ===");
            logger.info("Original URL: " + apiItem.getUrl());
            logger.info("Context before processing: " + executionContext);
            String url = processTemplate(apiItem.getUrl(), executionContext);
            logger.info("Processed URL: " + url);
            logger.info("=== END URL TEMPLATE PROCESSING ===");
            String method = apiItem.getMethod().toString().toLowerCase();
            
            // Build request headers
            Map<String, String> headerMap = new HashMap<>();
            if (apiItem.getRequestHeaders() != null && !apiItem.getRequestHeaders().trim().isEmpty()) {
                JsonNode headersNode = objectMapper.readTree(apiItem.getRequestHeaders());
                headersNode.fields().forEachRemaining(entry -> {
                    String value = processTemplate(entry.getValue().asText(), executionContext);
                    headerMap.put(entry.getKey(), value);
                });
            }
            
            // Prepare body
            String bodyString = null;
            if (apiItem.getRequestBody() != null && !apiItem.getRequestBody().trim().isEmpty()) {
                bodyString = processTemplate(apiItem.getRequestBody(), executionContext);
                
                // Set content type if not already set
                if (!headerMap.containsKey("Content-Type") && !headerMap.containsKey("content-type")) {
                    try {
                        // Try to parse as JSON
                        objectMapper.readValue(bodyString, Object.class);
                        headerMap.put("Content-Type", "application/json");
                    } catch (Exception e) {
                        // Use as text if not valid JSON
                        headerMap.put("Content-Type", "text/plain");
                    }
                }
            }
            
            // Handle query parameters for GET requests
            if ("get".equals(method) && apiItem.getRequestParams() != null && !apiItem.getRequestParams().trim().isEmpty()) {
                JsonNode paramsNode = objectMapper.readTree(apiItem.getRequestParams());
                StringBuilder urlWithParams = new StringBuilder(url);
                
                // Only add parameters if there are any
                boolean hasParams = false;
                Iterator<Map.Entry<String, JsonNode>> fields = paramsNode.fields();
                
                while (fields.hasNext()) {
                    Map.Entry<String, JsonNode> entry = fields.next();
                    String value = processTemplate(entry.getValue().asText(), executionContext);
                    
                    // Skip empty parameters
                    if (value != null && !value.trim().isEmpty()) {
                        if (!hasParams) {
                            urlWithParams.append("?");
                            hasParams = true;
                        } else {
                            urlWithParams.append("&");
                        }
                        urlWithParams.append(entry.getKey()).append("=").append(value);
                    }
                }
                
                url = urlWithParams.toString();
            }
            
            // Build HttpRequest
            HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                    .uri(URI.create(url));
            
            // Add headers
            for (Map.Entry<String, String> header : headerMap.entrySet()) {
                requestBuilder.header(header.getKey(), header.getValue());
            }
            
            // Add body for non-GET requests
            if (!"get".equals(method) && bodyString != null) {
                requestBuilder.method(method.toUpperCase(), HttpRequest.BodyPublishers.ofString(bodyString));
            } else {
                requestBuilder.method(method.toUpperCase(), HttpRequest.BodyPublishers.noBody());
            }
            
            HttpRequest request = requestBuilder.build();
            
            // Store request data
            String requestData = objectMapper.writeValueAsString(Map.of(
                "url", url,
                "method", method.toUpperCase(),
                "headers", headerMap,
                "body", bodyString != null ? bodyString : ""
            ));
            logger.info("=== STORING REQUEST DATA ===");
            logger.info("Final URL being stored: " + url);
            logger.info("Request data JSON: " + requestData);
            logger.info("=== END STORING REQUEST DATA ===");
            stepExecution.setRequestData(requestData);
            
            // Make API call with session HttpClient
            HttpResponse<String> response = sessionHttpClient.send(request, HttpResponse.BodyHandlers.ofString());
            
            long endTime = System.currentTimeMillis();
            long responseTime = endTime - startTime;
            
            // Store response data
            stepExecution.setHttpStatus(response.statusCode());
            stepExecution.setResponseData(response.body());
            stepExecution.setResponseTime(responseTime);
            
            logger.info("=== STORING RESPONSE DATA ===");
            logger.info("HTTP Status Code: " + response.statusCode());
            logger.info("Response Time: " + responseTime + "ms");
            logger.info("=== END STORING RESPONSE DATA ===");
            
            // Check HTTP status code to determine success/failure
            if (response.statusCode() >= 400) {
                throw new Exception("HTTP " + response.statusCode() + " error: " + response.body());
            }
            
            // Extract data for next steps
            
            Map<String, Object> extractedData = new HashMap<>();
            if (step.getDataExtractions() != null && !step.getDataExtractions().trim().isEmpty()) {
                extractedData = extractData(step.getDataExtractions(), response.body(), stepExecution);
            } else {
            }
            
            // Mark as successful only if HTTP status is OK (< 400)
            stepExecution.setStatus(StepExecution.StepStatus.SUCCESS);
            stepExecution.setCompletedAt(LocalDateTime.now());
            stepExecutionRepository.save(stepExecution);
            
            
            return extractedData;
            
        } catch (Exception e) {
            long endTime = System.currentTimeMillis();
            stepExecution.setResponseTime(endTime - startTime);
            throw e;
        }
    }

    private String processTemplate(String template, Map<String, Object> context) {
        if (template == null) return null;
        
        logger.info("=== TEMPLATE PROCESSING DEBUG ===");
        logger.info("Input template: " + template);
        logger.info("Available context keys: " + context.keySet());
        
        // Replace {{variable:defaultValue}} or {{variable}} with values from context
        Pattern pattern = Pattern.compile("\\{\\{([^:}]+)(?::([^}]*))?\\}\\}");
        Matcher matcher = pattern.matcher(template);
        
        StringBuffer result = new StringBuffer();
        while (matcher.find()) {
            String variable = matcher.group(1);
            String defaultValue = matcher.group(2); // null if no default value specified
            Object value = context.get(variable);
            
            logger.info("Processing variable: " + variable);
            logger.info("Default value: " + defaultValue);
            logger.info("Context value: " + value);
            logger.info("Context value type: " + (value != null ? value.getClass().getName() : "null"));
            logger.info("All context keys: " + context.keySet());
            logger.info("Context contains '" + variable + "': " + context.containsKey(variable));
            
            String replacement;
            if (value != null) {
                // Handle different types appropriately
                if (value instanceof String) {
                    replacement = (String) value;
                } else if (value instanceof Number) {
                    replacement = value.toString();
                } else {
                    // For complex objects, try to serialize as JSON if possible
                    try {
                        replacement = objectMapper.writeValueAsString(value);
                        // If it's a simple quoted string, remove the quotes
                        if (replacement.startsWith("\"") && replacement.endsWith("\"") && replacement.indexOf("\"", 1) == replacement.length() - 1) {
                            replacement = replacement.substring(1, replacement.length() - 1);
                        }
                    } catch (Exception e) {
                        replacement = value.toString();
                    }
                }
            } else if (defaultValue != null) {
                replacement = defaultValue;
            } else {
                replacement = "";
            }
            
            logger.info("Final replacement: " + replacement);
            matcher.appendReplacement(result, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(result);
        
        logger.info("Final result: " + result.toString());
        logger.info("=== END TEMPLATE PROCESSING DEBUG ===");
        
        return result.toString();
    }
    

    private Map<String, Object> extractData(String extractionRules, String responseBody, StepExecution stepExecution) {
        try {
            
            JsonNode extractionNode = objectMapper.readTree(extractionRules);
            JsonNode responseNode = objectMapper.readTree(responseBody);
            
            
            Map<String, Object> extractedData = new HashMap<>();
            
            extractionNode.fields().forEachRemaining(entry -> {
                String key = entry.getKey();
                String path = entry.getValue().asText();
                
                
                // Simple JSON path extraction (can be enhanced with JSONPath library)
                Object value = extractValueByPath(responseNode, path);
                
                if (value != null) {
                    extractedData.put(key, value);
                } else {
                }
            });
            
            // Store extracted data
            stepExecution.setExtractedData(objectMapper.writeValueAsString(extractedData));
            
            return extractedData;
            
        } catch (Exception e) {
            // Error extracting data
            e.printStackTrace();
            return new HashMap<>();
        }
    }

    private Object extractValueByPath(JsonNode node, String path) {
        // Simple implementation - can be enhanced with JSONPath
        
        String[] parts = path.split("\\.");
        JsonNode current = node;
        
        
        for (String part : parts) {
            
            if (current == null) {
                return null;
            }
            
            if (part.matches("\\d+")) {
                // Array index
                int index = Integer.parseInt(part);
                if (current.isArray() && index < current.size()) {
                    current = current.get(index);
                } else {
                    return null;
                }
            } else {
                // Object property
                current = current.get(part);
            }
        }
        
        Object result = current != null ? current.asText() : null;
        
        return result;
    }

    public PipelineExecution getExecutionStatus(Long executionId) {
        return pipelineExecutionRepository.findById(executionId)
                .orElseThrow(() -> new RuntimeException("Execution not found: " + executionId));
    }

    public List<StepExecution> getStepExecutions(Long executionId) {
        return stepExecutionRepository.findByExecutionIdWithApiItemOrderByStepOrder(executionId);
    }

    public List<PipelineExecution> getExecutionHistory(Long pipelineId) {
        return pipelineExecutionRepository.findRecentExecutions(pipelineId);
    }
}