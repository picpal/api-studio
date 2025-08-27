package com.example.apitest.aspect;

import com.example.apitest.annotation.RequireAuth;
import com.example.apitest.entity.User;
import com.example.apitest.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

/**
 * 인증 관련 AOP Aspect
 * @RequireAuth 어노테이션이 있는 메소드에 대해 세션 기반 인증을 자동으로 처리합니다.
 */
@Aspect
@Component
public class AuthenticationAspect {
    
    private static final Logger logger = LoggerFactory.getLogger(AuthenticationAspect.class);
    
    @Autowired
    private AuthService authService;
    
    /**
     * @RequireAuth 어노테이션이 있는 메소드 실행 전에 인증 체크
     */
    @Before("@annotation(requireAuth)")
    public void checkAuthentication(JoinPoint joinPoint, RequireAuth requireAuth) {
        logger.debug("인증 체크 시작 - 메소드: {}, 관리자 권한 필요: {}", 
                    joinPoint.getSignature().getName(), requireAuth.adminOnly());
        
        // 현재 HTTP 요청에서 세션 가져오기
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes == null) {
            logger.error("HTTP 요청 컨텍스트를 가져올 수 없습니다.");
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "서버 오류가 발생했습니다.");
        }
        
        HttpServletRequest request = attributes.getRequest();
        HttpSession session = request.getSession(false);
        
        if (session == null) {
            logger.warn("세션이 존재하지 않습니다 - IP: {}", request.getRemoteAddr());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "인증되지 않은 사용자입니다.");
        }
        
        String userEmail = (String) session.getAttribute("userEmail");
        Long userId = (Long) session.getAttribute("userId");
        
        if (userEmail == null || userId == null) {
            logger.warn("세션에 사용자 정보가 없습니다 - sessionId: {}, IP: {}", 
                       session.getId(), request.getRemoteAddr());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "인증되지 않은 사용자입니다.");
        }
        
        // 데이터베이스에서 사용자 정보 확인
        Optional<User> userOpt = authService.findByEmail(userEmail);
        if (userOpt.isEmpty()) {
            logger.warn("존재하지 않는 사용자 - email: {}, IP: {}", userEmail, request.getRemoteAddr());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "존재하지 않는 사용자입니다.");
        }
        
        User user = userOpt.get();
        
        // 관리자 권한 체크
        if (requireAuth.adminOnly() && !User.Role.ADMIN.equals(user.getRole())) {
            logger.warn("관리자 권한 필요 - 현재 사용자: {} ({}), IP: {}", 
                       user.getEmail(), user.getRole(), request.getRemoteAddr());
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "관리자 권한이 필요합니다.");
        }
        
        logger.debug("인증 성공 - 사용자: {} ({}), 메소드: {}", 
                    user.getEmail(), user.getRole(), joinPoint.getSignature().getName());
    }
}