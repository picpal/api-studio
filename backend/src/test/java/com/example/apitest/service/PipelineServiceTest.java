package com.example.apitest.service;

import com.example.apitest.dto.pipeline.request.BatchUpdateStepOrderRequest;
import com.example.apitest.dto.pipeline.request.CreatePipelineRequest;
import com.example.apitest.dto.pipeline.request.CreateStepRequest;
import com.example.apitest.dto.pipeline.request.UpdatePipelineRequest;
import com.example.apitest.dto.pipeline.request.UpdateStepOrderRequest;
import com.example.apitest.dto.pipeline.response.PipelineFolderDTO;
import com.example.apitest.dto.pipeline.response.PipelineStepDTO;
import com.example.apitest.entity.*;
import com.example.apitest.mapper.PipelineMapper;
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
@DisplayName("PipelineService 테스트")
class PipelineServiceTest {

    @InjectMocks
    private PipelineService pipelineService;

    @Mock
    private PipelineFolderRepository pipelineFolderRepository;

    @Mock
    private PipelineRepository pipelineRepository;

    @Mock
    private PipelineStepRepository pipelineStepRepository;

    @Mock
    private ApiItemRepository apiItemRepository;

    @Mock
    private StepExecutionRepository stepExecutionRepository;

    @Mock
    private PipelineExecutionRepository pipelineExecutionRepository;

    @Mock
    private PipelineMapper pipelineMapper;

    private PipelineFolder testFolder;
    private Pipeline testPipeline;
    private PipelineStep testStep;
    private ApiItem testApiItem;

    @BeforeEach
    void setUp() {
        testFolder = new PipelineFolder();
        testFolder.setId(1L);
        testFolder.setName("Test Folder");
        testFolder.setIsActive(true);

        testPipeline = new Pipeline();
        testPipeline.setId(1L);
        testPipeline.setName("Test Pipeline");
        testPipeline.setDescription("Test Description");
        testPipeline.setFolder(testFolder);
        testPipeline.setFolderId(1L);
        testPipeline.setIsActive(true);

        testApiItem = new ApiItem();
        testApiItem.setId(1L);
        testApiItem.setName("Test API");
        testApiItem.setMethod(ApiItem.HttpMethod.GET);
        testApiItem.setUrl("https://api.example.com/test");

        testStep = new PipelineStep();
        testStep.setId(1L);
        testStep.setPipeline(testPipeline);
        testStep.setApiItem(testApiItem);
        testStep.setStepOrder(1);
        testStep.setStepName("Test Step");
        testStep.setIsActive(true);
    }

    // === 폴더 관리 테스트 ===

    @Test
    @DisplayName("모든 활성 폴더를 조회해야 함")
    void shouldGetAllActiveFolders() {
        // given
        List<PipelineFolder> folders = Arrays.asList(testFolder);
        List<Pipeline> pipelines = Arrays.asList(testPipeline);
        List<PipelineStep> steps = Arrays.asList(testStep);

        PipelineFolderDTO folderDTO = new PipelineFolderDTO();
        folderDTO.setId(1L);
        folderDTO.setName("Test Folder");

        when(pipelineFolderRepository.findAll()).thenReturn(folders);
        when(pipelineRepository.findByIsActiveTrueAndFolderIdOrderByCreatedAtAsc(1L)).thenReturn(pipelines);
        when(pipelineStepRepository.findByPipelineIdOrderByStepOrderAsc(1L)).thenReturn(steps);
        when(pipelineMapper.toPipelineFolderDTO(any(), any(), any())).thenReturn(folderDTO);

        // when
        List<PipelineFolderDTO> result = pipelineService.getAllFolders();

        // then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo(1L);

        verify(pipelineFolderRepository).findAll();
        verify(pipelineRepository).findByIsActiveTrueAndFolderIdOrderByCreatedAtAsc(1L);
    }

    @Test
    @DisplayName("비활성 폴더는 조회되지 않아야 함")
    void shouldNotRetrieveInactiveFolders() {
        // given
        PipelineFolder inactiveFolder = new PipelineFolder();
        inactiveFolder.setId(2L);
        inactiveFolder.setName("Inactive Folder");
        inactiveFolder.setIsActive(false);

        List<PipelineFolder> folders = Arrays.asList(testFolder, inactiveFolder);

        PipelineFolderDTO folderDTO = new PipelineFolderDTO();
        folderDTO.setId(1L);

        when(pipelineFolderRepository.findAll()).thenReturn(folders);
        when(pipelineRepository.findByIsActiveTrueAndFolderIdOrderByCreatedAtAsc(1L)).thenReturn(Arrays.asList(testPipeline));
        when(pipelineStepRepository.findByPipelineIdOrderByStepOrderAsc(1L)).thenReturn(Arrays.asList());
        when(pipelineMapper.toPipelineFolderDTO(any(), any(), any())).thenReturn(folderDTO);

        // when
        List<PipelineFolderDTO> result = pipelineService.getAllFolders();

        // then
        assertThat(result).hasSize(1); // only active folder
        verify(pipelineRepository, never()).findByIsActiveTrueAndFolderIdOrderByCreatedAtAsc(2L);
    }

    @Test
    @DisplayName("폴더를 생성해야 함")
    void shouldCreateFolder() {
        // given
        PipelineFolder newFolder = new PipelineFolder();
        newFolder.setName("New Folder");

        when(pipelineFolderRepository.save(any(PipelineFolder.class))).thenAnswer(invocation -> {
            PipelineFolder folder = invocation.getArgument(0);
            folder.setId(2L);
            return folder;
        });

        // when
        PipelineFolder result = pipelineService.createFolder(newFolder);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(2L);

        verify(pipelineFolderRepository).save(newFolder);
    }

    @Test
    @DisplayName("폴더를 수정해야 함")
    void shouldUpdateFolder() {
        // given
        Long folderId = 1L;
        PipelineFolder updatedDetails = new PipelineFolder();
        updatedDetails.setName("Updated Folder");
        updatedDetails.setDescription("Updated Description");

        when(pipelineFolderRepository.findById(folderId)).thenReturn(Optional.of(testFolder));
        when(pipelineFolderRepository.save(any(PipelineFolder.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        Optional<PipelineFolder> result = pipelineService.updateFolder(folderId, updatedDetails);

        // then
        assertThat(result).isPresent();
        verify(pipelineFolderRepository).findById(folderId);
        verify(pipelineFolderRepository).save(any(PipelineFolder.class));
    }

    @Test
    @DisplayName("폴더를 삭제(비활성화)해야 함")
    void shouldDeleteFolder() {
        // given
        Long folderId = 1L;

        when(pipelineFolderRepository.findById(folderId)).thenReturn(Optional.of(testFolder));
        when(pipelineFolderRepository.save(any(PipelineFolder.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        boolean result = pipelineService.deleteFolder(folderId);

        // then
        assertThat(result).isTrue();
        verify(pipelineFolderRepository).findById(folderId);
        verify(pipelineFolderRepository).save(argThat(folder -> !folder.getIsActive()));
    }

    // === 파이프라인 관리 테스트 ===

    @Test
    @DisplayName("모든 활성 파이프라인을 조회해야 함")
    void shouldGetAllActivePipelines() {
        // given
        List<Pipeline> pipelines = Arrays.asList(testPipeline);

        when(pipelineRepository.findByIsActiveTrueOrderByCreatedAtAsc()).thenReturn(pipelines);

        // when
        List<Pipeline> result = pipelineService.getAllPipelines();

        // then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo(1L);

        verify(pipelineRepository).findByIsActiveTrueOrderByCreatedAtAsc();
    }

    @Test
    @DisplayName("파이프라인을 생성해야 함")
    void shouldCreatePipeline() {
        // given
        CreatePipelineRequest request = new CreatePipelineRequest();
        request.setName("New Pipeline");
        request.setDescription("New Description");
        request.setFolderId(1L);

        when(pipelineFolderRepository.findById(1L)).thenReturn(Optional.of(testFolder));
        when(pipelineRepository.save(any(Pipeline.class))).thenAnswer(invocation -> {
            Pipeline pipeline = invocation.getArgument(0);
            pipeline.setId(2L);
            return pipeline;
        });

        // when
        Pipeline result = pipelineService.createPipeline(request);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(2L);

        verify(pipelineFolderRepository).findById(1L);
        verify(pipelineRepository).save(any(Pipeline.class));
    }

    @Test
    @DisplayName("존재하지 않는 폴더로 파이프라인 생성 시 예외가 발생해야 함")
    void shouldThrowExceptionWhenCreatingPipelineWithNonExistentFolder() {
        // given
        CreatePipelineRequest request = new CreatePipelineRequest();
        request.setName("New Pipeline");
        request.setFolderId(999L);

        when(pipelineFolderRepository.findById(999L)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> pipelineService.createPipeline(request))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Folder not found");

        verify(pipelineFolderRepository).findById(999L);
        verify(pipelineRepository, never()).save(any(Pipeline.class));
    }

    @Test
    @DisplayName("폴더 ID로 파이프라인 목록을 조회해야 함")
    void shouldGetPipelinesByFolder() {
        // given
        Long folderId = 1L;
        List<Pipeline> pipelines = Arrays.asList(testPipeline);

        when(pipelineRepository.findByIsActiveTrueAndFolderIdOrderByCreatedAtAsc(folderId)).thenReturn(pipelines);

        // when
        List<Pipeline> result = pipelineService.getPipelinesByFolder(folderId);

        // then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo(1L);

        verify(pipelineRepository).findByIsActiveTrueAndFolderIdOrderByCreatedAtAsc(folderId);
    }

    @Test
    @DisplayName("ID로 파이프라인을 조회해야 함")
    void shouldGetPipelineById() {
        // given
        Long pipelineId = 1L;

        when(pipelineRepository.findById(pipelineId)).thenReturn(Optional.of(testPipeline));

        // when
        Optional<Pipeline> result = pipelineService.getPipeline(pipelineId);

        // then
        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(1L);

        verify(pipelineRepository).findById(pipelineId);
    }

    @Test
    @DisplayName("파이프라인을 수정해야 함")
    void shouldUpdatePipeline() {
        // given
        Long pipelineId = 1L;
        UpdatePipelineRequest request = new UpdatePipelineRequest();
        request.setName("Updated Pipeline");
        request.setDescription("Updated Description");

        when(pipelineRepository.findById(pipelineId)).thenReturn(Optional.of(testPipeline));
        when(pipelineRepository.save(any(Pipeline.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        Optional<Pipeline> result = pipelineService.updatePipeline(pipelineId, request);

        // then
        assertThat(result).isPresent();
        verify(pipelineRepository).findById(pipelineId);
        verify(pipelineRepository).save(any(Pipeline.class));
    }

    @Test
    @DisplayName("파이프라인을 삭제해야 함")
    void shouldDeletePipeline() {
        // given
        Long pipelineId = 1L;

        when(pipelineRepository.findById(pipelineId)).thenReturn(Optional.of(testPipeline));
        doNothing().when(stepExecutionRepository).deleteByPipelineId(pipelineId);
        doNothing().when(pipelineExecutionRepository).deleteByPipelineId(pipelineId);
        doNothing().when(pipelineRepository).delete(testPipeline);

        // when
        boolean result = pipelineService.deletePipeline(pipelineId);

        // then
        assertThat(result).isTrue();

        verify(pipelineRepository).findById(pipelineId);
        verify(stepExecutionRepository).deleteByPipelineId(pipelineId);
        verify(pipelineExecutionRepository).deleteByPipelineId(pipelineId);
        verify(pipelineRepository).delete(testPipeline);
    }

    // === 스텝 관리 테스트 ===

    @Test
    @DisplayName("파이프라인의 스텝 목록을 조회해야 함")
    void shouldGetStepsByPipeline() {
        // given
        Long pipelineId = 1L;
        List<PipelineStep> steps = Arrays.asList(testStep);

        PipelineStepDTO stepDTO = new PipelineStepDTO();
        stepDTO.setId(1L);
        stepDTO.setStepName("Test Step");

        when(pipelineStepRepository.findByPipelineIdOrderByStepOrderAsc(pipelineId)).thenReturn(steps);
        when(pipelineMapper.toPipelineStepDTO(any(PipelineStep.class))).thenReturn(stepDTO);

        // when
        List<PipelineStepDTO> result = pipelineService.getStepsByPipeline(pipelineId);

        // then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo(1L);

        verify(pipelineStepRepository).findByPipelineIdOrderByStepOrderAsc(pipelineId);
    }

    @Test
    @DisplayName("파이프라인에 스텝을 추가해야 함")
    void shouldAddStep() {
        // given
        Long pipelineId = 1L;
        CreateStepRequest request = new CreateStepRequest();
        request.setApiItemId(1L);
        request.setStepName("New Step");
        request.setDescription("New Description");

        PipelineStepDTO stepDTO = new PipelineStepDTO();
        stepDTO.setId(2L);

        when(pipelineRepository.findById(pipelineId)).thenReturn(Optional.of(testPipeline));
        when(apiItemRepository.findById(1L)).thenReturn(Optional.of(testApiItem));
        when(pipelineStepRepository.findByPipelineIdOrderByStepOrderAsc(pipelineId)).thenReturn(Arrays.asList(testStep));
        when(pipelineStepRepository.save(any(PipelineStep.class))).thenAnswer(invocation -> {
            PipelineStep step = invocation.getArgument(0);
            step.setId(2L);
            return step;
        });
        when(pipelineMapper.toPipelineStepDTO(any(PipelineStep.class))).thenReturn(stepDTO);

        // when
        PipelineStepDTO result = pipelineService.addStep(pipelineId, request);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(2L);

        verify(pipelineRepository).findById(pipelineId);
        verify(apiItemRepository).findById(1L);
        verify(pipelineStepRepository).save(argThat(step -> step.getStepOrder() == 2)); // 기존 1개 + 1
    }

    @Test
    @DisplayName("존재하지 않는 파이프라인에 스텝 추가 시 예외가 발생해야 함")
    void shouldThrowExceptionWhenAddingStepToNonExistentPipeline() {
        // given
        Long pipelineId = 999L;
        CreateStepRequest request = new CreateStepRequest();
        request.setApiItemId(1L);

        when(pipelineRepository.findById(pipelineId)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> pipelineService.addStep(pipelineId, request))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Pipeline not found");

        verify(pipelineRepository).findById(pipelineId);
        verify(pipelineStepRepository, never()).save(any(PipelineStep.class));
    }

    @Test
    @DisplayName("존재하지 않는 API Item으로 스텝 추가 시 예외가 발생해야 함")
    void shouldThrowExceptionWhenAddingStepWithNonExistentApiItem() {
        // given
        Long pipelineId = 1L;
        CreateStepRequest request = new CreateStepRequest();
        request.setApiItemId(999L);

        when(pipelineRepository.findById(pipelineId)).thenReturn(Optional.of(testPipeline));
        when(apiItemRepository.findById(999L)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> pipelineService.addStep(pipelineId, request))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("API item not found");

        verify(pipelineRepository).findById(pipelineId);
        verify(apiItemRepository).findById(999L);
        verify(pipelineStepRepository, never()).save(any(PipelineStep.class));
    }

    @Test
    @DisplayName("스텝의 skip 상태를 업데이트해야 함")
    void shouldUpdateStepSkip() {
        // given
        Long stepId = 1L;
        boolean isSkip = true;

        PipelineStepDTO stepDTO = new PipelineStepDTO();
        stepDTO.setId(1L);
        stepDTO.setIsSkip(true);

        when(pipelineStepRepository.findById(stepId)).thenReturn(Optional.of(testStep));
        when(pipelineStepRepository.save(any(PipelineStep.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(pipelineMapper.toPipelineStepDTO(any(PipelineStep.class))).thenReturn(stepDTO);

        // when
        Optional<PipelineStepDTO> result = pipelineService.updateStepSkip(stepId, isSkip);

        // then
        assertThat(result).isPresent();
        verify(pipelineStepRepository).findById(stepId);
        verify(pipelineStepRepository).save(argThat(step -> step.getIsSkip() == isSkip));
    }

    @Test
    @DisplayName("스텝을 삭제하고 나머지 스텝의 순서를 재정렬해야 함")
    void shouldDeleteStepAndReorderRemaining() {
        // given
        Long stepId = 1L;
        Long pipelineId = 1L;

        PipelineStep step2 = new PipelineStep();
        step2.setId(2L);
        step2.setPipeline(testPipeline);
        step2.setStepOrder(2);

        PipelineStep step3 = new PipelineStep();
        step3.setId(3L);
        step3.setPipeline(testPipeline);
        step3.setStepOrder(3);

        List<PipelineStep> remainingSteps = Arrays.asList(step2, step3);

        when(pipelineStepRepository.findById(stepId)).thenReturn(Optional.of(testStep));
        doNothing().when(stepExecutionRepository).deleteByPipelineStepId(stepId);
        doNothing().when(pipelineStepRepository).delete(testStep);
        when(pipelineStepRepository.findByPipelineIdOrderByStepOrderAsc(pipelineId)).thenReturn(remainingSteps);
        when(pipelineStepRepository.saveAll(anyList())).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        boolean result = pipelineService.deleteStep(stepId);

        // then
        assertThat(result).isTrue();

        verify(pipelineStepRepository).findById(stepId);
        verify(stepExecutionRepository).deleteByPipelineStepId(stepId);
        verify(pipelineStepRepository).delete(testStep);
        verify(pipelineStepRepository).saveAll(argThat(steps -> {
            List<PipelineStep> stepList = (List<PipelineStep>) steps;
            return stepList.get(0).getStepOrder() == 1 &&
                   stepList.get(1).getStepOrder() == 2;
        }));
    }

    @Test
    @DisplayName("스텝을 수정해야 함")
    void shouldUpdateStep() {
        // given
        Long stepId = 1L;
        CreateStepRequest request = new CreateStepRequest();
        request.setApiItemId(1L);
        request.setStepName("Updated Step");
        request.setDescription("Updated Description");

        PipelineStepDTO stepDTO = new PipelineStepDTO();
        stepDTO.setId(1L);

        when(pipelineStepRepository.findById(stepId)).thenReturn(Optional.of(testStep));
        when(pipelineStepRepository.save(any(PipelineStep.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(pipelineMapper.toPipelineStepDTO(any(PipelineStep.class))).thenReturn(stepDTO);

        // when
        Optional<PipelineStepDTO> result = pipelineService.updateStep(stepId, request);

        // then
        assertThat(result).isPresent();
        verify(pipelineStepRepository).findById(stepId);
        verify(pipelineStepRepository).save(any(PipelineStep.class));
    }

    @Test
    @DisplayName("스텝 순서를 변경해야 함")
    void shouldUpdateStepOrder() {
        // given
        Long stepId = 1L;
        UpdateStepOrderRequest request = new UpdateStepOrderRequest();
        request.setNewOrder(3);

        PipelineStep step2 = new PipelineStep();
        step2.setId(2L);
        step2.setPipeline(testPipeline);
        step2.setStepOrder(2);

        PipelineStep step3 = new PipelineStep();
        step3.setId(3L);
        step3.setPipeline(testPipeline);
        step3.setStepOrder(3);

        List<PipelineStep> steps = Arrays.asList(testStep, step2, step3);

        when(pipelineStepRepository.findById(stepId)).thenReturn(Optional.of(testStep));
        when(pipelineStepRepository.findByIsActiveTrueAndPipelineIdOrderByStepOrderAsc(1L)).thenReturn(steps);
        when(pipelineStepRepository.saveAll(anyList())).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        Optional<List<PipelineStep>> result = pipelineService.updateStepOrder(stepId, request);

        // then
        assertThat(result).isPresent();
        verify(pipelineStepRepository).findById(stepId);
        verify(pipelineStepRepository).saveAll(anyList());
    }

    @Test
    @DisplayName("일괄 스텝 순서 변경을 처리해야 함")
    void shouldBatchUpdateStepOrder() {
        // given
        Long pipelineId = 1L;

        PipelineStep step2 = new PipelineStep();
        step2.setId(2L);
        step2.setPipeline(testPipeline);
        step2.setStepOrder(2);

        List<PipelineStep> steps = Arrays.asList(testStep, step2);

        BatchUpdateStepOrderRequest request = new BatchUpdateStepOrderRequest();
        BatchUpdateStepOrderRequest.StepOrderItem item1 = new BatchUpdateStepOrderRequest.StepOrderItem();
        item1.setStepId(1L);
        item1.setNewOrder(2);

        BatchUpdateStepOrderRequest.StepOrderItem item2 = new BatchUpdateStepOrderRequest.StepOrderItem();
        item2.setStepId(2L);
        item2.setNewOrder(1);

        request.setSteps(Arrays.asList(item1, item2));

        PipelineStepDTO stepDTO1 = new PipelineStepDTO();
        stepDTO1.setId(1L);
        PipelineStepDTO stepDTO2 = new PipelineStepDTO();
        stepDTO2.setId(2L);

        when(pipelineRepository.findById(pipelineId)).thenReturn(Optional.of(testPipeline));
        when(pipelineStepRepository.findByIsActiveTrueAndPipelineIdOrderByStepOrderAsc(pipelineId)).thenReturn(steps);
        when(pipelineStepRepository.saveAll(anyList())).thenAnswer(invocation -> invocation.getArgument(0));
        when(pipelineMapper.toPipelineStepDTO(any(PipelineStep.class)))
            .thenReturn(stepDTO1)
            .thenReturn(stepDTO2);

        // when
        List<PipelineStepDTO> result = pipelineService.batchUpdateStepOrder(pipelineId, request);

        // then
        assertThat(result).hasSize(2);
        verify(pipelineRepository).findById(pipelineId);
        verify(pipelineStepRepository).saveAll(anyList());
    }

    @Test
    @DisplayName("존재하지 않는 파이프라인으로 일괄 순서 변경 시 예외가 발생해야 함")
    void shouldThrowExceptionWhenBatchUpdateForNonExistentPipeline() {
        // given
        Long pipelineId = 999L;
        BatchUpdateStepOrderRequest request = new BatchUpdateStepOrderRequest();

        when(pipelineRepository.findById(pipelineId)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> pipelineService.batchUpdateStepOrder(pipelineId, request))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Pipeline not found");

        verify(pipelineRepository).findById(pipelineId);
        verify(pipelineStepRepository, never()).saveAll(anyList());
    }
}
