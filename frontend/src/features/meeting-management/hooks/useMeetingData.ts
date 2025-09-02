import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatRoom, Message, CreateRoomRequest, User } from '../../../entities/meeting';
import { chatApi } from '../api/chatApi';
import { websocketService } from '../api/websocketService';
import { notificationService } from '../../../shared/services/notificationService';

export const useMeetingData = () => {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const currentRoomRef = useRef<number | null>(null);

  // 현재 사용자 정보 로드
  const loadCurrentUser = useCallback(async () => {
    try {
      const user = await chatApi.getCurrentUser();
      setCurrentUser(user);
      
      // 사용자 로그인 시 알림 권한 요청
      if (notificationService.isSupported() && !notificationService.isPermissionGranted()) {
        await notificationService.requestPermission();
      }
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
  const loadChatRooms = useCallback(async (currentRoomId?: number) => {
    try {
      setLoading(true);
      setError(null);
      const rooms = await chatApi.getUserRooms();
      
      // 현재 채팅방에 있다면 해당 방의 unreadCount를 0으로 설정
      if (currentRoomId) {
        const updatedRooms = rooms.map(room => 
          room.id === currentRoomId ? { ...room, unreadCount: 0 } : room
        );
        setChatRooms(updatedRooms);
      } else {
        setChatRooms(rooms);
      }
    } catch (err: any) {
      console.error('Failed to load chat rooms:', err);
      setError(err.response?.data?.message || '채팅방 목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 특정 채팅방의 메시지 로드 및 WebSocket 연결 (페이지네이션 지원)
  const loadMessages = useCallback(async (roomId: number, size: number = 20) => {
    try {
      setLoading(true);
      setError(null);
      setHasMoreMessages(true);
      
      // 페이지네이션으로 최신 메시지들 로드
      const roomMessages = await chatApi.getRoomMessagesWithPagination(roomId, size);
      setMessages(roomMessages);
      
      // 로드된 메시지 수가 요청한 크기보다 작으면 더 이상 메시지가 없음
      if (roomMessages.length < size) {
        setHasMoreMessages(false);
      }
      
      // 현재 방 설정
      currentRoomRef.current = roomId;
      
      // WebSocket이 연결되어 있으면 즉시 참가, 아니면 연결 대기
      if (websocketService.isConnected()) {
        try {
          websocketService.joinRoom(roomId);
        } catch (err) {
          console.warn('Failed to join room, will retry when WebSocket connects:', err);
          // WebSocket 연결 후 자동으로 참가됨
        }
      } else {
        console.log('WebSocket not connected yet, will join room when connected');
        // currentRoomRef.current이 설정되어 있으므로 연결 완료 시 자동으로 참가됨
      }
    } catch (err: any) {
      console.error('Failed to load messages:', err);
      if (err.response?.status === 403) {
        setError('이 채팅방에 접근 권한이 없습니다. 초대를 받아야 참여할 수 있습니다.');
        setMessages([]);
      } else {
        setError(err.response?.data?.message || '메시지를 불러올 수 없습니다.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // 이전 메시지 추가 로드 (위로 스크롤할 때)
  const loadMoreMessages = useCallback(async (roomId: number, size: number = 20) => {
    if (loadingMore || !hasMoreMessages || messages.length === 0) return;

    try {
      setLoadingMore(true);
      setError(null);
      
      // 현재 메시지 중 가장 오래된 메시지의 ID를 기준으로 이전 메시지들 로드
      const oldestMessage = messages[0];
      if (!oldestMessage || !oldestMessage.id) return;
      
      const olderMessages = await chatApi.getRoomMessagesWithPagination(
        roomId, 
        size, 
        oldestMessage.id
      );
      
      if (olderMessages.length > 0) {
        // 기존 메시지 앞에 추가
        setMessages(prev => [...olderMessages, ...prev]);
      }
      
      // 로드된 메시지 수가 요청한 크기보다 작으면 더 이상 메시지가 없음
      if (olderMessages.length < size) {
        setHasMoreMessages(false);
      }
      
    } catch (err: any) {
      console.error('Failed to load more messages:', err);
      setError(err.response?.data?.message || '이전 메시지를 불러올 수 없습니다.');
    } finally {
      setLoadingMore(false);
    }
  }, [messages, loadingMore, hasMoreMessages]);

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
    // WebSocket이 이미 연결되어 있는지 확인 (globalNotificationService에서 연결했을 수 있음)
    if (websocketService.isConnected()) {
      console.log('WebSocket already connected by global service');
      setWsConnected(true);
      
      // 이미 연결되어 있으면 현재 채팅방에 참가
      if (currentRoomRef.current) {
        try {
          console.log('Joining room with existing connection:', currentRoomRef.current);
          websocketService.joinRoom(currentRoomRef.current);
        } catch (err) {
          console.warn('Failed to join room:', err);
        }
      }
    } else {
      // WebSocket이 연결되어 있지 않으면 연결 (백업용, 실제로는 globalNotificationService가 처리해야 함)
      console.log('WebSocket not connected, connecting from useMeetingData (backup)');
      websocketService.connect(
        () => {
          console.log('WebSocket connected from useMeetingData');
          setWsConnected(true);
          
          // 연결 성공 시 현재 채팅방에 참가 (안전하게)
          if (currentRoomRef.current) {
            try {
              console.log('Auto-joining room after WebSocket connection:', currentRoomRef.current);
              websocketService.joinRoom(currentRoomRef.current);
            } catch (err) {
              console.warn('Failed to join room after WebSocket connection:', err);
            }
          }
        },
        (error) => {
          console.error('WebSocket connection error:', error);
          setWsConnected(false);
        }
      );
    }

    // 메시지 수신 리스너
    const handleNewMessage = (message: Message) => {
      // 현재 채팅방에 있는 경우에만 메시지 목록에 추가
      if (currentRoomRef.current === message.roomId) {
        setMessages(prev => {
          // 중복 체크 (같은 메시지가 이미 있는지 확인)
          const exists = prev.some(m => m.id === message.id);
          if (exists) {
            return prev;
          }
          return [...prev, message];
        });
      }
      
      // 채팅방 목록의 lastMessage와 unreadCount 업데이트
      setChatRooms(prev => prev.map(room => {
        if (room.id === message.roomId) {
          // 현재 채팅방에 있고 포커스된 상태라면 unreadCount는 0
          const isCurrentRoomAndFocused = 
            currentRoomRef.current === message.roomId && 
            !document.hidden;
            
          return {
            ...room,
            lastMessage: message,
            unreadCount: isCurrentRoomAndFocused ? 0 : room.unreadCount + 1
          };
        }
        return room;
      }));

      // 데스크톱 알림 표시 (본인 메시지가 아니고 시스템 메시지가 아닌 경우)
      // currentUser가 없으면 다시 로드 시도
      if (!currentUser) {
        loadCurrentUser();
      }

      // 알림 표시 조건:
      // 1. 본인이 보낸 메시지가 아님
      // 2. 시스템 메시지가 아님
      // 3. 현재 해당 채팅방에 접속하지 않았거나, 접속했어도 페이지가 포커스되지 않은 상태
      const shouldShowNotification = 
        message.messageType !== 'SYSTEM' &&
        message.senderId !== 0 &&
        (!currentUser || message.senderId !== currentUser.id) &&
        (currentRoomRef.current !== message.roomId || document.hidden);

      if (shouldShowNotification) {
        // 해당 채팅방 정보 찾기
        const messageRoom = chatRooms.find(room => room.id === message.roomId);
        const roomName = messageRoom?.name || '채팅방';
        
        notificationService.showChatNotification(
          message.senderName || '알 수 없는 사용자',
          message.content,
          roomName
        );
      }
    };

    // 연결 상태 리스너
    const handleConnectionChange = (connected: boolean) => {
      setWsConnected(connected);
      console.log('WebSocket connection changed:', connected);
      
      // 연결이 완료되고 현재 채팅방이 있으면 자동으로 참가
      if (connected && currentRoomRef.current) {
        console.log('WebSocket connected, auto-joining room:', currentRoomRef.current);
        try {
          websocketService.joinRoom(currentRoomRef.current);
        } catch (err) {
          console.warn('Failed to auto-join room after connection:', err);
        }
      }
    };

    // 채팅방 초대 리스너 (실시간 채팅방 목록 업데이트)
    const handleRoomInvitation = (newRoom: ChatRoom) => {
      setChatRooms(prev => {
        // 이미 목록에 있는지 확인
        const exists = prev.some(room => room.id === newRoom.id);
        if (exists) {
          return prev;
        }
        // 새 채팅방을 목록 앞에 추가
        const updatedRooms = [newRoom, ...prev];
        
        // 채팅방 초대 알림 표시
        notificationService.showInvitationNotification(newRoom.name);
        
        return updatedRooms;
      });
    };

    // 읽음 상태 업데이트 리스너
    const handleReadStatusUpdate = (readStatus: any) => {
      console.log('Read status updated:', readStatus);
      // TODO: 읽음 상태 UI 업데이트 로직 추가
      // 예: 메시지 목록에서 읽음 표시 업데이트, 안읽은 메시지 수 업데이트 등
    };

    // 시스템 알림 리스너
    const handleNotification = (notification: any) => {
      console.log('🔔 Received system notification:', notification);
      console.log('Current room:', currentRoomRef.current);
      console.log('Notification room:', notification.roomId);
      
      if (notification.type === 'CHAT_MESSAGE') {
        // 테스트를 위해 알림을 항상 표시 (조건 제거)
        console.log('Showing notification...');
        notificationService.showChatNotification(
          notification.senderName || '알 수 없는 사용자',
          notification.content,
          notification.roomName || '채팅방'
        );
        
        // 채팅방 목록의 unreadCount 업데이트
        setChatRooms(prev => prev.map(room => {
          if (room.id === notification.roomId) {
            return {
              ...room,
              unreadCount: room.unreadCount + 1,
              lastMessage: {
                id: notification.messageId,
                roomId: notification.roomId,
                senderId: 0, // 실제 senderId는 서버에서 전송하지 않음
                senderName: notification.senderName,
                content: notification.content,
                messageType: 'TEXT' as const,
                createdAt: notification.timestamp
              }
            };
          }
          return room;
        }));
      }
    };

    websocketService.onMessage(handleNewMessage);
    websocketService.onConnectionChange(handleConnectionChange);
    websocketService.onRoomInvitation(handleRoomInvitation);
    websocketService.onReadStatusUpdate(handleReadStatusUpdate);
    websocketService.onNotification(handleNotification);

    // 페이지 포커스 시 현재 채팅방 읽음 처리
    const handleVisibilityChange = () => {
      if (!document.hidden && currentRoomRef.current && messages.length > 0) {
        // 페이지가 다시 포커스되고 현재 채팅방에 있을 때
        // 마지막 메시지를 읽음 처리
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.id) {
          markMessagesAsRead(currentRoomRef.current, lastMessage.id);
        }
        
        // 로컬 상태에서도 unreadCount를 0으로 설정
        setChatRooms(prev => prev.map(room => 
          room.id === currentRoomRef.current 
            ? { ...room, unreadCount: 0 }
            : room
        ));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup - 리스너만 제거하고 WebSocket 연결은 유지 (전역 관리)
    return () => {
      websocketService.offMessage(handleNewMessage);
      websocketService.offConnectionChange(handleConnectionChange);
      websocketService.offRoomInvitation(handleRoomInvitation);
      websocketService.offReadStatusUpdate(handleReadStatusUpdate);
      websocketService.offNotification(handleNotification);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // 현재 채팅방에서 나가기 (연결은 유지)
      if (currentRoomRef.current) {
        websocketService.leaveRoom(currentRoomRef.current);
        currentRoomRef.current = null;
      }
      // websocketService.disconnect(); // 제거 - 전역에서 관리
    };
  }, []);

  // chatRooms 변경 시 WebSocket 메시지 핸들러 재등록 (알림용)
  useEffect(() => {
    const handleNewMessageForNotification = (message: Message) => {
      // 데스크톱 알림 표시 (본인 메시지가 아니고 시스템 메시지가 아닌 경우)
      const shouldShowNotification = 
        message.messageType !== 'SYSTEM' &&
        message.senderId !== 0 &&
        (!currentUser || message.senderId !== currentUser.id) &&
        (currentRoomRef.current !== message.roomId || document.hidden);

      if (shouldShowNotification) {
        // 해당 채팅방 정보 찾기
        const messageRoom = chatRooms.find(room => room.id === message.roomId);
        const roomName = messageRoom?.name || '채팅방';
        
        notificationService.showChatNotification(
          message.senderName || '알 수 없는 사용자',
          message.content,
          roomName
        );
      }
    };

    websocketService.onMessage(handleNewMessageForNotification);

    return () => {
      websocketService.offMessage(handleNewMessageForNotification);
    };
  }, [chatRooms, currentUser]);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadChatRooms();
    loadAvailableUsers();
  }, [loadChatRooms, loadAvailableUsers]);

  // 메시지 읽음 처리
  const markMessagesAsRead = useCallback(async (roomId: number, lastReadMessageId: number) => {
    try {
      await chatApi.markMessagesAsRead(roomId, lastReadMessageId);
    } catch (err: any) {
      console.error('Failed to mark messages as read:', err);
    }
  }, []);

  // 안읽은 메시지 수 조회
  const getUnreadCount = useCallback(async (roomId: number): Promise<number> => {
    try {
      return await chatApi.getUnreadCount(roomId);
    } catch (err: any) {
      console.error('Failed to get unread count:', err);
      return 0;
    }
  }, []);

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
    loadingMore,
    hasMoreMessages,
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
    loadMoreMessages,
    clearError,
    
    // 읽음 상태 관련
    markMessagesAsRead,
    getUnreadCount
  };
};