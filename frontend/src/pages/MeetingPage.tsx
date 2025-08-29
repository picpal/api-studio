import React, { useState, useEffect } from 'react';
import { ChatRoom, User } from '../entities/meeting';
import { useMeetingData } from '../features/meeting-management';
import { ChatSidebar, ChatArea, InviteModal } from '../widgets/meeting';

export const MeetingPage: React.FC = () => {
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const {
    chatRooms,
    messages,
    availableUsers,
    currentUser,
    loading,
    error,
    createRoom,
    deleteRoom,
    leaveRoom,
    addMessage,
    inviteUser,
    loadMessages,
    clearError
  } = useMeetingData();

  const handleSelectRoom = async (room: ChatRoom) => {
    setSelectedRoom(room);
    await loadMessages(room.id);
  };

  const handleCreateRoom = async (name: string, participants: User[]) => {
    try {
      const newRoom = await createRoom(name, participants);
      setSelectedRoom(newRoom);
    } catch (error) {
      console.error('Failed to create room:', error);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedRoom) return;
    await addMessage(content, selectedRoom.id);
  };

  const handleLeaveRoom = async () => {
    if (!selectedRoom) return;
    
    if (confirm('정말로 이 채팅방을 나가시겠습니까?')) {
      await leaveRoom(selectedRoom.id);
      setSelectedRoom(null);
    }
  };

  const handleDeleteRoom = async () => {
    if (!selectedRoom) return;
    
    if (confirm('⚠️ 채팅방을 완전히 삭제하시겠습니까?\n모든 메시지와 데이터가 영구적으로 삭제됩니다.')) {
      await deleteRoom(selectedRoom.id);
      setSelectedRoom(null);
      alert('채팅방이 삭제되었습니다.');
    }
  };

  const handleInviteUser = async (user: User) => {
    if (!selectedRoom) return;
    
    // 이미 참여중인지 확인
    const isAlreadyParticipant = selectedRoom.participants.some(p => p.userId === user.id);
    if (isAlreadyParticipant) {
      alert('이미 참여중인 사용자입니다.');
      return;
    }

    try {
      await inviteUser(selectedRoom.id, user);
      setShowInviteModal(false);
      alert('사용자가 초대되었습니다.');
    } catch (error) {
      console.error('Failed to invite user:', error);
    }
  };

  // 에러 표시
  useEffect(() => {
    if (error) {
      alert(error);
      clearError();
    }
  }, [error, clearError]);


  return (
    <div className="flex h-full bg-white">
      {loading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <span>로딩중...</span>
            </div>
          </div>
        </div>
      )}
      
      <ChatSidebar
        rooms={chatRooms}
        selectedRoom={selectedRoom}
        onSelectRoom={handleSelectRoom}
        onCreateRoom={handleCreateRoom}
        availableUsers={availableUsers}
      />

      {selectedRoom ? (
        <ChatArea
          room={selectedRoom}
          messages={messages}
          currentUserId={currentUser?.id || 0}
          onSendMessage={handleSendMessage}
          onLeaveRoom={handleLeaveRoom}
          onDeleteRoom={handleDeleteRoom}
          onInviteUser={() => setShowInviteModal(true)}
          loading={loading}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">채팅방을 선택하세요</h3>
            <p className="text-sm text-gray-500">
              좌측에서 채팅방을 선택하여 대화를 시작하거나 새로운 채팅방을 만드세요
            </p>
          </div>
        </div>
      )}

      {/* 유저 초대 모달 */}
      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInviteUser={handleInviteUser}
        availableUsers={availableUsers}
      />
    </div>
  );
};