package com.example.apitest.repository;

import com.example.apitest.entity.PipelineStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PipelineStepRepository extends JpaRepository<PipelineStep, Long> {
    
    List<PipelineStep> findByIsActiveTrueAndPipelineIdOrderByStepOrderAsc(Long pipelineId);
    
    // 하드 삭제 방식을 위해 isActive 조건 없이 모든 step 조회
    List<PipelineStep> findByPipelineIdOrderByStepOrderAsc(Long pipelineId);
    
    @Query("SELECT ps FROM PipelineStep ps JOIN FETCH ps.apiItem WHERE ps.isActive = true AND ps.pipeline.id = :pipelineId ORDER BY ps.stepOrder ASC")
    List<PipelineStep> findByIsActiveTrueAndPipelineIdOrderByStepOrderAscWithApiItem(@Param("pipelineId") Long pipelineId);
    
    // 하드 삭제 방식을 위해 isActive 조건 없이 ApiItem과 함께 조회
    @Query("SELECT ps FROM PipelineStep ps JOIN FETCH ps.apiItem WHERE ps.pipeline.id = :pipelineId ORDER BY ps.stepOrder ASC")
    List<PipelineStep> findByPipelineIdOrderByStepOrderAscWithApiItem(@Param("pipelineId") Long pipelineId);
    
    List<PipelineStep> findByIsActiveTrueOrderByStepOrderAsc();
    
    // API 아이템 삭제시 관련 파이프라인 스텝도 삭제
    @Modifying
    @Query("DELETE FROM PipelineStep ps WHERE ps.apiItem.id = :apiItemId")
    int deleteByApiItemId(@Param("apiItemId") Long apiItemId);
}