package com.example.apitest.resolver;

import com.example.apitest.annotation.CurrentUser;
import com.example.apitest.entity.ApiKey;
import com.example.apitest.entity.User;
import com.example.apitest.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

/**
 * @CurrentUser 어노테이션이 있는 파라미터에 현재 로그인한 사용자 객체를 주입하는 ArgumentResolver
 */
@Component
public class CurrentUserArgumentResolver implements HandlerMethodArgumentResolver {
    
    private static final Logger logger = LoggerFactory.getLogger(CurrentUserArgumentResolver.class);
    
    @Autowired
    private AuthService authService;
    
    /**
     * 이 resolver가 처리할 수 있는 파라미터인지 확인
     */
    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(CurrentUser.class) && 
               parameter.getParameterType().equals(User.class);
    }
    
    /**
     * 실제 User 객체를 생성하여 파라미터에 주입
     */
    @Override
    public Object resolveArgument(MethodParameter parameter, 
                                  ModelAndViewContainer mavContainer,
                                  NativeWebRequest webRequest, 
                                  WebDataBinderFactory binderFactory) throws Exception {
        
        logger.debug("@CurrentUser 파라미터 해석 시작 - 메소드: {}", 
                    parameter.getMethod().getName());
        
        HttpServletRequest request = webRequest.getNativeRequest(HttpServletRequest.class);
        if (request == null) {
            logger.error("HttpServletRequest를 가져올 수 없습니다.");
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "서버 오류가 발생했습니다.");
        }
        
        User authenticatedUser = null;
        
        // 1. API 키 인증 확인
        ApiKey apiKey = (ApiKey) request.getAttribute("apiKey");
        if (apiKey != null) {
            authenticatedUser = apiKey.getUser();
            logger.debug("API 키 인증 사용자 확인: {} ({})", authenticatedUser.getEmail(), authenticatedUser.getRole());
            return authenticatedUser;
        }
        
        // 2. Spring Security Context 확인
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            if (auth.getPrincipal() instanceof User) {
                authenticatedUser = (User) auth.getPrincipal();
            } else if (auth.getPrincipal() instanceof String) {
                String userEmail = (String) auth.getPrincipal();
                Optional<User> userOpt = authService.findByEmail(userEmail);
                if (userOpt.isPresent()) {
                    authenticatedUser = userOpt.get();
                }
            }
            
            if (authenticatedUser != null) {
                logger.debug("Spring Security 인증 사용자 확인: {} ({})", authenticatedUser.getEmail(), authenticatedUser.getRole());
                return authenticatedUser;
            }
        }
        
        // 3. 세션 기반 인증 확인
        HttpSession session = request.getSession(false);
        if (session != null) {
            String userEmail = (String) session.getAttribute("userEmail");
            if (userEmail != null) {
                Optional<User> userOpt = authService.findByEmail(userEmail);
                if (userOpt.isPresent()) {
                    authenticatedUser = userOpt.get();
                    logger.debug("세션 인증 사용자 확인: {} ({})", authenticatedUser.getEmail(), authenticatedUser.getRole());
                    return authenticatedUser;
                }
            }
        }
        
        // 인증된 사용자가 없는 경우
        logger.warn("인증되지 않은 요청 - IP: {}", request.getRemoteAddr());
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "인증되지 않은 사용자입니다.");
    }
}