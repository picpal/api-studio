package com.example.apitest.repository;

import com.example.apitest.entity.TestHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TestHistoryRepository extends JpaRepository<TestHistory, Long> {
    
    // 생성일 기준 내림차순으로 모든 테스트 히스토리 조회
    List<TestHistory> findAllByOrderByCreatedAtDesc();
    
    // 특정 사용자의 테스트 히스토리 조회
    List<TestHistory> findByCreatedByOrderByCreatedAtDesc(String createdBy);
    
    // 최근 N개의 테스트 히스토리 조회
    @Query("SELECT t FROM TestHistory t ORDER BY t.createdAt DESC LIMIT :limit")
    List<TestHistory> findRecentTestHistory(@Param("limit") int limit);
}