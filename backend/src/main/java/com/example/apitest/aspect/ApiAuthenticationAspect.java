package com.example.apitest.aspect;

import com.example.apitest.annotation.RequireApiAuth;
import com.example.apitest.entity.ApiKey;
import com.example.apitest.entity.User;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpServletRequest;
import java.lang.reflect.Method;

/**
 * API 키 기반 인증 및 권한 체크 AOP
 */
@Aspect
@Component
public class ApiAuthenticationAspect {
    
    private static final Logger logger = LoggerFactory.getLogger(ApiAuthenticationAspect.class);
    
    /**
     * @RequireApiAuth 어노테이션이 있는 메소드 실행 전에 API 키 권한 체크
     */
    @Before("@annotation(requireApiAuth)")
    public void checkApiAuthentication(JoinPoint joinPoint, RequireApiAuth requireApiAuth) {
        logger.debug("API 키 권한 체크 시작 - 메소드: {}, 관리자 권한 필요: {}", 
                    joinPoint.getSignature().getName(), requireApiAuth.adminOnly());
        
        // 현재 HTTP 요청에서 API 키 정보 가져오기
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes == null) {
            logger.error("HTTP 요청 컨텍스트를 가져올 수 없습니다.");
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "서버 오류가 발생했습니다.");
        }
        
        HttpServletRequest request = attributes.getRequest();
        
        // API 키 인증 또는 세션 인증 확인
        ApiKey apiKey = (ApiKey) request.getAttribute("apiKey");
        User authenticatedUser = (User) request.getAttribute("authenticatedUser");
        
        // 세션 기반 인증 확인 (request attribute)
        if (authenticatedUser == null) {
            authenticatedUser = (User) request.getAttribute("sessionUser");
        }
        
        // Spring Security SecurityContext에서 인증 확인
        if (authenticatedUser == null) {
            org.springframework.security.core.Authentication auth = 
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof User) {
                authenticatedUser = (User) auth.getPrincipal();
            }
        }
        
        if (authenticatedUser == null) {
            logger.warn("인증이 되지 않은 요청 - IP: {}", request.getRemoteAddr());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "인증이 필요합니다.");
        }
        
        // 관리자 권한 체크
        if (requireApiAuth.adminOnly() && !User.Role.ADMIN.equals(authenticatedUser.getRole())) {
            logger.warn("관리자 권한 필요 - 현재 사용자: {} ({}), IP: {}", 
                       authenticatedUser.getEmail(), authenticatedUser.getRole(), request.getRemoteAddr());
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "관리자 권한이 필요합니다.");
        }
        
        // 폴더 접근 권한 체크 (API 키 기반 인증인 경우에만)
        String folderParam = requireApiAuth.folderParam();
        if (folderParam != null && !folderParam.isEmpty() && apiKey != null) {
            Long folderId = extractFolderId(joinPoint, folderParam);
            
            if (folderId != null && !apiKey.canAccessFolder(folderId)) {
                logger.warn("폴더 접근 권한 없음 - 사용자: {}, 폴더 ID: {}, 허용된 폴더들: {}, IP: {}", 
                           authenticatedUser.getEmail(), folderId, apiKey.getAllowedFolderIds(), request.getRemoteAddr());
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "해당 폴더에 대한 접근 권한이 없습니다.");
            }
        }
        // 세션 기반 인증인 경우 폴더 권한 체크 생략 (모든 폴더 접근 허용)
        
        logger.debug("API 키 권한 체크 성공 - 사용자: {} ({}), 메소드: {}", 
                    authenticatedUser.getEmail(), authenticatedUser.getRole(), joinPoint.getSignature().getName());
    }
    
    /**
     * 메소드 파라미터에서 폴더 ID 추출
     */
    private Long extractFolderId(JoinPoint joinPoint, String folderParam) {
        try {
            Method method = ((org.aspectj.lang.reflect.MethodSignature) joinPoint.getSignature()).getMethod();
            String[] paramNames = getParameterNames(method);
            Object[] args = joinPoint.getArgs();
            
            for (int i = 0; i < paramNames.length; i++) {
                if (folderParam.equals(paramNames[i]) && args[i] instanceof Long) {
                    return (Long) args[i];
                }
            }
            
            // PathVariable에서 폴더 ID 찾기
            for (int i = 0; i < paramNames.length; i++) {
                if (paramNames[i].contains("folderId") && args[i] instanceof Long) {
                    return (Long) args[i];
                }
            }
            
        } catch (Exception e) {
            logger.error("폴더 ID 추출 중 오류 발생", e);
        }
        
        return null;
    }
    
    /**
     * 메소드 파라미터 이름 가져오기 (간단한 구현)
     */
    private String[] getParameterNames(Method method) {
        // 실제로는 reflection이나 AspectJ의 기능을 사용해야 하지만,
        // 간단하게 구현하기 위해 파라미터 타입 기반으로 추정
        java.lang.reflect.Parameter[] parameters = method.getParameters();
        String[] names = new String[parameters.length];
        
        for (int i = 0; i < parameters.length; i++) {
            // 파라미터 이름을 가져오려면 컴파일 시 -parameters 옵션이 필요
            names[i] = parameters[i].getName();
        }
        
        return names;
    }
}