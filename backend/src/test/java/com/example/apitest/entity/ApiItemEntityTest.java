package com.example.apitest.entity;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

public class ApiItemEntityTest {

    @Test
    void testApiItemCreation() {
        ApiItem apiItem = new ApiItem();
        apiItem.setId(1L);
        apiItem.setName("Test API");
        apiItem.setMethod(ApiItem.HttpMethod.GET);
        apiItem.setUrl("http://example.com/api");
        apiItem.setDescription("Test Description");

        assertEquals(1L, apiItem.getId());
        assertEquals("Test API", apiItem.getName());
        assertEquals(ApiItem.HttpMethod.GET, apiItem.getMethod());
        assertEquals("http://example.com/api", apiItem.getUrl());
        assertEquals("Test Description", apiItem.getDescription());
    }

    @Test
    void testApiItemConstructor() {
        ApiItem apiItem = new ApiItem("Test API", ApiItem.HttpMethod.POST, "http://example.com/api");

        assertEquals("Test API", apiItem.getName());
        assertEquals(ApiItem.HttpMethod.POST, apiItem.getMethod());
        assertEquals("http://example.com/api", apiItem.getUrl());
    }

    @Test
    void testHttpMethodEnum() {
        assertEquals("GET", ApiItem.HttpMethod.GET.name());
        assertEquals("POST", ApiItem.HttpMethod.POST.name());
        assertEquals("PUT", ApiItem.HttpMethod.PUT.name());
        assertEquals("DELETE", ApiItem.HttpMethod.DELETE.name());
        assertEquals("PATCH", ApiItem.HttpMethod.PATCH.name());
    }

    @Test
    void testRequestData() {
        ApiItem apiItem = new ApiItem();
        String headers = "{\"Content-Type\": \"application/json\"}";
        String params = "{\"param1\": \"value1\"}";
        String body = "{\"data\": \"test\"}";

        apiItem.setRequestHeaders(headers);
        apiItem.setRequestParams(params);
        apiItem.setRequestBody(body);

        assertEquals(headers, apiItem.getRequestHeaders());
        assertEquals(params, apiItem.getRequestParams());
        assertEquals(body, apiItem.getRequestBody());
    }

    @Test
    void testValidationSettings() {
        ApiItem apiItem = new ApiItem();
        String expectedValues = "[{\"key\": \"status\", \"value\": \"success\"}]";

        apiItem.setValidationEnabled(true);
        apiItem.setExpectedValues(expectedValues);

        assertTrue(apiItem.getValidationEnabled());
        assertEquals(expectedValues, apiItem.getExpectedValues());
    }

    @Test
    void testDefaultValidation() {
        ApiItem apiItem = new ApiItem();

        assertFalse(apiItem.getValidationEnabled());
    }

    @Test
    void testTimestamps() {
        ApiItem apiItem = new ApiItem();
        LocalDateTime now = LocalDateTime.now();

        apiItem.setCreatedAt(now);
        apiItem.setUpdatedAt(now);

        assertEquals(now, apiItem.getCreatedAt());
        assertEquals(now, apiItem.getUpdatedAt());
    }

    @Test
    void testFolder() {
        ApiItem apiItem = new ApiItem();
        ApiFolder folder = new ApiFolder();
        folder.setId(1L);
        folder.setName("Test Folder");

        apiItem.setFolder(folder);

        assertNotNull(apiItem.getFolder());
        assertEquals(1L, apiItem.getFolder().getId());
        assertEquals("Test Folder", apiItem.getFolder().getName());
        assertEquals(1L, apiItem.getFolderId());
    }

    @Test
    void testGetFolderIdWhenFolderIsNull() {
        ApiItem apiItem = new ApiItem();

        assertNull(apiItem.getFolderId());
    }
}