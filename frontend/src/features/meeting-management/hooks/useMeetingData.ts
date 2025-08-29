import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatRoom, Message, CreateRoomRequest, User } from '../../../entities/meeting';
import { chatApi } from '../api/chatApi';
import { websocketService } from '../api/websocketService';

export const useMeetingData = () => {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const currentRoomRef = useRef<number | null>(null);

  // 현재 사용자 정보 로드
  const loadCurrentUser = useCallback(async () => {
    try {
      const user = await chatApi.getCurrentUser();
      setCurrentUser(user);
    } catch (err: any) {
      console.error('Failed to load current user:', err);
    }
  }, []);

  // 사용자 목록 로드 (현재 사용자 제외, 승인된 사용자만)
  const loadAvailableUsers = useCallback(async () => {
    try {
      const [users, currentUserData] = await Promise.all([
        chatApi.getAvailableUsers(),
        chatApi.getCurrentUser()
      ]);
      
      
      // 현재 사용자를 제외하고 승인된 사용자만 필터링
      const filteredUsers = users.filter(user => 
        user.id !== currentUserData.id && 
        user.status === 'APPROVED'
      );
      setAvailableUsers(filteredUsers);
      setCurrentUser(currentUserData);
    } catch (err: any) {
      console.error('Failed to load available users:', err);
      // 사용자 목록 로드 실패 시에는 에러 상태를 설정하지 않음 (채팅은 여전히 가능해야 함)
    }
  }, []);

  // 채팅방 목록 로드
  const loadChatRooms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const rooms = await chatApi.getUserRooms();
      setChatRooms(rooms);
    } catch (err: any) {
      console.error('Failed to load chat rooms:', err);
      setError(err.response?.data?.message || '채팅방 목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 특정 채팅방의 메시지 로드 및 WebSocket 연결
  const loadMessages = useCallback(async (roomId: number) => {
    try {
      setLoading(true);
      setError(null);
      const roomMessages = await chatApi.getRoomMessages(roomId);
      setMessages(roomMessages);
      
      // WebSocket으로 채팅방 참가
      currentRoomRef.current = roomId;
      websocketService.joinRoom(roomId);
    } catch (err: any) {
      console.error('Failed to load messages:', err);
      setError(err.response?.data?.message || '메시지를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 채팅방 생성
  const createRoom = useCallback(async (name: string, participants: User[], isGroup = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const request: CreateRoomRequest = {
        name: isGroup ? name : undefined,
        roomType: isGroup ? 'GROUP' : 'DIRECT',
        participantIds: participants.map(p => p.id)
      };

      const newRoom = await chatApi.createRoom(request);
      setChatRooms(prev => [newRoom, ...prev]);
      return newRoom;
    } catch (err: any) {
      console.error('Failed to create room:', err);
      setError(err.response?.data?.message || '채팅방을 생성할 수 없습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 채팅방 나가기
  const leaveRoom = useCallback(async (roomId: number) => {
    try {
      setLoading(true);
      setError(null);
      await chatApi.leaveRoom(roomId);
      
      // 로컬 상태에서 방 제거
      setChatRooms(prev => prev.filter(room => room.id !== roomId));
      setMessages([]);
    } catch (err: any) {
      console.error('Failed to leave room:', err);
      setError(err.response?.data?.message || '채팅방을 나갈 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 메시지 전송 (WebSocket 사용)
  const addMessage = useCallback(async (content: string, roomId: number) => {
    try {
      setError(null);
      
      // WebSocket이 연결되어 있으면 WebSocket으로 전송
      if (websocketService.isConnected()) {
        websocketService.sendMessage(roomId, content);
        // WebSocket 메시지는 브로드캐스트되어 돌아옴
      } else {
        // WebSocket이 연결되지 않았으면 REST API 사용
        setLoading(true);
        const newMessage = await chatApi.sendMessage(roomId, { content });
        
        // 로컬 상태 업데이트
        setMessages(prev => [...prev, newMessage]);
        
        // 채팅방 목록의 lastMessage 업데이트
        setChatRooms(prev => prev.map(room => 
          room.id === roomId 
            ? { ...room, lastMessage: newMessage, unreadCount: 0 }
            : room
        ));
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setError(err.response?.data?.message || '메시지를 전송할 수 없습니다.');
      setLoading(false);
    }
  }, []);

  // 사용자 초대
  const inviteUser = useCallback(async (roomId: number, user: User) => {
    try {
      setLoading(true);
      setError(null);
      await chatApi.inviteUser(roomId, user.id);
      
      // 채팅방 정보 다시 로드 (참여자 목록 업데이트를 위해)
      const updatedRoom = await chatApi.getRoomById(roomId);
      setChatRooms(prev => prev.map(room => 
        room.id === roomId ? updatedRoom : room
      ));
    } catch (err: any) {
      console.error('Failed to invite user:', err);
      setError(err.response?.data?.message || '사용자를 초대할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 채팅방 삭제 (leaveRoom과 동일한 동작)
  const deleteRoom = useCallback(async (roomId: number) => {
    await leaveRoom(roomId);
  }, [leaveRoom]);

  // WebSocket 연결 및 메시지 리스너 설정
  useEffect(() => {
    // WebSocket 연결
    websocketService.connect(
      () => {
        console.log('WebSocket connected');
        setWsConnected(true);
      },
      (error) => {
        console.error('WebSocket connection error:', error);
        setWsConnected(false);
      }
    );

    // 메시지 수신 리스너
    const handleNewMessage = (message: Message) => {
      setMessages(prev => [...prev, message]);
      
      // 채팅방 목록의 lastMessage 업데이트
      setChatRooms(prev => prev.map(room => 
        room.id === currentRoomRef.current 
          ? { ...room, lastMessage: message, unreadCount: 0 }
          : room
      ));
    };

    // 연결 상태 리스너
    const handleConnectionChange = (connected: boolean) => {
      setWsConnected(connected);
    };

    websocketService.onMessage(handleNewMessage);
    websocketService.onConnectionChange(handleConnectionChange);

    // Cleanup
    return () => {
      websocketService.offMessage(handleNewMessage);
      websocketService.offConnectionChange(handleConnectionChange);
      websocketService.disconnect();
    };
  }, []);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadChatRooms();
    loadAvailableUsers();
  }, [loadChatRooms, loadAvailableUsers]);

  // 에러 초기화
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // 데이터
    dmRooms: chatRooms, // 백워드 호환성을 위한 별칭
    chatRooms,
    messages,
    availableUsers,
    currentUser,
    
    // 상태
    loading,
    error,
    wsConnected,
    
    // 액션
    createRoom,
    deleteRoom,
    leaveRoom,
    addMessage,
    inviteUser,
    loadChatRooms,
    loadMessages,
    clearError
  };
};