package com.example.apitest.service;

import com.example.apitest.entity.User;
import com.example.apitest.entity.UserActivity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AdminActivityService {
    
    @Autowired
    private ActivityLoggingService activityLoggingService;

    public Map<String, Object> searchActivities(int page, int size, String startDate, String endDate, 
                                               String searchTerm, String activityType, String userEmail) {
        Pageable pageable = PageRequest.of(page, size);
        Page<UserActivity> activities;
        
        try {
            // 검색 조건에 따라 다른 메서드 호출
            if (startDate != null && endDate != null) {
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
                LocalDateTime start = LocalDateTime.parse(startDate + "T00:00:00");
                LocalDateTime end = LocalDateTime.parse(endDate + "T23:59:59");
                activities = activityLoggingService.getActivitiesByDateRange(start, end, pageable);
            } else if (userEmail != null && !userEmail.trim().isEmpty()) {
                activities = activityLoggingService.getUserActivitiesByEmail(userEmail.trim(), pageable);
            } else if (activityType != null && !activityType.trim().isEmpty()) {
                UserActivity.ActivityType type = UserActivity.ActivityType.valueOf(activityType.toUpperCase());
                activities = activityLoggingService.getActivitiesByType(type, pageable);
            } else {
                activities = activityLoggingService.getAllActivities(pageable);
            }
            
            // 검색어가 있으면 필터링 (메모리에서)
            if (searchTerm != null && !searchTerm.trim().isEmpty()) {
                List<UserActivity> filteredList = activities.getContent().stream()
                    .filter(activity -> matchesSearchTerm(activity, searchTerm.trim()))
                    .collect(Collectors.toList());
                
                Map<String, Object> response = new HashMap<>();
                response.put("activities", filteredList.stream()
                    .map(this::convertToMap)
                    .collect(Collectors.toList()));
                response.put("totalPages", 1);
                response.put("totalElements", filteredList.size());
                response.put("currentPage", 0);
                response.put("pageSize", filteredList.size());
                
                return response;
            }
            
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("잘못된 날짜 형식입니다. (yyyy-MM-dd)");
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("잘못된 활동 유형입니다.");
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("activities", activities.getContent().stream()
            .map(this::convertToMap)
            .collect(Collectors.toList()));
        response.put("totalPages", activities.getTotalPages());
        response.put("totalElements", activities.getTotalElements());
        response.put("currentPage", page);
        response.put("pageSize", size);
        
        return response;
    }

    public List<UserActivity> getActivitiesForExport(String startDate, String endDate, String searchTerm, 
                                                   String activityType, String userEmail) {
        Pageable pageable = PageRequest.of(0, 10000); // 최대 10,000개
        Page<UserActivity> activities;
        
        // 검색 조건에 따라 데이터 조회
        if (startDate != null && endDate != null) {
            LocalDateTime start = LocalDateTime.parse(startDate + "T00:00:00");
            LocalDateTime end = LocalDateTime.parse(endDate + "T23:59:59");
            activities = activityLoggingService.getActivitiesByDateRange(start, end, pageable);
        } else if (userEmail != null && !userEmail.trim().isEmpty()) {
            activities = activityLoggingService.getUserActivitiesByEmail(userEmail.trim(), pageable);
        } else if (activityType != null && !activityType.trim().isEmpty()) {
            UserActivity.ActivityType type = UserActivity.ActivityType.valueOf(activityType.toUpperCase());
            activities = activityLoggingService.getActivitiesByType(type, pageable);
        } else {
            activities = activityLoggingService.getAllActivities(pageable);
        }
        
        List<UserActivity> activityList = activities.getContent();
        
        // 검색어가 있으면 필터링
        if (searchTerm != null && !searchTerm.trim().isEmpty()) {
            activityList = activityList.stream()
                .filter(activity -> matchesSearchTerm(activity, searchTerm.trim()))
                .collect(Collectors.toList());
        }
        
        return activityList;
    }

    public Map<String, Object> getUserActivities(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<UserActivity> activities = activityLoggingService.getUserActivities(userId, pageable);
        
        Map<String, Object> response = new HashMap<>();
        response.put("activities", activities.getContent().stream()
            .map(this::convertToMap)
            .collect(Collectors.toList()));
        response.put("totalPages", activities.getTotalPages());
        response.put("totalElements", activities.getTotalElements());
        response.put("currentPage", page);
        response.put("pageSize", size);
        
        return response;
    }

    public Map<String, Object> getUserActivitiesByEmail(String email, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<UserActivity> activities = activityLoggingService.getUserActivitiesByEmail(email, pageable);
        
        Map<String, Object> response = new HashMap<>();
        response.put("activities", activities.getContent().stream()
            .map(this::convertToMap)
            .collect(Collectors.toList()));
        response.put("totalPages", activities.getTotalPages());
        response.put("totalElements", activities.getTotalElements());
        response.put("currentPage", page);
        response.put("pageSize", size);
        
        return response;
    }

    public Map<String, Object> getActivitiesByType(String activityType, int page, int size) {
        UserActivity.ActivityType type = UserActivity.ActivityType.valueOf(activityType.toUpperCase());
        Pageable pageable = PageRequest.of(page, size);
        Page<UserActivity> activities = activityLoggingService.getActivitiesByType(type, pageable);
        
        Map<String, Object> response = new HashMap<>();
        response.put("activities", activities.getContent().stream()
            .map(this::convertToMap)
            .collect(Collectors.toList()));
        response.put("totalPages", activities.getTotalPages());
        response.put("totalElements", activities.getTotalElements());
        response.put("currentPage", page);
        response.put("pageSize", size);
        
        return response;
    }

    public Map<String, Object> getActivitiesByDateRange(String startDate, String endDate, int page, int size) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        LocalDateTime start = LocalDateTime.parse(startDate + " 00:00:00", formatter);
        LocalDateTime end = LocalDateTime.parse(endDate + " 23:59:59", formatter);
        
        Pageable pageable = PageRequest.of(page, size);
        Page<UserActivity> activities = activityLoggingService.getActivitiesByDateRange(start, end, pageable);
        
        Map<String, Object> response = new HashMap<>();
        response.put("activities", activities.getContent().stream()
            .map(this::convertToMap)
            .collect(Collectors.toList()));
        response.put("totalPages", activities.getTotalPages());
        response.put("totalElements", activities.getTotalElements());
        response.put("currentPage", page);
        response.put("pageSize", size);
        
        return response;
    }

    public Map<String, Object> getFailedLoginAttempts(int hours) {
        List<UserActivity> failedLogins = activityLoggingService.getFailedLoginAttempts(hours);
        
        Map<String, Object> response = new HashMap<>();
        response.put("failedLogins", failedLogins.stream()
            .map(this::convertToMap)
            .collect(Collectors.toList()));
        response.put("count", failedLogins.size());
        response.put("period", hours + "시간");
        
        return response;
    }

    public Map<String, Object> getActivitiesByIp(String ipAddress, int hours) {
        List<UserActivity> activities = activityLoggingService.getActivitiesByIp(ipAddress, hours);
        
        Map<String, Object> response = new HashMap<>();
        response.put("activities", activities.stream()
            .map(this::convertToMap)
            .collect(Collectors.toList()));
        response.put("count", activities.size());
        response.put("ipAddress", ipAddress);
        response.put("period", hours + "시간");
        
        return response;
    }

    public Map<String, Object> getDailyLoginStats(int days) {
        List<Object[]> stats = activityLoggingService.getDailyLoginStats(days);
        
        Map<String, Object> response = new HashMap<>();
        response.put("stats", stats.stream()
            .map(row -> Map.of("date", row[0], "count", row[1]))
            .collect(Collectors.toList()));
        response.put("period", days + "일");
        
        return response;
    }

    public Map<String, Object> getMostActiveUsers(int days, int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        List<Object[]> activeUsers = activityLoggingService.getMostActiveUsers(days, pageable);
        
        Map<String, Object> response = new HashMap<>();
        response.put("activeUsers", activeUsers.stream()
            .map(row -> Map.of("email", row[0], "activityCount", row[1]))
            .collect(Collectors.toList()));
        response.put("period", days + "일");
        
        return response;
    }

    /**
     * 검색어 매칭 검사
     */
    private boolean matchesSearchTerm(UserActivity activity, String searchTerm) {
        String term = searchTerm.toLowerCase();
        
        return (activity.getUserEmail() != null && activity.getUserEmail().toLowerCase().contains(term)) ||
               (activity.getActionDescription() != null && activity.getActionDescription().toLowerCase().contains(term)) ||
               (activity.getRequestUri() != null && activity.getRequestUri().toLowerCase().contains(term)) ||
               (activity.getIpAddress() != null && activity.getIpAddress().toLowerCase().contains(term)) ||
               (activity.getErrorMessage() != null && activity.getErrorMessage().toLowerCase().contains(term)) ||
               activity.getActivityType().toString().toLowerCase().contains(term) ||
               activity.getResult().toString().toLowerCase().contains(term);
    }
    
    /**
     * UserActivity를 Map으로 변환 (JSON 응답용)
     */
    private Map<String, Object> convertToMap(UserActivity activity) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", activity.getId());
        map.put("userEmail", activity.getUserEmail());
        map.put("activityType", activity.getActivityType().toString());
        map.put("actionDescription", activity.getActionDescription());
        map.put("requestUri", activity.getRequestUri());
        map.put("httpMethod", activity.getHttpMethod());
        map.put("ipAddress", activity.getIpAddress());
        map.put("userAgent", activity.getUserAgent());
        map.put("result", activity.getResult().toString());
        map.put("errorMessage", activity.getErrorMessage());
        map.put("createdAt", activity.getCreatedAt().toString());
        map.put("sessionId", activity.getSessionId());
        
        return map;
    }
}