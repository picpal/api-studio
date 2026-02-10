import { Client, IFrame, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

type Subscription = {
  unsubscribe: () => void;
};

class UiTestWebSocketService {
  private client: Client | null = null;
  private connected = false;
  private subscriptions: Map<string, Subscription> = new Map();

  connect(): void {
    if (this.client && this.connected) {
      return;
    }

    this.client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:3020/ws/chat'),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: (frame: IFrame) => {
        console.log('[UiTestWebSocket] Connected:', frame);
        this.connected = true;
      },
      onDisconnect: (frame: IFrame) => {
        console.log('[UiTestWebSocket] Disconnected:', frame);
        this.connected = false;
      },
      onStompError: (frame: IFrame) => {
        console.error('[UiTestWebSocket] STOMP error:', frame);
      },
    });

    this.client.activate();
  }

  disconnect(): void {
    if (this.client) {
      // Unsubscribe all
      this.subscriptions.forEach((sub) => {
        sub.unsubscribe();
      });
      this.subscriptions.clear();

      this.client.deactivate();
      this.client = null;
      this.connected = false;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  subscribe(destination: string, callback: (message: IMessage) => void): Subscription | null {
    if (!this.client || !this.connected) {
      console.warn('[UiTestWebSocket] Cannot subscribe: not connected');
      return null;
    }

    const subscription = this.client.subscribe(destination, callback);
    this.subscriptions.set(destination, subscription);

    return subscription;
  }

  unsubscribe(destination: string): void {
    const subscription = this.subscriptions.get(destination);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(destination);
    }
  }

  getClient(): Client | null {
    return this.client;
  }
}

export const uiTestWebSocketService = new UiTestWebSocketService();
