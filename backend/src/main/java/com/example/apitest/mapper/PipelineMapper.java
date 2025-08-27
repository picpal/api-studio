package com.example.apitest.mapper;

import com.example.apitest.dto.pipeline.response.*;
import com.example.apitest.entity.*;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class PipelineMapper {

    public PipelineFolderDTO toPipelineFolderDTO(PipelineFolder folder, List<Pipeline> pipelines, List<PipelineStep> allSteps) {
        PipelineFolderDTO dto = new PipelineFolderDTO();
        dto.setId(folder.getId());
        dto.setName(folder.getName());
        dto.setDescription(folder.getDescription());
        dto.setIsActive(folder.getIsActive());
        dto.setCreatedAt(folder.getCreatedAt());
        dto.setUpdatedAt(folder.getUpdatedAt());
        
        List<PipelineDTO> pipelineDTOs = pipelines.stream()
                .map(pipeline -> {
                    PipelineDTO pipelineDTO = new PipelineDTO();
                    pipelineDTO.setId(pipeline.getId());
                    pipelineDTO.setName(pipeline.getName());
                    pipelineDTO.setDescription(pipeline.getDescription());
                    pipelineDTO.setFolderId(pipeline.getFolderId());
                    
                    int stepCount = (int) allSteps.stream()
                            .filter(step -> step.getPipeline().getId().equals(pipeline.getId()))
                            .count();
                    pipelineDTO.setStepCount(stepCount);
                    
                    pipelineDTO.setCreatedAt(pipeline.getCreatedAt());
                    pipelineDTO.setUpdatedAt(pipeline.getUpdatedAt());
                    return pipelineDTO;
                })
                .collect(Collectors.toList());
        
        dto.setPipelines(pipelineDTOs);
        return dto;
    }

    public PipelineStepDTO toPipelineStepDTO(PipelineStep step) {
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
        
        if (step.getApiItem() != null) {
            dto.setApiItem(toApiItemDTO(step.getApiItem()));
        }
        
        return dto;
    }

    public ApiItemDTO toApiItemDTO(ApiItem apiItem) {
        ApiItemDTO dto = new ApiItemDTO();
        dto.setId(apiItem.getId());
        dto.setName(apiItem.getName());
        dto.setMethod(apiItem.getMethod().toString());
        dto.setUrl(apiItem.getUrl());
        dto.setDescription(apiItem.getDescription());
        return dto;
    }

    public PipelineExecutionDTO toPipelineExecutionDTO(PipelineExecution execution) {
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

    public StepExecutionDTO toStepExecutionDTO(StepExecution stepExecution) {
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
                dto.setApiItem(toApiItemDTO(step.getApiItem()));
            }
        }
        
        return dto;
    }
}