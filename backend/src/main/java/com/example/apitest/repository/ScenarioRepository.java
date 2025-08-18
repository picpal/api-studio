package com.example.apitest.repository;

import com.example.apitest.entity.Scenario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScenarioRepository extends JpaRepository<Scenario, Long> {
    
    @Query("SELECT s FROM Scenario s WHERE s.isActive = true ORDER BY s.createdAt ASC")
    List<Scenario> findAllActiveScenarios();
    
    @Query("SELECT s FROM Scenario s WHERE s.isActive = true AND s.folderId = :folderId ORDER BY s.createdAt ASC")
    List<Scenario> findByFolderId(Long folderId);
    
    @Query("SELECT s FROM Scenario s WHERE s.isActive = true AND s.name LIKE %:name% ORDER BY s.createdAt ASC")
    List<Scenario> findByNameContainingIgnoreCase(String name);
}