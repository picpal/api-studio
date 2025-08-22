package com.example.apitest.controller;

import com.example.apitest.entity.Pipeline;
import com.example.apitest.entity.PipelineFolder;
import com.example.apitest.entity.PipelineStep;
import com.example.apitest.entity.ApiItem;
import com.example.apitest.repository.PipelineFolderRepository;
import com.example.apitest.repository.PipelineRepository;
import com.example.apitest.repository.PipelineStepRepository;
import com.example.apitest.repository.ApiItemRepository;
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
    private ApiItemRepository apiItemRepository;

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
                    pipelineDTO.setStepCount(0); // 스텝 개수는 필요시 별도 조회
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

    @PutMapping("/{id}")
    public ResponseEntity<Pipeline> updatePipeline(@PathVariable Long id, @RequestBody Pipeline pipeline) {
        Optional<Pipeline> existingPipeline = pipelineRepository.findById(id);
        if (existingPipeline.isPresent()) {
            Pipeline updatedPipeline = existingPipeline.get();
            updatedPipeline.setName(pipeline.getName());
            updatedPipeline.setDescription(pipeline.getDescription());
            updatedPipeline.setFolder(pipeline.getFolder());
            Pipeline savedPipeline = pipelineRepository.save(updatedPipeline);
            return ResponseEntity.ok(savedPipeline);
        }
        return ResponseEntity.notFound().build();
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
    public ResponseEntity<List<PipelineStep>> getStepsByPipeline(@PathVariable Long pipelineId) {
        List<PipelineStep> steps = pipelineStepRepository.findByIsActiveTrueAndPipelineIdOrderByStepOrderAsc(pipelineId);
        return ResponseEntity.ok(steps);
    }

    @PostMapping("/{pipelineId}/steps")
    public ResponseEntity<PipelineStep> addStep(@PathVariable Long pipelineId, @RequestBody CreateStepRequest request) {
        Optional<Pipeline> pipeline = pipelineRepository.findById(pipelineId);
        if (!pipeline.isPresent()) {
            return ResponseEntity.badRequest().build();
        }

        Optional<ApiItem> apiItem = apiItemRepository.findById(request.getApiItemId());
        if (!apiItem.isPresent()) {
            return ResponseEntity.badRequest().build();
        }

        // Get the next step order
        List<PipelineStep> existingSteps = pipelineStepRepository.findByIsActiveTrueAndPipelineIdOrderByStepOrderAsc(pipelineId);
        int nextOrder = existingSteps.size() + 1;

        PipelineStep step = new PipelineStep();
        step.setPipeline(pipeline.get());
        step.setApiItem(apiItem.get());
        step.setStepOrder(nextOrder);
        step.setStepName(request.getStepName());
        step.setDescription(request.getDescription());
        step.setIsActive(true);

        PipelineStep savedStep = pipelineStepRepository.save(step);
        return ResponseEntity.ok(savedStep);
    }

    @DeleteMapping("/steps/{stepId}")
    public ResponseEntity<Void> deleteStep(@PathVariable Long stepId) {
        Optional<PipelineStep> step = pipelineStepRepository.findById(stepId);
        if (step.isPresent()) {
            PipelineStep stepToDelete = step.get();
            stepToDelete.setIsActive(false);
            pipelineStepRepository.save(stepToDelete);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
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

        // Constructors
        public CreateStepRequest() {}

        // Getters and Setters
        public Long getApiItemId() { return apiItemId; }
        public void setApiItemId(Long apiItemId) { this.apiItemId = apiItemId; }
        
        public String getStepName() { return stepName; }
        public void setStepName(String stepName) { this.stepName = stepName; }
        
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }

    public static class UpdateStepOrderRequest {
        private Integer newOrder;

        public UpdateStepOrderRequest() {}

        public Integer getNewOrder() { return newOrder; }
        public void setNewOrder(Integer newOrder) { this.newOrder = newOrder; }
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
}