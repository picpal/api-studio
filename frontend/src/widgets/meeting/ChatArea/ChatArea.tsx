import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../../../shared/ui';
import { ChatRoom, Message } from '../../../entities/meeting';

interface ChatAreaProps {
  room: ChatRoom;
  messages: Message[];
  currentUserId: number;
  onSendMessage: (content: string) => void;
  onLeaveRoom: () => void;
  onDeleteRoom: () => void;
  onInviteUser: () => void;
  loading?: boolean;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  room,
  messages,
  currentUserId,
  onSendMessage,
  onLeaveRoom,
  onDeleteRoom,
  onInviteUser,
  loading = false
}) => {
  const [message, setMessage] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!message.trim()) return;
    onSendMessage(message);
    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      <div className="flex-1 flex flex-col">
        {/* 채팅 헤더 */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">{room.name}</h2>
              <p className="text-sm text-gray-500">
                {room.participants.map(p => p.userName).join(', ')}
              </p>
            </div>
            <div className="relative">
              <Button
                variant="secondary"
                onClick={() => setShowOptions(!showOptions)}
                className="flex items-center gap-1"
              >
                <span>⋮</span>
              </Button>
              {showOptions && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-40">
                  <button
                    onClick={() => {
                      onInviteUser();
                      setShowOptions(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span>👥</span>
                    유저 초대
                  </button>
                  <hr className="my-1 border-gray-200" />
                  <button
                    onClick={() => {
                      onLeaveRoom();
                      setShowOptions(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span>🚪</span>
                    나가기
                  </button>
                  <button
                    onClick={() => {
                      onDeleteRoom();
                      setShowOptions(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <span>💥</span>
                    채팅방 삭제
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 채팅 메시지 */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          <div className="space-y-4">
            {messages.map((msg, index) => {
              // 시스템 메시지가 아닌 경우에만 senderId 비교
              const isSystemMessage = msg.messageType === 'SYSTEM' || msg.senderId === 0;
              const isMyMessage = !isSystemMessage && Number(msg.senderId) === Number(currentUserId);
              const showDate = index === 0 || 
                formatDate(msg.createdAt) !== formatDate(messages[index - 1].createdAt);
              
              return (
                <div key={msg.id || `msg-${index}-${msg.createdAt}`}>
                  {showDate && (
                    <div className="text-center text-xs text-gray-500 my-4">
                      {formatDate(msg.createdAt)}
                    </div>
                  )}
                  {isSystemMessage ? (
                    // 시스템 메시지는 중앙에 표시
                    <div className="flex justify-center my-2">
                      <div className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full">
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    // 일반 메시지
                    <div className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        isMyMessage 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-white text-gray-800 border border-gray-200'
                      }`}>
                        {!isMyMessage && (
                          <p className="text-xs font-medium mb-1 text-gray-600">
                            {msg.senderName}
                          </p>
                        )}
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-xs mt-1 ${
                          isMyMessage ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* 메시지 입력 */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex gap-2">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="메시지를 입력하세요..."
              className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={1}
            />
            <Button
              variant="primary"
              onClick={handleSend}
              disabled={!message.trim() || loading}
            >
              {loading ? '전송중...' : '전송'}
            </Button>
          </div>
        </div>
      </div>

      {/* 클릭 시 옵션 메뉴 닫기 */}
      {showOptions && (
        <div 
          className="fixed inset-0 z-5"
          onClick={() => setShowOptions(false)}
        />
      )}
    </>
  );
};