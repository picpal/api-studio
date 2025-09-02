import { websocketService } from '../../features/meeting-management/api/websocketService';
import { notificationService } from './notification';
import { Message } from '../../entities/meeting';

class GlobalNotificationService {
  private isConnected = false;
  private currentUser: any = null;
  
  /**
   * 앱 시작 시 전역 WebSocket 연결 초기화
   */
  public async initialize() {
    if (this.isConnected) {
      return;
    }

    try {
      // 현재 사용자 정보 가져오기
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        console.log('User not authenticated, skipping global notification setup');
        return;
      }
      
      this.currentUser = await response.json();
      console.log('Global notification service: User authenticated', this.currentUser.email);
      
      // 알림 권한 요청
      if (notificationService.isSupported() && !notificationService.isPermissionGranted()) {
        await notificationService.requestPermission();
      }
      
      // WebSocket 연결
      this.connectWebSocket();
      
    } catch (error) {
      console.error('Failed to initialize global notification service:', error);
    }
  }

  private connectWebSocket() {
    websocketService.connect(
      () => {
        console.log('Global WebSocket connected');
        this.isConnected = true;
      },
      (error) => {
        console.error('Global WebSocket connection error:', error);
        this.isConnected = false;
        
        // 재연결 시도
        setTimeout(() => {
          if (!this.isConnected) {
            console.log('Attempting WebSocket reconnection...');
            this.connectWebSocket();
          }
        }, 5000);
      }
    );

    // 전역 메시지 리스너 설정
    websocketService.onMessage(this.handleGlobalMessage.bind(this));
    websocketService.onRoomInvitation(this.handleRoomInvitation.bind(this));
    
    // 시스템 알림 리스너 추가
    websocketService.onNotification(this.handleSystemNotification.bind(this));
  }

  private handleGlobalMessage(message: Message) {
    // 본인이 보낸 메시지가 아니고 시스템 메시지가 아닌 경우에만 알림 표시
    const shouldShowNotification = 
      message.messageType !== 'SYSTEM' &&
      message.senderId !== 0 &&
      (!this.currentUser || message.senderId !== this.currentUser.id);

    if (shouldShowNotification) {
      // Meeting 페이지에 있는지 확인
      const isOnMeetingPage = window.location.pathname.includes('/meeting');
      
      // Meeting 페이지에 있지 않거나, 있더라도 페이지가 포커스되지 않은 경우 알림 표시
      if (!isOnMeetingPage || document.hidden) {
        this.showDesktopNotification(message);
      }
    }
  }

  private handleRoomInvitation(room: any) {
    notificationService.showInvitationNotification(room.name);
  }

  private handleSystemNotification(notification: any) {
    console.log('🔔 Global notification service received system notification:', notification);
    
    // 알림 타입에 따라 처리
    if (notification.type === 'CHAT_MESSAGE') {
      // Meeting 페이지에 있는지 확인
      const isOnMeetingPage = window.location.pathname.includes('/meeting');
      
      // Meeting 페이지에 있지 않거나, 페이지가 포커스되지 않은 경우 알림 표시
      if (!isOnMeetingPage || document.hidden) {
        notificationService.showChatNotification(
          notification.senderName || '알 수 없는 사용자',
          notification.content,
          notification.roomName || '채팅방'
        );
      }
    }
  }

  private async showDesktopNotification(message: Message) {
    try {
      // 채팅방 정보 가져오기 (옵션)
      let roomName = '채팅방';
      try {
        const response = await fetch(`/api/chat/rooms`, {
          credentials: 'include'
        });
        if (response.ok) {
          const rooms = await response.json();
          const room = rooms.find((r: any) => r.id === message.roomId);
          if (room) {
            roomName = room.name;
          }
        }
      } catch (error) {
        // 채팅방 정보 가져오기 실패는 무시
      }

      notificationService.showChatNotification(
        message.senderName || '알 수 없는 사용자',
        message.content,
        roomName
      );
    } catch (error) {
      console.error('Failed to show desktop notification:', error);
    }
  }

  /**
   * 로그아웃 시 연결 해제
   */
  public disconnect() {
    if (this.isConnected) {
      websocketService.disconnect();
      this.isConnected = false;
      this.currentUser = null;
      console.log('Global notification service disconnected');
    }
  }

  /**
   * 현재 연결 상태 확인
   */
  public isWebSocketConnected(): boolean {
    return this.isConnected && websocketService.isConnected();
  }
}

// 싱글톤 인스턴스
export const globalNotificationService = new GlobalNotificationService();