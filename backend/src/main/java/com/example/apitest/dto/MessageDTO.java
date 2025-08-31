package com.example.apitest.dto;

import com.example.apitest.entity.Message;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageDTO {
    private Long id;
    private Long roomId;
    private Long senderId;
    private String senderName;
    private String content;
    private Message.MessageType messageType;
    private LocalDateTime createdAt;
}