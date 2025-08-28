package com.example.apitest.repository;

import com.example.apitest.entity.ApiFolder;
import com.example.apitest.entity.ApiItem;
import com.example.apitest.entity.Pipeline;
import com.example.apitest.entity.PipelineStep;
import com.example.apitest.entity.PipelineFolder;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
public class PipelineStepRepositorySimpleTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private PipelineStepRepository pipelineStepRepository;

    private ApiFolder testFolder;
    private PipelineFolder pipelineFolder;
    private Pipeline testPipeline;
    private ApiItem testApiItem;

    @BeforeEach
    void setUp() {
        // Create test folder
        testFolder = new ApiFolder();
        testFolder.setName("Test Folder");
        testFolder = entityManager.persistAndFlush(testFolder);

        // Create pipeline folder
        pipelineFolder = new PipelineFolder();
        pipelineFolder.setName("Test Pipeline Folder");
        pipelineFolder = entityManager.persistAndFlush(pipelineFolder);

        // Create test API item
        testApiItem = new ApiItem();
        testApiItem.setName("Test API");
        testApiItem.setMethod(ApiItem.HttpMethod.GET);
        testApiItem.setUrl("http://test.com/api");
        testApiItem.setFolder(testFolder);
        testApiItem = entityManager.persistAndFlush(testApiItem);

        // Create test pipeline
        testPipeline = new Pipeline();
        testPipeline.setName("Test Pipeline");
        testPipeline.setFolder(pipelineFolder);
        testPipeline = entityManager.persistAndFlush(testPipeline);
    }

    @Test
    void testSaveAndFindStep() {
        PipelineStep step = new PipelineStep();
        step.setPipeline(testPipeline);
        step.setApiItem(testApiItem);
        step.setStepOrder(1);
        step.setDelayAfter(1000);

        PipelineStep saved = pipelineStepRepository.save(step);
        
        assertNotNull(saved.getId());
        assertEquals(1, saved.getStepOrder());
        assertEquals(1000, saved.getDelayAfter());
    }

    @Test
    void testFindByPipelineId() {
        PipelineStep step1 = new PipelineStep();
        step1.setPipeline(testPipeline);
        step1.setApiItem(testApiItem);
        step1.setStepOrder(1);
        pipelineStepRepository.save(step1);

        PipelineStep step2 = new PipelineStep();
        step2.setPipeline(testPipeline);
        step2.setApiItem(testApiItem);
        step2.setStepOrder(2);
        pipelineStepRepository.save(step2);

        List<PipelineStep> steps = pipelineStepRepository.findByPipelineIdOrderByStepOrderAsc(testPipeline.getId());
        
        assertEquals(2, steps.size());
        assertEquals(1, steps.get(0).getStepOrder());
        assertEquals(2, steps.get(1).getStepOrder());
    }

    @Test
    void testFindByPipelineIdWithApiItem() {
        PipelineStep step = new PipelineStep();
        step.setPipeline(testPipeline);
        step.setApiItem(testApiItem);
        step.setStepOrder(1);
        pipelineStepRepository.save(step);

        List<PipelineStep> steps = pipelineStepRepository.findByPipelineIdOrderByStepOrderAscWithApiItem(testPipeline.getId());
        
        assertEquals(1, steps.size());
        assertNotNull(steps.get(0).getApiItem());
        assertEquals(testApiItem.getId(), steps.get(0).getApiItem().getId());
    }

    @Test
    void testDeleteStep() {
        PipelineStep step = new PipelineStep();
        step.setPipeline(testPipeline);
        step.setApiItem(testApiItem);
        step.setStepOrder(1);
        step = pipelineStepRepository.save(step);

        Long id = step.getId();
        pipelineStepRepository.delete(step);
        
        Optional<PipelineStep> deleted = pipelineStepRepository.findById(id);
        assertFalse(deleted.isPresent());
    }

    @Test
    void testDeleteByApiItemId() {
        PipelineStep step = new PipelineStep();
        step.setPipeline(testPipeline);
        step.setApiItem(testApiItem);
        step.setStepOrder(1);
        pipelineStepRepository.save(step);

        int deletedCount = pipelineStepRepository.deleteByApiItemId(testApiItem.getId());
        
        assertEquals(1, deletedCount);
    }

    @Test
    void testFindActiveSteps() {
        PipelineStep activeStep = new PipelineStep();
        activeStep.setPipeline(testPipeline);
        activeStep.setApiItem(testApiItem);
        activeStep.setStepOrder(1);
        activeStep.setIsActive(true);
        pipelineStepRepository.save(activeStep);

        PipelineStep inactiveStep = new PipelineStep();
        inactiveStep.setPipeline(testPipeline);
        inactiveStep.setApiItem(testApiItem);
        inactiveStep.setStepOrder(2);
        inactiveStep.setIsActive(false);
        pipelineStepRepository.save(inactiveStep);

        List<PipelineStep> activeSteps = pipelineStepRepository.findByIsActiveTrueAndPipelineIdOrderByStepOrderAsc(testPipeline.getId());
        
        assertEquals(1, activeSteps.size());
        assertEquals(1, activeSteps.get(0).getStepOrder());
    }
}