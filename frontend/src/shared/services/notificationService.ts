class NotificationService {
  private hasPermission = false;

  constructor() {
    this.requestPermission();
  }

  showChatNotification(senderName: string, content: string, roomName: string) {
    if (!this.hasPermission || !('Notification' in window)) {
      console.log('Notification permission not granted or not supported');
      return;
    }

    try {
      const notification = new Notification(`${senderName} - ${roomName}`, {
        body: content,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `chat-${roomName}`, // 같은 채팅방의 알림은 하나로 합침
        requireInteraction: false,
        silent: false
      });

      // 5초 후 자동으로 닫기
      setTimeout(() => {
        notification.close();
      }, 5000);

      // 알림 클릭 시 창에 포커스
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  showInvitationNotification(roomName: string) {
    if (!this.hasPermission || !('Notification' in window)) {
      console.log('Notification permission not granted or not supported');
      return;
    }

    try {
      const notification = new Notification('새 채팅방 초대', {
        body: `${roomName}에 초대되었습니다.`,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `invitation-${roomName}`,
        requireInteraction: true,
        silent: false
      });

      // 알림 클릭 시 창에 포커스
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error('Failed to show invitation notification:', error);
    }
  }

  // 알림이 지원되는지 확인
  isSupported(): boolean {
    return 'Notification' in window;
  }

  // 권한이 허용되었는지 확인
  isPermissionGranted(): boolean {
    return this.hasPermission;
  }

  // 권한 상태 확인 (getter)
  get permissionGranted(): boolean {
    return this.hasPermission;
  }

  // 권한 재요청
  async reRequestPermission(): Promise<boolean> {
    await this.requestPermission();
    return this.hasPermission;
  }

  // 권한 요청 (public method)
  async requestPermission(): Promise<boolean> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      this.hasPermission = permission === 'granted';
    }
    return this.hasPermission;
  }
}

// 싱글톤 인스턴스
export const notificationService = new NotificationService();