package com.example.apitest.repository;

import com.example.apitest.entity.StepExecution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StepExecutionRepository extends JpaRepository<StepExecution, Long> {
    
    List<StepExecution> findByPipelineExecutionIdOrderByStepOrder(Long pipelineExecutionId);
    
    @Query("SELECT se FROM StepExecution se WHERE se.pipelineExecution.id = :executionId ORDER BY se.stepOrder")
    List<StepExecution> findByExecutionIdOrderByStepOrder(@Param("executionId") Long executionId);
    
    @Query("SELECT se FROM StepExecution se WHERE se.pipelineExecution.id = :executionId AND se.stepOrder <= :stepOrder ORDER BY se.stepOrder")
    List<StepExecution> findPreviousSteps(@Param("executionId") Long executionId, @Param("stepOrder") Integer stepOrder);
}