package com.example.apitest.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpRequestResponseHolder;
import org.springframework.security.web.context.SecurityContextRepository;

/**
 * API 키 인증을 위한 Stateless SecurityContextRepository
 * 세션을 생성하거나 사용하지 않음
 */
public class StatelessSecurityContextRepository implements SecurityContextRepository {
    
    @Override
    public SecurityContext loadContext(HttpRequestResponseHolder requestResponseHolder) {
        return SecurityContextHolder.createEmptyContext();
    }
    
    @Override
    public void saveContext(SecurityContext context, HttpServletRequest request, HttpServletResponse response) {
        // API 키 인증은 stateless이므로 context를 저장하지 않음
    }
    
    @Override
    public boolean containsContext(HttpServletRequest request) {
        return false;
    }
}