package com.example.apitest.repository;

import com.example.apitest.entity.PipelineFolderPermission;
import com.example.apitest.entity.PipelineFolder;
import com.example.apitest.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface PipelineFolderPermissionRepository extends JpaRepository<PipelineFolderPermission, Long> {
    
    Optional<PipelineFolderPermission> findByUserAndPipelineFolder(User user, PipelineFolder pipelineFolder);
    
    List<PipelineFolderPermission> findByPipelineFolder(PipelineFolder pipelineFolder);
    
    List<PipelineFolderPermission> findByUser(User user);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM PipelineFolderPermission p WHERE p.pipelineFolder.id = :pipelineFolderId")
    void deleteByPipelineFolderId(@Param("pipelineFolderId") Long pipelineFolderId);
}