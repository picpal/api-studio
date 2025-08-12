package com.example.apitest.service;

import com.example.apitest.entity.User;
import com.example.apitest.entity.UserActivity;
import com.example.apitest.repository.UserActivityRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ActivityLoggingServiceTest {

    @Mock
    private UserActivityRepository userActivityRepository;

    @InjectMocks
    private ActivityLoggingService activityLoggingService;

    private HttpServletRequest mockRequest;
    private HttpSession mockSession;

    @BeforeEach
    void setUp() {
        mockRequest = mock(HttpServletRequest.class);
        mockSession = mock(HttpSession.class);

        when(mockRequest.getRequestURI()).thenReturn("/test-uri");
        when(mockRequest.getMethod()).thenReturn("GET");
        when(mockRequest.getHeader("X-Forwarded-For")).thenReturn(null);
        when(mockRequest.getHeader("X-Real-IP")).thenReturn(null);
        when(mockRequest.getRemoteAddr()).thenReturn("127.0.0.1");
        when(mockRequest.getHeader("User-Agent")).thenReturn("Test-Agent");
        when(mockRequest.getSession(false)).thenReturn(mockSession);
        when(mockSession.getId()).thenReturn("test-session-id");

        ServletRequestAttributes attrs = new ServletRequestAttributes(mockRequest);
        RequestContextHolder.setRequestAttributes(attrs);
    }

    @AfterEach
    void tearDown() {
        RequestContextHolder.resetRequestAttributes();
    }

    private User createUser() {
        User user = new User();
        user.setId(1L);
        user.setEmail("test@example.com");
        return user;
    }

    private UserActivity createUserActivity() {
        UserActivity activity = new UserActivity();
        activity.setId(1L);
        activity.setUser(createUser());
        activity.setUserEmail("test@example.com");
        activity.setActivityType(UserActivity.ActivityType.LOGIN);
        activity.setActionDescription("로그인 성공");
        activity.setResult(UserActivity.ActionResult.SUCCESS);
        activity.setCreatedAt(LocalDateTime.now());
        activity.setRequestUri("/api/auth/login");
        activity.setHttpMethod("POST");
        activity.setIpAddress("127.0.0.1");
        activity.setUserAgent("Test-Agent");
        activity.setSessionId("test-session-id");
        return activity;
    }

    // --- logActivity tests ---
    @Test
    @DisplayName("logActivity 성공 - 사용자 포함")
    void logActivity_success_withUser() {
        User user = createUser();
        activityLoggingService.logActivity(user, UserActivity.ActivityType.LOGIN, "로그인 성공", UserActivity.ActionResult.SUCCESS);
        verify(userActivityRepository, times(1)).save(any(UserActivity.class));
    }

    @Test
    @DisplayName("logActivity 성공 - 사용자 없음")
    void logActivity_success_noUser() {
        activityLoggingService.logActivity(null, UserActivity.ActivityType.LOGIN, "로그인 실패", UserActivity.ActionResult.FAILURE);
        verify(userActivityRepository, times(1)).save(any(UserActivity.class));
    }

    // --- logFailedLogin tests ---
    @Test
    @DisplayName("logFailedLogin 성공")
    void logFailedLogin_success() {
        activityLoggingService.logFailedLogin("fail@example.com", "비밀번호 오류", "192.168.1.1");
        verify(userActivityRepository, times(1)).save(any(UserActivity.class));
    }

    // --- logHttpActivity tests ---
    @Test
    @DisplayName("logHttpActivity 성공")
    void logHttpActivity_success() {
        User user = createUser();
        activityLoggingService.logHttpActivity(user, UserActivity.ActivityType.API_CALL, "API 호출", UserActivity.ActionResult.SUCCESS, "/api/data", "GET");
        verify(userActivityRepository, times(1)).save(any(UserActivity.class));
    }

    // --- logActivityWithError tests ---
    @Test
    @DisplayName("logActivityWithError 성공")
    void logActivityWithError_success() {
        User user = createUser();
        activityLoggingService.logActivityWithError(user, UserActivity.ActivityType.ITEM_CREATE, "아이템 생성 실패", "데이터베이스 오류");
        verify(userActivityRepository, times(1)).save(any(UserActivity.class));
    }

    // --- Delegation Methods tests ---
    @Test
    @DisplayName("logFolderCreate 성공")
    void logFolderCreate_success() {
        User user = createUser();
        activityLoggingService.logFolderCreate(user, "새 폴더", "/api/folders", "POST");
        verify(userActivityRepository, times(1)).save(any(UserActivity.class));
    }

    @Test
    @DisplayName("logItemCreate 성공")
    void logItemCreate_success() {
        User user = createUser();
        activityLoggingService.logItemCreate(user, "새 아이템", "폴더1", "/api/items", "POST");
        verify(userActivityRepository, times(1)).save(any(UserActivity.class));
    }

    @Test
    @DisplayName("logAdminAction 성공")
    void logAdminAction_success() {
        User user = createUser();
        activityLoggingService.logAdminAction(user, "사용자 승인", "/api/admin/users/1/status", "PUT");
        verify(userActivityRepository, times(1)).save(any(UserActivity.class));
    }

    // --- logCrudFailure tests ---
    @Test
    @DisplayName("logCrudFailure 성공")
    void logCrudFailure_success() {
        User user = createUser();
        activityLoggingService.logCrudFailure(user, UserActivity.ActivityType.FOLDER_CREATE, "폴더 생성 실패", "권한 없음", "/api/folders", "POST");
        verify(userActivityRepository, times(1)).save(any(UserActivity.class));
    }

    // --- Query Methods tests ---
    @Test
    @DisplayName("getUserActivities 성공")
    void getUserActivities_success() {
        Long userId = 1L;
        Pageable pageable = PageRequest.of(0, 10);
        Page<UserActivity> mockPage = new PageImpl<>(Collections.singletonList(createUserActivity()));

        when(userActivityRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)).thenReturn(mockPage);

        Page<UserActivity> result = activityLoggingService.getUserActivities(userId, pageable);

        assertNotNull(result);
        assertEquals(mockPage, result);
        verify(userActivityRepository, times(1)).findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    @Test
    @DisplayName("getUserActivitiesByEmail 성공")
    void getUserActivitiesByEmail_success() {
        String email = "test@example.com";
        Pageable pageable = PageRequest.of(0, 10);
        Page<UserActivity> mockPage = new PageImpl<>(Collections.singletonList(createUserActivity()));

        when(userActivityRepository.findByUserEmailOrderByCreatedAtDesc(email, pageable)).thenReturn(mockPage);

        Page<UserActivity> result = activityLoggingService.getUserActivitiesByEmail(email, pageable);

        assertNotNull(result);
        assertEquals(mockPage, result);
        verify(userActivityRepository, times(1)).findByUserEmailOrderByCreatedAtDesc(email, pageable);
    }

    @Test
    @DisplayName("getAllActivities 성공")
    void getAllActivities_success() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<UserActivity> mockPage = new PageImpl<>(Collections.singletonList(createUserActivity()));

        when(userActivityRepository.findAllByOrderByCreatedAtDesc(pageable)).thenReturn(mockPage);

        Page<UserActivity> result = activityLoggingService.getAllActivities(pageable);

        assertNotNull(result);
        assertEquals(mockPage, result);
        verify(userActivityRepository, times(1)).findAllByOrderByCreatedAtDesc(pageable);
    }

    @Test
    @DisplayName("getActivitiesByType 성공")
    void getActivitiesByType_success() {
        UserActivity.ActivityType type = UserActivity.ActivityType.LOGIN;
        Pageable pageable = PageRequest.of(0, 10);
        Page<UserActivity> mockPage = new PageImpl<>(Collections.singletonList(createUserActivity()));

        when(userActivityRepository.findByActivityTypeOrderByCreatedAtDesc(type, pageable)).thenReturn(mockPage);

        Page<UserActivity> result = activityLoggingService.getActivitiesByType(type, pageable);

        assertNotNull(result);
        assertEquals(mockPage, result);
        verify(userActivityRepository, times(1)).findByActivityTypeOrderByCreatedAtDesc(type, pageable);
    }

    @Test
    @DisplayName("getActivitiesByDateRange 성공")
    void getActivitiesByDateRange_success() {
        LocalDateTime start = LocalDateTime.now().minusDays(7);
        LocalDateTime end = LocalDateTime.now();
        Pageable pageable = PageRequest.of(0, 10);
        Page<UserActivity> mockPage = new PageImpl<>(Collections.singletonList(createUserActivity()));

        when(userActivityRepository.findByDateRange(start, end, pageable)).thenReturn(mockPage);

        Page<UserActivity> result = activityLoggingService.getActivitiesByDateRange(start, end, pageable);

        assertNotNull(result);
        assertEquals(mockPage, result);
        verify(userActivityRepository, times(1)).findByDateRange(start, end, pageable);
    }

    @Test
    @DisplayName("getFailedLoginAttempts 성공")
    void getFailedLoginAttempts_success() {
        int hours = 24;
        List<UserActivity> mockList = Collections.singletonList(createUserActivity());

        when(userActivityRepository.findFailedLoginAttemptsSince(any(LocalDateTime.class))).thenReturn(mockList);

        List<UserActivity> result = activityLoggingService.getFailedLoginAttempts(hours);

        assertNotNull(result);
        assertEquals(mockList, result);
        verify(userActivityRepository, times(1)).findFailedLoginAttemptsSince(any(LocalDateTime.class));
    }

    @Test
    @DisplayName("getActivitiesByIp 성공")
    void getActivitiesByIp_success() {
        String ip = "127.0.0.1";
        int hours = 24;
        List<UserActivity> mockList = Collections.singletonList(createUserActivity());

        when(userActivityRepository.findByIpAddressAndCreatedAtAfterOrderByCreatedAtDesc(eq(ip), any(LocalDateTime.class))).thenReturn(mockList);

        List<UserActivity> result = activityLoggingService.getActivitiesByIp(ip, hours);

        assertNotNull(result);
        assertEquals(mockList, result);
        verify(userActivityRepository, times(1)).findByIpAddressAndCreatedAtAfterOrderByCreatedAtDesc(eq(ip), any(LocalDateTime.class));
    }

    @Test
    @DisplayName("getDailyLoginStats 성공")
    void getDailyLoginStats_success() {
        int days = 30;
        List<Object[]> mockList = Arrays.asList(new Object[]{"2023-01-01", 10L});

        when(userActivityRepository.getDailyLoginStats(any(LocalDateTime.class))).thenReturn(mockList);

        List<Object[]> result = activityLoggingService.getDailyLoginStats(days);

        assertNotNull(result);
        assertEquals(mockList, result);
        verify(userActivityRepository, times(1)).getDailyLoginStats(any(LocalDateTime.class));
    }

    @Test
    @DisplayName("getMostActiveUsers 성공")
    void getMostActiveUsers_success() {
        int days = 7;
        Pageable pageable = PageRequest.of(0, 10);
        List<Object[]> mockList = Arrays.asList(new Object[]{"user@example.com", 50L});

        when(userActivityRepository.getMostActiveUsers(any(LocalDateTime.class), eq(pageable))).thenReturn(mockList);

        List<Object[]> result = activityLoggingService.getMostActiveUsers(days, pageable);

        assertNotNull(result);
        assertEquals(mockList, result);
        verify(userActivityRepository, times(1)).getMostActiveUsers(any(LocalDateTime.class), eq(pageable));
    }
}