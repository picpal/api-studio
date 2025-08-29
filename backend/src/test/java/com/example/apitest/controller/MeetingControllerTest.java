package com.example.apitest.controller;

import com.example.apitest.dto.ChatRoomDTO;
import com.example.apitest.dto.CreateRoomRequest;
import com.example.apitest.dto.MessageDTO;
import com.example.apitest.entity.ChatRoom;
import com.example.apitest.entity.User;
import com.example.apitest.service.ChatRoomService;
import com.example.apitest.service.MessageService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import com.example.apitest.service.ActivityLoggingService;
import com.example.apitest.resolver.CurrentUserArgumentResolver;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = MeetingController.class)
@DisplayName("MeetingController 테스트")
class MeetingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ChatRoomService chatRoomService;

    @MockBean
    private MessageService messageService;

    @MockBean
    private ActivityLoggingService activityLoggingService;

    @MockBean
    private CurrentUserArgumentResolver currentUserArgumentResolver;

    @Autowired
    private ObjectMapper objectMapper;

    private User testUser;
    private ChatRoomDTO testRoomDTO;
    private CreateRoomRequest createRoomRequest;

    @BeforeEach
    void setUp() throws Exception {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");

        testRoomDTO = ChatRoomDTO.builder()
            .id(1L)
            .name("Test DM")
            .roomType(ChatRoom.RoomType.DIRECT)
            .unreadCount(0L)
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();

        createRoomRequest = CreateRoomRequest.builder()
            .name("New DM")
            .roomType(ChatRoom.RoomType.DIRECT)
            .participantIds(Arrays.asList(2L))
            .build();

        // Mock the CurrentUserArgumentResolver to return the testUser
        when(currentUserArgumentResolver.supportsParameter(any())).thenReturn(true);
        when(currentUserArgumentResolver.resolveArgument(any(), any(), any(), any())).thenReturn(testUser);
    }

    @Test
    @WithMockUser(username = "test@example.com", roles = {"USER"})
    @DisplayName("사용자의 채팅방 목록을 조회해야 함")
    void shouldGetUserRooms() throws Exception {
        // given
        List<ChatRoomDTO> roomList = Arrays.asList(testRoomDTO);
        when(chatRoomService.getUserRooms(anyLong())).thenReturn(roomList);

        // when & then
        mockMvc.perform(get("/api/chat/rooms")
                .with(csrf()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(1))
            .andExpect(jsonPath("$[0].id").value(1))
            .andExpect(jsonPath("$[0].name").value("Test DM"))
            .andExpect(jsonPath("$[0].roomType").value("DIRECT"));

        verify(chatRoomService).getUserRooms(anyLong());
    }

    @Test
    @WithMockUser(username = "test@example.com", roles = {"USER"})
    @DisplayName("특정 채팅방을 조회해야 함")
    void shouldGetRoomById() throws Exception {
        // given
        when(chatRoomService.getRoomById(eq(1L), anyLong())).thenReturn(testRoomDTO);

        // when & then
        mockMvc.perform(get("/api/chat/rooms/1")
                .with(csrf()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.name").value("Test DM"))
            .andExpect(jsonPath("$.roomType").value("DIRECT"));

        verify(chatRoomService).getRoomById(1L, anyLong());
    }

    @Test
    @WithMockUser(username = "test@example.com", roles = {"USER"})
    @DisplayName("새로운 채팅방을 생성해야 함")
    void shouldCreateRoom() throws Exception {
        // given
        when(chatRoomService.createRoom(any(CreateRoomRequest.class), anyLong())).thenReturn(testRoomDTO);

        // when & then
        mockMvc.perform(post("/api/chat/rooms")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createRoomRequest)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.name").value("Test DM"))
            .andExpect(jsonPath("$.roomType").value("DIRECT"));

        verify(chatRoomService).createRoom(any(CreateRoomRequest.class), anyLong());
    }

    @Test
    @WithMockUser(username = "test@example.com", roles = {"USER"})
    @DisplayName("채팅방에 사용자를 초대해야 함")
    void shouldInviteUser() throws Exception {
        // given
        doNothing().when(chatRoomService).inviteUser(eq(1L), eq(2L), anyLong());

        // when & then
        mockMvc.perform(post("/api/chat/rooms/1/invite/2")
                .with(csrf()))
            .andExpect(status().isOk())
            .andExpect(content().string("사용자가 성공적으로 초대되었습니다."));

        verify(chatRoomService).inviteUser(1L, 2L, anyLong());
    }

    @Test
    @WithMockUser(username = "test@example.com", roles = {"USER"})
    @DisplayName("채팅방을 나가야 함")
    void shouldLeaveRoom() throws Exception {
        // given
        doNothing().when(chatRoomService).leaveRoom(eq(1L), anyLong());

        // when & then
        mockMvc.perform(post("/api/chat/rooms/1/leave")
                .with(csrf()))
            .andExpect(status().isOk())
            .andExpect(content().string("채팅방을 나갔습니다."));

        verify(chatRoomService).leaveRoom(1L, anyLong());
    }

    @Test
    @WithMockUser(username = "test@example.com", roles = {"USER"})
    @DisplayName("채팅방의 메시지 목록을 조회해야 함")
    void shouldGetRoomMessages() throws Exception {
        // given
        MessageDTO messageDTO = MessageDTO.builder()
            .id(1L)
            .senderId(1L)
            .senderName("Test User")
            .content("Hello")
            .createdAt(LocalDateTime.now())
            .build();
        List<MessageDTO> messages = Arrays.asList(messageDTO);
        when(messageService.getRoomMessages(eq(1L), anyLong())).thenReturn(messages);

        // when & then
        mockMvc.perform(get("/api/chat/rooms/1/messages")
                .with(csrf()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(1))
            .andExpect(jsonPath("$[0].id").value(1))
            .andExpect(jsonPath("$[0].content").value("Hello"));

        verify(messageService).getRoomMessages(1L, anyLong());
    }

    @Test
    @WithMockUser(username = "test@example.com", roles = {"USER"})
    @DisplayName("메시지를 전송해야 함")
    void shouldSendMessage() throws Exception {
        // given
        MessageDTO messageDTO = MessageDTO.builder()
            .id(1L)
            .senderId(1L)
            .senderName("Test User")
            .content("Hello")
            .createdAt(LocalDateTime.now())
            .build();
        when(messageService.sendMessage(eq(1L), eq("Hello"), anyLong())).thenReturn(messageDTO);

        // when & then
        mockMvc.perform(post("/api/chat/rooms/1/messages")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"content\":\"Hello\"}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.content").value("Hello"));

        verify(messageService).sendMessage(1L, "Hello", anyLong());
    }

    @Test
    @WithMockUser(username = "test@example.com", roles = {"USER"})
    @DisplayName("잘못된 요청 시 400 에러를 반환해야 함")
    void shouldReturnBadRequestForInvalidInput() throws Exception {
        // given
        CreateRoomRequest invalidRequest = CreateRoomRequest.builder()
            .name("")  // 빈 이름
            .roomType(null)  // null 타입
            .build();

        // when & then
        mockMvc.perform(post("/api/chat/rooms")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest)))
            .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "test@example.com", roles = {"USER"})
    @DisplayName("권한이 없는 채팅방 접근 시 403 에러를 반환해야 함")
    void shouldReturnForbiddenForUnauthorizedAccess() throws Exception {
        // given
        when(chatRoomService.getRoomById(eq(1L), anyLong()))
            .thenThrow(new org.springframework.security.access.AccessDeniedException("접근 권한이 없습니다"));

        // when & then
        mockMvc.perform(get("/api/chat/rooms/1")
                .with(csrf()))
            .andExpect(status().isForbidden());

        verify(chatRoomService).getRoomById(1L, anyLong());
    }

    @Test
    @WithMockUser(username = "test@example.com", roles = {"USER"})
    @DisplayName("존재하지 않는 채팅방 접근 시 404 에러를 반환해야 함")
    void shouldReturnNotFoundForNonExistentRoom() throws Exception {
        // given
        when(chatRoomService.getRoomById(eq(999L), anyLong()))
            .thenThrow(new IllegalArgumentException("채팅방을 찾을 수 없습니다"));

        // when & then
        mockMvc.perform(get("/api/chat/rooms/999")
                .with(csrf()))
            .andExpect(status().isNotFound());

        verify(chatRoomService).getRoomById(999L, anyLong());
    }

    @Test
    @WithMockUser(username = "test@example.com", roles = {"USER"})
    @DisplayName("서비스 계층 에러 시 500 에러를 반환해야 함")
    void shouldReturnInternalServerErrorForServiceException() throws Exception {
        // given
        when(chatRoomService.getUserRooms(anyLong()))
            .thenThrow(new RuntimeException("데이터베이스 연결 실패"));

        // when & then
        mockMvc.perform(get("/api/chat/rooms")
                .with(csrf()))
            .andExpect(status().isInternalServerError());

        verify(chatRoomService).getUserRooms(anyLong());
    }

    @Test
    @DisplayName("인증되지 않은 사용자는 401 에러를 받아야 함")
    void shouldReturnUnauthorizedForUnauthenticatedUser() throws Exception {
        // when & then
        mockMvc.perform(get("/api/chat/rooms"))
            .andExpect(status().isUnauthorized());

        verifyNoInteractions(chatRoomService);
    }
}