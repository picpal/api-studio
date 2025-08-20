package com.example.apitest.repository;

import com.example.apitest.entity.ApiItemHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApiItemHistoryRepository extends JpaRepository<ApiItemHistory, Long> {
    
    // 특정 API 아이템의 히스토리 조회 (최신순)
    List<ApiItemHistory> findByApiItemIdOrderBySavedAtDesc(Long apiItemId);
    
    // 특정 API 아이템의 히스토리 개수 조회
    long countByApiItemId(Long apiItemId);
    
    // 특정 API 아이템의 오래된 히스토리 삭제 (10개 초과시)
    @Modifying
    @Query("DELETE FROM ApiItemHistory h WHERE h.apiItemId = :apiItemId AND h.id NOT IN " +
           "(SELECT h2.id FROM ApiItemHistory h2 WHERE h2.apiItemId = :apiItemId ORDER BY h2.savedAt DESC LIMIT 10)")
    void deleteOldHistories(@Param("apiItemId") Long apiItemId);
    
    // API 아이템 삭제시 관련 히스토리도 모두 삭제
    @Modifying
    @Query("DELETE FROM ApiItemHistory h WHERE h.apiItemId = :apiItemId")
    void deleteByApiItemId(@Param("apiItemId") Long apiItemId);
}