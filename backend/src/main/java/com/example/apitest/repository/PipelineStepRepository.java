package com.example.apitest.repository;

import com.example.apitest.entity.PipelineStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PipelineStepRepository extends JpaRepository<PipelineStep, Long> {
    
    List<PipelineStep> findByIsActiveTrueAndPipelineIdOrderByStepOrderAsc(Long pipelineId);
    
    List<PipelineStep> findByIsActiveTrueOrderByStepOrderAsc();
}