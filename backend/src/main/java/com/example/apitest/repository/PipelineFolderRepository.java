package com.example.apitest.repository;

import com.example.apitest.entity.PipelineFolder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PipelineFolderRepository extends JpaRepository<PipelineFolder, Long> {
    
    List<PipelineFolder> findByIsActiveTrueOrderByCreatedAtAsc();
    
    List<PipelineFolder> findByIsActiveTrueAndNameContainingIgnoreCaseOrderByCreatedAtAsc(String name);
}