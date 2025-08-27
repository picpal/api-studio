package com.example.apitest.controller;

import com.example.apitest.entity.User;
import com.example.apitest.entity.UserActivity;
import com.example.apitest.service.ActivityLoggingService;
import com.example.apitest.service.AdminActivityService;
import com.example.apitest.service.AuthService;
import com.example.apitest.service.ExcelExportService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin/activities")
@CrossOrigin(origins = {"http://localhost:3001", "http://localhost:3002"}, allowCredentials = "true")
public class AdminActivityController {
    
    @Autowired
    private AdminActivityService adminActivityService;
    
    @Autowired
    private ExcelExportService excelExportService;
    
    @Autowired
    private ActivityLoggingService activityLoggingService;
    
    @Autowired
    private AuthService authService;
    
    /**
     * 관리자 권한 확인
     */
    private boolean isAdmin(HttpSession session) {
        String userEmail = (String) session.getAttribute("userEmail");
        if (userEmail != null) {
            Optional<User> userOpt = authService.findByEmail(userEmail);
            return userOpt.isPresent() && userOpt.get().getRole() == User.Role.ADMIN;
        }
        return false;
    }
    
    /**
     * 현재 로그인한 사용자 정보 가져오기
     */
    private User getCurrentUser(HttpSession session) {
        String userEmail = (String) session.getAttribute("userEmail");
        if (userEmail != null) {
            Optional<User> userOpt = authService.findByEmail(userEmail);
            return userOpt.orElse(null);
        }
        return null;
    }
    
    /**
     * 사용자 활동 로그 검색 (관리자용)
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> searchActivities(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false) String activityType,
            @RequestParam(required = false) String userEmail,
            HttpSession session) {
        
        if (!isAdmin(session)) {
            return ResponseEntity.status(403).body(Map.of("error", "관리자 권한이 필요합니다."));
        }
        
        try {
            Map<String, Object> response = adminActivityService.searchActivities(
                page, size, startDate, endDate, searchTerm, activityType, userEmail);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * 특정 사용자의 활동 로그 조회
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<Map<String, Object>> getUserActivities(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpSession session) {
        
        if (!isAdmin(session)) {
            return ResponseEntity.status(403).body(Map.of("error", "관리자 권한이 필요합니다."));
        }
        
        Map<String, Object> response = adminActivityService.getUserActivities(userId, page, size);
        return ResponseEntity.ok(response);
    }
    
    /**
     * 이메일로 사용자 활동 로그 조회
     */
    @GetMapping("/email/{email}")
    public ResponseEntity<Map<String, Object>> getUserActivitiesByEmail(
            @PathVariable String email,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpSession session) {
        
        if (!isAdmin(session)) {
            return ResponseEntity.status(403).body(Map.of("error", "관리자 권한이 필요합니다."));
        }
        
        Map<String, Object> response = adminActivityService.getUserActivitiesByEmail(email, page, size);
        return ResponseEntity.ok(response);
    }
    
    /**
     * 활동 유형별 조회
     */
    @GetMapping("/type/{activityType}")
    public ResponseEntity<Map<String, Object>> getActivitiesByType(
            @PathVariable String activityType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpSession session) {
        
        if (!isAdmin(session)) {
            return ResponseEntity.status(403).body(Map.of("error", "관리자 권한이 필요합니다."));
        }
        
        try {
            Map<String, Object> response = adminActivityService.getActivitiesByType(activityType, page, size);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "잘못된 활동 유형입니다."));
        }
    }
    
    /**
     * 날짜 범위별 활동 조회
     */
    @GetMapping("/daterange")
    public ResponseEntity<Map<String, Object>> getActivitiesByDateRange(
            @RequestParam String startDate,
            @RequestParam String endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpSession session) {
        
        if (!isAdmin(session)) {
            return ResponseEntity.status(403).body(Map.of("error", "관리자 권한이 필요합니다."));
        }
        
        try {
            Map<String, Object> response = adminActivityService.getActivitiesByDateRange(startDate, endDate, page, size);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "잘못된 날짜 형식입니다. (yyyy-MM-dd)"));
        }
    }
    
    /**
     * 실패한 로그인 시도 조회 (보안 모니터링)
     */
    @GetMapping("/failed-logins")
    public ResponseEntity<Map<String, Object>> getFailedLoginAttempts(
            @RequestParam(defaultValue = "24") int hours,
            HttpSession session) {
        
        if (!isAdmin(session)) {
            return ResponseEntity.status(403).body(Map.of("error", "관리자 권한이 필요합니다."));
        }
        
        Map<String, Object> response = adminActivityService.getFailedLoginAttempts(hours);
        return ResponseEntity.ok(response);
    }
    
    /**
     * IP별 활동 조회 (의심스러운 활동 모니터링)
     */
    @GetMapping("/ip/{ipAddress}")
    public ResponseEntity<Map<String, Object>> getActivitiesByIp(
            @PathVariable String ipAddress,
            @RequestParam(defaultValue = "24") int hours,
            HttpSession session) {
        
        if (!isAdmin(session)) {
            return ResponseEntity.status(403).body(Map.of("error", "관리자 권한이 필요합니다."));
        }
        
        Map<String, Object> response = adminActivityService.getActivitiesByIp(ipAddress, hours);
        return ResponseEntity.ok(response);
    }
    
    /**
     * 일별 로그인 통계
     */
    @GetMapping("/stats/daily-logins")
    public ResponseEntity<Map<String, Object>> getDailyLoginStats(
            @RequestParam(defaultValue = "30") int days,
            HttpSession session) {
        
        if (!isAdmin(session)) {
            return ResponseEntity.status(403).body(Map.of("error", "관리자 권한이 필요합니다."));
        }
        
        Map<String, Object> response = adminActivityService.getDailyLoginStats(days);
        return ResponseEntity.ok(response);
    }
    
    /**
     * 가장 활발한 사용자 조회
     */
    @GetMapping("/stats/active-users")
    public ResponseEntity<Map<String, Object>> getMostActiveUsers(
            @RequestParam(defaultValue = "7") int days,
            @RequestParam(defaultValue = "10") int limit,
            HttpSession session) {
        
        if (!isAdmin(session)) {
            return ResponseEntity.status(403).body(Map.of("error", "관리자 권한이 필요합니다."));
        }
        
        Map<String, Object> response = adminActivityService.getMostActiveUsers(days, limit);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Excel 다운로드
     */
    @GetMapping("/export")
    public void exportToExcel(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false) String activityType,
            @RequestParam(required = false) String userEmail,
            HttpSession session,
            HttpServletRequest request,
            HttpServletResponse response) throws IOException {
        
        if (!isAdmin(session)) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.getWriter().write("{\"error\":\"관리자 권한이 필요합니다.\"}");
            return;
        }
        
        try {
            // 데이터 조회
            List<UserActivity> activityList = adminActivityService.getActivitiesForExport(
                startDate, endDate, searchTerm, activityType, userEmail);
            
            // Excel 파일명 생성
            String filename = excelExportService.generateFileName("user_activities");
            
            // HTTP 응답 설정
            response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            response.setHeader("Content-Disposition", "attachment; filename=" + filename);
            
            // Excel 파일 생성 및 출력
            excelExportService.exportUserActivitiesToExcel(activityList, response.getOutputStream());
            
            // Excel 다운로드 활동 로깅
            User currentUser = getCurrentUser(session);
            if (currentUser != null) {
                activityLoggingService.logExcelDownload(currentUser, filename, activityList.size(),
                    request.getRequestURI(), request.getMethod());
            }
            
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("{\"error\":\"Excel 파일 생성 중 오류가 발생했습니다.\"}");
        }
    }
}