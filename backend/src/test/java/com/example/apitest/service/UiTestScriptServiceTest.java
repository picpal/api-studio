package com.example.apitest.service;

import com.example.apitest.entity.UiTestScript;
import com.example.apitest.entity.UiTestFolder;
import com.example.apitest.entity.UiTestExecution;
import com.example.apitest.entity.User;
import com.example.apitest.repository.UiTestScriptRepository;
import com.example.apitest.repository.UiTestFolderRepository;
import com.example.apitest.repository.UiTestExecutionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UiTestScriptServiceTest {

    @Mock
    private UiTestScriptRepository scriptRepository;

    @Mock
    private UiTestFolderRepository folderRepository;

    @Mock
    private UiTestExecutionRepository executionRepository;

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private UiTestScriptService uiTestScriptService;

    private User testUser;
    private UiTestFolder testFolder;
    private UiTestScript testScript;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        // User entity doesn't have setName method

        testFolder = new UiTestFolder();
        testFolder.setId(1L);
        testFolder.setName("Test Folder");
        testFolder.setCreatedBy(testUser);

        testScript = new UiTestScript();
        testScript.setId(1L);
        testScript.setName("Test Script");
        testScript.setDescription("Test Description");
        testScript.setScriptContent("test content");
        testScript.setCreatedBy(testUser);
        testScript.setFolder(testFolder);
        testScript.setCreatedAt(LocalDateTime.now());
        testScript.setUpdatedAt(LocalDateTime.now());
    }

    @Test
    void testGetAllScripts() {
        // Given
        List<UiTestScript> scripts = Arrays.asList(testScript);
        when(scriptRepository.findAll()).thenReturn(scripts);

        // When
        List<Map<String, Object>> result = uiTestScriptService.getAllScripts();

        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(testScript.getName(), result.get(0).get("name"));
        verify(scriptRepository).findAll();
    }

    @Test
    void testGetScript() {
        // Given
        when(scriptRepository.findById(1L)).thenReturn(Optional.of(testScript));

        // When
        Optional<Map<String, Object>> result = uiTestScriptService.getScript(1L);

        // Then
        assertTrue(result.isPresent());
        assertEquals(testScript.getName(), result.get().get("name"));
        verify(scriptRepository).findById(1L);
    }

    @Test
    void testGetScriptNotFound() {
        // Given
        when(scriptRepository.findById(1L)).thenReturn(Optional.empty());

        // When
        Optional<Map<String, Object>> result = uiTestScriptService.getScript(1L);

        // Then
        assertFalse(result.isPresent());
        verify(scriptRepository).findById(1L);
    }

    @Test
    void testGetScriptsByFolder() {
        // Given
        List<UiTestScript> scripts = Arrays.asList(testScript);
        when(scriptRepository.findByFolderIdOrderByNameAsc(1L)).thenReturn(scripts);

        // When
        List<Map<String, Object>> result = uiTestScriptService.getScriptsByFolder(1L);

        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(testScript.getName(), result.get(0).get("name"));
        verify(scriptRepository).findByFolderIdOrderByNameAsc(1L);
    }

    @Test
    void testSearchScripts() {
        // Given
        String keyword = "test";
        List<UiTestScript> scripts = Arrays.asList(testScript);
        when(scriptRepository.findByKeyword(keyword)).thenReturn(scripts);

        // When
        List<Map<String, Object>> result = uiTestScriptService.searchScripts(keyword);

        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(testScript.getName(), result.get(0).get("name"));
        verify(scriptRepository).findByKeyword(keyword);
    }

    @Test
    void testCreateScript() {
        // Given
        Map<String, Object> scriptData = new HashMap<>();
        scriptData.put("name", "New Script");
        scriptData.put("description", "New Description");
        scriptData.put("scriptContent", "new content");
        scriptData.put("folderId", 1L);

        when(folderRepository.findById(1L)).thenReturn(Optional.of(testFolder));
        when(scriptRepository.save(any(UiTestScript.class))).thenReturn(testScript);

        // When
        Map<String, Object> result = uiTestScriptService.createScript(scriptData, testUser);

        // Then
        assertNotNull(result);
        verify(folderRepository).findById(1L);
        verify(scriptRepository).save(any(UiTestScript.class));
    }

    @Test
    void testCreateScriptWithoutFolder() {
        // Given
        Map<String, Object> scriptData = new HashMap<>();
        scriptData.put("name", "New Script");
        scriptData.put("description", "New Description");
        scriptData.put("scriptContent", "new content");

        when(scriptRepository.save(any(UiTestScript.class))).thenReturn(testScript);

        // When
        Map<String, Object> result = uiTestScriptService.createScript(scriptData, testUser);

        // Then
        assertNotNull(result);
        verify(scriptRepository).save(any(UiTestScript.class));
        verifyNoInteractions(folderRepository);
    }

    @Test
    void testUpdateScript() {
        // Given
        Map<String, Object> scriptDetails = new HashMap<>();
        scriptDetails.put("name", "Updated Script");
        scriptDetails.put("description", "Updated Description");

        when(scriptRepository.findById(1L)).thenReturn(Optional.of(testScript));
        when(scriptRepository.save(any(UiTestScript.class))).thenReturn(testScript);

        // When
        Optional<Map<String, Object>> result = uiTestScriptService.updateScript(1L, scriptDetails);

        // Then
        assertTrue(result.isPresent());
        verify(scriptRepository).findById(1L);
        verify(scriptRepository).save(any(UiTestScript.class));
    }

    @Test
    void testUpdateScriptNotFound() {
        // Given
        Map<String, Object> scriptDetails = new HashMap<>();
        scriptDetails.put("name", "Updated Script");

        when(scriptRepository.findById(1L)).thenReturn(Optional.empty());

        // When
        Optional<Map<String, Object>> result = uiTestScriptService.updateScript(1L, scriptDetails);

        // Then
        assertFalse(result.isPresent());
        verify(scriptRepository).findById(1L);
        verify(scriptRepository, never()).save(any(UiTestScript.class));
    }

    @Test
    void testDeleteScript() {
        // Given
        when(scriptRepository.existsById(1L)).thenReturn(true);
        when(scriptRepository.findById(1L)).thenReturn(Optional.of(testScript));

        // When
        boolean result = uiTestScriptService.deleteScript(1L);

        // Then
        assertTrue(result);
        verify(scriptRepository).existsById(1L);
        verify(scriptRepository).findById(1L);
        verify(executionRepository).deleteByScript(testScript);
        verify(scriptRepository).deleteById(1L);
    }

    @Test
    void testDeleteScriptNotFound() {
        // Given
        when(scriptRepository.existsById(1L)).thenReturn(false);

        // When
        boolean result = uiTestScriptService.deleteScript(1L);

        // Then
        assertFalse(result);
        verify(scriptRepository).existsById(1L);
        verify(scriptRepository, never()).deleteById(1L);
    }

    @Test
    void testGetFolderName() {
        // Given
        when(folderRepository.findById(1L)).thenReturn(Optional.of(testFolder));

        // When
        String result = uiTestScriptService.getFolderName(1L);

        // Then
        assertEquals(testFolder.getName(), result);
        verify(folderRepository).findById(1L);
    }

    @Test
    void testGetFolderNameNotFound() {
        // Given
        when(folderRepository.findById(1L)).thenReturn(Optional.empty());

        // When
        String result = uiTestScriptService.getFolderName(1L);

        // Then
        assertEquals("Unknown", result);
        verify(folderRepository).findById(1L);
    }

    @Test
    void testGetFolderNameNull() {
        // When
        String result = uiTestScriptService.getFolderName(null);

        // Then
        assertEquals("Root", result);
        verifyNoInteractions(folderRepository);
    }

    @Test
    void testExecuteScriptNotFound() {
        // Given
        when(scriptRepository.findById(1L)).thenReturn(Optional.empty());

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            uiTestScriptService.executeScript(1L, testUser);
        });

        assertEquals("Script not found with id: 1", exception.getMessage());
        verify(scriptRepository).findById(1L);
        verifyNoInteractions(executionRepository);
        verifyNoInteractions(restTemplate);
    }
}