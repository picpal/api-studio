package com.example.apitest.repository;

import com.example.apitest.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
    
    /**
     * 사용자가 참여중인 활성 채팅방 목록 조회 (최근 활동순)
     */
    @Query("""
        SELECT DISTINCT cr FROM ChatRoom cr
        JOIN ChatRoomParticipant crp ON cr.id = crp.roomId
        WHERE crp.userId = :userId 
        AND crp.isActive = true 
        AND cr.isActive = true
        ORDER BY cr.updatedAt DESC
        """)
    List<ChatRoom> findActiveRoomsByUserId(@Param("userId") Long userId);
    
    /**
     * 특정 채팅방 조회 (참여 권한 체크 포함)
     */
    @Query("""
        SELECT cr FROM ChatRoom cr
        JOIN ChatRoomParticipant crp ON cr.id = crp.roomId
        WHERE cr.id = :roomId 
        AND crp.userId = :userId 
        AND crp.isActive = true
        AND cr.isActive = true
        """)
    Optional<ChatRoom> findRoomByIdAndUserId(@Param("roomId") Long roomId, @Param("userId") Long userId);
    
    /**
     * 두 사용자 간의 DM방 존재 여부 확인 (중복 생성 방지)
     */
    @Query("""
        SELECT cr FROM ChatRoom cr
        WHERE cr.roomType = 'DIRECT'
        AND cr.isActive = true
        AND EXISTS (
            SELECT 1 FROM ChatRoomParticipant crp1 
            WHERE crp1.roomId = cr.id AND crp1.userId = :userId1 AND crp1.isActive = true
        )
        AND EXISTS (
            SELECT 1 FROM ChatRoomParticipant crp2 
            WHERE crp2.roomId = cr.id AND crp2.userId = :userId2 AND crp2.isActive = true
        )
        AND (
            SELECT COUNT(*) FROM ChatRoomParticipant crp3 
            WHERE crp3.roomId = cr.id AND crp3.isActive = true
        ) = 2
        """)
    Optional<ChatRoom> findDirectRoomBetweenUsers(@Param("userId1") Long userId1, @Param("userId2") Long userId2);
    
    /**
     * 채팅방의 마지막 활동 시간 업데이트
     */
    @Query("""
        UPDATE ChatRoom cr 
        SET cr.updatedAt = :updatedAt 
        WHERE cr.id = :roomId
        """)
    void updateLastActivity(@Param("roomId") Long roomId, @Param("updatedAt") LocalDateTime updatedAt);
    
    /**
     * 사용자가 생성한 채팅방 목록 조회
     */
    List<ChatRoom> findByCreatedByAndIsActiveTrue(Long createdBy);
    
    /**
     * 채팅방 타입별 조회
     */
    List<ChatRoom> findByRoomTypeAndIsActiveTrue(ChatRoom.RoomType roomType);
}