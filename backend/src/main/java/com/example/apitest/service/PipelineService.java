package com.example.apitest.service;

import com.example.apitest.dto.pipeline.request.*;
import com.example.apitest.dto.pipeline.response.*;
import com.example.apitest.entity.*;
import com.example.apitest.mapper.PipelineMapper;
import com.example.apitest.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PipelineService {

    @Autowired
    private PipelineFolderRepository pipelineFolderRepository;
    
    @Autowired
    private PipelineRepository pipelineRepository;
    
    @Autowired
    private PipelineStepRepository pipelineStepRepository;
    
    @Autowired
    private ApiItemRepository apiItemRepository;
    
    @Autowired
    private StepExecutionRepository stepExecutionRepository;
    
    @Autowired
    private PipelineExecutionRepository pipelineExecutionRepository;
    
    @Autowired
    private PipelineMapper pipelineMapper;

    @Transactional(readOnly = true)
    public List<PipelineFolderDTO> getAllFolders() {
        List<PipelineFolder> folders = pipelineFolderRepository.findAll().stream()
            .filter(folder -> folder.getIsActive() != null && folder.getIsActive())
            .collect(Collectors.toList());
        
        return folders.stream().map(folder -> {
            List<Pipeline> pipelines = pipelineRepository.findByIsActiveTrueAndFolderIdOrderByCreatedAtAsc(folder.getId());
            List<PipelineStep> allSteps = pipelines.stream()
                .flatMap(pipeline -> pipelineStepRepository.findByPipelineIdOrderByStepOrderAsc(pipeline.getId()).stream())
                .collect(Collectors.toList());
            return pipelineMapper.toPipelineFolderDTO(folder, pipelines, allSteps);
        }).collect(Collectors.toList());
    }

    public PipelineFolder createFolder(PipelineFolder folder) {
        return pipelineFolderRepository.save(folder);
    }

    public Optional<PipelineFolder> updateFolder(Long id, PipelineFolder folderDetails) {
        return pipelineFolderRepository.findById(id)
            .map(folder -> {
                folder.setName(folderDetails.getName());
                folder.setDescription(folderDetails.getDescription());
                return pipelineFolderRepository.save(folder);
            });
    }

    public boolean deleteFolder(Long id) {
        return pipelineFolderRepository.findById(id)
            .map(folder -> {
                folder.setIsActive(false);
                pipelineFolderRepository.save(folder);
                return true;
            })
            .orElse(false);
    }

    public List<Pipeline> getAllPipelines() {
        return pipelineRepository.findByIsActiveTrueOrderByCreatedAtAsc();
    }

    public Pipeline createPipeline(CreatePipelineRequest request) {
        Optional<PipelineFolder> folder = pipelineFolderRepository.findById(request.getFolderId());
        if (!folder.isPresent()) {
            throw new IllegalArgumentException("Folder not found");
        }

        Pipeline pipeline = new Pipeline();
        pipeline.setName(request.getName());
        pipeline.setDescription(request.getDescription());
        pipeline.setFolder(folder.get());
        pipeline.setFolderId(request.getFolderId()); // folderId 명시적 설정
        pipeline.setIsActive(true);

        return pipelineRepository.save(pipeline);
    }

    public List<Pipeline> getPipelinesByFolder(Long folderId) {
        return pipelineRepository.findByIsActiveTrueAndFolderIdOrderByCreatedAtAsc(folderId);
    }

    public Optional<Pipeline> getPipeline(Long id) {
        return pipelineRepository.findById(id);
    }

    @Transactional
    public Optional<Pipeline> updatePipeline(Long id, UpdatePipelineRequest request) {
        return pipelineRepository.findById(id)
            .map(pipeline -> {
                pipeline.setName(request.getName());
                pipeline.setDescription(request.getDescription());
                return pipelineRepository.save(pipeline);
            });
    }

    @Transactional
    public boolean deletePipeline(Long id) {
        return pipelineRepository.findById(id)
            .map(pipeline -> {
                try {
                    // 1. StepExecution 먼저 삭제 (외래키 제약조건 해결)
                    stepExecutionRepository.deleteByPipelineId(id);
                    
                    // 2. PipelineExecution 삭제 (외래키 제약조건 해결)
                    pipelineExecutionRepository.deleteByPipelineId(id);
                    
                    // 3. Pipeline 삭제 (PipelineStep은 CASCADE로 자동 삭제됨)
                    pipelineRepository.delete(pipeline);
                    
                    return true;
                } catch (Exception e) {
                    e.printStackTrace();
                    throw e; // 트랜잭션 롤백
                }
            })
            .orElse(false);
    }

    @Transactional(readOnly = true)
    public List<PipelineStepDTO> getStepsByPipeline(Long pipelineId) {
        List<PipelineStep> steps = pipelineStepRepository.findByPipelineIdOrderByStepOrderAsc(pipelineId);
        return steps.stream()
            .map(pipelineMapper::toPipelineStepDTO)
            .collect(Collectors.toList());
    }

    @Transactional
    public PipelineStepDTO addStep(Long pipelineId, CreateStepRequest request) {
        Optional<Pipeline> pipeline = pipelineRepository.findById(pipelineId);
        if (!pipeline.isPresent()) {
            throw new IllegalArgumentException("Pipeline not found");
        }

        Optional<ApiItem> apiItem = apiItemRepository.findById(request.getApiItemId());
        if (!apiItem.isPresent()) {
            throw new IllegalArgumentException("API item not found");
        }

        List<PipelineStep> existingSteps = pipelineStepRepository.findByPipelineIdOrderByStepOrderAsc(pipelineId);
        int nextOrder = existingSteps.size() + 1;

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
        return pipelineMapper.toPipelineStepDTO(savedStep);
    }

    @Transactional
    public boolean deleteStep(Long stepId) {
        Optional<PipelineStep> step = pipelineStepRepository.findById(stepId);
        if (step.isPresent()) {
            PipelineStep stepToDelete = step.get();
            Long pipelineId = stepToDelete.getPipeline().getId();

            stepExecutionRepository.deleteByPipelineStepId(stepId);
            pipelineStepRepository.delete(stepToDelete);

            List<PipelineStep> remainingSteps = pipelineStepRepository
                .findByPipelineIdOrderByStepOrderAsc(pipelineId);

            for (int i = 0; i < remainingSteps.size(); i++) {
                int newOrder = i + 1;
                remainingSteps.get(i).setStepOrder(newOrder);
            }

            pipelineStepRepository.saveAll(remainingSteps);
            return true;
        }
        return false;
    }

    @Transactional
    public Optional<PipelineStepDTO> updateStep(Long stepId, CreateStepRequest request) {
        return pipelineStepRepository.findById(stepId)
            .map(step -> {
                if (!step.getApiItem().getId().equals(request.getApiItemId())) {
                    Optional<ApiItem> apiItem = apiItemRepository.findById(request.getApiItemId());
                    if (!apiItem.isPresent()) {
                        throw new IllegalArgumentException("API item not found");
                    }
                    step.setApiItem(apiItem.get());
                }

                step.setStepName(request.getStepName());
                step.setDescription(request.getDescription());
                step.setDataExtractions(request.getDataExtractions());
                step.setDataInjections(request.getDataInjections());
                step.setExecutionCondition(request.getExecutionCondition());
                step.setDelayAfter(request.getDelayAfter());

                PipelineStep updatedStep = pipelineStepRepository.save(step);
                return pipelineMapper.toPipelineStepDTO(updatedStep);
            });
    }

    public Optional<List<PipelineStep>> updateStepOrder(Long stepId, UpdateStepOrderRequest request) {
        Optional<PipelineStep> stepOptional = pipelineStepRepository.findById(stepId);
        if (!stepOptional.isPresent()) {
            return Optional.empty();
        }

        PipelineStep step = stepOptional.get();
        Long pipelineId = step.getPipeline().getId();
        
        List<PipelineStep> steps = pipelineStepRepository.findByIsActiveTrueAndPipelineIdOrderByStepOrderAsc(pipelineId);
        
        int oldOrder = step.getStepOrder();
        int newOrder = request.getNewOrder();
        
        if (newOrder < 1 || newOrder > steps.size()) {
            throw new IllegalArgumentException("Invalid order");
        }
        
        for (PipelineStep s : steps) {
            if (s.getId().equals(stepId)) {
                s.setStepOrder(newOrder);
            } else if (oldOrder < newOrder && s.getStepOrder() > oldOrder && s.getStepOrder() <= newOrder) {
                s.setStepOrder(s.getStepOrder() - 1);
            } else if (oldOrder > newOrder && s.getStepOrder() >= newOrder && s.getStepOrder() < oldOrder) {
                s.setStepOrder(s.getStepOrder() + 1);
            }
        }
        
        return Optional.of(pipelineStepRepository.saveAll(steps));
    }
}