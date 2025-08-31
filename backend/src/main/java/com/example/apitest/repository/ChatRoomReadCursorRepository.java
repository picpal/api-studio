package com.example.apitest.repository;

import com.example.apitest.entity.ChatRoomReadCursor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRoomReadCursorRepository extends JpaRepository<ChatRoomReadCursor, Long> {
    
    Optional<ChatRoomReadCursor> findByChatRoomIdAndUserId(Long chatRoomId, Long userId);
    
    List<ChatRoomReadCursor> findByUserId(Long userId);
    
    @Query("SELECT crc FROM ChatRoomReadCursor crc WHERE crc.chatRoomId = :chatRoomId")
    List<ChatRoomReadCursor> findByChatRoomId(@Param("chatRoomId") Long chatRoomId);
    
    void deleteByChatRoomId(Long chatRoomId);
    
    void deleteByChatRoomIdAndUserId(Long chatRoomId, Long userId);
}