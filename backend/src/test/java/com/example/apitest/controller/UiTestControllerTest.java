package com.example.apitest.controller;

import com.example.apitest.entity.User;
import com.example.apitest.service.AuthService;
import com.example.apitest.service.ApiKeyService;
import com.example.apitest.service.UiTestScriptService;
import com.example.apitest.service.UiTestFolderService;
import com.example.apitest.service.UiTestExecutionService;
import com.example.apitest.service.UiTestFileService;
import com.example.apitest.service.ActivityLoggingService;
import com.example.apitest.config.ApiKeyAuthenticationFilter;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;

import java.util.*;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UiTestController.class)
@AutoConfigureMockMvc(addFilters = false)
public class UiTestControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UiTestScriptService scriptService;

    @MockBean
    private UiTestFolderService folderService;

    @MockBean
    private UiTestExecutionService executionService;

    @MockBean
    private ActivityLoggingService activityLoggingService;

    @MockBean
    private AuthService authService;

    @MockBean
    private UiTestFileService fileService;

    @MockBean
    private SimpMessagingTemplate messagingTemplate;

    @MockBean
    private ApiKeyService apiKeyService;

    @MockBean
    private ApiKeyAuthenticationFilter apiKeyAuthenticationFilter;

    private MockHttpSession mockSession;
    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        // User entity doesn't have setName method

        mockSession = new MockHttpSession();
        mockSession.setAttribute("userEmail", "test@example.com");
    }

    @Test
    void testGetAllFolders() throws Exception {
        // Given
        List<Map<String, Object>> folders = Arrays.asList(
                Map.of("id", 1L, "name", "Test Folder")
        );
        when(folderService.getRootFolders()).thenReturn(folders);

        // When & Then
        mockMvc.perform(get("/api/ui-tests/folders")
                        .session(mockSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].name").value("Test Folder"));

        verify(folderService).getRootFolders();
    }

    @Test
    void testGetFolderStructure() throws Exception {
        // Given
        List<Map<String, Object>> structure = Arrays.asList(
                Map.of("id", 1L, "name", "Root Folder", "children", Arrays.asList())
        );
        when(folderService.getFolderStructure()).thenReturn(structure);

        // When & Then
        mockMvc.perform(get("/api/ui-tests/folders/structure")
                        .session(mockSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        verify(folderService).getFolderStructure();
    }

    @Test
    void testGetFolder() throws Exception {
        // Given
        Map<String, Object> folder = Map.of("id", 1L, "name", "Test Folder");
        when(folderService.getFolder(1L)).thenReturn(Optional.of(folder));

        // When & Then
        mockMvc.perform(get("/api/ui-tests/folders/1")
                        .session(mockSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Test Folder"));

        verify(folderService).getFolder(1L);
    }

    @Test
    void testGetFolderNotFound() throws Exception {
        // Given
        when(folderService.getFolder(1L)).thenReturn(Optional.empty());

        // When & Then
        mockMvc.perform(get("/api/ui-tests/folders/1")
                        .session(mockSession))
                .andExpect(status().isNotFound());

        verify(folderService).getFolder(1L);
    }

    @Test
    void testCreateFolder() throws Exception {
        // Given
        Map<String, Object> folderData = Map.of("name", "New Folder", "description", "Test folder");
        Map<String, Object> createdFolder = Map.of("id", 1L, "name", "New Folder");

        when(authService.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(folderService.createFolder(any(Map.class), eq(testUser))).thenReturn(createdFolder);

        // When & Then
        mockMvc.perform(post("/api/ui-tests/folders")
                        .session(mockSession)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(folderData)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("New Folder"));

        verify(authService, atLeastOnce()).findByEmail("test@example.com");
        verify(folderService).createFolder(any(Map.class), eq(testUser));
    }

    @Test
    void testCreateFolderUnauthorized() throws Exception {
        // Given
        Map<String, Object> folderData = Map.of("name", "New Folder");
        when(authService.findByEmail("test@example.com")).thenReturn(Optional.empty());

        // When & Then
        mockMvc.perform(post("/api/ui-tests/folders")
                        .session(mockSession)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(folderData)))
                .andExpect(status().isUnauthorized());

        verify(authService, atLeastOnce()).findByEmail("test@example.com");
        verifyNoInteractions(folderService);
    }

    @Test
    void testGetAllScripts() throws Exception {
        // Given
        List<Map<String, Object>> scripts = Arrays.asList(
                Map.of("id", 1L, "name", "Test Script")
        );
        when(scriptService.getAllScripts()).thenReturn(scripts);

        // When & Then
        mockMvc.perform(get("/api/ui-tests/scripts")
                        .session(mockSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].name").value("Test Script"));

        verify(scriptService).getAllScripts();
    }

    @Test
    void testGetScript() throws Exception {
        // Given
        Map<String, Object> script = Map.of("id", 1L, "name", "Test Script");
        when(scriptService.getScript(1L)).thenReturn(Optional.of(script));

        // When & Then
        mockMvc.perform(get("/api/ui-tests/scripts/1")
                        .session(mockSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Test Script"));

        verify(scriptService).getScript(1L);
    }

    @Test
    void testGetScriptNotFound() throws Exception {
        // Given
        when(scriptService.getScript(1L)).thenReturn(Optional.empty());

        // When & Then
        mockMvc.perform(get("/api/ui-tests/scripts/1")
                        .session(mockSession))
                .andExpect(status().isNotFound());

        verify(scriptService).getScript(1L);
    }

    @Test
    void testCreateScript() throws Exception {
        // Given
        Map<String, Object> scriptData = Map.of(
                "name", "New Script",
                "scriptContent", "test content"
        );
        Map<String, Object> createdScript = Map.of("id", 1L, "name", "New Script");

        when(authService.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(scriptService.createScript(any(Map.class), eq(testUser))).thenReturn(createdScript);

        // When & Then
        mockMvc.perform(post("/api/ui-tests/scripts")
                        .session(mockSession)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(scriptData)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("New Script"));

        verify(authService, atLeastOnce()).findByEmail("test@example.com");
        verify(scriptService).createScript(any(Map.class), eq(testUser));
    }

    @Test
    void testExecuteScript() throws Exception {
        // Given
        Map<String, Object> executionResult = Map.of(
                "executionId", "exec-123",
                "status", "started"
        );

        when(authService.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(scriptService.executeScript(1L, testUser)).thenReturn(executionResult);

        // When & Then
        mockMvc.perform(post("/api/ui-tests/scripts/1/execute")
                        .session(mockSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("started"));

        verify(authService, atLeastOnce()).findByEmail("test@example.com");
        verify(scriptService).executeScript(1L, testUser);
    }

    @Test
    void testGetAllExecutions() throws Exception {
        // Given
        List<Map<String, Object>> executions = Arrays.asList(
                Map.of("id", 1L, "executionId", "exec-123", "status", "COMPLETED")
        );
        when(executionService.getAllExecutions()).thenReturn(executions);

        // When & Then
        mockMvc.perform(get("/api/ui-tests/executions")
                        .session(mockSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].status").value("COMPLETED"));

        verify(executionService).getAllExecutions();
    }

    @Test
    void testGetExecutionStats() throws Exception {
        // Given
        Map<String, Object> stats = Map.of(
                "totalExecutions", 10L,
                "completedExecutions", 8L,
                "failedExecutions", 2L
        );
        when(executionService.getExecutionStats()).thenReturn(stats);

        // When & Then
        mockMvc.perform(get("/api/ui-tests/executions/stats")
                        .session(mockSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalExecutions").value(10))
                .andExpect(jsonPath("$.completedExecutions").value(8));

        verify(executionService).getExecutionStats();
    }

    @Test
    void testHealthCheck() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/ui-tests/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("healthy"))
                .andExpect(jsonPath("$.service").value("UI Testing API"));
    }
}