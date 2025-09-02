package com.example.apitest.repository;

import com.example.apitest.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    
    /**
     * 특정 채팅방의 메시지 목록 조회 (시간순)
     */
    @Query("""
        SELECT m FROM Message m 
        WHERE m.roomId = :roomId 
        AND m.isDeleted = false 
        ORDER BY m.createdAt ASC
        """)
    List<Message> findByRoomIdOrderByCreatedAtAsc(@Param("roomId") Long roomId);
    
    /**
     * 특정 채팅방의 메시지 목록 조회 (페이징, 최신순)
     */
    @Query("""
        SELECT m FROM Message m 
        WHERE m.roomId = :roomId 
        AND m.isDeleted = false 
        ORDER BY m.createdAt DESC
        """)
    Page<Message> findMessagesByRoomId(@Param("roomId") Long roomId, Pageable pageable);
    
    /**
     * 특정 채팅방의 마지막 메시지 조회
     */
    Optional<Message> findFirstByRoomIdAndIsDeletedFalseOrderByCreatedAtDesc(Long roomId);
    
    /**
     * 특정 사용자가 마지막으로 읽은 메시지 이후의 읽지 않은 메시지 수 조회
     */
    @Query("""
        SELECT COUNT(m) FROM Message m 
        WHERE m.roomId = :roomId 
        AND m.id > :lastReadMessageId 
        AND m.isDeleted = false
        """)
    Long countUnreadMessages(@Param("roomId") Long roomId, @Param("lastReadMessageId") Long lastReadMessageId);
    
    /**
     * 특정 채팅방의 총 메시지 수 조회
     */
    long countByRoomIdAndIsDeletedFalse(Long roomId);
    
    /**
     * 특정 사용자가 보낸 메시지 조회
     */
    Page<Message> findBySenderIdAndIsDeletedFalseOrderByCreatedAtDesc(Long senderId, Pageable pageable);
    
    /**
     * 시스템 메시지 조회
     */
    @Query("""
        SELECT m FROM Message m 
        WHERE m.roomId = :roomId 
        AND m.messageType = 'SYSTEM' 
        AND m.isDeleted = false 
        ORDER BY m.createdAt DESC
        """)
    Page<Message> findSystemMessagesByRoomId(@Param("roomId") Long roomId, Pageable pageable);
    
    /**
     * 특정 기간 동안의 메시지 조회
     */
    @Query("""
        SELECT m FROM Message m 
        WHERE m.roomId = :roomId 
        AND m.createdAt >= :startDate 
        AND m.createdAt <= :endDate 
        AND m.isDeleted = false 
        ORDER BY m.createdAt ASC
        """)
    Page<Message> findMessagesByRoomIdAndDateRange(
        @Param("roomId") Long roomId, 
        @Param("startDate") java.time.LocalDateTime startDate,
        @Param("endDate") java.time.LocalDateTime endDate,
        Pageable pageable
    );
    
    /**
     * 특정 사용자가 읽지 않은 메시지 조회 (커서 기반)
     */
    @Query("""
        SELECT m FROM Message m 
        WHERE m.roomId = :roomId 
        AND m.senderId != :userId 
        AND m.id > :lastReadMessageId 
        AND m.isDeleted = false 
        ORDER BY m.createdAt ASC
        """)
    List<Message> findUnreadMessages(@Param("roomId") Long roomId, 
                                   @Param("userId") Long userId, 
                                   @Param("lastReadMessageId") Long lastReadMessageId);
    
    /**
     * 특정 사용자가 읽지 않은 메시지 수 조회 (본인 메시지 제외)
     */
    @Query("""
        SELECT COUNT(m) FROM Message m 
        WHERE m.roomId = :roomId 
        AND m.senderId != :userId 
        AND m.id > :lastReadMessageId 
        AND m.isDeleted = false
        """)
    int countUnreadMessagesForUser(@Param("roomId") Long roomId, 
                                  @Param("userId") Long userId,
                                  @Param("lastReadMessageId") Long lastReadMessageId);
    
    /**
     * 특정 메시지 ID 이전의 메시지들을 페이징으로 조회 (커서 기반 페이지네이션)
     */
    @Query("""
        SELECT m FROM Message m 
        WHERE m.roomId = :roomId 
        AND m.id < :beforeMessageId 
        AND m.isDeleted = false 
        ORDER BY m.createdAt DESC
        """)
    Page<Message> findMessagesByRoomIdBeforeId(@Param("roomId") Long roomId, 
                                              @Param("beforeMessageId") Long beforeMessageId, 
                                              Pageable pageable);
}