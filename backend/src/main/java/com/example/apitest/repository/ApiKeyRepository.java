package com.example.apitest.repository;

import com.example.apitest.entity.ApiKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ApiKeyRepository extends JpaRepository<ApiKey, Long> {
    
    Optional<ApiKey> findByKeyValueAndIsActiveTrue(String keyValue);
    
    List<ApiKey> findByUserIdAndIsActiveTrueOrderByCreatedAtDesc(Long userId);
    
    List<ApiKey> findByIsActiveTrueOrderByCreatedAtDesc();
    
    @Query("SELECT ak FROM ApiKey ak WHERE ak.user.email = :userEmail AND ak.isActive = true ORDER BY ak.createdAt DESC")
    List<ApiKey> findByUserEmailAndIsActiveTrue(@Param("userEmail") String userEmail);
    
    @Modifying
    @Query("UPDATE ApiKey ak SET ak.lastUsedAt = :lastUsedAt WHERE ak.id = :id")
    void updateLastUsedAt(@Param("id") Long id, @Param("lastUsedAt") LocalDateTime lastUsedAt);
    
    @Modifying
    @Query("UPDATE ApiKey ak SET ak.isActive = false WHERE ak.id = :id")
    void deactivateApiKey(@Param("id") Long id);
    
    boolean existsByKeyValue(String keyValue);
}