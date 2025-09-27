import WebSocket, { WebSocketServer } from 'ws';
import { Server } from 'http';
import { Logger } from '../utils/logger';
import { TestExecutionResult, WebSocketMessage } from '../types';

export class WebSocketService {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();

  constructor(server: Server) {
    this.wss = new WebSocketServer({
      server,
      path: '/ws'
    });

    this.wss.on('connection', (ws: WebSocket) => {
      this.handleConnection(ws);
    });

    Logger.info('WebSocket server initialized');
  }

  private handleConnection(ws: WebSocket): void {
    this.clients.add(ws);
    Logger.info(`WebSocket client connected. Total clients: ${this.clients.size}`);

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        this.handleMessage(ws, data);
      } catch (error) {
        Logger.error('Failed to parse WebSocket message', error);
        this.sendError(ws, 'Invalid JSON message');
      }
    });

    ws.on('close', () => {
      this.clients.delete(ws);
      Logger.info(`WebSocket client disconnected. Total clients: ${this.clients.size}`);
    });

    ws.on('error', (error) => {
      Logger.error('WebSocket error', error);
      this.clients.delete(ws);
    });

    this.sendMessage(ws, {
      type: 'connection-established',
      timestamp: new Date().toISOString()
    });
  }

  private handleMessage(ws: WebSocket, data: any): void {
    switch (data.type) {
      case 'ping':
        this.sendMessage(ws, {
          type: 'pong',
          timestamp: new Date().toISOString()
        });
        break;

      case 'subscribe':
        Logger.info('Client subscribed to test execution updates');
        break;

      default:
        Logger.warn('Unknown message type received:', data.type);
    }
  }

  broadcastExecutionStart(result: TestExecutionResult): void {
    const message: WebSocketMessage = {
      type: 'execution-start',
      data: result
    };
    this.broadcast(message);
  }

  broadcastExecutionProgress(result: TestExecutionResult): void {
    const message: WebSocketMessage = {
      type: 'execution-progress',
      data: result
    };
    this.broadcast(message);
  }

  broadcastExecutionComplete(result: TestExecutionResult): void {
    const message: WebSocketMessage = {
      type: 'execution-complete',
      data: result
    };
    this.broadcast(message);
  }

  broadcastExecutionError(result: TestExecutionResult): void {
    const message: WebSocketMessage = {
      type: 'execution-error',
      data: result
    };
    this.broadcast(message);
  }

  private broadcast(message: WebSocketMessage | any): void {
    const messageStr = JSON.stringify({
      ...message,
      timestamp: new Date().toISOString()
    });

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(messageStr);
        } catch (error) {
          Logger.error('Failed to send message to WebSocket client', error);
          this.clients.delete(client);
        }
      }
    });

    Logger.debug(`Broadcasted message to ${this.clients.size} clients:`, message.type);
  }

  private sendMessage(ws: WebSocket, message: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({
          ...message,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        Logger.error('Failed to send message to WebSocket client', error);
      }
    }
  }

  private sendError(ws: WebSocket, error: string): void {
    this.sendMessage(ws, {
      type: 'error',
      message: error
    });
  }

  getConnectedClients(): number {
    return this.clients.size;
  }

  close(): void {
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.close();
      }
    });
    this.wss.close();
    Logger.info('WebSocket server closed');
  }
}