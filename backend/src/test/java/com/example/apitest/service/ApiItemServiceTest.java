package com.example.apitest.service;

import com.example.apitest.entity.ApiFolder;
import com.example.apitest.entity.ApiItem;
import com.example.apitest.repository.ApiFolderRepository;
import com.example.apitest.repository.ApiItemHistoryRepository;
import com.example.apitest.repository.ApiItemRepository;
import com.example.apitest.repository.PipelineStepRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ApiItemService 테스트")
class ApiItemServiceTest {

    @InjectMocks
    private ApiItemService apiItemService;

    @Mock
    private ApiItemRepository itemRepository;

    @Mock
    private ApiFolderRepository folderRepository;

    @Mock
    private ApiItemHistoryRepository historyRepository;

    @Mock
    private PipelineStepRepository pipelineStepRepository;

    private ApiItem testItem;
    private ApiFolder testFolder;

    @BeforeEach
    void setUp() {
        testFolder = new ApiFolder();
        testFolder.setId(1L);
        testFolder.setName("Test Folder");

        testItem = new ApiItem();
        testItem.setId(1L);
        testItem.setName("Test API");
        testItem.setMethod(ApiItem.HttpMethod.GET);
        testItem.setUrl("https://api.example.com/test");
        testItem.setDescription("Test Description");
        testItem.setRequestParams("{}");
        testItem.setRequestHeaders("{}");
        testItem.setRequestBody("");
        testItem.setValidationEnabled(false);
        testItem.setExpectedValues("");
        testItem.setFolder(testFolder);
        testItem.setCreatedAt(LocalDateTime.now());
        testItem.setUpdatedAt(LocalDateTime.now());
    }

    // === getAllItems 테스트 ===

    @Test
    @DisplayName("모든 API 아이템을 조회해야 함")
    void shouldGetAllItems() {
        // given
        List<ApiItem> items = Arrays.asList(testItem);
        when(itemRepository.findAll()).thenReturn(items);

        // when
        List<Map<String, Object>> result = apiItemService.getAllItems();

        // then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).get("id")).isEqualTo(1L);
        assertThat(result.get(0).get("name")).isEqualTo("Test API");

        verify(itemRepository).findAll();
    }

    @Test
    @DisplayName("아이템이 없는 경우 빈 목록을 반환해야 함")
    void shouldReturnEmptyListWhenNoItems() {
        // given
        when(itemRepository.findAll()).thenReturn(Arrays.asList());

        // when
        List<Map<String, Object>> result = apiItemService.getAllItems();

        // then
        assertThat(result).isEmpty();
        verify(itemRepository).findAll();
    }

    // === getItem 테스트 ===

    @Test
    @DisplayName("ID로 API 아이템을 조회해야 함")
    void shouldGetItemById() {
        // given
        Long itemId = 1L;
        when(itemRepository.findById(itemId)).thenReturn(Optional.of(testItem));

        // when
        Optional<Map<String, Object>> result = apiItemService.getItem(itemId);

        // then
        assertThat(result).isPresent();
        assertThat(result.get().get("id")).isEqualTo(1L);
        assertThat(result.get().get("name")).isEqualTo("Test API");

        verify(itemRepository).findById(itemId);
    }

    @Test
    @DisplayName("존재하지 않는 ID로 조회 시 빈 Optional을 반환해야 함")
    void shouldReturnEmptyOptionalWhenItemNotFound() {
        // given
        Long itemId = 999L;
        when(itemRepository.findById(itemId)).thenReturn(Optional.empty());

        // when
        Optional<Map<String, Object>> result = apiItemService.getItem(itemId);

        // then
        assertThat(result).isEmpty();
        verify(itemRepository).findById(itemId);
    }

    // === getItemsByFolder 테스트 ===

    @Test
    @DisplayName("폴더 ID로 API 아이템 목록을 조회해야 함")
    void shouldGetItemsByFolder() {
        // given
        Long folderId = 1L;
        List<ApiItem> items = Arrays.asList(testItem);

        when(itemRepository.findByFolderIdOrderByCreatedAtAsc(folderId)).thenReturn(items);

        // when
        List<Map<String, Object>> result = apiItemService.getItemsByFolder(folderId);

        // then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).get("id")).isEqualTo(1L);

        verify(itemRepository).findByFolderIdOrderByCreatedAtAsc(folderId);
    }

    @Test
    @DisplayName("폴더에 아이템이 없는 경우 빈 목록을 반환해야 함")
    void shouldReturnEmptyListForFolderWithNoItems() {
        // given
        Long folderId = 1L;
        when(itemRepository.findByFolderIdOrderByCreatedAtAsc(folderId)).thenReturn(Arrays.asList());

        // when
        List<Map<String, Object>> result = apiItemService.getItemsByFolder(folderId);

        // then
        assertThat(result).isEmpty();
        verify(itemRepository).findByFolderIdOrderByCreatedAtAsc(folderId);
    }

    // === createItem 테스트 ===

    @Test
    @DisplayName("API 아이템을 생성해야 함")
    void shouldCreateItem() {
        // given
        Map<String, Object> itemData = new HashMap<>();
        itemData.put("name", "New API");
        itemData.put("method", "POST");
        itemData.put("url", "https://api.example.com/new");
        itemData.put("description", "New Description");
        itemData.put("requestParams", "{}");
        itemData.put("requestHeaders", "{}");
        itemData.put("requestBody", "{\"key\":\"value\"}");
        itemData.put("validationEnabled", true);
        itemData.put("expectedValues", "{\"status\":200}");
        itemData.put("folderId", 1L);

        when(folderRepository.findById(1L)).thenReturn(Optional.of(testFolder));
        when(itemRepository.save(any(ApiItem.class))).thenAnswer(invocation -> {
            ApiItem item = invocation.getArgument(0);
            item.setId(2L);
            return item;
        });

        // when
        Map<String, Object> result = apiItemService.createItem(itemData);

        // then
        assertThat(result).isNotNull();
        assertThat(result.get("id")).isEqualTo(2L);

        verify(folderRepository).findById(1L);
        verify(itemRepository).save(any(ApiItem.class));
    }

    @Test
    @DisplayName("폴더 없이 API 아이템을 생성할 수 있어야 함")
    void shouldCreateItemWithoutFolder() {
        // given
        Map<String, Object> itemData = new HashMap<>();
        itemData.put("name", "New API");
        itemData.put("method", "GET");
        itemData.put("url", "https://api.example.com/new");

        when(itemRepository.save(any(ApiItem.class))).thenAnswer(invocation -> {
            ApiItem item = invocation.getArgument(0);
            item.setId(3L);
            return item;
        });

        // when
        Map<String, Object> result = apiItemService.createItem(itemData);

        // then
        assertThat(result).isNotNull();
        assertThat(result.get("id")).isEqualTo(3L);

        verify(itemRepository).save(any(ApiItem.class));
        verifyNoInteractions(folderRepository);
    }

    // === updateItem 테스트 ===

    @Test
    @DisplayName("API 아이템을 수정해야 함")
    void shouldUpdateItem() {
        // given
        Long itemId = 1L;
        Map<String, Object> itemDetails = new HashMap<>();
        itemDetails.put("name", "Updated API");
        itemDetails.put("method", "PUT");
        itemDetails.put("url", "https://api.example.com/updated");
        itemDetails.put("description", "Updated Description");

        when(itemRepository.findById(itemId)).thenReturn(Optional.of(testItem));
        when(itemRepository.save(any(ApiItem.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        Optional<Map<String, Object>> result = apiItemService.updateItem(itemId, itemDetails);

        // then
        assertThat(result).isPresent();
        verify(itemRepository).findById(itemId);
        verify(itemRepository).save(any(ApiItem.class));
    }

    @Test
    @DisplayName("존재하지 않는 아이템 수정 시 빈 Optional을 반환해야 함")
    void shouldReturnEmptyOptionalWhenUpdatingNonExistentItem() {
        // given
        Long itemId = 999L;
        Map<String, Object> itemDetails = new HashMap<>();
        itemDetails.put("name", "Updated API");

        when(itemRepository.findById(itemId)).thenReturn(Optional.empty());

        // when
        Optional<Map<String, Object>> result = apiItemService.updateItem(itemId, itemDetails);

        // then
        assertThat(result).isEmpty();
        verify(itemRepository).findById(itemId);
        verify(itemRepository, never()).save(any(ApiItem.class));
    }

    @Test
    @DisplayName("아이템 수정 시 폴더를 변경할 수 있어야 함")
    void shouldUpdateItemFolder() {
        // given
        Long itemId = 1L;
        Long newFolderId = 2L;

        ApiFolder newFolder = new ApiFolder();
        newFolder.setId(newFolderId);
        newFolder.setName("New Folder");

        Map<String, Object> itemDetails = new HashMap<>();
        itemDetails.put("name", "Updated API");
        itemDetails.put("folderId", newFolderId);

        when(itemRepository.findById(itemId)).thenReturn(Optional.of(testItem));
        when(folderRepository.findById(newFolderId)).thenReturn(Optional.of(newFolder));
        when(itemRepository.save(any(ApiItem.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        Optional<Map<String, Object>> result = apiItemService.updateItem(itemId, itemDetails);

        // then
        assertThat(result).isPresent();
        verify(itemRepository).findById(itemId);
        verify(folderRepository).findById(newFolderId);
        verify(itemRepository).save(any(ApiItem.class));
    }

    // === deleteItem 테스트 ===

    @Test
    @DisplayName("API 아이템을 삭제해야 함")
    void shouldDeleteItem() {
        // given
        Long itemId = 1L;

        when(itemRepository.findById(itemId)).thenReturn(Optional.of(testItem));
        when(itemRepository.deleteByIdCustom(itemId)).thenReturn(1);

        // when
        boolean result = apiItemService.deleteItem(itemId);

        // then
        assertThat(result).isTrue();

        verify(itemRepository).findById(itemId);
        verify(pipelineStepRepository).deleteByApiItemId(itemId);
        verify(historyRepository).deleteByApiItemId(itemId);
        verify(itemRepository).deleteByIdCustom(itemId);
    }

    @Test
    @DisplayName("존재하지 않는 아이템 삭제 시 false를 반환해야 함")
    void shouldReturnFalseWhenDeletingNonExistentItem() {
        // given
        Long itemId = 999L;

        when(itemRepository.findById(itemId)).thenReturn(Optional.empty());

        // when
        boolean result = apiItemService.deleteItem(itemId);

        // then
        assertThat(result).isFalse();

        verify(itemRepository).findById(itemId);
        verifyNoInteractions(pipelineStepRepository);
        verifyNoInteractions(historyRepository);
    }


    // === getFolderName 테스트 ===

    @Test
    @DisplayName("폴더 ID로 폴더 이름을 조회해야 함")
    void shouldGetFolderName() {
        // given
        Long folderId = 1L;
        when(folderRepository.findById(folderId)).thenReturn(Optional.of(testFolder));

        // when
        String result = apiItemService.getFolderName(folderId);

        // then
        assertThat(result).isEqualTo("Test Folder");
        verify(folderRepository).findById(folderId);
    }

    @Test
    @DisplayName("존재하지 않는 폴더 ID로 조회 시 '알 수 없는 폴더'를 반환해야 함")
    void shouldReturnUnknownFolderForNonExistentId() {
        // given
        Long folderId = 999L;
        when(folderRepository.findById(folderId)).thenReturn(Optional.empty());

        // when
        String result = apiItemService.getFolderName(folderId);

        // then
        assertThat(result).isEqualTo("알 수 없는 폴더");
        verify(folderRepository).findById(folderId);
    }

    @Test
    @DisplayName("null 폴더 ID로 조회 시 '루트'를 반환해야 함")
    void shouldReturnRootForNullFolderId() {
        // when
        String result = apiItemService.getFolderName(null);

        // then
        assertThat(result).isEqualTo("루트");
        verifyNoInteractions(folderRepository);
    }


    // === Validation 테스트 ===

    @Test
    @DisplayName("검증이 활성화된 아이템을 생성할 수 있어야 함")
    void shouldCreateItemWithValidationEnabled() {
        // given
        Map<String, Object> itemData = new HashMap<>();
        itemData.put("name", "Validated API");
        itemData.put("method", "GET");
        itemData.put("url", "https://api.example.com/validated");
        itemData.put("validationEnabled", true);
        itemData.put("expectedValues", "{\"status\":200,\"message\":\"success\"}");

        when(itemRepository.save(any(ApiItem.class))).thenAnswer(invocation -> {
            ApiItem item = invocation.getArgument(0);
            item.setId(1L);
            return item;
        });

        // when
        Map<String, Object> result = apiItemService.createItem(itemData);

        // then
        assertThat(result).isNotNull();
        verify(itemRepository).save(argThat(item ->
            item.getValidationEnabled() != null &&
            item.getValidationEnabled() &&
            item.getExpectedValues() != null
        ));
    }

    // === Map 변환 테스트 ===

    @Test
    @DisplayName("ApiItem을 Map으로 변환 시 모든 필드가 포함되어야 함")
    void shouldConvertApiItemToMapWithAllFields() {
        // given
        List<ApiItem> items = Arrays.asList(testItem);
        when(itemRepository.findAll()).thenReturn(items);

        // when
        List<Map<String, Object>> result = apiItemService.getAllItems();

        // then
        assertThat(result).hasSize(1);
        Map<String, Object> itemMap = result.get(0);

        assertThat(itemMap).containsKeys(
            "id", "name", "method", "url", "description",
            "requestParams", "requestHeaders", "requestBody",
            "createdAt", "updatedAt", "folderId",
            "validationEnabled", "expectedValues"
        );

        assertThat(itemMap.get("id")).isEqualTo(testItem.getId());
        assertThat(itemMap.get("name")).isEqualTo(testItem.getName());
        assertThat(itemMap.get("method")).isEqualTo(testItem.getMethod());
        assertThat(itemMap.get("url")).isEqualTo(testItem.getUrl());
    }

    // === 부분 업데이트 테스트 ===

    @Test
    @DisplayName("일부 필드만 업데이트할 수 있어야 함")
    void shouldUpdateOnlyProvidedFields() {
        // given
        Long itemId = 1L;
        Map<String, Object> itemDetails = new HashMap<>();
        itemDetails.put("description", "Updated Description Only");

        when(itemRepository.findById(itemId)).thenReturn(Optional.of(testItem));
        when(itemRepository.save(any(ApiItem.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        Optional<Map<String, Object>> result = apiItemService.updateItem(itemId, itemDetails);

        // then
        assertThat(result).isPresent();
        verify(itemRepository).findById(itemId);
        verify(itemRepository).save(any(ApiItem.class));
    }
}
