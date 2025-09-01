package com.example.apitest.controller;

import com.example.apitest.annotation.RequireApiAuth;
import com.example.apitest.dto.pipeline.request.*;
import com.example.apitest.dto.pipeline.request.BatchUpdateStepOrderRequest;
import com.example.apitest.dto.pipeline.response.*;
import com.example.apitest.entity.ApiKey;
import com.example.apitest.entity.Pipeline;
import com.example.apitest.entity.PipelineExecution;
import com.example.apitest.entity.PipelineFolder;
import com.example.apitest.entity.PipelineStep;
import com.example.apitest.entity.StepExecution;
import com.example.apitest.mapper.PipelineMapper;
import com.example.apitest.service.PipelineService;
import com.example.apitest.service.PipelineExecutionService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/pipelines")
@CrossOrigin(origins = "*")
public class PipelineController {

    @Autowired
    private PipelineService pipelineService;

    @Autowired
    private PipelineExecutionService pipelineExecutionService;

    @Autowired
    private PipelineMapper pipelineMapper;

    // Folder Operations
    @GetMapping("/folders")
    @RequireApiAuth
    public ResponseEntity<List<PipelineFolderDTO>> getAllFolders(HttpServletRequest request) {
        try {
            List<PipelineFolderDTO> folderDTOs = pipelineService.getAllFolders();
            
            // API 키 권한에 따라 폴더 필터링 (API 키 기반 인증인 경우에만)
            ApiKey apiKey = (ApiKey) request.getAttribute("apiKey");
            if (apiKey != null && apiKey.getAllowedFolderIds() != null) {
                folderDTOs = folderDTOs.stream()
                    .filter(folder -> apiKey.canAccessFolder(folder.getId()))
                    .collect(Collectors.toList());
            }
            // 세션 기반 인증인 경우 모든 폴더 반환
            
            return ResponseEntity.ok(folderDTOs);
        } catch (Exception e) {
            System.err.println("Error in getAllFolders: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/folders")
    @RequireApiAuth(adminOnly = true)
    public ResponseEntity<PipelineFolder> createFolder(@RequestBody PipelineFolder folder) {
        PipelineFolder savedFolder = pipelineService.createFolder(folder);
        return ResponseEntity.ok(savedFolder);
    }

    @PutMapping("/folders/{id}")
    @RequireApiAuth(adminOnly = true)
    public ResponseEntity<PipelineFolder> updateFolder(@PathVariable Long id, @RequestBody PipelineFolder folder) {
        return pipelineService.updateFolder(id, folder)
            .map(updatedFolder -> ResponseEntity.ok(updatedFolder))
            .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/folders/{id}")
    @RequireApiAuth(adminOnly = true)
    public ResponseEntity<Void> deleteFolder(@PathVariable Long id) {
        if (pipelineService.deleteFolder(id)) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    // Pipeline Operations
    @GetMapping
    @RequireApiAuth
    public ResponseEntity<List<Pipeline>> getAllPipelines() {
        List<Pipeline> pipelines = pipelineService.getAllPipelines();
        return ResponseEntity.ok(pipelines);
    }

    @PostMapping
    @RequireApiAuth(folderParam = "folderId")
    public ResponseEntity<Pipeline> createPipeline(@RequestBody CreatePipelineRequest request) {
        try {
            Pipeline savedPipeline = pipelineService.createPipeline(request);
            return ResponseEntity.ok(savedPipeline);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/folder/{folderId}")
    @RequireApiAuth(folderParam = "folderId")
    public ResponseEntity<List<Pipeline>> getPipelinesByFolder(@PathVariable Long folderId) {
        List<Pipeline> pipelines = pipelineService.getPipelinesByFolder(folderId);
        return ResponseEntity.ok(pipelines);
    }

    @GetMapping("/{id}")
    @RequireApiAuth
    public ResponseEntity<Pipeline> getPipeline(@PathVariable Long id) {
        try {
            return pipelineService.getPipeline(id)
                .map(pipeline -> ResponseEntity.ok(pipeline))
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            System.err.println("Error in getPipeline: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/{id}")
    @RequireApiAuth
    public ResponseEntity<Pipeline> updatePipeline(@PathVariable Long id, @RequestBody UpdatePipelineRequest request) {
        try {
            return pipelineService.updatePipeline(id, request)
                .map(updatedPipeline -> ResponseEntity.ok(updatedPipeline))
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            System.err.println("Error in updatePipeline: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/{id}")
    @RequireApiAuth
    public ResponseEntity<Void> deletePipeline(@PathVariable Long id) {
        if (pipelineService.deletePipeline(id)) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    // Step Operations
    @GetMapping("/{pipelineId}/steps")
    @RequireApiAuth
    public ResponseEntity<List<PipelineStepDTO>> getStepsByPipeline(@PathVariable Long pipelineId) {
        try {
            List<PipelineStepDTO> stepDTOs = pipelineService.getStepsByPipeline(pipelineId);
            return ResponseEntity.ok(stepDTOs);
        } catch (Exception e) {
            System.err.println("Error fetching steps for pipeline " + pipelineId + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/{pipelineId}/steps")
    @RequireApiAuth
    public ResponseEntity<PipelineStepDTO> addStep(@PathVariable Long pipelineId, @RequestBody CreateStepRequest request) {
        try {
            PipelineStepDTO stepDTO = pipelineService.addStep(pipelineId, request);
            return ResponseEntity.ok(stepDTO);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            System.err.println("Error creating step: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/steps/{stepId}")
    @RequireApiAuth
    public ResponseEntity<Void> deleteStep(@PathVariable Long stepId) {
        if (pipelineService.deleteStep(stepId)) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/steps/{stepId}")
    @RequireApiAuth
    public ResponseEntity<PipelineStepDTO> updateStep(@PathVariable Long stepId, @RequestBody CreateStepRequest request) {
        try {
            return pipelineService.updateStep(stepId, request)
                .map(stepDTO -> ResponseEntity.ok(stepDTO))
                .orElse(ResponseEntity.notFound().build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            System.err.println("Error in updateStep: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/steps/{stepId}/order")
    @RequireApiAuth
    public ResponseEntity<List<PipelineStep>> updateStepOrder(@PathVariable Long stepId, @RequestBody UpdateStepOrderRequest request) {
        try {
            return pipelineService.updateStepOrder(stepId, request)
                .map(updatedSteps -> ResponseEntity.ok(updatedSteps))
                .orElse(ResponseEntity.notFound().build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{pipelineId}/steps/batch-reorder")
    @RequireApiAuth
    public ResponseEntity<List<PipelineStepDTO>> batchUpdateStepOrder(@PathVariable Long pipelineId, @RequestBody BatchUpdateStepOrderRequest request) {
        try {
            List<PipelineStepDTO> updatedSteps = pipelineService.batchUpdateStepOrder(pipelineId, request);
            return ResponseEntity.ok(updatedSteps);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            System.err.println("Error in batchUpdateStepOrder: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // Pipeline Execution Operations
    @PostMapping("/{pipelineId}/execute")
    @RequireApiAuth
    public ResponseEntity<PipelineExecutionDTO> executePipeline(@PathVariable Long pipelineId) {
        try {
            PipelineExecution execution = pipelineExecutionService.startExecution(pipelineId);
            PipelineExecutionDTO dto = pipelineMapper.toPipelineExecutionDTO(execution);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            System.err.println("Error starting pipeline execution: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/executions/{executionId}")
    @RequireApiAuth
    public ResponseEntity<PipelineExecutionDTO> getExecutionStatus(@PathVariable Long executionId) {
        try {
            PipelineExecution execution = pipelineExecutionService.getExecutionStatus(executionId);
            PipelineExecutionDTO dto = pipelineMapper.toPipelineExecutionDTO(execution);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            System.err.println("Error getting execution status: " + e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/executions/{executionId}/steps")
    @RequireApiAuth
    public ResponseEntity<List<StepExecutionDTO>> getExecutionSteps(@PathVariable Long executionId) {
        try {
            List<StepExecution> stepExecutions = pipelineExecutionService.getStepExecutions(executionId);
            List<StepExecutionDTO> dtos = stepExecutions.stream()
                    .map(pipelineMapper::toStepExecutionDTO)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            System.err.println("Error getting execution steps: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{pipelineId}/executions")
    @RequireApiAuth
    public ResponseEntity<List<PipelineExecutionDTO>> getExecutionHistory(@PathVariable Long pipelineId) {
        try {
            List<PipelineExecution> executions = pipelineExecutionService.getExecutionHistory(pipelineId);
            List<PipelineExecutionDTO> dtos = executions.stream()
                    .map(pipelineMapper::toPipelineExecutionDTO)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            System.err.println("Error getting execution history: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}