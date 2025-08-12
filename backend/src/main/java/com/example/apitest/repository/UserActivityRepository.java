package com.example.apitest.repository;

import com.example.apitest.entity.UserActivity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface UserActivityRepository extends JpaRepository<UserActivity, Long> {
    
    /**
     * 모든 활동 로그 조회 (최신순)
     */
    Page<UserActivity> findAllByOrderByCreatedAtDesc(Pageable pageable);
    
    /**
     * 특정 사용자의 활동 로그 조회
     */
    Page<UserActivity> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    
    /**
     * 특정 이메일의 활동 로그 조회 (사용자 삭제된 경우에도 조회 가능)
     */
    Page<UserActivity> findByUserEmailOrderByCreatedAtDesc(String userEmail, Pageable pageable);
    
    /**
     * 특정 활동 유형별 조회
     */
    Page<UserActivity> findByActivityTypeOrderByCreatedAtDesc(UserActivity.ActivityType activityType, Pageable pageable);
    
    /**
     * 특정 IP에서의 활동 조회
     */
    List<UserActivity> findByIpAddressAndCreatedAtAfterOrderByCreatedAtDesc(String ipAddress, LocalDateTime after);
    
    /**
     * 실패한 로그인 시도 조회 (보안 모니터링용)
     */
    @Query("SELECT ua FROM UserActivity ua WHERE ua.activityType = 'LOGIN' AND ua.result = 'FAILURE' AND ua.createdAt >= :since ORDER BY ua.createdAt DESC")
    List<UserActivity> findFailedLoginAttemptsSince(@Param("since") LocalDateTime since);
    
    /**
     * 특정 세션의 활동 조회
     */
    List<UserActivity> findBySessionIdOrderByCreatedAtDesc(String sessionId);
    
    /**
     * 날짜 범위별 활동 조회
     */
    @Query("SELECT ua FROM UserActivity ua WHERE ua.createdAt BETWEEN :startDate AND :endDate ORDER BY ua.createdAt DESC")
    Page<UserActivity> findByDateRange(@Param("startDate") LocalDateTime startDate, 
                                      @Param("endDate") LocalDateTime endDate, 
                                      Pageable pageable);
    
    /**
     * 사용자별 최근 로그인 시간 조회
     */
    @Query("SELECT ua FROM UserActivity ua WHERE ua.user.id = :userId AND ua.activityType = 'LOGIN' AND ua.result = 'SUCCESS' ORDER BY ua.createdAt DESC")
    List<UserActivity> findLatestSuccessfulLogin(@Param("userId") Long userId, Pageable pageable);
    
    /**
     * 관리자 액션 로그 조회
     */
    Page<UserActivity> findByActivityTypeInOrderByCreatedAtDesc(List<UserActivity.ActivityType> activityTypes, Pageable pageable);
    
    /**
     * 특정 URI 패턴의 활동 조회
     */
    @Query("SELECT ua FROM UserActivity ua WHERE ua.requestUri LIKE :uriPattern ORDER BY ua.createdAt DESC")
    Page<UserActivity> findByRequestUriPattern(@Param("uriPattern") String uriPattern, Pageable pageable);
    
    /**
     * 활동 통계 - 일별 로그인 수
     */
    @Query("SELECT DATE(ua.createdAt) as loginDate, COUNT(ua) as loginCount " +
           "FROM UserActivity ua " +
           "WHERE ua.activityType = 'LOGIN' AND ua.result = 'SUCCESS' " +
           "AND ua.createdAt >= :since " +
           "GROUP BY DATE(ua.createdAt) " +
           "ORDER BY loginDate DESC")
    List<Object[]> getDailyLoginStats(@Param("since") LocalDateTime since);
    
    /**
     * 가장 활발한 사용자 조회
     */
    @Query("SELECT ua.userEmail, COUNT(ua) as activityCount " +
           "FROM UserActivity ua " +
           "WHERE ua.createdAt >= :since " +
           "GROUP BY ua.userEmail " +
           "ORDER BY activityCount DESC")
    List<Object[]> getMostActiveUsers(@Param("since") LocalDateTime since, Pageable pageable);
}