/**
 * 브라우저 알림 유틸리티
 */

export class NotificationService {
  private static instance: NotificationService;
  private permission: NotificationPermission = 'default';

  private constructor() {
    this.checkPermission();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * 알림 권한 확인
   */
  private checkPermission() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  /**
   * 알림 권한 요청
   */
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('이 브라우저는 알림을 지원하지 않습니다.');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('알림 권한 요청 실패:', error);
      return false;
    }
  }

  /**
   * 알림 표시
   */
  async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    // 권한이 없으면 요청
    if (this.permission === 'default') {
      const granted = await this.requestPermission();
      if (!granted) return;
    }

    // 권한이 거부되었으면 중단
    if (this.permission === 'denied') {
      return;
    }

    // 페이지가 활성화되어 있고 포커스가 있으면 알림 표시하지 않음
    if (document.hasFocus()) {
      return;
    }

    try {
      const notification = new Notification(title, {
        icon: '/logo192.png', // React 기본 아이콘 사용
        badge: '/logo192.png',
        tag: `chat-${Date.now()}`, // 각 알림마다 고유 태그
        renotify: true, // 태그가 같아도 다시 알림
        requireInteraction: false, // 자동으로 사라짐
        ...options
      });

      // 클릭 시 창 포커스
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // 5초 후 자동으로 닫기
      setTimeout(() => {
        notification.close();
      }, 5000);
    } catch (error) {
      console.error('알림 표시 실패:', error);
    }
  }

  /**
   * 채팅 메시지 알림
   */
  showChatNotification(senderName: string, message: string, roomName?: string) {
    const title = roomName ? `${roomName} - ${senderName}` : senderName;
    this.showNotification(title, {
      body: message,
      icon: '/logo192.png',
      tag: `chat-${Date.now()}`, // 각 메시지마다 고유 태그
    });
  }

  /**
   * 채팅방 초대 알림
   */
  showInvitationNotification(roomName: string, inviterName?: string) {
    const title = '새로운 채팅방 초대';
    const body = inviterName 
      ? `${inviterName}님이 '${roomName}' 채팅방에 초대했습니다.`
      : `'${roomName}' 채팅방에 초대되었습니다.`;
    
    this.showNotification(title, {
      body,
      icon: '/logo192.png',
      tag: `invite-${Date.now()}`,
    });
  }

  /**
   * 알림 권한 상태 확인
   */
  isPermissionGranted(): boolean {
    return this.permission === 'granted';
  }

  /**
   * 알림 지원 여부 확인
   */
  isSupported(): boolean {
    return 'Notification' in window;
  }
}

export const notificationService = NotificationService.getInstance();