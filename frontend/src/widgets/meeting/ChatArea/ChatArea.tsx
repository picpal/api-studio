import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
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
  onLoadMoreMessages?: (roomId: number) => void;
  onMarkMessagesAsRead?: (roomId: number, lastReadMessageId: number) => void;
  loading?: boolean;
  loadingMore?: boolean;
  hasMoreMessages?: boolean;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  room,
  messages,
  currentUserId,
  onSendMessage,
  onLeaveRoom,
  onDeleteRoom,
  onInviteUser,
  onLoadMoreMessages,
  onMarkMessagesAsRead,
  loading = false,
  loadingMore = false,
  hasMoreMessages = true
}) => {
  const [message, setMessage] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showMessages, setShowMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevScrollHeight = useRef<number>(0);

  const scrollToBottom = (immediate: boolean = false) => {
    if (immediate && messagesContainerRef.current) {
      // 즉시 스크롤 - 애니메이션 없이 바로 이동
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    } else {
      // 부드러운 스크롤
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // 스크롤 위치 유지 (새 메시지 로드 후)
  const maintainScrollPosition = () => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const newScrollHeight = container.scrollHeight;
      const heightDifference = newScrollHeight - prevScrollHeight.current;
      container.scrollTop = container.scrollTop + heightDifference;
      prevScrollHeight.current = newScrollHeight;
    }
  };

  // 위로 스크롤 감지하여 이전 메시지 로드
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current || loadingMore || !hasMoreMessages || !onLoadMoreMessages) return;
    
    const container = messagesContainerRef.current;
    
    // 스크롤이 최상단 근처에 있을 때 이전 메시지 로드
    if (container.scrollTop <= 100) {
      prevScrollHeight.current = container.scrollHeight;
      onLoadMoreMessages(room.id);
    }
  }, [room.id, loadingMore, hasMoreMessages, onLoadMoreMessages]);

  // 읽음 처리를 debounce로 처리
  const debouncedMarkAsRead = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (roomId: number, messageId: number) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          if (onMarkMessagesAsRead) {
            console.log('Marking message as read:', messageId);
            onMarkMessagesAsRead(roomId, messageId);
          }
        }, 500); // 500ms 지연
      };
    })(),
    [onMarkMessagesAsRead]
  );

  // 초기 로드 시 즉시 스크롤을 위한 useLayoutEffect
  useLayoutEffect(() => {
    if (isInitialLoad && messages.length > 0) {
      // DOM 렌더링 직후 즉시 스크롤 (애니메이션 없음)
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        // 스크롤 완료 후 메시지 표시
        setShowMessages(true);
      }
      setIsInitialLoad(false);
    }
  }, [isInitialLoad, messages.length]);

  // 기타 스크롤 처리
  useEffect(() => {
    if (!isInitialLoad && loadingMore) {
      // 이전 메시지 로드 시 스크롤 위치 유지
      setTimeout(maintainScrollPosition, 50);
    } else if (!isInitialLoad && !loadingMore && messages.length > 0) {
      // 초기 로드가 완료된 후 메시지 표시
      if (!showMessages) {
        setShowMessages(true);
      }
      
      // 새 메시지 수신 시 맨 아래로 스크롤 (본인 메시지이거나 현재 하단에 있는 경우)
      const container = messagesContainerRef.current;
      if (container) {
        const isAtBottom = container.scrollHeight - container.clientHeight <= container.scrollTop + 50;
        const lastMessage = messages[messages.length - 1];
        const isMyMessage = Number(lastMessage.senderId) === Number(currentUserId);
        
        if (isMyMessage || isAtBottom) {
          scrollToBottom(false); // 새 메시지는 부드럽게 스크롤
        }
      }
    }
  }, [messages, room.id, currentUserId, isInitialLoad, loadingMore, showMessages]);

  // 읽음 처리를 별도 useEffect로 분리
  useEffect(() => {
    // 메시지가 있고 읽음 처리 함수가 제공된 경우
    if (messages.length > 0 && onMarkMessagesAsRead) {
      // 마지막 메시지 찾기 (본인 메시지가 아닌 것 중 가장 최신)
      let lastUnreadMessage = null;
      for (let i = messages.length - 1; i >= 0; i--) {
        const message = messages[i];
        const isMyMessage = Number(message.senderId) === Number(currentUserId);
        const isSystemMessage = message.messageType === 'SYSTEM' || message.senderId === 0;
        
        if (!isMyMessage && !isSystemMessage && message.id) {
          lastUnreadMessage = message;
          break;
        }
      }
      
      if (lastUnreadMessage) {
        debouncedMarkAsRead(room.id, lastUnreadMessage.id);
      }
    }
  }, [messages, room.id, currentUserId, debouncedMarkAsRead]);

  // 새 채팅방 선택 시 초기 로드 상태 리셋
  useEffect(() => {
    setIsInitialLoad(true);
    setShowMessages(false);
  }, [room.id]);

  // 스크롤 이벤트 리스너 등록
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

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
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4 bg-gray-50 transition-opacity duration-200"
          style={{ opacity: loading && messages.length === 0 ? 0.8 : 1 }}
        >
          {loading && messages.length === 0 ? (
            /* 초기 로딩 시 스켈레톤 */
            <div className="space-y-4 animate-pulse">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={`flex ${i % 3 === 0 ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    i % 3 === 0 ? 'bg-blue-200' : 'bg-gray-200'
                  }`}>
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div 
              className="space-y-4" 
              style={{ opacity: showMessages ? 1 : 0, transition: 'opacity 0.2s ease-in-out' }}
            >
              {/* 이전 메시지 로딩 인디케이터 */}
              {loadingMore && (
                <div className="flex justify-center py-2">
                  <div className="bg-gray-200 text-gray-600 text-sm px-3 py-1 rounded-full">
                    이전 메시지 로딩 중...
                  </div>
                </div>
              )}
              
              {/* 더 이상 메시지가 없을 때 */}
              {!hasMoreMessages && messages.length > 20 && (
                <div className="flex justify-center py-2">
                  <div className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full">
                    채팅방의 처음입니다
                  </div>
                </div>
              )}
            {messages.map((msg, index) => {
              // 시스템 메시지가 아닌 경우에만 senderId 비교
              const isSystemMessage = msg.messageType === 'SYSTEM' || msg.senderId === 0;
              const isMyMessage = !isSystemMessage && Number(msg.senderId) === Number(currentUserId);
              const showDate = index === 0 || 
                formatDate(msg.createdAt) !== formatDate(messages[index - 1].createdAt);
              
              return (
                <div key={`msg-${index}-${msg.id}-${msg.createdAt}`}>
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
          )}
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