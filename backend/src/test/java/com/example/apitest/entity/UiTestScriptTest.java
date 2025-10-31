package com.example.apitest.entity;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import static org.junit.jupiter.api.Assertions.*;
import java.time.LocalDateTime;

public class UiTestScriptTest {

    private UiTestScript uiTestScript;

    @BeforeEach
    void setUp() {
        uiTestScript = new UiTestScript();
    }

    @Test
    void testScriptCreation() {
        // Given
        String name = "Login Test Script";
        String description = "Test script for login functionality";
        String scriptContent = "const { test, expect } = require('@playwright/test');";

        // When
        uiTestScript.setName(name);
        uiTestScript.setDescription(description);
        uiTestScript.setScriptContent(scriptContent);

        // Then
        assertEquals(name, uiTestScript.getName());
        assertEquals(description, uiTestScript.getDescription());
        assertEquals(scriptContent, uiTestScript.getScriptContent());
    }

    @Test
    void testDefaultValues() {
        // Given & When
        UiTestScript script = new UiTestScript();

        // Then
        assertEquals(UiTestScript.ScriptType.PLAYWRIGHT, script.getScriptType());
        assertEquals(UiTestScript.BrowserType.CHROMIUM, script.getBrowserType());
        assertEquals(Integer.valueOf(30), script.getTimeoutSeconds());
        assertTrue(script.getHeadlessMode());
        assertTrue(script.getScreenshotOnFailure());
    }

    @Test
    void testEnumTypes() {
        // Given & When
        uiTestScript.setScriptType(UiTestScript.ScriptType.SELENIUM);
        uiTestScript.setBrowserType(UiTestScript.BrowserType.FIREFOX);

        // Then
        assertEquals(UiTestScript.ScriptType.SELENIUM, uiTestScript.getScriptType());
        assertEquals(UiTestScript.BrowserType.FIREFOX, uiTestScript.getBrowserType());
    }

    @Test
    void testTimeoutAndSettings() {
        // Given
        Integer timeout = 60;
        Boolean headless = false;
        Boolean screenshot = false;

        // When
        uiTestScript.setTimeoutSeconds(timeout);
        uiTestScript.setHeadlessMode(headless);
        uiTestScript.setScreenshotOnFailure(screenshot);

        // Then
        assertEquals(timeout, uiTestScript.getTimeoutSeconds());
        assertFalse(uiTestScript.getHeadlessMode());
        assertFalse(uiTestScript.getScreenshotOnFailure());
    }

    @Test
    void testPrePersist() {
        // Given
        UiTestScript script = new UiTestScript();

        // When
        script.onCreate(); // Simulating @PrePersist

        // Then
        assertNotNull(script.getCreatedAt());
        assertNotNull(script.getUpdatedAt());
        // Note: These timestamps should be the same since they are set at the same time
        // We just verify they are not null and properly initialized
    }

    @Test
    void testPreUpdate() {
        // Given
        UiTestScript script = new UiTestScript();
        script.onCreate(); // Simulating @PrePersist
        LocalDateTime createdAt = script.getCreatedAt();

        try {
            Thread.sleep(1); // Ensure time difference
        } catch (InterruptedException e) {
            // Ignore
        }

        // When
        script.onUpdate(); // Simulating @PreUpdate

        // Then
        assertNotNull(script.getUpdatedAt());
        assertTrue(script.getUpdatedAt().isAfter(createdAt) || script.getUpdatedAt().equals(createdAt));
    }

    @Test
    void testAllScriptTypes() {
        // Test all enum values exist
        UiTestScript.ScriptType[] types = UiTestScript.ScriptType.values();
        assertTrue(types.length >= 3);

        boolean hasPlaywright = false;
        boolean hasSelenium = false;
        boolean hasCypress = false;

        for (UiTestScript.ScriptType type : types) {
            if (type == UiTestScript.ScriptType.PLAYWRIGHT) hasPlaywright = true;
            if (type == UiTestScript.ScriptType.SELENIUM) hasSelenium = true;
            if (type == UiTestScript.ScriptType.CYPRESS) hasCypress = true;
        }

        assertTrue(hasPlaywright);
        assertTrue(hasSelenium);
        assertTrue(hasCypress);
    }

    @Test
    void testAllBrowserTypes() {
        // Test all enum values exist
        UiTestScript.BrowserType[] types = UiTestScript.BrowserType.values();
        assertTrue(types.length >= 5);

        boolean hasChromium = false;
        boolean hasFirefox = false;
        boolean hasWebkit = false;
        boolean hasChrome = false;
        boolean hasSafari = false;

        for (UiTestScript.BrowserType type : types) {
            if (type == UiTestScript.BrowserType.CHROMIUM) hasChromium = true;
            if (type == UiTestScript.BrowserType.FIREFOX) hasFirefox = true;
            if (type == UiTestScript.BrowserType.WEBKIT) hasWebkit = true;
            if (type == UiTestScript.BrowserType.CHROME) hasChrome = true;
            if (type == UiTestScript.BrowserType.SAFARI) hasSafari = true;
        }

        assertTrue(hasChromium);
        assertTrue(hasFirefox);
        assertTrue(hasWebkit);
        assertTrue(hasChrome);
        assertTrue(hasSafari);
    }
}