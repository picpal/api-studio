import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Message } from '../../../entities/meeting/types';

class WebSocketService {
  private client: Client | null = null;
  private roomId: number | null = null;
  private messageCallbacks: ((message: Message) => void)[] = [];
  private connectionCallbacks: ((connected: boolean) => void)[] = [];
  private roomInvitationCallbacks: ((room: any) => void)[] = [];
  private readStatusCallbacks: ((readStatus: any) => void)[] = [];
  private messageSubscription: any = null;
  private typingSubscription: any = null;
  private personalSubscription: any = null;
  private readStatusSubscription: any = null;
  private globalMessageSubscription: any = null;

  connect(onConnected?: () => void, onError?: (error: any) => void) {
    // withCredentials 옵션을 추가하여 쿠키를 포함
    const socket = new SockJS('http://localhost:8080/ws', null, {
      withCredentials: true
    });
    
    this.client = new Client({
      webSocketFactory: () => socket as any,
      
      onConnect: () => {
        console.log('WebSocket Connected');
        this.connectionCallbacks.forEach(cb => cb(true));
        
        // 개인 채널 구독 (채팅방 초대 알림용)
        this.subscribeToPersonalChannel();
        
        if (onConnected) onConnected();
      },
      
      onStompError: (frame) => {
        console.error('STOMP error:', frame.headers['message']);
        this.connectionCallbacks.forEach(cb => cb(false));
        if (onError) onError(frame);
      },
      
      onWebSocketError: (error) => {
        console.error('WebSocket error:', error);
        this.connectionCallbacks.forEach(cb => cb(false));
        if (onError) onError(error);
      },
      
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.activate();
  }

  disconnect() {
    // 구독 해제
    if (this.messageSubscription) {
      try {
        this.messageSubscription.unsubscribe();
      } catch (e) {
        console.error('Error unsubscribing message subscription:', e);
      }
      this.messageSubscription = null;
    }
    
    if (this.typingSubscription) {
      try {
        this.typingSubscription.unsubscribe();
      } catch (e) {
        console.error('Error unsubscribing typing subscription:', e);
      }
      this.typingSubscription = null;
    }
    
    if (this.personalSubscription) {
      try {
        this.personalSubscription.unsubscribe();
      } catch (e) {
        console.error('Error unsubscribing personal subscription:', e);
      }
      this.personalSubscription = null;
    }
    
    if (this.readStatusSubscription) {
      try {
        this.readStatusSubscription.unsubscribe();
      } catch (e) {
        console.error('Error unsubscribing read status subscription:', e);
      }
      this.readStatusSubscription = null;
    }
    
    if (this.globalMessageSubscription) {
      try {
        this.globalMessageSubscription.unsubscribe();
      } catch (e) {
        console.error('Error unsubscribing global message subscription:', e);
      }
      this.globalMessageSubscription = null;
    }
    
    // 클라이언트가 활성 상태일 때만 퇴장 알림 및 deactivate
    if (this.client && this.client.active) {
      // 채팅방 퇴장 알림
      if (this.roomId) {
        try {
          this.leaveRoom(this.roomId);
        } catch (e) {
          console.error('Error leaving room on disconnect:', e);
        }
      }
      
      try {
        this.client.deactivate();
      } catch (e) {
        console.error('Error deactivating client:', e);
      }
    }
    
    this.client = null;
    this.roomId = null;
  }

  joinRoom(roomId: number) {
    if (!this.client || !this.client.active) {
      console.error('WebSocket is not connected');
      return;
    }

    // 이미 같은 방에 있으면 아무것도 하지 않음
    if (this.roomId === roomId) {
      console.log('Already in room:', roomId);
      return;
    }

    // 이전 방 구독 해제
    if (this.roomId && this.roomId !== roomId) {
      this.leaveRoom(this.roomId);
    }

    // 기존 구독 해제
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }
    if (this.typingSubscription) {
      this.typingSubscription.unsubscribe();
    }
    if (this.readStatusSubscription) {
      this.readStatusSubscription.unsubscribe();
    }

    this.roomId = roomId;

    // 메시지 구독
    this.messageSubscription = this.client.subscribe(`/topic/room/${roomId}`, (message: IMessage) => {
      const messageData: Message = JSON.parse(message.body);
      console.log('Received message:', messageData);
      this.messageCallbacks.forEach(callback => callback(messageData));
    });

    // 타이핑 알림 구독
    this.typingSubscription = this.client.subscribe(`/topic/room/${roomId}/typing`, (message: IMessage) => {
      const typingUser = message.body;
      console.log('User typing:', typingUser);
    });

    // 읽음 상태 구독
    this.readStatusSubscription = this.client.subscribe(`/topic/room/${roomId}/read-status`, (message: IMessage) => {
      const readStatusData = JSON.parse(message.body);
      console.log('Received read status update:', readStatusData);
      this.readStatusCallbacks.forEach(callback => callback(readStatusData));
    });

    // 입장 알림 전송
    this.client.publish({
      destination: `/app/chat/${roomId}/join`,
      body: JSON.stringify({}),
    });
  }

  leaveRoom(roomId: number) {
    if (!this.client || !this.client.active) {
      console.warn('Cannot leave room - WebSocket not connected');
      return;
    }

    try {
      // 퇴장 알림 전송
      this.client.publish({
        destination: `/app/chat/${roomId}/leave`,
        body: JSON.stringify({}),
      });
    } catch (e) {
      console.error('Error sending leave message:', e);
    }

    // 구독 해제는 자동으로 처리됨
    this.roomId = null;
  }

  sendMessage(roomId: number, content: string) {
    if (!this.client || !this.client.active) {
      console.error('WebSocket is not connected');
      return;
    }

    this.client.publish({
      destination: `/app/chat/${roomId}/send`,
      body: JSON.stringify({ content }),
    });
  }

  sendTypingIndicator(roomId: number) {
    if (!this.client || !this.client.active) {
      return;
    }

    this.client.publish({
      destination: `/app/chat/${roomId}/typing`,
      body: JSON.stringify({}),
    });
  }

  // 메시지 수신 콜백 등록
  onMessage(callback: (message: Message) => void) {
    this.messageCallbacks.push(callback);
  }

  // 메시지 수신 콜백 제거
  offMessage(callback: (message: Message) => void) {
    this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
  }

  // 연결 상태 콜백 등록
  onConnectionChange(callback: (connected: boolean) => void) {
    this.connectionCallbacks.push(callback);
  }

  // 연결 상태 콜백 제거
  offConnectionChange(callback: (connected: boolean) => void) {
    this.connectionCallbacks = this.connectionCallbacks.filter(cb => cb !== callback);
  }

  // 개인 채널 구독 (채팅방 초대 알림용)
  private subscribeToPersonalChannel() {
    if (!this.client || !this.client.active) {
      console.error('Cannot subscribe to personal channel - WebSocket not connected');
      return;
    }

    // 개인 큐 구독 (사용자별 메시지)
    this.personalSubscription = this.client.subscribe('/user/queue/room-invitation', (message: IMessage) => {
      const roomData = JSON.parse(message.body);
      console.log('Received room invitation:', roomData);
      this.roomInvitationCallbacks.forEach(callback => callback(roomData));
    });

    // 전역 채팅 메시지 구독 (모든 채팅방의 메시지 알림용)
    this.globalMessageSubscription = this.client.subscribe('/user/queue/chat-messages', (message: IMessage) => {
      const messageData: Message = JSON.parse(message.body);
      console.log('Received global chat message:', messageData);
      this.messageCallbacks.forEach(callback => callback(messageData));
    });
  }

  // 채팅방 초대 콜백 등록
  onRoomInvitation(callback: (room: any) => void) {
    this.roomInvitationCallbacks.push(callback);
  }

  // 채팅방 초대 콜백 제거
  offRoomInvitation(callback: (room: any) => void) {
    this.roomInvitationCallbacks = this.roomInvitationCallbacks.filter(cb => cb !== callback);
  }

  // 읽음 상태 콜백 등록
  onReadStatusUpdate(callback: (readStatus: any) => void) {
    this.readStatusCallbacks.push(callback);
  }

  // 읽음 상태 콜백 제거
  offReadStatusUpdate(callback: (readStatus: any) => void) {
    this.readStatusCallbacks = this.readStatusCallbacks.filter(cb => cb !== callback);
  }

  isConnected(): boolean {
    return this.client !== null && this.client.active;
  }
}

// 싱글톤 인스턴스
export const websocketService = new WebSocketService();