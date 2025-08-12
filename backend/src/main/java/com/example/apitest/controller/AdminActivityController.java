package com.example.apitest.controller;

import com.example.apitest.entity.User;
import com.example.apitest.entity.UserActivity;
import com.example.apitest.service.ActivityLoggingService;
import com.example.apitest.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/activities")
@CrossOrigin(origins = {"http://localhost:3001", "http://localhost:3002"}, allowCredentials = "true")
public class AdminActivityController {
    
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
                
                return ResponseEntity.ok(response);
            }
            
        } catch (DateTimeParseException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "잘못된 날짜 형식입니다. (yyyy-MM-dd)"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "잘못된 활동 유형입니다."));
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("activities", activities.getContent().stream()
            .map(this::convertToMap)
            .collect(Collectors.toList()));
        response.put("totalPages", activities.getTotalPages());
        response.put("totalElements", activities.getTotalElements());
        response.put("currentPage", page);
        response.put("pageSize", size);
        
        return ResponseEntity.ok(response);
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
        
        List<UserActivity> failedLogins = activityLoggingService.getFailedLoginAttempts(hours);
        
        Map<String, Object> response = new HashMap<>();
        response.put("failedLogins", failedLogins.stream()
            .map(this::convertToMap)
            .collect(Collectors.toList()));
        response.put("count", failedLogins.size());
        response.put("period", hours + "시간");
        
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
        
        List<UserActivity> activities = activityLoggingService.getActivitiesByIp(ipAddress, hours);
        
        Map<String, Object> response = new HashMap<>();
        response.put("activities", activities.stream()
            .map(this::convertToMap)
            .collect(Collectors.toList()));
        response.put("count", activities.size());
        response.put("ipAddress", ipAddress);
        response.put("period", hours + "시간");
        
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
        
        List<Object[]> stats = activityLoggingService.getDailyLoginStats(days);
        
        Map<String, Object> response = new HashMap<>();
        response.put("stats", stats.stream()
            .map(row -> Map.of("date", row[0], "count", row[1]))
            .collect(Collectors.toList()));
        response.put("period", days + "일");
        
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
        
        Pageable pageable = PageRequest.of(0, limit);
        List<Object[]> activeUsers = activityLoggingService.getMostActiveUsers(days, pageable);
        
        Map<String, Object> response = new HashMap<>();
        response.put("activeUsers", activeUsers.stream()
            .map(row -> Map.of("email", row[0], "activityCount", row[1]))
            .collect(Collectors.toList()));
        response.put("period", days + "일");
        
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
            // 모든 데이터를 가져오기 (페이징 없이)
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
            
            // Excel 파일 생성
            Workbook workbook = new XSSFWorkbook();
            Sheet sheet = workbook.createSheet("사용자 활동 로그");
            
            // 헤더 스타일
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.LIGHT_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            
            // 헤더 생성
            Row headerRow = sheet.createRow(0);
            String[] headers = {"ID", "사용자 이메일", "활동 유형", "액션 설명", "요청 URI", 
                              "HTTP 메서드", "IP 주소", "결과", "오류 메시지", "생성 시간"};
            
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
                sheet.autoSizeColumn(i);
            }
            
            // 데이터 행 생성
            int rowNum = 1;
            for (UserActivity activity : activityList) {
                Row row = sheet.createRow(rowNum++);
                
                row.createCell(0).setCellValue(activity.getId());
                row.createCell(1).setCellValue(activity.getUserEmail());
                row.createCell(2).setCellValue(activity.getActivityType().toString());
                row.createCell(3).setCellValue(activity.getActionDescription());
                row.createCell(4).setCellValue(activity.getRequestUri());
                row.createCell(5).setCellValue(activity.getHttpMethod());
                row.createCell(6).setCellValue(activity.getIpAddress());
                row.createCell(7).setCellValue(activity.getResult().toString());
                row.createCell(8).setCellValue(activity.getErrorMessage());
                row.createCell(9).setCellValue(activity.getCreatedAt().toString());
            }
            
            // 열 너비 자동 조정
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }
            
            // HTTP 응답 설정
            String filename = "user_activities_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".xlsx";
            response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            response.setHeader("Content-Disposition", "attachment; filename=" + filename);
            
            // Excel 파일 출력
            workbook.write(response.getOutputStream());
            workbook.close();
            
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