import { useEffect, useRef } from 'react';
import { uiTestWebSocketService } from '../lib/uiTestWebSocketService';

interface UiTestUpdate {
  fileId: number;
  status: 'UPLOADED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  result: string;
  timestamp: number;
}

export const useUiTestWebSocket = (
  onUpdate: (update: UiTestUpdate) => void
) => {
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const connectionAttemptedRef = useRef(false);

  useEffect(() => {
    // WebSocket이 연결되어 있지 않으면 연결
    if (!uiTestWebSocketService.isConnected() && !connectionAttemptedRef.current) {
      connectionAttemptedRef.current = true;
      uiTestWebSocketService.connect();
    }

    // 연결 후 구독 설정 (연결 완료 대기)
    const setupSubscription = () => {
      if (uiTestWebSocketService.isConnected()) {
        const client = uiTestWebSocketService.getClient();
        if (client) {
          subscriptionRef.current = client.subscribe(
            '/topic/ui-test-updates',
            (message) => {
              try {
                const update: UiTestUpdate = JSON.parse(message.body);
                console.log('Received UI test update:', update);
                onUpdate(update);
              } catch (error) {
                console.error('Failed to parse UI test update:', error);
              }
            }
          );
        }
        return true;
      }
      return false;
    };

    // 즉시 시도
    if (!setupSubscription()) {
      // 연결 대기 후 재시도
      const retryInterval = setInterval(() => {
        if (setupSubscription()) {
          clearInterval(retryInterval);
        }
      }, 1000);

      // 30초 후 타임아웃
      const timeout = setTimeout(() => {
        clearInterval(retryInterval);
      }, 30000);

      return () => {
        clearInterval(retryInterval);
        clearTimeout(timeout);
        if (subscriptionRef.current) {
          subscriptionRef.current.unsubscribe();
        }
      };
    }

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [onUpdate]);
};
