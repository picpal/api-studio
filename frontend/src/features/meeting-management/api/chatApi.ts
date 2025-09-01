import axios from 'axios';
import { ChatRoom, CreateRoomRequest, Message, SendMessageRequest } from '../../../entities/meeting/types';

const API_BASE_URL = 'http://localhost:8080/api/chat';

// Configure axios instance with credentials for session-based auth
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const chatApi = {
  // 사용자 관련 API
  getCurrentUser: async (): Promise<any> => {
    const response = await axios.get('http://localhost:8080/api/auth/me', {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data.user;
  },

  getAvailableUsers: async (): Promise<any[]> => {
    const response = await api.get('/available-users');
    return response.data;
  },

  // 채팅방 관련 API
  getUserRooms: async (): Promise<ChatRoom[]> => {
    const response = await api.get('/rooms');
    return response.data;
  },

  getRoomById: async (roomId: number): Promise<ChatRoom> => {
    const response = await api.get(`/rooms/${roomId}`);
    return response.data;
  },

  createRoom: async (request: CreateRoomRequest): Promise<ChatRoom> => {
    const response = await api.post('/rooms', request);
    return response.data;
  },

  inviteUser: async (roomId: number, targetUserId: number): Promise<string> => {
    const response = await api.post(`/rooms/${roomId}/invite/${targetUserId}`);
    return response.data;
  },

  leaveRoom: async (roomId: number): Promise<string> => {
    const response = await api.post(`/rooms/${roomId}/leave`);
    return response.data;
  },

  // 메시지 관련 API
  getRoomMessages: async (roomId: number): Promise<Message[]> => {
    const response = await api.get(`/rooms/${roomId}/messages`);
    return response.data;
  },

  // 페이지네이션 기반 메시지 조회
  getRoomMessagesWithPagination: async (
    roomId: number, 
    size: number = 20, 
    beforeMessageId?: number
  ): Promise<Message[]> => {
    const params = new URLSearchParams();
    params.append('size', size.toString());
    if (beforeMessageId) {
      params.append('beforeMessageId', beforeMessageId.toString());
    }
    
    const response = await api.get(`/rooms/${roomId}/messages?${params.toString()}`);
    return response.data;
  },

  sendMessage: async (roomId: number, request: SendMessageRequest): Promise<Message> => {
    const response = await api.post(`/rooms/${roomId}/messages`, request);
    return response.data;
  },

  // 읽음 상태 관련 API
  markMessagesAsRead: async (roomId: number, lastReadMessageId: number): Promise<void> => {
    await api.post(`/rooms/${roomId}/messages/read`, {
      lastReadMessageId
    });
  },

  getUnreadCount: async (roomId: number): Promise<number> => {
    const response = await api.get(`/rooms/${roomId}/unread-count`);
    return response.data.unreadCount;
  },

  getMessageReadStatus: async (messageId: number): Promise<any[]> => {
    const response = await api.get(`/messages/${messageId}/read-status`);
    return response.data.readStatuses;
  },

  getMessageReadCount: async (messageId: number): Promise<number> => {
    const response = await api.get(`/messages/${messageId}/read-count`);
    return response.data.readCount;
  },

  getMultipleMessageReadCounts: async (messageIds: number[]): Promise<Record<number, number>> => {
    const response = await api.post('/messages/read-counts', {
      messageIds
    });
    return response.data.readCounts;
  },

  hasUserReadMessage: async (messageId: number): Promise<boolean> => {
    const response = await api.get(`/messages/${messageId}/read-by-me`);
    return response.data.hasRead;
  },
};