package com.example.apitest.repository;

import com.example.apitest.entity.ScenarioFolder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScenarioFolderRepository extends JpaRepository<ScenarioFolder, Long> {
    
    @Query("SELECT DISTINCT f FROM ScenarioFolder f LEFT JOIN FETCH f.scenarios s WHERE f.isActive = true AND (s IS NULL OR s.isActive = true) ORDER BY f.createdAt ASC")
    List<ScenarioFolder> findAllActiveFolders();
    
    @Query("SELECT f FROM ScenarioFolder f WHERE f.isActive = true AND f.name LIKE %:name% ORDER BY f.createdAt ASC")
    List<ScenarioFolder> findByNameContainingIgnoreCase(String name);
}