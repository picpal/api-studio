export interface User {
  id: number;
  email: string;
  role: string;
  status: string;
}

export interface Participant {
  userId: number;
  userName: string;
  email: string;
  joinedAt: string;
  lastReadMessageId?: number;
}

export interface Message {
  id: number;
  roomId: number;
  senderId: number;
  senderName: string;
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
  createdAt: string;
}

export interface ChatRoom {
  id: number;
  name: string;
  description?: string;
  roomType: 'DIRECT' | 'GROUP';
  participants: Participant[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoomRequest {
  name?: string;
  description?: string;
  roomType: 'DIRECT' | 'GROUP';
  participantIds: number[];
}

export interface SendMessageRequest {
  content: string;
}

// Legacy types for backward compatibility
export type DMRoom = ChatRoom;