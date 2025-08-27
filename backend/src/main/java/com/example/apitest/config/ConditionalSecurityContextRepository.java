package com.example.apitest.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpRequestResponseHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;

/**
 * API 키 인증과 세션 인증을 구분하는 SecurityContextRepository
 * API 키 인증 시에는 세션을 생성하지 않음
 */
public class ConditionalSecurityContextRepository implements SecurityContextRepository {
    
    private final HttpSessionSecurityContextRepository sessionRepository = new HttpSessionSecurityContextRepository();
    
    @Override
    public SecurityContext loadContext(HttpRequestResponseHolder requestResponseHolder) {
        HttpServletRequest request = requestResponseHolder.getRequest();
        
        // API 키 헤더가 있으면 빈 컨텍스트 반환 (세션 사용 안 함)
        if (request.getHeader("X-API-Key") != null) {
            return SecurityContextHolder.createEmptyContext();
        }
        
        // 그 외에는 세션에서 로드
        return sessionRepository.loadContext(requestResponseHolder);
    }
    
    @Override
    public void saveContext(SecurityContext context, HttpServletRequest request, HttpServletResponse response) {
        // API 키 인증이면 세션에 저장하지 않음
        if (request.getAttribute("API_KEY_AUTHENTICATED") != null || 
            request.getHeader("X-API-Key") != null) {
            return;
        }
        
        // 그 외에는 세션에 저장
        sessionRepository.saveContext(context, request, response);
    }
    
    @Override
    public boolean containsContext(HttpServletRequest request) {
        // API 키 인증이면 false
        if (request.getHeader("X-API-Key") != null) {
            return false;
        }
        
        return sessionRepository.containsContext(request);
    }
}