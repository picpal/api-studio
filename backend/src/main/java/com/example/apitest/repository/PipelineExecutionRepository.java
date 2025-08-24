package com.example.apitest.repository;

import com.example.apitest.entity.PipelineExecution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PipelineExecutionRepository extends JpaRepository<PipelineExecution, Long> {
    
    List<PipelineExecution> findByPipelineIdOrderByStartedAtDesc(Long pipelineId);
    
    @Query("SELECT pe FROM PipelineExecution pe WHERE pe.pipeline.id = :pipelineId ORDER BY pe.startedAt DESC")
    List<PipelineExecution> findRecentExecutions(@Param("pipelineId") Long pipelineId);
    
    @Query("SELECT pe FROM PipelineExecution pe WHERE pe.status = 'RUNNING'")
    List<PipelineExecution> findRunningExecutions();
}