package com.example.apitest.repository;

import com.example.apitest.entity.MessageReadStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface MessageReadStatusRepository extends JpaRepository<MessageReadStatus, Long> {
    
    @Query("SELECT mrs FROM MessageReadStatus mrs WHERE mrs.messageId = :messageId")
    List<MessageReadStatus> findByMessageId(@Param("messageId") Long messageId);
    
    @Query("SELECT mrs FROM MessageReadStatus mrs WHERE mrs.chatRoomId = :chatRoomId AND mrs.userId = :userId")
    List<MessageReadStatus> findByChatRoomIdAndUserId(@Param("chatRoomId") Long chatRoomId, @Param("userId") Long userId);
    
    @Query("SELECT COUNT(mrs) FROM MessageReadStatus mrs WHERE mrs.messageId = :messageId")
    int countByMessageId(@Param("messageId") Long messageId);
    
    @Query("SELECT mrs.messageId, COUNT(mrs) FROM MessageReadStatus mrs " +
           "WHERE mrs.messageId IN :messageIds GROUP BY mrs.messageId")
    List<Object[]> countReadStatusByMessageIds(@Param("messageIds") List<Long> messageIds);
    
    @Query("SELECT mrs FROM MessageReadStatus mrs " +
           "WHERE mrs.chatRoomId = :chatRoomId AND mrs.messageId IN :messageIds")
    List<MessageReadStatus> findByChatRoomIdAndMessageIds(@Param("chatRoomId") Long chatRoomId, 
                                                         @Param("messageIds") List<Long> messageIds);
    
    boolean existsByMessageIdAndUserId(Long messageId, Long userId);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM MessageReadStatus mrs WHERE mrs.chatRoomId = :chatRoomId")
    void deleteByChatRoomId(@Param("chatRoomId") Long chatRoomId);
}