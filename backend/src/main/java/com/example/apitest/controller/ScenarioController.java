package com.example.apitest.controller;

import com.example.apitest.entity.Scenario;
import com.example.apitest.entity.ScenarioFolder;
import com.example.apitest.entity.ScenarioStep;
import com.example.apitest.entity.ApiItem;
import com.example.apitest.repository.ScenarioFolderRepository;
import com.example.apitest.repository.ScenarioRepository;
import com.example.apitest.repository.ScenarioStepRepository;
import com.example.apitest.repository.ApiItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/scenarios")
@CrossOrigin(origins = "*")
public class ScenarioController {

    @Autowired
    private ScenarioFolderRepository scenarioFolderRepository;

    @Autowired
    private ScenarioRepository scenarioRepository;

    @Autowired
    private ScenarioStepRepository scenarioStepRepository;

    @Autowired
    private ApiItemRepository apiItemRepository;

    // Folder Operations
    @GetMapping("/folders")
    public ResponseEntity<List<ScenarioFolder>> getAllFolders() {
        System.out.println("ScenarioController.getAllFolders() called!");
        List<ScenarioFolder> folders = scenarioFolderRepository.findAll().stream()
            .filter(folder -> folder.getIsActive() != null && folder.getIsActive())
            .collect(java.util.stream.Collectors.toList());
        System.out.println("Found " + folders.size() + " folders in database");
        System.out.println("Returning folders response");
        return ResponseEntity.ok(folders);
    }

    @PostMapping("/folders")
    public ResponseEntity<ScenarioFolder> createFolder(@RequestBody ScenarioFolder folder) {
        ScenarioFolder savedFolder = scenarioFolderRepository.save(folder);
        return ResponseEntity.ok(savedFolder);
    }

    @PutMapping("/folders/{id}")
    public ResponseEntity<ScenarioFolder> updateFolder(@PathVariable Long id, @RequestBody ScenarioFolder folder) {
        Optional<ScenarioFolder> existingFolder = scenarioFolderRepository.findById(id);
        if (existingFolder.isPresent()) {
            ScenarioFolder updatedFolder = existingFolder.get();
            updatedFolder.setName(folder.getName());
            updatedFolder.setDescription(folder.getDescription());
            ScenarioFolder savedFolder = scenarioFolderRepository.save(updatedFolder);
            return ResponseEntity.ok(savedFolder);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/folders/{id}")
    public ResponseEntity<Void> deleteFolder(@PathVariable Long id) {
        Optional<ScenarioFolder> folder = scenarioFolderRepository.findById(id);
        if (folder.isPresent()) {
            ScenarioFolder folderToDelete = folder.get();
            folderToDelete.setIsActive(false);
            scenarioFolderRepository.save(folderToDelete);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    // Scenario Operations
    // @TODO 사용하는곳이 없는데 왜 있을까?
    @GetMapping
    public ResponseEntity<List<Scenario>> getAllScenarios() {
        List<Scenario> scenarios = scenarioRepository.findAllActiveScenarios();
        return ResponseEntity.ok(scenarios);
    }

    @GetMapping("/folder/{folderId}")
    public ResponseEntity<List<Scenario>> getScenariosByFolder(@PathVariable Long folderId) {
        List<Scenario> scenarios = scenarioRepository.findByFolderId(folderId);
        return ResponseEntity.ok(scenarios);
    }

    // @TODO 여기도 사용하는 부분이 없는데 왜 선언된걸까
    @PostMapping
    public ResponseEntity<Scenario> createScenario(@RequestBody CreateScenarioRequest request) {
        Optional<ScenarioFolder> folder = scenarioFolderRepository.findById(request.getFolderId());
        if (!folder.isPresent()) {
            return ResponseEntity.badRequest().build();
        }
        
        Scenario scenario = new Scenario();
        scenario.setName(request.getName());
        scenario.setDescription(request.getDescription());
        scenario.setFolderId(request.getFolderId());
        scenario.setIsActive(true);
        
        Scenario savedScenario = scenarioRepository.save(scenario);
        return ResponseEntity.ok(savedScenario);
    }

    // Request DTO class
    public static class CreateScenarioRequest {
        private String name;
        private String description;
        private Long folderId;

        // Constructors
        public CreateScenarioRequest() {}

        // Getters and Setters
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        
        public Long getFolderId() { return folderId; }
        public void setFolderId(Long folderId) { this.folderId = folderId; }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Scenario> updateScenario(@PathVariable Long id, @RequestBody Scenario scenario) {
        Optional<Scenario> existingScenario = scenarioRepository.findById(id);
        if (existingScenario.isPresent()) {
            Scenario updatedScenario = existingScenario.get();
            updatedScenario.setName(scenario.getName());
            updatedScenario.setDescription(scenario.getDescription());
            updatedScenario.setFolder(scenario.getFolder());
            Scenario savedScenario = scenarioRepository.save(updatedScenario);
            return ResponseEntity.ok(savedScenario);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteScenario(@PathVariable Long id) {
        Optional<Scenario> scenario = scenarioRepository.findById(id);
        if (scenario.isPresent()) {
            Scenario scenarioToDelete = scenario.get();
            scenarioToDelete.setIsActive(false);
            scenarioRepository.save(scenarioToDelete);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    // Step Operations
    @GetMapping("/{scenarioId}/steps")
    public ResponseEntity<List<ScenarioStep>> getStepsByScenario(@PathVariable Long scenarioId) {
        List<ScenarioStep> steps = scenarioStepRepository.findByScenarioIdOrderByStepOrder(scenarioId);
        return ResponseEntity.ok(steps);
    }

    @PostMapping("/{scenarioId}/steps")
    public ResponseEntity<ScenarioStep> addStep(@PathVariable Long scenarioId, @RequestBody CreateStepRequest request) {
        Optional<Scenario> scenario = scenarioRepository.findById(scenarioId);
        if (!scenario.isPresent()) {
            return ResponseEntity.badRequest().build();
        }

        Optional<ApiItem> apiItem = apiItemRepository.findById(request.getApiItemId());
        if (!apiItem.isPresent()) {
            return ResponseEntity.badRequest().build();
        }

        // Get the next step order
        List<ScenarioStep> existingSteps = scenarioStepRepository.findByScenarioIdOrderByStepOrder(scenarioId);
        int nextOrder = existingSteps.size() + 1;

        ScenarioStep step = new ScenarioStep();
        step.setScenario(scenario.get());
        step.setApiItem(apiItem.get());
        step.setStepOrder(nextOrder);
        step.setStepName(request.getStepName());
        step.setDescription(request.getDescription());
        step.setIsActive(true);

        ScenarioStep savedStep = scenarioStepRepository.save(step);
        return ResponseEntity.ok(savedStep);
    }

    @DeleteMapping("/steps/{stepId}")
    public ResponseEntity<Void> deleteStep(@PathVariable Long stepId) {
        Optional<ScenarioStep> step = scenarioStepRepository.findById(stepId);
        if (step.isPresent()) {
            ScenarioStep stepToDelete = step.get();
            stepToDelete.setIsActive(false);
            scenarioStepRepository.save(stepToDelete);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/steps/{stepId}/order")
    public ResponseEntity<List<ScenarioStep>> updateStepOrder(@PathVariable Long stepId, @RequestBody UpdateStepOrderRequest request) {
        Optional<ScenarioStep> stepOptional = scenarioStepRepository.findById(stepId);
        if (!stepOptional.isPresent()) {
            return ResponseEntity.notFound().build();
        }

        ScenarioStep step = stepOptional.get();
        Long scenarioId = step.getScenario().getId();
        
        // Get all steps for this scenario
        List<ScenarioStep> steps = scenarioStepRepository.findByScenarioIdOrderByStepOrder(scenarioId);
        
        // Update the order
        int oldOrder = step.getStepOrder();
        int newOrder = request.getNewOrder();
        
        if (newOrder < 1 || newOrder > steps.size()) {
            return ResponseEntity.badRequest().build();
        }
        
        // Reorder steps
        for (ScenarioStep s : steps) {
            if (s.getId().equals(stepId)) {
                s.setStepOrder(newOrder);
            } else if (oldOrder < newOrder && s.getStepOrder() > oldOrder && s.getStepOrder() <= newOrder) {
                s.setStepOrder(s.getStepOrder() - 1);
            } else if (oldOrder > newOrder && s.getStepOrder() >= newOrder && s.getStepOrder() < oldOrder) {
                s.setStepOrder(s.getStepOrder() + 1);
            }
        }
        
        List<ScenarioStep> updatedSteps = scenarioStepRepository.saveAll(steps);
        return ResponseEntity.ok(updatedSteps);
    }

    // Request DTO classes for steps
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
}