package com.example.apitest.config;

import com.example.apitest.entity.User;
import com.example.apitest.entity.UserActivity;
import com.example.apitest.service.ActivityLoggingService;
import com.example.apitest.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Optional;

@Component
public class ActivityLoggingInterceptor implements HandlerInterceptor {
    
    @Autowired
    private ActivityLoggingService activityLoggingService;
    
    @Autowired
    private AuthService authService;
    
    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, 
                               Object handler, Exception ex) throws Exception {
        
        // 로깅 대상 URI 필터링
        String requestURI = request.getRequestURI();
        if (shouldLogRequest(requestURI)) {
            logApiCall(request, response, ex);
        }
    }
    
    /**
     * 로깅 대상 요청인지 판단
     */
    private boolean shouldLogRequest(String requestURI) {
        // 정적 리소스와 헬스체크는 제외
        if (requestURI.startsWith("/static/") || 
            requestURI.startsWith("/css/") || 
            requestURI.startsWith("/js/") || 
            requestURI.startsWith("/images/") ||
            requestURI.startsWith("/favicon.ico") ||
            requestURI.startsWith("/actuator/") ||
            requestURI.equals("/error")) {
            return false;
        }
        
        // API 엔드포인트만 로깅
        return requestURI.startsWith("/api/");
    }
    
    /**
     * API 호출 로깅
     */
    private void logApiCall(HttpServletRequest request, HttpServletResponse response, Exception ex) {
        try {
            HttpSession session = request.getSession(false);
            User user = null;
            String userEmail = null;
            
            // 세션에서 사용자 정보 추출
            if (session != null) {
                userEmail = (String) session.getAttribute("userEmail");
                if (userEmail != null) {
                    Optional<User> userOpt = authService.findByEmail(userEmail);
                    user = userOpt.orElse(null);
                }
            }
            
            // 액션 설명 생성
            String actionDescription = generateActionDescription(request);
            
            // 결과 판단
            UserActivity.ActionResult result = determineResult(response, ex);
            
            // 에러 메시지 추출
            String errorMessage = ex != null ? ex.getMessage() : null;
            if (errorMessage == null && result == UserActivity.ActionResult.FAILURE) {
                errorMessage = "HTTP " + response.getStatus();
            }
            
            // 로깅
            if (errorMessage != null) {
                activityLoggingService.logActivityWithError(user, UserActivity.ActivityType.API_CALL,
                    actionDescription, errorMessage);
            } else {
                activityLoggingService.logHttpActivity(user, UserActivity.ActivityType.API_CALL,
                    actionDescription, result, request.getRequestURI(), request.getMethod());
            }
            
        } catch (Exception e) {
            // 로깅 실패가 메인 로직에 영향을 주면 안 됨
            System.err.println("Failed to log API call: " + e.getMessage());
        }
    }
    
    /**
     * 액션 설명 생성
     */
    private String generateActionDescription(HttpServletRequest request) {
        String method = request.getMethod();
        String uri = request.getRequestURI();
        
        // URI별 의미있는 설명 생성
        if (uri.startsWith("/api/folders")) {
            return switch (method) {
                case "GET" -> "폴더 목록 조회";
                case "POST" -> "새 폴더 생성";
                case "PUT", "PATCH" -> "폴더 정보 수정";
                case "DELETE" -> "폴더 삭제";
                default -> method + " " + uri;
            };
        } else if (uri.startsWith("/api/items")) {
            return switch (method) {
                case "GET" -> "API 아이템 조회";
                case "POST" -> "새 API 아이템 생성";
                case "PUT", "PATCH" -> "API 아이템 수정";
                case "DELETE" -> "API 아이템 삭제";
                default -> method + " " + uri;
            };
        } else if (uri.startsWith("/api/auth")) {
            // 인증 관련은 AuthController에서 별도 처리하므로 제외
            return null;
        } else if (uri.startsWith("/api/admin")) {
            return switch (method) {
                case "GET" -> "관리자 정보 조회";
                case "POST" -> "관리자 액션 실행";
                case "PUT", "PATCH" -> "관리자 설정 변경";
                case "DELETE" -> "관리자 데이터 삭제";
                default -> "관리자 " + method + " " + uri;
            };
        } else {
            return method + " " + uri;
        }
    }
    
    /**
     * API 호출 결과 판단
     */
    private UserActivity.ActionResult determineResult(HttpServletResponse response, Exception ex) {
        if (ex != null) {
            return UserActivity.ActionResult.FAILURE;
        }
        
        int status = response.getStatus();
        if (status >= 200 && status < 300) {
            return UserActivity.ActionResult.SUCCESS;
        } else if (status == 401 || status == 403) {
            return UserActivity.ActionResult.BLOCKED;
        } else {
            return UserActivity.ActionResult.FAILURE;
        }
    }
}