package com.example.apitest.repository;

import com.example.apitest.entity.UiTestExecution;
import com.example.apitest.entity.UiTestScript;
import com.example.apitest.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UiTestExecutionRepository extends JpaRepository<UiTestExecution, Long> {

    Optional<UiTestExecution> findByExecutionId(String executionId);

    List<UiTestExecution> findByScriptOrderByCreatedAtDesc(UiTestScript script);

    Page<UiTestExecution> findByScriptOrderByCreatedAtDesc(UiTestScript script, Pageable pageable);

    List<UiTestExecution> findByExecutedByOrderByCreatedAtDesc(User executedBy);

    Page<UiTestExecution> findByExecutedByOrderByCreatedAtDesc(User executedBy, Pageable pageable);

    List<UiTestExecution> findByStatusOrderByCreatedAtDesc(UiTestExecution.ExecutionStatus status);

    @Query("SELECT e FROM UiTestExecution e WHERE e.createdAt BETWEEN :startDate AND :endDate ORDER BY e.createdAt DESC")
    List<UiTestExecution> findByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT e FROM UiTestExecution e WHERE e.script.id = :scriptId AND e.createdAt BETWEEN :startDate AND :endDate ORDER BY e.createdAt DESC")
    List<UiTestExecution> findByScriptIdAndDateRange(@Param("scriptId") Long scriptId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COUNT(e) FROM UiTestExecution e WHERE e.status = :status")
    long countByStatus(@Param("status") UiTestExecution.ExecutionStatus status);

    @Query("SELECT COUNT(e) FROM UiTestExecution e WHERE e.script = :script AND e.status = :status")
    long countByScriptAndStatus(@Param("script") UiTestScript script, @Param("status") UiTestExecution.ExecutionStatus status);

    @Query("SELECT COUNT(e) FROM UiTestExecution e WHERE e.executedBy = :user AND e.status = :status")
    long countByExecutedByAndStatus(@Param("user") User user, @Param("status") UiTestExecution.ExecutionStatus status);

    @Query("SELECT e FROM UiTestExecution e WHERE e.script.id = :scriptId ORDER BY e.createdAt DESC LIMIT 1")
    Optional<UiTestExecution> findLatestByScriptId(@Param("scriptId") Long scriptId);

    @Query("SELECT AVG(e.durationMs) FROM UiTestExecution e WHERE e.script = :script AND e.status = 'COMPLETED'")
    Double getAverageDurationByScript(@Param("script") UiTestScript script);

    @Query("SELECT e FROM UiTestExecution e WHERE e.status IN :statuses ORDER BY e.createdAt DESC")
    List<UiTestExecution> findByStatusInOrderByCreatedAtDesc(@Param("statuses") List<UiTestExecution.ExecutionStatus> statuses);

    void deleteByScript(UiTestScript script);
}