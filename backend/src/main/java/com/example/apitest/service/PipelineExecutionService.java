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

@Service
@Transactional
public class PipelineExecutionService {

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
        System.out.println("Starting pipeline execution for pipeline: " + pipelineId);
        
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
                System.out.println("Loaded ApiItem " + apiItem.getId() + " for step " + step.getStepOrder());
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

        System.out.println("Created pipeline execution with ID: " + execution.getId());

        // Execute steps synchronously for now to test core functionality
        try {
            executeStepsWithId(execution.getId(), steps);
        } catch (Exception e) {
            System.err.println("Error in pipeline execution: " + e.getMessage());
            e.printStackTrace();
            execution.setStatus(PipelineExecution.ExecutionStatus.FAILED);
            execution.setErrorMessage(e.getMessage());
            execution.setCompletedAt(LocalDateTime.now());
            pipelineExecutionRepository.save(execution);
            
            // Clean up any remaining session data on failure
            System.out.println("Pipeline execution failed - cleaned up session data");
        }

        return execution;
    }


    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void executeStepsWithId(Long executionId, List<PipelineStep> steps) {
        System.out.println("Starting execution of " + steps.size() + " steps for execution ID: " + executionId);
        
        // Get execution entity from database
        PipelineExecution execution = pipelineExecutionRepository.findById(executionId)
            .orElseThrow(() -> new RuntimeException("Pipeline execution not found: " + executionId));
        
        Map<String, Object> executionContext = new HashMap<>();
        
        // Create dedicated HttpClient for this pipeline execution to maintain session
        CookieManager cookieManager = new CookieManager();
        cookieManager.setCookiePolicy(CookiePolicy.ACCEPT_ALL);
        HttpClient sessionHttpClient = HttpClient.newBuilder()
                .cookieHandler(cookieManager)
                .build();
                
        // Add HttpClient to execution context for session management
        executionContext.put("httpClient", sessionHttpClient);
        
        for (PipelineStep step : steps) {
            System.out.println("Executing step " + step.getStepOrder() + ": " + step.getStepName());
            
            // Create step execution record
            StepExecution stepExecution = new StepExecution(execution, step);
            stepExecution.setStatus(StepExecution.StepStatus.RUNNING);
            stepExecution = stepExecutionRepository.save(stepExecution);

            try {
                // Execute the step
                executeStep(stepExecution, executionContext);
                
                // Update counters
                execution.setCompletedSteps(execution.getCompletedSteps() + 1);
                execution.setSuccessfulSteps(execution.getSuccessfulSteps() + 1);
                
            } catch (Exception e) {
                System.err.println("Step " + step.getStepOrder() + " failed: " + e.getMessage());
                
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
                        System.out.println("Cleaned up session cookies after step failure");
                    }
                } catch (Exception cleanupError) {
                    System.err.println("Failed to clean up cookies after step failure: " + cleanupError.getMessage());
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
                    System.out.println("Session cookies used during execution: " + cookiesString.toString());
                    // Only save if needed for debugging - normally we clean up after execution
                    // execution.setSessionCookies(cookiesString.toString());
                }
                
                // Clean up cookies from memory after execution completion
                executionCookieManager.getCookieStore().removeAll();
                System.out.println("Cleaned up session cookies from memory");
            }
        } catch (Exception e) {
            System.err.println("Failed to handle session cookies: " + e.getMessage());
        }
        
        // Mark as completed
        execution.setStatus(PipelineExecution.ExecutionStatus.COMPLETED);
        execution.setCompletedAt(LocalDateTime.now());
        pipelineExecutionRepository.save(execution);
        
        System.out.println("Pipeline execution completed successfully with session preserved");
    }

    private void executeStep(StepExecution stepExecution, Map<String, Object> executionContext) throws Exception {
        PipelineStep step = stepExecution.getPipelineStep();
        ApiItem apiItem = step.getApiItem();
        HttpClient sessionHttpClient = (HttpClient) executionContext.get("httpClient");
        
        System.out.println("Executing API call with session: " + apiItem.getMethod() + " " + apiItem.getUrl());
        
        long startTime = System.currentTimeMillis();
        
        try {
            // Prepare request
            String url = processTemplate(apiItem.getUrl(), executionContext);
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
                urlWithParams.append("?");
                
                paramsNode.fields().forEachRemaining(entry -> {
                    String value = processTemplate(entry.getValue().asText(), executionContext);
                    urlWithParams.append(entry.getKey()).append("=").append(value).append("&");
                });
                
                // Remove trailing &
                if (urlWithParams.charAt(urlWithParams.length() - 1) == '&') {
                    urlWithParams.setLength(urlWithParams.length() - 1);
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
            stepExecution.setRequestData(requestData);
            
            // Make API call with session HttpClient
            HttpResponse<String> response = sessionHttpClient.send(request, HttpResponse.BodyHandlers.ofString());
            
            long endTime = System.currentTimeMillis();
            long responseTime = endTime - startTime;
            
            // Store response data
            stepExecution.setHttpStatus(response.statusCode());
            stepExecution.setResponseData(response.body());
            stepExecution.setResponseTime(responseTime);
            
            // Extract data for next steps
            System.out.println("=== EXTRACTION CHECK ===");
            System.out.println("Step ID: " + step.getId());
            System.out.println("Step DataExtractions: " + step.getDataExtractions());
            System.out.println("DataExtractions is null: " + (step.getDataExtractions() == null));
            System.out.println("DataExtractions is empty: " + (step.getDataExtractions() != null && step.getDataExtractions().trim().isEmpty()));
            
            if (step.getDataExtractions() != null && !step.getDataExtractions().trim().isEmpty()) {
                System.out.println("Calling extractData...");
                extractData(step.getDataExtractions(), response.body(), executionContext, stepExecution);
            } else {
                System.out.println("Skipping data extraction - no rules defined");
            }
            
            // Mark as successful
            stepExecution.setStatus(StepExecution.StepStatus.SUCCESS);
            stepExecution.setCompletedAt(LocalDateTime.now());
            stepExecutionRepository.save(stepExecution);
            
            System.out.println("Step completed successfully with session in " + responseTime + "ms");
            
        } catch (Exception e) {
            long endTime = System.currentTimeMillis();
            stepExecution.setResponseTime(endTime - startTime);
            throw e;
        }
    }

    private String processTemplate(String template, Map<String, Object> context) {
        if (template == null) return null;
        
        System.out.println("=== TEMPLATE PROCESSING DEBUG ===");
        System.out.println("Input template: " + template);
        System.out.println("Available context keys: " + context.keySet());
        
        // Replace {{variable:defaultValue}} or {{variable}} with values from context
        Pattern pattern = Pattern.compile("\\{\\{([^}:]+)(?::([^}]*))?\\}\\}");
        Matcher matcher = pattern.matcher(template);
        
        StringBuffer result = new StringBuffer();
        while (matcher.find()) {
            String variable = matcher.group(1);
            String defaultValue = matcher.group(2); // null if no default value specified
            Object value = context.get(variable);
            
            System.out.println("Processing variable: " + variable);
            System.out.println("Default value: " + defaultValue);
            System.out.println("Context value: " + value);
            System.out.println("Context value type: " + (value != null ? value.getClass().getName() : "null"));
            
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
                        if (replacement.startsWith("\"") && replacement.endsWith("\"") && !replacement.contains("\"", 1)) {
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
            
            System.out.println("Final replacement: " + replacement);
            matcher.appendReplacement(result, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(result);
        
        System.out.println("Final result: " + result.toString());
        System.out.println("=== END TEMPLATE PROCESSING DEBUG ===");
        
        return result.toString();
    }
    

    private void extractData(String extractionRules, String responseBody, Map<String, Object> context, StepExecution stepExecution) {
        try {
            System.out.println("=== DATA EXTRACTION DEBUG ===");
            System.out.println("Extraction rules: " + extractionRules);
            System.out.println("Response body: " + responseBody);
            
            JsonNode extractionNode = objectMapper.readTree(extractionRules);
            JsonNode responseNode = objectMapper.readTree(responseBody);
            
            System.out.println("Response node structure: " + responseNode.toString());
            
            Map<String, Object> extractedData = new HashMap<>();
            
            extractionNode.fields().forEachRemaining(entry -> {
                String key = entry.getKey();
                String path = entry.getValue().asText();
                
                System.out.println("Extracting key: " + key + ", path: " + path);
                
                // Simple JSON path extraction (can be enhanced with JSONPath library)
                Object value = extractValueByPath(responseNode, path);
                System.out.println("Extracted value: " + value);
                
                if (value != null) {
                    context.put(key, value);
                    extractedData.put(key, value);
                    System.out.println("Successfully extracted " + key + " = " + value);
                } else {
                    System.out.println("Failed to extract value for path: " + path);
                }
            });
            
            // Store extracted data
            stepExecution.setExtractedData(objectMapper.writeValueAsString(extractedData));
            System.out.println("Final extracted data: " + objectMapper.writeValueAsString(extractedData));
            System.out.println("=== END DATA EXTRACTION DEBUG ===");
            
        } catch (Exception e) {
            System.err.println("Error extracting data: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private Object extractValueByPath(JsonNode node, String path) {
        // Simple implementation - can be enhanced with JSONPath
        System.out.println("=== EXTRACT VALUE DEBUG ===");
        System.out.println("Path: " + path);
        System.out.println("Node: " + node.toString());
        
        String[] parts = path.split("\\.");
        JsonNode current = node;
        
        System.out.println("Path parts: " + java.util.Arrays.toString(parts));
        
        for (String part : parts) {
            System.out.println("Processing part: " + part);
            System.out.println("Current node before: " + (current != null ? current.toString() : "null"));
            
            if (current == null) {
                System.out.println("Current node is null, returning null");
                return null;
            }
            
            if (part.matches("\\d+")) {
                // Array index
                int index = Integer.parseInt(part);
                if (current.isArray() && index < current.size()) {
                    current = current.get(index);
                } else {
                    System.out.println("Array access failed for index: " + index);
                    return null;
                }
            } else {
                // Object property
                current = current.get(part);
                System.out.println("After accessing property '" + part + "': " + (current != null ? current.toString() : "null"));
            }
        }
        
        Object result = current != null ? current.asText() : null;
        System.out.println("Final result: " + result);
        System.out.println("=== END EXTRACT VALUE DEBUG ===");
        
        return result;
    }

    public PipelineExecution getExecutionStatus(Long executionId) {
        return pipelineExecutionRepository.findById(executionId)
                .orElseThrow(() -> new RuntimeException("Execution not found: " + executionId));
    }

    public List<StepExecution> getStepExecutions(Long executionId) {
        return stepExecutionRepository.findByExecutionIdOrderByStepOrder(executionId);
    }

    public List<PipelineExecution> getExecutionHistory(Long pipelineId) {
        return pipelineExecutionRepository.findRecentExecutions(pipelineId);
    }
}