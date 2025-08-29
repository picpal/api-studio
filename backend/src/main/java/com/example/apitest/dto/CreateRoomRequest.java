package com.example.apitest.dto;

import com.example.apitest.entity.ChatRoom;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateRoomRequest {
    private String name;
    private String description;
    private ChatRoom.RoomType roomType;
    private List<Long> participantIds;
}