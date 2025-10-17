import { useEffect } from 'react';
import { websocketService } from '../../meeting-management/api/websocketService';

interface UiTestUpdate {
  fileId: number;
  status: 'UPLOADED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  result: string;
  timestamp: number;
}

export const useUiTestWebSocket = (
  onUpdate: (update: UiTestUpdate) => void
) => {
  useEffect(() => {
    // WebSocket이 연결되어 있지 않으면 연결
    if (!websocketService.isConnected()) {
      websocketService.connect();
    }

    // UI 테스트 업데이트 구독
    const subscription = websocketService['client']?.subscribe(
      '/topic/ui-test-updates',
      (message: any) => {
        const update: UiTestUpdate = JSON.parse(message.body);
        console.log('Received UI test update:', update);
        onUpdate(update);
      }
    );

    return () => {
      // 구독 해제
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [onUpdate]);
};
