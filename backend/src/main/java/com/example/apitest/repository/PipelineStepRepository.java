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
    
    List<PipelineStep> findByIsActiveTrueOrderByStepOrderAsc();
    
    // API 아이템 삭제시 관련 파이프라인 스텝도 삭제
    @Modifying
    @Query("DELETE FROM PipelineStep ps WHERE ps.apiItem.id = :apiItemId")
    int deleteByApiItemId(@Param("apiItemId") Long apiItemId);
}