package com.example.apitest.repository;

import com.example.apitest.entity.UiTestScript;
import com.example.apitest.entity.UiTestFolder;
import com.example.apitest.entity.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
public class UiTestScriptRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private UiTestScriptRepository scriptRepository;

    @Autowired
    private UiTestFolderRepository folderRepository;

    @Autowired
    private UserRepository userRepository;

    private User testUser;
    private UiTestFolder testFolder;
    private UiTestScript testScript;

    @BeforeEach
    void setUp() {
        // Create test user
        testUser = new User();
        testUser.setEmail("test@example.com");
        testUser.setPassword("password123");
        // User entity doesn't have setName method
        testUser = entityManager.persistAndFlush(testUser);

        // Create test folder
        testFolder = new UiTestFolder();
        testFolder.setName("Test Folder");
        testFolder.setDescription("Test folder description");
        testFolder.setCreatedBy(testUser);
        testFolder = entityManager.persistAndFlush(testFolder);

        // Create test script
        testScript = new UiTestScript();
        testScript.setName("Test Script");
        testScript.setDescription("Test script description");
        testScript.setScriptContent("test content");
        testScript.setCreatedBy(testUser);
        testScript.setFolder(testFolder);
        testScript = entityManager.persistAndFlush(testScript);

        entityManager.clear();
    }

    @Test
    void testFindByFolderId() {
        // When
        List<UiTestScript> scripts = scriptRepository.findByFolderId(testFolder.getId());

        // Then
        assertFalse(scripts.isEmpty());
        assertEquals(1, scripts.size());
        assertEquals(testScript.getName(), scripts.get(0).getName());
    }

    @Test
    void testFindByFolderIdOrderByNameAsc() {
        // Given - create another script
        UiTestScript script2 = new UiTestScript();
        script2.setName("Another Script");
        script2.setDescription("Another script description");
        script2.setScriptContent("another test content");
        script2.setCreatedBy(testUser);
        script2.setFolder(testFolder);
        entityManager.persistAndFlush(script2);

        // When
        List<UiTestScript> scripts = scriptRepository.findByFolderIdOrderByNameAsc(testFolder.getId());

        // Then
        assertEquals(2, scripts.size());
        assertEquals("Another Script", scripts.get(0).getName());
        assertEquals("Test Script", scripts.get(1).getName());
    }

    @Test
    void testFindByCreatedByOrderByCreatedAtDesc() {
        // When
        List<UiTestScript> scripts = scriptRepository.findByCreatedByOrderByCreatedAtDesc(testUser);

        // Then
        assertFalse(scripts.isEmpty());
        assertEquals(1, scripts.size());
        assertEquals(testScript.getName(), scripts.get(0).getName());
    }

    @Test
    void testFindByKeyword() {
        // When
        List<UiTestScript> scriptsByName = scriptRepository.findByKeyword("Test Script");
        List<UiTestScript> scriptsByDescription = scriptRepository.findByKeyword("script description");

        // Then
        assertFalse(scriptsByName.isEmpty());
        assertEquals(1, scriptsByName.size());
        assertEquals(testScript.getName(), scriptsByName.get(0).getName());

        assertFalse(scriptsByDescription.isEmpty());
        assertEquals(1, scriptsByDescription.size());
        assertEquals(testScript.getName(), scriptsByDescription.get(0).getName());
    }

    @Test
    void testFindByFolderIdAndKeyword() {
        // When
        List<UiTestScript> scripts = scriptRepository.findByFolderIdAndKeyword(
                testFolder.getId(), "Test Script");

        // Then
        assertFalse(scripts.isEmpty());
        assertEquals(1, scripts.size());
        assertEquals(testScript.getName(), scripts.get(0).getName());
    }

    @Test
    void testExistsByNameAndFolderId() {
        // When & Then
        assertTrue(scriptRepository.existsByNameAndFolderId(testScript.getName(), testFolder.getId()));
        assertFalse(scriptRepository.existsByNameAndFolderId("Non-existent Script", testFolder.getId()));
    }

    @Test
    void testCountByFolderId() {
        // When
        long count = scriptRepository.countByFolderId(testFolder.getId());

        // Then
        assertEquals(1, count);
    }

    @Test
    void testCountByCreatedBy() {
        // When
        long count = scriptRepository.countByCreatedBy(testUser);

        // Then
        assertEquals(1, count);
    }

    @Test
    void testFindByNonExistentFolderId() {
        // When
        List<UiTestScript> scripts = scriptRepository.findByFolderId(999L);

        // Then
        assertTrue(scripts.isEmpty());
    }

    @Test
    void testFindByKeywordWithNoResults() {
        // When
        List<UiTestScript> scripts = scriptRepository.findByKeyword("nonexistent keyword");

        // Then
        assertTrue(scripts.isEmpty());
    }
}