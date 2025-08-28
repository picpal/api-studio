package com.example.apitest.entity;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

public class PipelineStepEntityTest {

    @Test
    void testPipelineStepCreation() {
        PipelineStep step = new PipelineStep();
        step.setId(1L);
        step.setStepOrder(1);
        step.setStepName("Test Step");
        step.setDescription("Test Description");
        step.setDelayAfter(1000);

        assertEquals(1L, step.getId());
        assertEquals(1, step.getStepOrder());
        assertEquals("Test Step", step.getStepName());
        assertEquals("Test Description", step.getDescription());
        assertEquals(1000, step.getDelayAfter());
    }

    @Test
    void testPipelineStepConstructor() {
        Pipeline pipeline = new Pipeline();
        ApiItem apiItem = new ApiItem();
        
        PipelineStep step = new PipelineStep(pipeline, apiItem, 1);

        assertEquals(pipeline, step.getPipeline());
        assertEquals(apiItem, step.getApiItem());
        assertEquals(1, step.getStepOrder());
    }

    @Test
    void testDefaultValues() {
        PipelineStep step = new PipelineStep();

        assertTrue(step.getIsActive());
    }

    @Test
    void testDataExtractions() {
        PipelineStep step = new PipelineStep();
        String extractions = "{\"token\": \"response.data.token\"}";

        step.setDataExtractions(extractions);

        assertEquals(extractions, step.getDataExtractions());
    }

    @Test
    void testDataInjections() {
        PipelineStep step = new PipelineStep();
        String injections = "{\"headers.Authorization\": \"Bearer {{token}}\"}";

        step.setDataInjections(injections);

        assertEquals(injections, step.getDataInjections());
    }

    @Test
    void testExecutionCondition() {
        PipelineStep step = new PipelineStep();
        String condition = "{\"field\": \"value\"}";

        step.setExecutionCondition(condition);

        assertEquals(condition, step.getExecutionCondition());
    }

    @Test
    void testTimestamps() {
        PipelineStep step = new PipelineStep();
        LocalDateTime now = LocalDateTime.now();

        step.setCreatedAt(now);
        step.setUpdatedAt(now);

        assertEquals(now, step.getCreatedAt());
        assertEquals(now, step.getUpdatedAt());
    }

    @Test
    void testActiveState() {
        PipelineStep step = new PipelineStep();

        step.setIsActive(true);
        assertTrue(step.getIsActive());

        step.setIsActive(false);
        assertFalse(step.getIsActive());
    }

    @Test
    void testRelations() {
        PipelineStep step = new PipelineStep();
        Pipeline pipeline = new Pipeline();
        ApiItem apiItem = new ApiItem();

        step.setPipeline(pipeline);
        step.setApiItem(apiItem);

        assertEquals(pipeline, step.getPipeline());
        assertEquals(apiItem, step.getApiItem());
    }
}