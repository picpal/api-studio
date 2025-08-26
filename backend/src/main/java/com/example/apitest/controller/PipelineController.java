package com.example.apitest.controller;

import com.example.apitest.entity.Pipeline;
import com.example.apitest.entity.PipelineFolder;
import com.example.apitest.entity.PipelineStep;
import com.example.apitest.entity.ApiItem;
import com.example.apitest.entity.PipelineExecution;
import com.example.apitest.entity.StepExecution;
import com.example.apitest.repository.PipelineFolderRepository;
import com.example.apitest.repository.PipelineRepository;
import com.example.apitest.repository.PipelineStepRepository;
import com.example.apitest.repository.StepExecutionRepository;
import com.example.apitest.repository.ApiItemRepository;
import com.example.apitest.service.PipelineExecutionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/pipelines")
@CrossOrigin(origins = "*")
public class PipelineController {

    @Autowired
    private PipelineFolderRepository pipelineFolderRepository;

    @Autowired
    private PipelineRepository pipelineRepository;

    @Autowired
    private PipelineStepRepository pipelineStepRepository;

    @Autowired
    private StepExecutionRepository stepExecutionRepository;

    @Autowired
    private ApiItemRepository apiItemRepository;

    @Autowired
    private PipelineExecutionService pipelineExecutionService;

    // Folder Operations
    @GetMapping("/folders")
    @Transactional(readOnly = true)
    public ResponseEntity<List<PipelineFolderDTO>> getAllFolders() {
        System.out.println("PipelineController.getAllFolders() called!");
        try {
            List<PipelineFolder> folders = pipelineFolderRepository.findAll().stream()
                .filter(folder -> folder.getIsActive() != null && folder.getIsActive())
                .collect(java.util.stream.Collectors.toList());
            
            System.out.println("Found " + folders.size() + " folders in database");
            
            List<PipelineFolderDTO> folderDTOs = new ArrayList<>();
            
            for (PipelineFolder folder : folders) {
                PipelineFolderDTO dto = new PipelineFolderDTO();
                dto.setId(folder.getId());
                dto.setName(folder.getName());
                dto.setDescription(folder.getDescription());
                dto.setIsActive(folder.getIsActive());
                dto.setCreatedAt(folder.getCreatedAt());
                dto.setUpdatedAt(folder.getUpdatedAt());
                
                // 파이프라인 정보만 기본적인 정보로 로드
                List<Pipeline> pipelines = pipelineRepository.findByIsActiveTrueAndFolderIdOrderByCreatedAtAsc(folder.getId());
                List<PipelineDTO> pipelineDTOs = new ArrayList<>();
                
                for (Pipeline pipeline : pipelines) {
                    PipelineDTO pipelineDTO = new PipelineDTO();
                    pipelineDTO.setId(pipeline.getId());
                    pipelineDTO.setName(pipeline.getName());
                    pipelineDTO.setDescription(pipeline.getDescription());
                    pipelineDTO.setFolderId(pipeline.getFolderId());
                    // 실제 단계 개수 조회
                    List<PipelineStep> pipelineSteps = pipelineStepRepository.findByIsActiveTrueAndPipelineIdOrderByStepOrderAsc(pipeline.getId());
                    pipelineDTO.setStepCount(pipelineSteps.size());
                    pipelineDTO.setCreatedAt(pipeline.getCreatedAt());
                    pipelineDTO.setUpdatedAt(pipeline.getUpdatedAt());
                    pipelineDTOs.add(pipelineDTO);
                }
                
                dto.setPipelines(pipelineDTOs);
                folderDTOs.add(dto);
                
                System.out.println("Folder " + folder.getName() + " has " + pipelines.size() + " pipelines");
            }
            
            System.out.println("Returning folders response");
            return ResponseEntity.ok(folderDTOs);
        } catch (Exception e) {
            System.err.println("Error in getAllFolders: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/folders")
    public ResponseEntity<PipelineFolder> createFolder(@RequestBody PipelineFolder folder) {
        PipelineFolder savedFolder = pipelineFolderRepository.save(folder);
        return ResponseEntity.ok(savedFolder);
    }

    @PutMapping("/folders/{id}")
    public ResponseEntity<PipelineFolder> updateFolder(@PathVariable Long id, @RequestBody PipelineFolder folder) {
        Optional<PipelineFolder> existingFolder = pipelineFolderRepository.findById(id);
        if (existingFolder.isPresent()) {
            PipelineFolder updatedFolder = existingFolder.get();
            updatedFolder.setName(folder.getName());
            updatedFolder.setDescription(folder.getDescription());
            PipelineFolder savedFolder = pipelineFolderRepository.save(updatedFolder);
            return ResponseEntity.ok(savedFolder);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/folders/{id}")
    public ResponseEntity<Void> deleteFolder(@PathVariable Long id) {
        Optional<PipelineFolder> folder = pipelineFolderRepository.findById(id);
        if (folder.isPresent()) {
            PipelineFolder folderToDelete = folder.get();
            folderToDelete.setIsActive(false);
            pipelineFolderRepository.save(folderToDelete);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    // Pipeline Operations
    @GetMapping
    public ResponseEntity<List<Pipeline>> getAllPipelines() {
        List<Pipeline> pipelines = pipelineRepository.findByIsActiveTrueOrderByCreatedAtAsc();
        return ResponseEntity.ok(pipelines);
    }

    @PostMapping
    public ResponseEntity<Pipeline> createPipeline(@RequestBody CreatePipelineRequest request) {
        Optional<PipelineFolder> folder = pipelineFolderRepository.findById(request.getFolderId());
        if (!folder.isPresent()) {
            return ResponseEntity.badRequest().build();
        }

        Pipeline pipeline = new Pipeline();
        pipeline.setName(request.getName());
        pipeline.setDescription(request.getDescription());
        pipeline.setFolder(folder.get());
        pipeline.setIsActive(true);

        Pipeline savedPipeline = pipelineRepository.save(pipeline);
        return ResponseEntity.ok(savedPipeline);
    }

    @GetMapping("/folder/{folderId}")
    public ResponseEntity<List<Pipeline>> getPipelinesByFolder(@PathVariable Long folderId) {
        List<Pipeline> pipelines = pipelineRepository.findByIsActiveTrueAndFolderIdOrderByCreatedAtAsc(folderId);
        return ResponseEntity.ok(pipelines);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Pipeline> getPipeline(@PathVariable Long id) {
        System.out.println("PipelineController.getPipeline() called for pipeline: " + id);
        
        try {
            Optional<Pipeline> pipeline = pipelineRepository.findById(id);
            if (pipeline.isPresent()) {
                System.out.println("Pipeline found: " + pipeline.get().getName());
                return ResponseEntity.ok(pipeline.get());
            } else {
                System.out.println("Pipeline not found: " + id);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("Error in getPipeline: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<Pipeline> updatePipeline(@PathVariable Long id, @RequestBody UpdatePipelineRequest request) {
        System.out.println("PipelineController.updatePipeline() called for pipeline: " + id);
        System.out.println("Request data: name=" + request.getName() + ", description=" + request.getDescription());
        
        try {
            Optional<Pipeline> existingPipeline = pipelineRepository.findById(id);
            if (!existingPipeline.isPresent()) {
                System.out.println("Pipeline not found: " + id);
                return ResponseEntity.notFound().build();
            }
            
            Pipeline updatedPipeline = existingPipeline.get();
            updatedPipeline.setName(request.getName());
            updatedPipeline.setDescription(request.getDescription());
            Pipeline savedPipeline = pipelineRepository.save(updatedPipeline);
            
            System.out.println("Pipeline updated successfully with ID: " + savedPipeline.getId());
            return ResponseEntity.ok(savedPipeline);
        } catch (Exception e) {
            System.err.println("Error in updatePipeline: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePipeline(@PathVariable Long id) {
        Optional<Pipeline> pipeline = pipelineRepository.findById(id);
        if (pipeline.isPresent()) {
            Pipeline pipelineToDelete = pipeline.get();
            pipelineToDelete.setIsActive(false);
            pipelineRepository.save(pipelineToDelete);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    // Step Operations
    @GetMapping("/{pipelineId}/steps")
    @Transactional(readOnly = true)
    public ResponseEntity<List<PipelineStepDTO>> getStepsByPipeline(@PathVariable Long pipelineId) {
        System.out.println("PipelineController.getStepsByPipeline() called for pipeline: " + pipelineId);
        try {
            // 하드 삭제 방식으로 변경: isActive 조건 없이 모든 step 조회
            List<PipelineStep> steps = pipelineStepRepository.findByPipelineIdOrderByStepOrderAsc(pipelineId);
            System.out.println("Found " + steps.size() + " steps for pipeline " + pipelineId);
            
            List<PipelineStepDTO> stepDTOs = new ArrayList<>();
            for (PipelineStep step : steps) {
                PipelineStepDTO dto = new PipelineStepDTO();
                dto.setId(step.getId());
                dto.setStepOrder(step.getStepOrder());
                dto.setStepName(step.getStepName());
                dto.setDescription(step.getDescription());
                dto.setDataExtractions(step.getDataExtractions());
                dto.setDataInjections(step.getDataInjections());
                dto.setExecutionCondition(step.getExecutionCondition());
                dto.setDelayAfter(step.getDelayAfter());
                dto.setIsActive(step.getIsActive());
                dto.setCreatedAt(step.getCreatedAt());
                dto.setUpdatedAt(step.getUpdatedAt());
                
                // ApiItem 정보 설정
                if (step.getApiItem() != null) {
                    ApiItem apiItem = step.getApiItem();
                    ApiItemDTO apiItemDTO = new ApiItemDTO();
                    apiItemDTO.setId(apiItem.getId());
                    apiItemDTO.setName(apiItem.getName());
                    apiItemDTO.setMethod(apiItem.getMethod().toString());
                    apiItemDTO.setUrl(apiItem.getUrl());
                    apiItemDTO.setDescription(apiItem.getDescription());
                    dto.setApiItem(apiItemDTO);
                    System.out.println("Step " + step.getId() + " has ApiItem: " + apiItem.getName());
                }
                
                System.out.println("Step " + step.getId() + " extractions: " + step.getDataExtractions());
                System.out.println("Step " + step.getId() + " injections: " + step.getDataInjections());
                
                stepDTOs.add(dto);
            }
            
            System.out.println("Returning " + stepDTOs.size() + " step DTOs");
            return ResponseEntity.ok(stepDTOs);
        } catch (Exception e) {
            System.err.println("Error fetching steps for pipeline " + pipelineId + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/{pipelineId}/steps")
    @Transactional
    public ResponseEntity<PipelineStepDTO> addStep(@PathVariable Long pipelineId, @RequestBody CreateStepRequest request) {
        System.out.println("PipelineController.addStep() called for pipeline: " + pipelineId);
        System.out.println("Request data: apiItemId=" + request.getApiItemId() + ", stepName=" + request.getStepName() + ", description=" + request.getDescription());
        
        try {
            Optional<Pipeline> pipeline = pipelineRepository.findById(pipelineId);
            if (!pipeline.isPresent()) {
                System.out.println("Pipeline not found: " + pipelineId);
                return ResponseEntity.badRequest().build();
            }

            Optional<ApiItem> apiItem = apiItemRepository.findById(request.getApiItemId());
            if (!apiItem.isPresent()) {
                System.out.println("ApiItem not found: " + request.getApiItemId());
                return ResponseEntity.badRequest().build();
            }

            // Get the next step order (하드 삭제 방식에서는 모든 step이 활성이므로 단순히 개수 + 1)
            List<PipelineStep> existingSteps = pipelineStepRepository.findByPipelineIdOrderByStepOrderAsc(pipelineId);
            int nextOrder = existingSteps.size() + 1;
            
            System.out.println("Existing steps: " + existingSteps.size());
            System.out.println("Next step order will be: " + nextOrder);

            PipelineStep step = new PipelineStep();
            step.setPipeline(pipeline.get());
            step.setApiItem(apiItem.get());
            step.setStepOrder(nextOrder);
            step.setStepName(request.getStepName());
            step.setDescription(request.getDescription());
            step.setDataExtractions(request.getDataExtractions());
            step.setDataInjections(request.getDataInjections());
            step.setExecutionCondition(request.getExecutionCondition());
            step.setDelayAfter(request.getDelayAfter());
            step.setIsActive(true);

            PipelineStep savedStep = pipelineStepRepository.save(step);
            System.out.println("Step saved successfully with ID: " + savedStep.getId());
            
            // Convert to DTO to avoid lazy loading issues
            PipelineStepDTO dto = new PipelineStepDTO();
            dto.setId(savedStep.getId());
            dto.setStepOrder(savedStep.getStepOrder());
            dto.setStepName(savedStep.getStepName());
            dto.setDescription(savedStep.getDescription());
            dto.setDataExtractions(savedStep.getDataExtractions());
            dto.setDataInjections(savedStep.getDataInjections());
            dto.setExecutionCondition(savedStep.getExecutionCondition());
            dto.setDelayAfter(savedStep.getDelayAfter());
            dto.setIsActive(savedStep.getIsActive());
            dto.setCreatedAt(savedStep.getCreatedAt());
            dto.setUpdatedAt(savedStep.getUpdatedAt());
            
            // Set ApiItem DTO
            if (savedStep.getApiItem() != null) {
                ApiItem stepApiItem = savedStep.getApiItem();
                ApiItemDTO apiItemDTO = new ApiItemDTO();
                apiItemDTO.setId(stepApiItem.getId());
                apiItemDTO.setName(stepApiItem.getName());
                apiItemDTO.setMethod(stepApiItem.getMethod().toString());
                apiItemDTO.setUrl(stepApiItem.getUrl());
                apiItemDTO.setDescription(stepApiItem.getDescription());
                dto.setApiItem(apiItemDTO);
            }
            
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            System.err.println("Error creating step: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/steps/{stepId}")
    @Transactional
    public ResponseEntity<Void> deleteStep(@PathVariable Long stepId) {
        System.out.println("=== DELETE STEP CALLED (HARD DELETE) ===");
        System.out.println("Step ID to delete: " + stepId);
        
        Optional<PipelineStep> step = pipelineStepRepository.findById(stepId);
        if (step.isPresent()) {
            PipelineStep stepToDelete = step.get();
            Long pipelineId = stepToDelete.getPipeline().getId();
            int deletedStepOrder = stepToDelete.getStepOrder();
            
            System.out.println("Deleting step with order: " + deletedStepOrder + " from pipeline: " + pipelineId);
            
            // 먼저 관련된 StepExecution 레코드들을 삭제
            System.out.println("Deleting related StepExecution records for step: " + stepId);
            stepExecutionRepository.deleteByPipelineStepId(stepId);
            System.out.println("StepExecution records deleted");
            
            // 하드 삭제: 실제로 DB에서 제거
            pipelineStepRepository.delete(stepToDelete);
            System.out.println("Step physically deleted from database");
            
            // 삭제 후 남은 모든 단계들을 가져와서 재정렬 (하드 삭제 방식)
            List<PipelineStep> remainingSteps = pipelineStepRepository
                .findByPipelineIdOrderByStepOrderAsc(pipelineId);
            
            System.out.println("Found " + remainingSteps.size() + " remaining active steps");
            
            // 순번을 1부터 시작해서 순차적으로 재정렬 (연속된 순번 보장)
            for (int i = 0; i < remainingSteps.size(); i++) {
                int newOrder = i + 1;
                System.out.println("Reordering step " + remainingSteps.get(i).getId() + 
                    " from order " + remainingSteps.get(i).getStepOrder() + " to " + newOrder);
                remainingSteps.get(i).setStepOrder(newOrder);
            }
            
            // 모든 변경사항을 저장
            pipelineStepRepository.saveAll(remainingSteps);
            
            System.out.println("Step " + stepId + " hard deleted. Remaining steps reordered: " + 
                remainingSteps.size() + " steps");
            
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/steps/{stepId}")
    @Transactional
    public ResponseEntity<PipelineStepDTO> updateStep(@PathVariable Long stepId, @RequestBody CreateStepRequest request) {
        System.out.println("PipelineController.updateStep() called for step: " + stepId);
        System.out.println("Request data: apiItemId=" + request.getApiItemId() + ", stepName=" + request.getStepName() + ", description=" + request.getDescription());
        
        try {
            Optional<PipelineStep> stepOptional = pipelineStepRepository.findById(stepId);
            if (!stepOptional.isPresent()) {
                System.out.println("Step not found: " + stepId);
                return ResponseEntity.notFound().build();
            }

            PipelineStep step = stepOptional.get();

            // API 아이템이 변경된 경우에만 확인
            if (!step.getApiItem().getId().equals(request.getApiItemId())) {
                Optional<ApiItem> apiItem = apiItemRepository.findById(request.getApiItemId());
                if (!apiItem.isPresent()) {
                    System.out.println("ApiItem not found: " + request.getApiItemId());
                    return ResponseEntity.badRequest().build();
                }
                step.setApiItem(apiItem.get());
            }

            // 업데이트 가능한 필드들
            step.setStepName(request.getStepName());
            step.setDescription(request.getDescription());
            step.setDataExtractions(request.getDataExtractions());
            step.setDataInjections(request.getDataInjections());
            step.setExecutionCondition(request.getExecutionCondition());
            step.setDelayAfter(request.getDelayAfter());

            PipelineStep updatedStep = pipelineStepRepository.save(step);
            System.out.println("Step updated successfully with ID: " + updatedStep.getId());
            
            // Convert to DTO
            PipelineStepDTO dto = new PipelineStepDTO();
            dto.setId(updatedStep.getId());
            dto.setStepOrder(updatedStep.getStepOrder());
            dto.setStepName(updatedStep.getStepName());
            dto.setDescription(updatedStep.getDescription());
            dto.setDataExtractions(updatedStep.getDataExtractions());
            dto.setDataInjections(updatedStep.getDataInjections());
            dto.setExecutionCondition(updatedStep.getExecutionCondition());
            dto.setDelayAfter(updatedStep.getDelayAfter());
            dto.setIsActive(updatedStep.getIsActive());
            dto.setCreatedAt(updatedStep.getCreatedAt());
            dto.setUpdatedAt(updatedStep.getUpdatedAt());
            
            // Set ApiItem DTO
            if (updatedStep.getApiItem() != null) {
                ApiItem stepApiItem = updatedStep.getApiItem();
                ApiItemDTO apiItemDTO = new ApiItemDTO();
                apiItemDTO.setId(stepApiItem.getId());
                apiItemDTO.setName(stepApiItem.getName());
                apiItemDTO.setMethod(stepApiItem.getMethod().toString());
                apiItemDTO.setUrl(stepApiItem.getUrl());
                apiItemDTO.setDescription(stepApiItem.getDescription());
                dto.setApiItem(apiItemDTO);
            }
            
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            System.err.println("Error in updateStep: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/steps/{stepId}/order")
    public ResponseEntity<List<PipelineStep>> updateStepOrder(@PathVariable Long stepId, @RequestBody UpdateStepOrderRequest request) {
        Optional<PipelineStep> stepOptional = pipelineStepRepository.findById(stepId);
        if (!stepOptional.isPresent()) {
            return ResponseEntity.notFound().build();
        }

        PipelineStep step = stepOptional.get();
        Long pipelineId = step.getPipeline().getId();
        
        // Get all steps for this pipeline
        List<PipelineStep> steps = pipelineStepRepository.findByIsActiveTrueAndPipelineIdOrderByStepOrderAsc(pipelineId);
        
        // Update the order
        int oldOrder = step.getStepOrder();
        int newOrder = request.getNewOrder();
        
        if (newOrder < 1 || newOrder > steps.size()) {
            return ResponseEntity.badRequest().build();
        }
        
        // Reorder steps
        for (PipelineStep s : steps) {
            if (s.getId().equals(stepId)) {
                s.setStepOrder(newOrder);
            } else if (oldOrder < newOrder && s.getStepOrder() > oldOrder && s.getStepOrder() <= newOrder) {
                s.setStepOrder(s.getStepOrder() - 1);
            } else if (oldOrder > newOrder && s.getStepOrder() >= newOrder && s.getStepOrder() < oldOrder) {
                s.setStepOrder(s.getStepOrder() + 1);
            }
        }
        
        List<PipelineStep> updatedSteps = pipelineStepRepository.saveAll(steps);
        return ResponseEntity.ok(updatedSteps);
    }

    // Pipeline Execution Operations
    @PostMapping("/{pipelineId}/execute")
    public ResponseEntity<PipelineExecutionDTO> executePipeline(@PathVariable Long pipelineId) {
        System.out.println("PipelineController.executePipeline() called for pipeline: " + pipelineId);
        try {
            PipelineExecution execution = pipelineExecutionService.startExecution(pipelineId);
            PipelineExecutionDTO dto = convertToPipelineExecutionDTO(execution);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            System.err.println("Error starting pipeline execution: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/executions/{executionId}")
    public ResponseEntity<PipelineExecutionDTO> getExecutionStatus(@PathVariable Long executionId) {
        try {
            PipelineExecution execution = pipelineExecutionService.getExecutionStatus(executionId);
            PipelineExecutionDTO dto = convertToPipelineExecutionDTO(execution);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            System.err.println("Error getting execution status: " + e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/executions/{executionId}/steps")
    public ResponseEntity<List<StepExecutionDTO>> getExecutionSteps(@PathVariable Long executionId) {
        try {
            List<StepExecution> stepExecutions = pipelineExecutionService.getStepExecutions(executionId);
            List<StepExecutionDTO> dtos = stepExecutions.stream()
                    .map(this::convertToStepExecutionDTO)
                    .collect(java.util.stream.Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            System.err.println("Error getting execution steps: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{pipelineId}/executions")
    public ResponseEntity<List<PipelineExecutionDTO>> getExecutionHistory(@PathVariable Long pipelineId) {
        try {
            List<PipelineExecution> executions = pipelineExecutionService.getExecutionHistory(pipelineId);
            List<PipelineExecutionDTO> dtos = executions.stream()
                    .map(this::convertToPipelineExecutionDTO)
                    .collect(java.util.stream.Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            System.err.println("Error getting execution history: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    // Helper methods for DTO conversion
    private PipelineExecutionDTO convertToPipelineExecutionDTO(PipelineExecution execution) {
        PipelineExecutionDTO dto = new PipelineExecutionDTO();
        dto.setId(execution.getId());
        dto.setStatus(execution.getStatus().toString());
        dto.setStartedAt(execution.getStartedAt());
        dto.setCompletedAt(execution.getCompletedAt());
        dto.setErrorMessage(execution.getErrorMessage());
        dto.setTotalSteps(execution.getTotalSteps());
        dto.setCompletedSteps(execution.getCompletedSteps());
        dto.setSuccessfulSteps(execution.getSuccessfulSteps());
        dto.setFailedSteps(execution.getFailedSteps());
        dto.setSessionCookies(execution.getSessionCookies());
        
        if (execution.getPipeline() != null) {
            dto.setPipelineId(execution.getPipeline().getId());
            dto.setPipelineName(execution.getPipeline().getName());
        }
        
        return dto;
    }

    private StepExecutionDTO convertToStepExecutionDTO(StepExecution stepExecution) {
        StepExecutionDTO dto = new StepExecutionDTO();
        dto.setId(stepExecution.getId());
        dto.setStepOrder(stepExecution.getStepOrder());
        dto.setStatus(stepExecution.getStatus().toString());
        dto.setStartedAt(stepExecution.getStartedAt());
        dto.setCompletedAt(stepExecution.getCompletedAt());
        dto.setHttpStatus(stepExecution.getHttpStatus());
        dto.setResponseTime(stepExecution.getResponseTime());
        dto.setErrorMessage(stepExecution.getErrorMessage());
        dto.setRequestData(stepExecution.getRequestData());
        dto.setResponseData(stepExecution.getResponseData());
        dto.setExtractedData(stepExecution.getExtractedData());
        
        if (stepExecution.getPipelineStep() != null) {
            PipelineStep step = stepExecution.getPipelineStep();
            dto.setStepName(step.getStepName());
            dto.setStepDescription(step.getDescription());
            
            if (step.getApiItem() != null) {
                ApiItem apiItem = step.getApiItem();
                ApiItemDTO apiItemDTO = new ApiItemDTO();
                apiItemDTO.setId(apiItem.getId());
                apiItemDTO.setName(apiItem.getName());
                apiItemDTO.setMethod(apiItem.getMethod().toString());
                apiItemDTO.setUrl(apiItem.getUrl());
                apiItemDTO.setDescription(apiItem.getDescription());
                dto.setApiItem(apiItemDTO);
            }
        }
        
        return dto;
    }

    // Request DTO classes
    public static class CreatePipelineRequest {
        private String name;
        private String description;
        private Long folderId;

        // Constructors
        public CreatePipelineRequest() {}

        // Getters and Setters
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        
        public Long getFolderId() { return folderId; }
        public void setFolderId(Long folderId) { this.folderId = folderId; }
    }

    public static class CreateStepRequest {
        private Long apiItemId;
        private String stepName;
        private String description;
        private String dataExtractions;
        private String dataInjections;
        private String executionCondition;
        private Integer delayAfter;

        // Constructors
        public CreateStepRequest() {}

        // Getters and Setters
        public Long getApiItemId() { return apiItemId; }
        public void setApiItemId(Long apiItemId) { this.apiItemId = apiItemId; }
        
        public String getStepName() { return stepName; }
        public void setStepName(String stepName) { this.stepName = stepName; }
        
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        
        public String getDataExtractions() { return dataExtractions; }
        public void setDataExtractions(String dataExtractions) { this.dataExtractions = dataExtractions; }
        
        public String getDataInjections() { return dataInjections; }
        public void setDataInjections(String dataInjections) { this.dataInjections = dataInjections; }
        
        public String getExecutionCondition() { return executionCondition; }
        public void setExecutionCondition(String executionCondition) { this.executionCondition = executionCondition; }
        
        public Integer getDelayAfter() { return delayAfter; }
        public void setDelayAfter(Integer delayAfter) { this.delayAfter = delayAfter; }
    }

    public static class UpdateStepOrderRequest {
        private Integer newOrder;

        public UpdateStepOrderRequest() {}

        public Integer getNewOrder() { return newOrder; }
        public void setNewOrder(Integer newOrder) { this.newOrder = newOrder; }
    }

    public static class UpdatePipelineRequest {
        private String name;
        private String description;

        // Constructors
        public UpdatePipelineRequest() {}

        // Getters and Setters
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }

    // DTO classes for API responses
    public static class PipelineFolderDTO {
        private Long id;
        private String name;
        private String description;
        private List<PipelineDTO> pipelines;
        private Boolean isActive;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        // Constructors
        public PipelineFolderDTO() {}

        // Getters and Setters
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        
        public List<PipelineDTO> getPipelines() { return pipelines; }
        public void setPipelines(List<PipelineDTO> pipelines) { this.pipelines = pipelines; }
        
        public Boolean getIsActive() { return isActive; }
        public void setIsActive(Boolean isActive) { this.isActive = isActive; }
        
        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
        
        public LocalDateTime getUpdatedAt() { return updatedAt; }
        public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    }

    public static class PipelineDTO {
        private Long id;
        private String name;
        private String description;
        private Long folderId;
        private Integer stepCount;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        // Constructors
        public PipelineDTO() {}

        // Getters and Setters
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        
        public Long getFolderId() { return folderId; }
        public void setFolderId(Long folderId) { this.folderId = folderId; }
        
        public Integer getStepCount() { return stepCount; }
        public void setStepCount(Integer stepCount) { this.stepCount = stepCount; }
        
        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
        
        public LocalDateTime getUpdatedAt() { return updatedAt; }
        public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    }

    // PipelineStep DTO classes
    public static class PipelineStepDTO {
        private Long id;
        private Integer stepOrder;
        private String stepName;
        private String description;
        private String dataExtractions;
        private String dataInjections;
        private String executionCondition;
        private Integer delayAfter;
        private Boolean isActive;
        private ApiItemDTO apiItem;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        // Constructors
        public PipelineStepDTO() {}

        // Getters and Setters
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public Integer getStepOrder() { return stepOrder; }
        public void setStepOrder(Integer stepOrder) { this.stepOrder = stepOrder; }

        public String getStepName() { return stepName; }
        public void setStepName(String stepName) { this.stepName = stepName; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        
        public String getDataExtractions() { return dataExtractions; }
        public void setDataExtractions(String dataExtractions) { this.dataExtractions = dataExtractions; }
        
        public String getDataInjections() { return dataInjections; }
        public void setDataInjections(String dataInjections) { this.dataInjections = dataInjections; }
        
        public String getExecutionCondition() { return executionCondition; }
        public void setExecutionCondition(String executionCondition) { this.executionCondition = executionCondition; }
        
        public Integer getDelayAfter() { return delayAfter; }
        public void setDelayAfter(Integer delayAfter) { this.delayAfter = delayAfter; }
        
        public Boolean getIsActive() { return isActive; }
        public void setIsActive(Boolean isActive) { this.isActive = isActive; }

        public ApiItemDTO getApiItem() { return apiItem; }
        public void setApiItem(ApiItemDTO apiItem) { this.apiItem = apiItem; }

        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

        public LocalDateTime getUpdatedAt() { return updatedAt; }
        public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    }

    public static class ApiItemDTO {
        private Long id;
        private String name;
        private String method;
        private String url;
        private String description;

        // Constructors
        public ApiItemDTO() {}

        // Getters and Setters
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getMethod() { return method; }
        public void setMethod(String method) { this.method = method; }

        public String getUrl() { return url; }
        public void setUrl(String url) { this.url = url; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }

    // Pipeline Execution DTO classes
    public static class PipelineExecutionDTO {
        private Long id;
        private Long pipelineId;
        private String pipelineName;
        private String status;
        private LocalDateTime startedAt;
        private LocalDateTime completedAt;
        private String errorMessage;
        private Integer totalSteps;
        private Integer completedSteps;
        private Integer successfulSteps;
        private Integer failedSteps;
        private String sessionCookies;

        // Constructors
        public PipelineExecutionDTO() {}

        // Getters and Setters
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public Long getPipelineId() { return pipelineId; }
        public void setPipelineId(Long pipelineId) { this.pipelineId = pipelineId; }

        public String getPipelineName() { return pipelineName; }
        public void setPipelineName(String pipelineName) { this.pipelineName = pipelineName; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public LocalDateTime getStartedAt() { return startedAt; }
        public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }

        public LocalDateTime getCompletedAt() { return completedAt; }
        public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }

        public String getErrorMessage() { return errorMessage; }
        public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

        public Integer getTotalSteps() { return totalSteps; }
        public void setTotalSteps(Integer totalSteps) { this.totalSteps = totalSteps; }

        public Integer getCompletedSteps() { return completedSteps; }
        public void setCompletedSteps(Integer completedSteps) { this.completedSteps = completedSteps; }

        public Integer getSuccessfulSteps() { return successfulSteps; }
        public void setSuccessfulSteps(Integer successfulSteps) { this.successfulSteps = successfulSteps; }

        public Integer getFailedSteps() { return failedSteps; }
        public void setFailedSteps(Integer failedSteps) { this.failedSteps = failedSteps; }

        public String getSessionCookies() { return sessionCookies; }
        public void setSessionCookies(String sessionCookies) { this.sessionCookies = sessionCookies; }
    }

    public static class StepExecutionDTO {
        private Long id;
        private Integer stepOrder;
        private String stepName;
        private String stepDescription;
        private String status;
        private LocalDateTime startedAt;
        private LocalDateTime completedAt;
        private Integer httpStatus;
        private Long responseTime;
        private String errorMessage;
        private String requestData;
        private String responseData;
        private String extractedData;
        private ApiItemDTO apiItem;

        // Constructors
        public StepExecutionDTO() {}

        // Getters and Setters
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public Integer getStepOrder() { return stepOrder; }
        public void setStepOrder(Integer stepOrder) { this.stepOrder = stepOrder; }

        public String getStepName() { return stepName; }
        public void setStepName(String stepName) { this.stepName = stepName; }

        public String getStepDescription() { return stepDescription; }
        public void setStepDescription(String stepDescription) { this.stepDescription = stepDescription; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public LocalDateTime getStartedAt() { return startedAt; }
        public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }

        public LocalDateTime getCompletedAt() { return completedAt; }
        public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }

        public Integer getHttpStatus() { return httpStatus; }
        public void setHttpStatus(Integer httpStatus) { this.httpStatus = httpStatus; }

        public Long getResponseTime() { return responseTime; }
        public void setResponseTime(Long responseTime) { this.responseTime = responseTime; }

        public String getErrorMessage() { return errorMessage; }
        public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

        public String getRequestData() { return requestData; }
        public void setRequestData(String requestData) { this.requestData = requestData; }

        public String getResponseData() { return responseData; }
        public void setResponseData(String responseData) { this.responseData = responseData; }

        public String getExtractedData() { return extractedData; }
        public void setExtractedData(String extractedData) { this.extractedData = extractedData; }

        public ApiItemDTO getApiItem() { return apiItem; }
        public void setApiItem(ApiItemDTO apiItem) { this.apiItem = apiItem; }
    }
}