package com.example.apitest.service;

import com.example.apitest.entity.*;
import com.example.apitest.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PipelineExecutionService 테스트")
class PipelineExecutionServiceTest {

    @InjectMocks
    private PipelineExecutionService pipelineExecutionService;

    @Mock
    private PipelineRepository pipelineRepository;

    @Mock
    private PipelineStepRepository pipelineStepRepository;

    @Mock
    private PipelineExecutionRepository pipelineExecutionRepository;

    @Mock
    private StepExecutionRepository stepExecutionRepository;

    private Pipeline testPipeline;
    private PipelineStep testStep;
    private ApiItem testApiItem;
    private PipelineExecution testExecution;

    @BeforeEach
    void setUp() {
        testPipeline = new Pipeline();
        testPipeline.setId(1L);
        testPipeline.setName("Test Pipeline");
        testPipeline.setIsActive(true);

        testApiItem = new ApiItem();
        testApiItem.setId(1L);
        testApiItem.setName("Test API");
        testApiItem.setMethod(ApiItem.HttpMethod.GET);
        testApiItem.setUrl("https://jsonplaceholder.typicode.com/posts/1");
        testApiItem.setRequestHeaders("{}");
        testApiItem.setRequestBody("");

        testStep = new PipelineStep();
        testStep.setId(1L);
        testStep.setPipeline(testPipeline);
        testStep.setApiItem(testApiItem);
        testStep.setStepOrder(1);
        testStep.setStepName("Test Step");
        testStep.setIsActive(true);
        testStep.setIsSkip(false);

        testExecution = new PipelineExecution(testPipeline);
        testExecution.setId(1L);
        testExecution.setTotalSteps(1);
    }

    // === startExecution 테스트 ===

    @Test
    @DisplayName("파이프라인 실행을 시작해야 함")
    void shouldStartExecution() {
        // given
        Long pipelineId = 1L;
        List<PipelineStep> steps = Arrays.asList(testStep);

        when(pipelineRepository.findById(pipelineId)).thenReturn(Optional.of(testPipeline));
        when(pipelineStepRepository.findByIsActiveTrueAndPipelineIdOrderByStepOrderAsc(pipelineId)).thenReturn(steps);
        when(pipelineExecutionRepository.save(any(PipelineExecution.class))).thenAnswer(invocation -> {
            PipelineExecution execution = invocation.getArgument(0);
            execution.setId(1L);
            return execution;
        });
        when(stepExecutionRepository.save(any(StepExecution.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        PipelineExecution result = pipelineExecutionService.startExecution(pipelineId);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);

        verify(pipelineRepository).findById(pipelineId);
        verify(pipelineStepRepository).findByIsActiveTrueAndPipelineIdOrderByStepOrderAsc(pipelineId);
        verify(pipelineExecutionRepository, atLeastOnce()).save(any(PipelineExecution.class));
    }

    @Test
    @DisplayName("존재하지 않는 파이프라인 실행 시 예외가 발생해야 함")
    void shouldThrowExceptionWhenExecutingNonExistentPipeline() {
        // given
        Long pipelineId = 999L;

        when(pipelineRepository.findById(pipelineId)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> pipelineExecutionService.startExecution(pipelineId))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("Pipeline not found");

        verify(pipelineRepository).findById(pipelineId);
        verify(pipelineExecutionRepository, never()).save(any(PipelineExecution.class));
    }

    @Test
    @DisplayName("활성 스텝이 없는 파이프라인 실행 시 예외가 발생해야 함")
    void shouldThrowExceptionWhenNoActiveSteps() {
        // given
        Long pipelineId = 1L;

        when(pipelineRepository.findById(pipelineId)).thenReturn(Optional.of(testPipeline));
        when(pipelineStepRepository.findByIsActiveTrueAndPipelineIdOrderByStepOrderAsc(pipelineId)).thenReturn(Arrays.asList());

        // when & then
        assertThatThrownBy(() -> pipelineExecutionService.startExecution(pipelineId))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("No active steps found");

        verify(pipelineRepository).findById(pipelineId);
        verify(pipelineStepRepository).findByIsActiveTrueAndPipelineIdOrderByStepOrderAsc(pipelineId);
    }

    @Test
    @DisplayName("스킵 설정된 스텝은 실행하지 않아야 함")
    void shouldSkipStepsMarkedAsSkip() {
        // given
        Long pipelineId = 1L;
        testStep.setIsSkip(true);
        List<PipelineStep> steps = Arrays.asList(testStep);

        when(pipelineRepository.findById(pipelineId)).thenReturn(Optional.of(testPipeline));
        when(pipelineStepRepository.findByIsActiveTrueAndPipelineIdOrderByStepOrderAsc(pipelineId)).thenReturn(steps);
        when(pipelineExecutionRepository.save(any(PipelineExecution.class))).thenAnswer(invocation -> {
            PipelineExecution execution = invocation.getArgument(0);
            execution.setId(1L);
            return execution;
        });
        when(pipelineExecutionRepository.findById(1L)).thenReturn(Optional.of(testExecution));
        when(stepExecutionRepository.save(any(StepExecution.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        PipelineExecution result = pipelineExecutionService.startExecution(pipelineId);

        // then
        assertThat(result).isNotNull();

        verify(pipelineRepository).findById(pipelineId);
        verify(stepExecutionRepository, atLeastOnce()).save(argThat(execution ->
            execution.getStatus() == StepExecution.StepStatus.SKIPPED
        ));
    }

    // === getExecutionStatus 테스트 ===

    @Test
    @DisplayName("실행 ID로 실행 상태를 조회해야 함")
    void shouldGetExecutionStatus() {
        // given
        Long executionId = 1L;

        when(pipelineExecutionRepository.findById(executionId)).thenReturn(Optional.of(testExecution));

        // when
        PipelineExecution result = pipelineExecutionService.getExecutionStatus(executionId);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);

        verify(pipelineExecutionRepository).findById(executionId);
    }

    @Test
    @DisplayName("존재하지 않는 실행 ID로 조회 시 예외가 발생해야 함")
    void shouldThrowExceptionWhenExecutionNotFound() {
        // given
        Long executionId = 999L;

        when(pipelineExecutionRepository.findById(executionId)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> pipelineExecutionService.getExecutionStatus(executionId))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("Execution not found");

        verify(pipelineExecutionRepository).findById(executionId);
    }

    // === getStepExecutions 테스트 ===

    @Test
    @DisplayName("실행 ID로 스텝 실행 목록을 조회해야 함")
    void shouldGetStepExecutions() {
        // given
        Long executionId = 1L;

        StepExecution stepExecution = new StepExecution(testExecution, testStep);
        stepExecution.setId(1L);
        stepExecution.setStatus(StepExecution.StepStatus.SUCCESS);

        List<StepExecution> stepExecutions = Arrays.asList(stepExecution);

        when(stepExecutionRepository.findByExecutionIdWithApiItemOrderByStepOrder(executionId)).thenReturn(stepExecutions);

        // when
        List<StepExecution> result = pipelineExecutionService.getStepExecutions(executionId);

        // then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo(1L);

        verify(stepExecutionRepository).findByExecutionIdWithApiItemOrderByStepOrder(executionId);
    }

    @Test
    @DisplayName("스텝 실행이 없는 경우 빈 목록을 반환해야 함")
    void shouldReturnEmptyListWhenNoStepExecutions() {
        // given
        Long executionId = 1L;

        when(stepExecutionRepository.findByExecutionIdWithApiItemOrderByStepOrder(executionId)).thenReturn(Arrays.asList());

        // when
        List<StepExecution> result = pipelineExecutionService.getStepExecutions(executionId);

        // then
        assertThat(result).isEmpty();

        verify(stepExecutionRepository).findByExecutionIdWithApiItemOrderByStepOrder(executionId);
    }

    // === getExecutionHistory 테스트 ===

    @Test
    @DisplayName("파이프라인 ID로 실행 이력을 조회해야 함")
    void shouldGetExecutionHistory() {
        // given
        Long pipelineId = 1L;

        PipelineExecution execution1 = new PipelineExecution(testPipeline);
        execution1.setId(1L);
        execution1.setStatus(PipelineExecution.ExecutionStatus.COMPLETED);

        PipelineExecution execution2 = new PipelineExecution(testPipeline);
        execution2.setId(2L);
        execution2.setStatus(PipelineExecution.ExecutionStatus.FAILED);

        List<PipelineExecution> history = Arrays.asList(execution2, execution1);

        when(pipelineExecutionRepository.findRecentExecutions(pipelineId)).thenReturn(history);

        // when
        List<PipelineExecution> result = pipelineExecutionService.getExecutionHistory(pipelineId);

        // then
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getId()).isEqualTo(2L);
        assertThat(result.get(1).getId()).isEqualTo(1L);

        verify(pipelineExecutionRepository).findRecentExecutions(pipelineId);
    }

    @Test
    @DisplayName("실행 이력이 없는 경우 빈 목록을 반환해야 함")
    void shouldReturnEmptyListWhenNoExecutionHistory() {
        // given
        Long pipelineId = 1L;

        when(pipelineExecutionRepository.findRecentExecutions(pipelineId)).thenReturn(Arrays.asList());

        // when
        List<PipelineExecution> result = pipelineExecutionService.getExecutionHistory(pipelineId);

        // then
        assertThat(result).isEmpty();

        verify(pipelineExecutionRepository).findRecentExecutions(pipelineId);
    }

    // === 다중 스텝 실행 테스트 ===

    @Test
    @DisplayName("여러 스텝이 있는 파이프라인을 실행해야 함")
    void shouldExecutePipelineWithMultipleSteps() {
        // given
        Long pipelineId = 1L;

        ApiItem apiItem2 = new ApiItem();
        apiItem2.setId(2L);
        apiItem2.setMethod(ApiItem.HttpMethod.GET);
        apiItem2.setUrl("https://jsonplaceholder.typicode.com/posts/2");
        apiItem2.setRequestHeaders("{}");

        PipelineStep step2 = new PipelineStep();
        step2.setId(2L);
        step2.setPipeline(testPipeline);
        step2.setApiItem(apiItem2);
        step2.setStepOrder(2);
        step2.setStepName("Test Step 2");
        step2.setIsActive(true);
        step2.setIsSkip(false);

        List<PipelineStep> steps = Arrays.asList(testStep, step2);

        when(pipelineRepository.findById(pipelineId)).thenReturn(Optional.of(testPipeline));
        when(pipelineStepRepository.findByIsActiveTrueAndPipelineIdOrderByStepOrderAsc(pipelineId)).thenReturn(steps);
        when(pipelineExecutionRepository.save(any(PipelineExecution.class))).thenAnswer(invocation -> {
            PipelineExecution execution = invocation.getArgument(0);
            execution.setId(1L);
            return execution;
        });
        when(stepExecutionRepository.save(any(StepExecution.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        PipelineExecution result = pipelineExecutionService.startExecution(pipelineId);

        // then
        assertThat(result).isNotNull();
        verify(pipelineRepository).findById(pipelineId);
        verify(pipelineStepRepository).findByIsActiveTrueAndPipelineIdOrderByStepOrderAsc(pipelineId);
    }

    // === 데이터 추출 및 주입 테스트 ===

    @Test
    @DisplayName("데이터 추출 설정이 있는 스텝을 처리해야 함")
    void shouldHandleStepWithDataExtraction() {
        // given
        Long pipelineId = 1L;
        testStep.setDataExtractions("{\"userId\":\"userId\"}");

        List<PipelineStep> steps = Arrays.asList(testStep);

        when(pipelineRepository.findById(pipelineId)).thenReturn(Optional.of(testPipeline));
        when(pipelineStepRepository.findByIsActiveTrueAndPipelineIdOrderByStepOrderAsc(pipelineId)).thenReturn(steps);
        when(pipelineExecutionRepository.save(any(PipelineExecution.class))).thenAnswer(invocation -> {
            PipelineExecution execution = invocation.getArgument(0);
            execution.setId(1L);
            return execution;
        });
        when(stepExecutionRepository.save(any(StepExecution.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        PipelineExecution result = pipelineExecutionService.startExecution(pipelineId);

        // then
        assertThat(result).isNotNull();
        verify(pipelineRepository).findById(pipelineId);
    }

    @Test
    @DisplayName("delay가 설정된 스텝은 지연 시간을 고려해야 함")
    void shouldRespectStepDelay() {
        // given
        Long pipelineId = 1L;
        testStep.setDelayAfter(100); // 100ms delay

        List<PipelineStep> steps = Arrays.asList(testStep);

        when(pipelineRepository.findById(pipelineId)).thenReturn(Optional.of(testPipeline));
        when(pipelineStepRepository.findByIsActiveTrueAndPipelineIdOrderByStepOrderAsc(pipelineId)).thenReturn(steps);
        when(pipelineExecutionRepository.save(any(PipelineExecution.class))).thenAnswer(invocation -> {
            PipelineExecution execution = invocation.getArgument(0);
            execution.setId(1L);
            return execution;
        });
        when(stepExecutionRepository.save(any(StepExecution.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        PipelineExecution result = pipelineExecutionService.startExecution(pipelineId);

        // then
        assertThat(result).isNotNull();
        verify(pipelineRepository).findById(pipelineId);
    }

    // === 실행 실패 처리 테스트 ===

    @Test
    @DisplayName("파이프라인 실행 중 오류 발생 시 FAILED 상태로 저장해야 함")
    void shouldMarkExecutionAsFailedOnError() {
        // given
        Long pipelineId = 1L;

        when(pipelineRepository.findById(pipelineId)).thenReturn(Optional.of(testPipeline));
        when(pipelineStepRepository.findByIsActiveTrueAndPipelineIdOrderByStepOrderAsc(pipelineId))
            .thenThrow(new RuntimeException("Test error"));
        when(pipelineExecutionRepository.save(any(PipelineExecution.class))).thenAnswer(invocation -> {
            PipelineExecution execution = invocation.getArgument(0);
            execution.setId(1L);
            return execution;
        });

        // when
        PipelineExecution result = pipelineExecutionService.startExecution(pipelineId);

        // then
        assertThat(result).isNotNull();
        verify(pipelineRepository).findById(pipelineId);
        verify(pipelineExecutionRepository, atLeastOnce()).save(argThat(execution ->
            execution.getStatus() == PipelineExecution.ExecutionStatus.FAILED
        ));
    }
}
