package com.example.apitest.resolver;

import com.example.apitest.annotation.CurrentUser;
import com.example.apitest.entity.User;
import com.example.apitest.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
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
        
        HttpSession session = request.getSession(false);
        if (session == null) {
            logger.warn("세션이 존재하지 않습니다 - IP: {}", request.getRemoteAddr());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "인증되지 않은 사용자입니다.");
        }
        
        String userEmail = (String) session.getAttribute("userEmail");
        if (userEmail == null) {
            logger.warn("세션에 사용자 이메일이 없습니다 - sessionId: {}", session.getId());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "인증되지 않은 사용자입니다.");
        }
        
        Optional<User> userOpt = authService.findByEmail(userEmail);
        if (userOpt.isEmpty()) {
            logger.warn("존재하지 않는 사용자 - email: {}", userEmail);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "존재하지 않는 사용자입니다.");
        }
        
        User user = userOpt.get();
        logger.debug("@CurrentUser 파라미터 해석 완료 - 사용자: {} ({})", 
                    user.getEmail(), user.getRole());
        
        return user;
    }
}