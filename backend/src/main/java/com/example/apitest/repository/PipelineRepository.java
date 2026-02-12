package com.example.apitest.repository;

import com.example.apitest.entity.Pipeline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PipelineRepository extends JpaRepository<Pipeline, Long> {

    List<Pipeline> findByIsActiveTrueOrderByCreatedAtAsc();

    List<Pipeline> findByIsActiveTrueAndFolderIdOrderByCreatedAtAsc(Long folderId);

    List<Pipeline> findByIsActiveTrueAndNameContainingIgnoreCaseOrderByCreatedAtAsc(String name);

    List<Pipeline> findByIsActiveTrueOrderByOrderIndexAsc();

    List<Pipeline> findByIsActiveTrueAndFolderIdOrderByOrderIndexAsc(Long folderId);
}