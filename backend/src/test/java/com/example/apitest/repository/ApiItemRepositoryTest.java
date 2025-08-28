package com.example.apitest.repository;

import com.example.apitest.entity.ApiFolder;
import com.example.apitest.entity.ApiItem;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
public class ApiItemRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private ApiItemRepository apiItemRepository;

    private ApiFolder testFolder;
    private ApiItem testApiItem;

    @BeforeEach
    void setUp() {
        // Create test folder
        testFolder = new ApiFolder();
        testFolder.setName("Test Folder");
        testFolder = entityManager.persistAndFlush(testFolder);

        // Create test API item
        testApiItem = new ApiItem();
        testApiItem.setName("Test API");
        testApiItem.setMethod(ApiItem.HttpMethod.GET);
        testApiItem.setUrl("http://test.com/api");
        testApiItem.setFolder(testFolder);
        testApiItem = entityManager.persistAndFlush(testApiItem);
    }

    @Test
    void testFindById() {
        Optional<ApiItem> found = apiItemRepository.findById(testApiItem.getId());

        assertTrue(found.isPresent());
        assertEquals("Test API", found.get().getName());
        assertEquals(ApiItem.HttpMethod.GET, found.get().getMethod());
        assertEquals("http://test.com/api", found.get().getUrl());
    }

    @Test
    void testFindAll() {
        ApiItem anotherItem = new ApiItem();
        anotherItem.setName("Another API");
        anotherItem.setMethod(ApiItem.HttpMethod.POST);
        anotherItem.setUrl("http://test.com/another");
        anotherItem.setFolder(testFolder);
        entityManager.persistAndFlush(anotherItem);

        List<ApiItem> items = apiItemRepository.findAll();

        assertTrue(items.size() >= 2);
    }

    @Test
    void testSaveApiItem() {
        ApiItem newItem = new ApiItem();
        newItem.setName("New API");
        newItem.setMethod(ApiItem.HttpMethod.PUT);
        newItem.setUrl("http://test.com/new");
        newItem.setFolder(testFolder);
        newItem.setDescription("New Description");

        ApiItem saved = apiItemRepository.save(newItem);

        assertNotNull(saved.getId());
        assertEquals("New API", saved.getName());
        assertEquals(ApiItem.HttpMethod.PUT, saved.getMethod());
        assertEquals("New Description", saved.getDescription());
    }

    @Test
    void testUpdateApiItem() {
        testApiItem.setName("Updated API");
        testApiItem.setMethod(ApiItem.HttpMethod.DELETE);
        testApiItem.setUrl("http://test.com/updated");

        ApiItem updated = apiItemRepository.save(testApiItem);

        assertEquals("Updated API", updated.getName());
        assertEquals(ApiItem.HttpMethod.DELETE, updated.getMethod());
        assertEquals("http://test.com/updated", updated.getUrl());
    }

    @Test
    void testDeleteApiItem() {
        Long itemId = testApiItem.getId();

        apiItemRepository.delete(testApiItem);
        entityManager.flush();

        Optional<ApiItem> deleted = apiItemRepository.findById(itemId);
        assertFalse(deleted.isPresent());
    }





}