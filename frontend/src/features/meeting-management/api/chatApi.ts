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
    const response = await axios.get('http://localhost:8080/api/admin/users', {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' }
    });
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

  sendMessage: async (roomId: number, request: SendMessageRequest): Promise<Message> => {
    const response = await api.post(`/rooms/${roomId}/messages`, request);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await axios.get('/api/auth/me', { withCredentials: true });
    return response.data.user; // user 객체 안에 실제 사용자 데이터가 있음
  },

  getAvailableUsers: async (): Promise<User[]> => {
    const response = await axios.get('/api/chat/available-users', { withCredentials: true });
    return response.data;
  },
};