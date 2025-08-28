package com.example.apitest.entity;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class PipelineEntityTest {

    @Test
    void testPipelineCreation() {
        Pipeline pipeline = new Pipeline();
        pipeline.setId(1L);
        pipeline.setName("Test Pipeline");
        pipeline.setDescription("Test Description");

        assertEquals(1L, pipeline.getId());
        assertEquals("Test Pipeline", pipeline.getName());
        assertEquals("Test Description", pipeline.getDescription());
    }

    @Test
    void testPipelineConstructor() {
        PipelineFolder folder = new PipelineFolder();
        folder.setId(1L);
        folder.setName("Test Folder");

        Pipeline pipeline = new Pipeline("Test Pipeline", "Test Description", folder);

        assertEquals("Test Pipeline", pipeline.getName());
        assertEquals("Test Description", pipeline.getDescription());
        assertEquals(folder, pipeline.getFolder());
    }

    @Test
    void testDefaultValues() {
        Pipeline pipeline = new Pipeline();

        assertTrue(pipeline.getIsActive());
    }

    @Test
    void testFolderRelation() {
        Pipeline pipeline = new Pipeline();
        PipelineFolder folder = new PipelineFolder();
        folder.setId(1L);
        folder.setName("Test Folder");

        pipeline.setFolder(folder);
        pipeline.setFolderId(1L);

        assertEquals(folder, pipeline.getFolder());
        assertEquals(1L, pipeline.getFolderId());
    }

    @Test
    void testStepsRelation() {
        Pipeline pipeline = new Pipeline();
        List<PipelineStep> steps = new ArrayList<>();
        
        PipelineStep step1 = new PipelineStep();
        step1.setId(1L);
        step1.setStepOrder(1);
        steps.add(step1);

        PipelineStep step2 = new PipelineStep();
        step2.setId(2L);
        step2.setStepOrder(2);
        steps.add(step2);

        pipeline.setSteps(steps);

        assertEquals(2, pipeline.getSteps().size());
        assertEquals(1, pipeline.getSteps().get(0).getStepOrder());
        assertEquals(2, pipeline.getSteps().get(1).getStepOrder());
    }

    @Test
    void testTimestamps() {
        Pipeline pipeline = new Pipeline();
        LocalDateTime now = LocalDateTime.now();

        pipeline.setCreatedAt(now);
        pipeline.setUpdatedAt(now);

        assertEquals(now, pipeline.getCreatedAt());
        assertEquals(now, pipeline.getUpdatedAt());
    }

    @Test
    void testActiveState() {
        Pipeline pipeline = new Pipeline();

        pipeline.setIsActive(true);
        assertTrue(pipeline.getIsActive());

        pipeline.setIsActive(false);
        assertFalse(pipeline.getIsActive());
    }
}