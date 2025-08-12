package com.example.apitest.controller;

import com.example.apitest.entity.User;
import com.example.apitest.entity.UserActivity;
import com.example.apitest.service.ActivityLoggingService;
import com.example.apitest.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:3001", "http://localhost:3002"}, allowCredentials = "true")
public class AuthController {

    @Autowired
    private AuthService authService;
    
    @Autowired
    private ActivityLoggingService activityLoggingService;

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody Map<String, String> request, HttpServletRequest httpRequest) {
        try {
            String email = request.get("email");
            String password = request.get("password");

            if (email == null || password == null || email.trim().isEmpty() || password.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "이메일과 비밀번호를 입력해주세요."));
            }

            User user = authService.register(email, password);
            
            // 회원가입 성공 로깅
            activityLoggingService.logHttpActivity(user, UserActivity.ActivityType.API_CALL,
                "회원가입 완료: " + email, UserActivity.ActionResult.SUCCESS,
                httpRequest.getRequestURI(), httpRequest.getMethod());
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "회원가입이 완료되었습니다.");
            response.put("user", Map.of("id", user.getId(), "email", user.getEmail()));
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            // 회원가입 실패 로깅
            String email = request.get("email");
            activityLoggingService.logHttpActivity(null, UserActivity.ActivityType.API_CALL,
                "회원가입 실패: " + email, UserActivity.ActionResult.FAILURE,
                httpRequest.getRequestURI(), httpRequest.getMethod());
            
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> request, HttpSession session, HttpServletRequest httpRequest) {
        try {
            String email = request.get("email");
            String password = request.get("password");

            if (email == null || password == null || email.trim().isEmpty() || password.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "이메일과 비밀번호를 입력해주세요."));
            }

            Optional<User> userOpt = authService.login(email, password);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                session.setAttribute("userId", user.getId());
                session.setAttribute("userEmail", user.getEmail());
                
                // 로그인 성공 로깅
                activityLoggingService.logHttpActivity(user, UserActivity.ActivityType.LOGIN,
                    "로그인 성공: " + email, UserActivity.ActionResult.SUCCESS,
                    httpRequest.getRequestURI(), httpRequest.getMethod());
                
                Map<String, Object> response = new HashMap<>();
                response.put("message", "로그인 성공");
                response.put("user", Map.of(
                    "id", user.getId(), 
                    "email", user.getEmail(),
                    "role", user.getRole().toString()
                ));
                
                return ResponseEntity.ok(response);
            } else {
                // 로그인 실패 로깅 (사용자가 존재하지 않는 경우)
                activityLoggingService.logFailedLogin(email, "이메일 또는 비밀번호가 올바르지 않습니다.",
                    getClientIpAddress(httpRequest));
                
                return ResponseEntity.badRequest().body(Map.of("error", "이메일 또는 비밀번호가 올바르지 않습니다."));
            }
        } catch (RuntimeException e) {
            // AuthService에서 던진 구체적인 메시지 전달 (비밀번호 만료, 계정 미승인 등)
            String email = request.get("email");
            activityLoggingService.logFailedLogin(email, e.getMessage(),
                getClientIpAddress(httpRequest));
            
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            String email = request.get("email");
            activityLoggingService.logFailedLogin(email, "로그인 중 예상치 못한 오류가 발생했습니다.",
                getClientIpAddress(httpRequest));
            
            return ResponseEntity.badRequest().body(Map.of("error", "로그인 중 예상치 못한 오류가 발생했습니다."));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(HttpSession session, HttpServletRequest httpRequest) {
        // 로그아웃 전 사용자 정보 저장
        Long userId = (Long) session.getAttribute("userId");
        String userEmail = (String) session.getAttribute("userEmail");
        
        if (userId != null && userEmail != null) {
            Optional<User> userOpt = authService.findByEmail(userEmail);
            if (userOpt.isPresent()) {
                // 로그아웃 로깅
                activityLoggingService.logHttpActivity(userOpt.get(), UserActivity.ActivityType.LOGOUT,
                    "로그아웃: " + userEmail, UserActivity.ActionResult.SUCCESS,
                    httpRequest.getRequestURI(), httpRequest.getMethod());
            }
        }
        
        session.invalidate();
        return ResponseEntity.ok(Map.of("message", "로그아웃되었습니다."));
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        String userEmail = (String) session.getAttribute("userEmail");
        
        if (userId != null && userEmail != null) {
            Optional<User> userOpt = authService.findByEmail(userEmail);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                Map<String, Object> response = new HashMap<>();
                response.put("user", Map.of(
                    "id", user.getId(), 
                    "email", user.getEmail(),
                    "role", user.getRole().toString()
                ));
                return ResponseEntity.ok(response);
            }
        }
        return ResponseEntity.status(401).body(Map.of("error", "인증되지 않은 사용자입니다."));
    }
    
    @PostMapping("/change-password")
    public ResponseEntity<Map<String, Object>> changePassword(@RequestBody Map<String, String> request, HttpSession session, HttpServletRequest httpRequest) {
        try {
            String userEmail = (String) session.getAttribute("userEmail");
            if (userEmail == null) {
                return ResponseEntity.status(401).body(Map.of("error", "인증되지 않은 사용자입니다."));
            }
            
            String oldPassword = request.get("oldPassword");
            String newPassword = request.get("newPassword");
            
            if (oldPassword == null || newPassword == null || 
                oldPassword.trim().isEmpty() || newPassword.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "현재 비밀번호와 새 비밀번호를 모두 입력해주세요."));
            }
            
            authService.changePassword(userEmail, oldPassword, newPassword);
            
            // 비밀번호 변경 성공 로깅
            Optional<User> userOpt = authService.findByEmail(userEmail);
            if (userOpt.isPresent()) {
                activityLoggingService.logHttpActivity(userOpt.get(), UserActivity.ActivityType.PASSWORD_CHANGE,
                    "비밀번호 변경 성공: " + userEmail, UserActivity.ActionResult.SUCCESS,
                    httpRequest.getRequestURI(), httpRequest.getMethod());
            }
            
            return ResponseEntity.ok(Map.of("message", "비밀번호가 성공적으로 변경되었습니다."));
            
        } catch (RuntimeException e) {
            // 비밀번호 변경 실패 로깅
            String userEmail = (String) session.getAttribute("userEmail");
            if (userEmail != null) {
                Optional<User> userOpt = authService.findByEmail(userEmail);
                if (userOpt.isPresent()) {
                    activityLoggingService.logActivityWithError(userOpt.get(), UserActivity.ActivityType.PASSWORD_CHANGE,
                        "비밀번호 변경 실패: " + userEmail, e.getMessage());
                }
            }
            
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            String userEmail = (String) session.getAttribute("userEmail");
            if (userEmail != null) {
                Optional<User> userOpt = authService.findByEmail(userEmail);
                if (userOpt.isPresent()) {
                    activityLoggingService.logActivityWithError(userOpt.get(), UserActivity.ActivityType.PASSWORD_CHANGE,
                        "비밀번호 변경 오류: " + userEmail, "예상치 못한 오류");
                }
            }
            
            return ResponseEntity.badRequest().body(Map.of("error", "비밀번호 변경 중 예상치 못한 오류가 발생했습니다."));
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
    
    @PostMapping("/validate-password")
    public ResponseEntity<Map<String, Object>> validatePassword(@RequestBody Map<String, String> request, HttpSession session) {
        try {
            String password = request.get("password");
            String userEmail = (String) session.getAttribute("userEmail");
            
            if (password == null || password.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "비밀번호를 입력해주세요."));
            }
            
            // 비밀번호 검증 서비스 직접 사용
            com.example.apitest.service.PasswordValidationService passwordValidationService = 
                new com.example.apitest.service.PasswordValidationService();
            
            com.example.apitest.service.PasswordValidationService.ValidationResult result = 
                passwordValidationService.validatePassword(password, userEmail);
            
            Map<String, Object> response = new HashMap<>();
            response.put("valid", result.isValid());
            response.put("errors", result.getErrors());
            
            if (result.isValid()) {
                com.example.apitest.service.PasswordValidationService.PasswordStrength strength = 
                    passwordValidationService.evaluatePasswordStrength(password);
                response.put("strength", strength.toString());
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "비밀번호 검증 중 오류가 발생했습니다."));
        }
    }
}