package com.example.apitest.repository;

import com.example.apitest.entity.ScenarioStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScenarioStepRepository extends JpaRepository<ScenarioStep, Long> {
    
    @Query("SELECT s FROM ScenarioStep s WHERE s.isActive = true AND s.scenario.id = :scenarioId ORDER BY s.stepOrder ASC")
    List<ScenarioStep> findByScenarioIdOrderByStepOrder(Long scenarioId);
    
    @Query("SELECT s FROM ScenarioStep s WHERE s.isActive = true ORDER BY s.stepOrder ASC")
    List<ScenarioStep> findAllActiveSteps();
}