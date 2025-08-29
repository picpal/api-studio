package com.example.apitest.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParticipantDTO {
    private Long userId;
    private String userName;
    private String email;
    private LocalDateTime joinedAt;
    private Long lastReadMessageId;
}