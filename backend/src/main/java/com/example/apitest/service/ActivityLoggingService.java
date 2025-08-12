package com.example.apitest.service;

import com.example.apitest.entity.User;
import com.example.apitest.entity.UserActivity;
import com.example.apitest.repository.UserActivityRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ActivityLoggingService {
    
    @Autowired
    private UserActivityRepository userActivityRepository;
    
    /**
     * 비동기로 사용자 활동을 로깅합니다.
     * 성능에 영향을 주지 않기 위해 별도 스레드에서 실행됩니다.
     */
    @Async
    public void logActivity(User user, UserActivity.ActivityType activityType, 
                           String actionDescription, UserActivity.ActionResult result) {
        try {
            UserActivity activity = new UserActivity();
            activity.setUser(user);
            activity.setUserEmail(user != null ? user.getEmail() : null);
            activity.setActivityType(activityType);
            activity.setActionDescription(actionDescription);
            activity.setResult(result);
            
            // HTTP 요청 정보 자동 추출
            enrichWithHttpInfo(activity);
            
            userActivityRepository.save(activity);
        } catch (Exception e) {
            // 로깅 실패가 메인 로직에 영향을 주면 안 되므로 에러를 조용히 처리
            System.err.println("Failed to log user activity: " + e.getMessage());
        }
    }
    
    /**
     * 로그인 실패 시 사용자가 없어도 로깅
     */
    @Async
    public void logFailedLogin(String email, String errorMessage, String ipAddress) {
        try {
            UserActivity activity = new UserActivity();
            activity.setUser(null);
            activity.setUserEmail(email);
            activity.setActivityType(UserActivity.ActivityType.LOGIN);
            activity.setActionDescription("로그인 실패: " + email);
            activity.setResult(UserActivity.ActionResult.FAILURE);
            activity.setErrorMessage(errorMessage);
            activity.setIpAddress(ipAddress);
            
            enrichWithHttpInfo(activity);
            
            userActivityRepository.save(activity);
        } catch (Exception e) {
            System.err.println("Failed to log failed login: " + e.getMessage());
        }
    }
    
    /**
     * HTTP 요청과 함께 활동 로깅
     */
    @Async
    public void logHttpActivity(User user, UserActivity.ActivityType activityType,
                               String actionDescription, UserActivity.ActionResult result,
                               String requestUri, String httpMethod) {
        try {
            UserActivity activity = new UserActivity();
            activity.setUser(user);
            activity.setUserEmail(user != null ? user.getEmail() : null);
            activity.setActivityType(activityType);
            activity.setActionDescription(actionDescription);
            activity.setResult(result);
            activity.setRequestUri(requestUri);
            activity.setHttpMethod(httpMethod);
            
            enrichWithHttpInfo(activity);
            
            userActivityRepository.save(activity);
        } catch (Exception e) {
            System.err.println("Failed to log HTTP activity: " + e.getMessage());
        }
    }
    
    /**
     * 에러와 함께 활동 로깅
     */
    @Async
    public void logActivityWithError(User user, UserActivity.ActivityType activityType,
                                   String actionDescription, String errorMessage) {
        try {
            UserActivity activity = new UserActivity();
            activity.setUser(user);
            activity.setUserEmail(user != null ? user.getEmail() : null);
            activity.setActivityType(activityType);
            activity.setActionDescription(actionDescription);
            activity.setResult(UserActivity.ActionResult.FAILURE);
            activity.setErrorMessage(errorMessage);
            
            enrichWithHttpInfo(activity);
            
            userActivityRepository.save(activity);
        } catch (Exception e) {
            System.err.println("Failed to log activity with error: " + e.getMessage());
        }
    }
    
    /**
     * HTTP 요청 정보로 활동 레코드를 풍부하게 합니다
     */
    private void enrichWithHttpInfo(UserActivity activity) {
        try {
            ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                HttpServletRequest request = attrs.getRequest();
                
                if (activity.getRequestUri() == null) {
                    activity.setRequestUri(request.getRequestURI());
                }
                
                if (activity.getHttpMethod() == null) {
                    activity.setHttpMethod(request.getMethod());
                }
                
                if (activity.getIpAddress() == null) {
                    activity.setIpAddress(getClientIpAddress(request));
                }
                
                if (activity.getUserAgent() == null) {
                    activity.setUserAgent(request.getHeader("User-Agent"));
                }
                
                if (activity.getSessionId() == null && request.getSession(false) != null) {
                    activity.setSessionId(request.getSession(false).getId());
                }
            }
        } catch (Exception e) {
            // HTTP 정보 추출 실패는 무시
        }
    }
    
    /**
     * 클라이언트 IP 주소 추출 (프록시 환경 고려)
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty() && !"unknown".equalsIgnoreCase(xRealIp)) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
    
    // === 조회 메소드들 ===
    
    /**
     * 사용자별 활동 로그 조회
     */
    public Page<UserActivity> getUserActivities(Long userId, Pageable pageable) {
        return userActivityRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }
    
    /**
     * 이메일별 활동 로그 조회
     */
    public Page<UserActivity> getUserActivitiesByEmail(String email, Pageable pageable) {
        return userActivityRepository.findByUserEmailOrderByCreatedAtDesc(email, pageable);
    }
    
    /**
     * 전체 활동 로그 조회 (관리자용) - 최신순
     */
    public Page<UserActivity> getAllActivities(Pageable pageable) {
        return userActivityRepository.findAllByOrderByCreatedAtDesc(pageable);
    }
    
    /**
     * 활동 유형별 조회
     */
    public Page<UserActivity> getActivitiesByType(UserActivity.ActivityType activityType, Pageable pageable) {
        return userActivityRepository.findByActivityTypeOrderByCreatedAtDesc(activityType, pageable);
    }
    
    /**
     * 날짜 범위별 활동 조회
     */
    public Page<UserActivity> getActivitiesByDateRange(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable) {
        return userActivityRepository.findByDateRange(startDate, endDate, pageable);
    }
    
    /**
     * 실패한 로그인 시도 조회 (보안 모니터링)
     */
    public List<UserActivity> getFailedLoginAttempts(int hours) {
        LocalDateTime since = LocalDateTime.now().minusHours(hours);
        return userActivityRepository.findFailedLoginAttemptsSince(since);
    }
    
    /**
     * 특정 IP의 활동 조회
     */
    public List<UserActivity> getActivitiesByIp(String ipAddress, int hours) {
        LocalDateTime since = LocalDateTime.now().minusHours(hours);
        return userActivityRepository.findByIpAddressAndCreatedAtAfterOrderByCreatedAtDesc(ipAddress, since);
    }
    
    /**
     * 일별 로그인 통계
     */
    public List<Object[]> getDailyLoginStats(int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        return userActivityRepository.getDailyLoginStats(since);
    }
    
    /**
     * 가장 활발한 사용자 조회
     */
    public List<Object[]> getMostActiveUsers(int days, Pageable pageable) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        return userActivityRepository.getMostActiveUsers(since, pageable);
    }
    
    // === CRUD 작업 로깅을 위한 공통 메서드들 ===
    
    /**
     * 폴더 생성 로깅
     */
    @Async
    public void logFolderCreate(User user, String folderName, String requestUri, String httpMethod) {
        logHttpActivity(user, UserActivity.ActivityType.FOLDER_CREATE,
            "폴더 생성: " + folderName, UserActivity.ActionResult.SUCCESS,
            requestUri, httpMethod);
    }
    
    /**
     * 폴더 수정 로깅
     */
    @Async
    public void logFolderUpdate(User user, String folderName, String requestUri, String httpMethod) {
        logHttpActivity(user, UserActivity.ActivityType.FOLDER_UPDATE,
            "폴더 수정: " + folderName, UserActivity.ActionResult.SUCCESS,
            requestUri, httpMethod);
    }
    
    /**
     * 폴더 삭제 로깅
     */
    @Async
    public void logFolderDelete(User user, String folderName, String requestUri, String httpMethod) {
        logHttpActivity(user, UserActivity.ActivityType.FOLDER_DELETE,
            "폴더 삭제: " + folderName, UserActivity.ActionResult.SUCCESS,
            requestUri, httpMethod);
    }
    
    /**
     * API 아이템 생성 로깅
     */
    @Async
    public void logItemCreate(User user, String itemName, String folderName, String requestUri, String httpMethod) {
        logHttpActivity(user, UserActivity.ActivityType.ITEM_CREATE,
            "API 아이템 생성: " + itemName + " (폴더: " + folderName + ")", UserActivity.ActionResult.SUCCESS,
            requestUri, httpMethod);
    }
    
    /**
     * API 아이템 수정 로깅
     */
    @Async
    public void logItemUpdate(User user, String itemName, String folderName, String requestUri, String httpMethod) {
        logHttpActivity(user, UserActivity.ActivityType.ITEM_UPDATE,
            "API 아이템 수정: " + itemName + " (폴더: " + folderName + ")", UserActivity.ActionResult.SUCCESS,
            requestUri, httpMethod);
    }
    
    /**
     * API 아이템 삭제 로깅
     */
    @Async
    public void logItemDelete(User user, String itemName, String folderName, String requestUri, String httpMethod) {
        logHttpActivity(user, UserActivity.ActivityType.ITEM_DELETE,
            "API 아이템 삭제: " + itemName + " (폴더: " + folderName + ")", UserActivity.ActionResult.SUCCESS,
            requestUri, httpMethod);
    }
    
    /**
     * 관리자 액션 로깅
     */
    @Async
    public void logAdminAction(User user, String actionDescription, String requestUri, String httpMethod) {
        logHttpActivity(user, UserActivity.ActivityType.ADMIN_ACTION,
            "관리자 액션: " + actionDescription, UserActivity.ActionResult.SUCCESS,
            requestUri, httpMethod);
    }
    
    /**
     * CRUD 작업 실패 로깅
     */
    @Async
    public void logCrudFailure(User user, UserActivity.ActivityType activityType, String actionDescription, 
                              String errorMessage, String requestUri, String httpMethod) {
        try {
            UserActivity activity = new UserActivity();
            activity.setUser(user);
            activity.setUserEmail(user != null ? user.getEmail() : null);
            activity.setActivityType(activityType);
            activity.setActionDescription(actionDescription);
            activity.setResult(UserActivity.ActionResult.FAILURE);
            activity.setErrorMessage(errorMessage);
            activity.setRequestUri(requestUri);
            activity.setHttpMethod(httpMethod);
            
            enrichWithHttpInfo(activity);
            
            userActivityRepository.save(activity);
        } catch (Exception e) {
            System.err.println("Failed to log CRUD failure: " + e.getMessage());
        }
    }
    
    /**
     * Excel 다운로드 로깅
     */
    @Async
    public void logExcelDownload(User user, String fileName, int recordCount, String requestUri, String httpMethod) {
        logHttpActivity(user, UserActivity.ActivityType.ADMIN_ACTION,
            "Excel 다운로드: " + fileName + " (" + recordCount + "개 레코드)", UserActivity.ActionResult.SUCCESS,
            requestUri, httpMethod);
    }
}