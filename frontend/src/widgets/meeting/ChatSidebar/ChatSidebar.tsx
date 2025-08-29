import React, { useState } from 'react';
import { Button } from '../../../shared/ui';
import { ChatRoom, User } from '../../../entities/meeting';
import { CreateRoomModal } from '../CreateRoomModal/CreateRoomModal';

interface ChatSidebarProps {
  rooms: ChatRoom[];
  selectedRoom: ChatRoom | null;
  onSelectRoom: (room: ChatRoom) => void;
  onCreateRoom: (name: string, participants: User[]) => void;
  availableUsers: User[];
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  rooms,
  selectedRoom,
  onSelectRoom,
  onCreateRoom,
  availableUsers
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  return (
    <>
      <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Direct Messages</h2>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1"
            >
              <span>+</span>
              새 채팅
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {rooms.map(room => (
            <div
              key={room.id}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-white transition-colors ${
                selectedRoom?.id === room.id ? 'bg-white border-l-4 border-l-blue-500' : ''
              }`}
              onClick={() => onSelectRoom(room)}
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-medium text-gray-900 truncate">{room.name}</h3>
                {room.unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                    {room.unreadCount}
                  </span>
                )}
              </div>
              {room.lastMessage && (
                <>
                  <p className="text-sm text-gray-600 truncate mb-1">
                    {room.lastMessage.content}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatTime(room.lastMessage.createdAt)}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateRoom={onCreateRoom}
        availableUsers={availableUsers}
      />
    </>
  );
};