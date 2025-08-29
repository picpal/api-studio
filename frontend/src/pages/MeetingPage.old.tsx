import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../shared/ui';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface Message {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: Date;
}

interface DMRoom {
  id: string;
  name: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
}

export const MeetingPage: React.FC = () => {
  const [selectedRoom, setSelectedRoom] = useState<DMRoom | null>(null);
  const [message, setMessage] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchUser, setSearchUser] = useState('');
  const [showRoomOptions, setShowRoomOptions] = useState(false);
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [selectedUsersForRoom, setSelectedUsersForRoom] = useState<User[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock 데이터
  const [dmRooms, setDmRooms] = useState<DMRoom[]>([
    {
      id: '1',
      name: 'John Doe',
      participants: [
        { id: '1', name: 'John Doe', email: 'john@example.com' },
        { id: '2', name: 'Me', email: 'me@example.com' }
      ],
      lastMessage: {
        id: '1',
        userId: '1',
        userName: 'John Doe',
        content: '안녕하세요! API 테스트 관련 문의가 있어서 연락드립니다.',
        timestamp: new Date('2024-01-15T10:30:00')
      },
      unreadCount: 2
    },
    {
      id: '2',
      name: 'Jane Smith',
      participants: [
        { id: '3', name: 'Jane Smith', email: 'jane@example.com' },
        { id: '2', name: 'Me', email: 'me@example.com' }
      ],
      lastMessage: {
        id: '2',
        userId: '3',
        userName: 'Jane Smith',
        content: 'Pipeline 설정 완료했어요!',
        timestamp: new Date('2024-01-15T09:15:00')
      },
      unreadCount: 0
    }
  ]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      userId: '1',
      userName: 'John Doe',
      content: '안녕하세요! API 테스트 관련 문의가 있어서 연락드립니다.',
      timestamp: new Date('2024-01-15T10:30:00')
    },
    {
      id: '2',
      userId: '2',
      userName: 'Me',
      content: '네, 무엇을 도와드릴까요?',
      timestamp: new Date('2024-01-15T10:32:00')
    },
    {
      id: '3',
      userId: '1',
      userName: 'John Doe',
      content: 'Pipeline 실행 시 변수 전달이 잘 안되는 것 같아요.',
      timestamp: new Date('2024-01-15T10:35:00')
    }
  ]);

  const availableUsers: User[] = [
    { id: '4', name: 'Mike Johnson', email: 'mike@example.com' },
    { id: '5', name: 'Sarah Wilson', email: 'sarah@example.com' },
    { id: '6', name: 'David Lee', email: 'david@example.com' }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!message.trim() || !selectedRoom) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      userId: '2',
      userName: 'Me',
      content: message.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setMessage('');

    // 선택된 방의 lastMessage 업데이트
    setDmRooms(prev => prev.map(room => 
      room.id === selectedRoom.id 
        ? { ...room, lastMessage: newMessage }
        : room
    ));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleInviteUser = (user: User) => {
    if (!selectedRoom) return;
    
    // 이미 참여중인지 확인
    const isAlreadyParticipant = selectedRoom.participants.some(p => p.id === user.id);
    if (isAlreadyParticipant) return;

    // 참여자 추가
    setDmRooms(prev => prev.map(room => 
      room.id === selectedRoom.id
        ? { 
            ...room, 
            participants: [...room.participants, user],
            name: room.participants.length === 2 ? `${room.name}, ${user.name}` : `${room.name}, ${user.name}`
          }
        : room
    ));

    setShowInviteModal(false);
    setSearchUser('');
  };

  const handleLeaveRoom = () => {
    if (!selectedRoom) return;
    
    if (confirm('정말로 이 채팅방을 나가시겠습니까?')) {
      // 현재 유저를 참여자에서 제거
      const updatedParticipants = selectedRoom.participants.filter(p => p.id !== '2');
      
      if (updatedParticipants.length === 0) {
        // 참여자가 없으면 방 삭제
        setDmRooms(prev => prev.filter(room => room.id !== selectedRoom.id));
        setSelectedRoom(null);
      } else {
        // 참여자가 있으면 업데이트
        setDmRooms(prev => prev.map(room => 
          room.id === selectedRoom.id
            ? { ...room, participants: updatedParticipants }
            : room
        ));
        
        // 선택된 방도 업데이트
        setSelectedRoom({ ...selectedRoom, participants: updatedParticipants });
      }
      
      setShowRoomOptions(false);
    }
  };

  const handleDeleteRoom = () => {
    if (!selectedRoom) return;
    
    if (confirm('⚠️ 채팅방을 완전히 삭제하시겠습니까?\n모든 메시지와 데이터가 영구적으로 삭제됩니다.')) {
      // 방과 메시지 완전 삭제
      setDmRooms(prev => prev.filter(room => room.id !== selectedRoom.id));
      setMessages([]);
      setSelectedRoom(null);
      setShowRoomOptions(false);
      
      // 삭제 완료 알림
      alert('채팅방이 삭제되었습니다.');
    }
  };

  const handleCreateRoom = () => {
    if (!newRoomName.trim() || selectedUsersForRoom.length === 0) return;

    const newRoom: DMRoom = {
      id: Date.now().toString(),
      name: newRoomName.trim(),
      participants: [
        { id: '2', name: 'Me', email: 'me@example.com' },
        ...selectedUsersForRoom
      ],
      unreadCount: 0
    };

    setDmRooms(prev => [newRoom, ...prev]);
    setSelectedRoom(newRoom);
    
    // 모달 초기화
    setShowCreateRoomModal(false);
    setNewRoomName('');
    setSelectedUsersForRoom([]);
  };

  const handleToggleUserSelection = (user: User) => {
    setSelectedUsersForRoom(prev => {
      const isSelected = prev.some(u => u.id === user.id);
      if (isSelected) {
        return prev.filter(u => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const filteredUsers = availableUsers.filter(user =>
    user.name.toLowerCase().includes(searchUser.toLowerCase()) ||
    user.email.toLowerCase().includes(searchUser.toLowerCase())
  );

  return (
    <div className="flex h-full bg-white">
      {/* 사이드바 - DM 목록 */}
      <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
        <div className="p-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-md font-semibold text-gray-800">Direct Messages</h2>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowCreateRoomModal(true)}
              className="flex items-center gap-1"
            >
              <span>+</span>
              새 채팅
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {dmRooms.map(room => (
            <div
              key={room.id}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-white transition-colors ${
                selectedRoom?.id === room.id ? 'bg-white border-l-4 border-l-blue-500' : ''
              }`}
              onClick={() => setSelectedRoom(room)}
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
                    {formatTime(room.lastMessage.timestamp)}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 메인 컨텐츠 - 채팅 영역 */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            {/* 채팅 헤더 */}
            <div className="px-6 py-4 border-b border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* 채팅방 아바타 */}
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {selectedRoom.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{selectedRoom.name}</h2>
                    <p className="text-sm text-gray-500">
                      {selectedRoom.participants.length}명 참여 • 활성
                    </p>
                  </div>
                </div>
                {/* 옵션 메뉴 */}
                <div className="relative">
                    <button
                      onClick={() => setShowRoomOptions(!showRoomOptions)}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                  {showRoomOptions && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-40">
                      <button
                        onClick={() => {
                          setShowInviteModal(true);
                          setShowRoomOptions(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <span>👥</span>
                        유저 초대
                      </button>
                      <hr className="my-1 border-gray-200" />
                      <button
                        onClick={handleLeaveRoom}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <span>🚪</span>
                        나가기
                      </button>
                      <button
                        onClick={handleDeleteRoom}
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
                  const isMyMessage = msg.userId === '2';
                  const showDate = index === 0 || 
                    formatDate(msg.timestamp) !== formatDate(messages[index - 1].timestamp);
                  
                  return (
                    <div key={msg.id}>
                      {showDate && (
                        <div className="text-center text-xs text-gray-500 my-4">
                          {formatDate(msg.timestamp)}
                        </div>
                      )}
                      <div className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isMyMessage 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-white text-gray-800 border border-gray-200'
                        }`}>
                          {!isMyMessage && (
                            <p className="text-xs font-medium mb-1 text-gray-600">
                              {msg.userName}
                            </p>
                          )}
                          <p className="text-sm">{msg.content}</p>
                          <p className={`text-xs mt-1 ${
                            isMyMessage ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {formatTime(msg.timestamp)}
                          </p>
                        </div>
                      </div>
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
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                >
                  전송
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">DM을 선택하세요</h3>
              <p className="text-sm text-gray-500">
                좌측에서 채팅방을 선택하여 대화를 시작하세요
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 유저 초대 모달 */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-96 max-h-96">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">유저 초대</h3>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <input
                type="text"
                placeholder="이름 또는 이메일로 검색..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <div className="max-h-48 overflow-y-auto">
                {filteredUsers.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                    onClick={() => handleInviteUser(user)}
                  >
                    <div>
                      <p className="font-medium text-gray-800">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <Button variant="secondary" size="sm">
                      초대
                    </Button>
                  </div>
                ))}
                {filteredUsers.length === 0 && (
                  <p className="text-center text-gray-500 py-4">
                    검색 결과가 없습니다
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 채팅방 생성 모달 */}
      {showCreateRoomModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-96 max-h-96">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">새 채팅방 만들기</h3>
                <button
                  onClick={() => {
                    setShowCreateRoomModal(false);
                    setNewRoomName('');
                    setSelectedUsersForRoom([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  채팅방 이름
                </label>
                <input
                  type="text"
                  placeholder="채팅방 이름을 입력하세요"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  참여자 선택 ({selectedUsersForRoom.length}명 선택됨)
                </label>
                <div className="max-h-32 overflow-y-auto border border-gray-200 rounded">
                  {availableUsers.map(user => {
                    const isSelected = selectedUsersForRoom.some(u => u.id === user.id);
                    return (
                      <div
                        key={user.id}
                        className={`flex items-center justify-between p-2 hover:bg-gray-50 cursor-pointer ${
                          isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                        }`}
                        onClick={() => handleToggleUserSelection(user)}
                      >
                        <div>
                          <p className="font-medium text-gray-800">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                        }`}>
                          {isSelected && <span className="text-white text-xs">✓</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowCreateRoomModal(false);
                    setNewRoomName('');
                    setSelectedUsersForRoom([]);
                  }}
                >
                  취소
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateRoom}
                  disabled={!newRoomName.trim() || selectedUsersForRoom.length === 0}
                >
                  생성
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 클릭 시 옵션 메뉴 닫기 */}
      {showRoomOptions && (
        <div 
          className="fixed inset-0 z-5"
          onClick={() => setShowRoomOptions(false)}
        />
      )}
    </div>
  );
};