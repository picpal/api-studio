package com.example.apitest.config;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpServletResponseWrapper;

/**
 * API 키 인증 시 세션 쿠키 생성을 방지하는 Response Wrapper
 */
public class NoSessionResponseWrapper extends HttpServletResponseWrapper {
    
    public NoSessionResponseWrapper(HttpServletResponse response) {
        super(response);
    }
    
    @Override
    public void addCookie(Cookie cookie) {
        // JSESSIONID 쿠키를 추가하지 않음
        if (!"JSESSIONID".equals(cookie.getName())) {
            super.addCookie(cookie);
        }
    }
    
    @Override
    public void addHeader(String name, String value) {
        // Set-Cookie 헤더에서 JSESSIONID 제외
        if ("Set-Cookie".equalsIgnoreCase(name) && value != null && value.contains("JSESSIONID")) {
            return;
        }
        super.addHeader(name, value);
    }
    
    @Override
    public void setHeader(String name, String value) {
        // Set-Cookie 헤더에서 JSESSIONID 제외
        if ("Set-Cookie".equalsIgnoreCase(name) && value != null && value.contains("JSESSIONID")) {
            return;
        }
        super.setHeader(name, value);
    }
}