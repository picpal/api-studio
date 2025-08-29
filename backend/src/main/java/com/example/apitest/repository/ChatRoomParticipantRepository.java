package com.example.apitest.repository;

import com.example.apitest.entity.ChatRoomParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRoomParticipantRepository extends JpaRepository<ChatRoomParticipant, Long> {
    
    /**
     * 특정 채팅방의 활성 참여자 조회
     */
    List<ChatRoomParticipant> findByRoomIdAndIsActive(Long roomId, Boolean isActive);
    
    /**
     * 특정 사용자의 특정 채팅방 참여 정보 조회
     */
    Optional<ChatRoomParticipant> findByRoomIdAndUserIdAndIsActive(Long roomId, Long userId, Boolean isActive);
    
    /**
     * 사용자의 채팅방 참여 여부 확인
     */
    boolean existsByRoomIdAndUserIdAndIsActive(Long roomId, Long userId, Boolean isActive);
    
    /**
     * 특정 채팅방의 활성 참여자 수 조회
     */
    long countByRoomIdAndIsActive(Long roomId, Boolean isActive);
    
    /**
     * 사용자가 참여중인 모든 채팅방의 참여 정보 조회
     */
    List<ChatRoomParticipant> findByUserIdAndIsActive(Long userId, Boolean isActive);
    
    /**
     * 특정 채팅방의 활성 참여자 정보 (사용자 정보 포함)
     */
    @Query("""
        SELECT crp
        FROM ChatRoomParticipant crp
        WHERE crp.roomId = :roomId 
        AND crp.isActive = true
        ORDER BY crp.joinedAt ASC
        """)
    List<ChatRoomParticipant> findActiveParticipantsWithUserInfo(@Param("roomId") Long roomId);
    
    /**
     * 특정 사용자를 제외한 채팅방 참여자 조회
     */
    @Query("""
        SELECT crp FROM ChatRoomParticipant crp
        WHERE crp.roomId = :roomId 
        AND crp.userId != :excludeUserId 
        AND crp.isActive = true
        """)
    List<ChatRoomParticipant> findActiveParticipantsExcluding(@Param("roomId") Long roomId, @Param("excludeUserId") Long excludeUserId);
}