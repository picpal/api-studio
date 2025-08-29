import React, { useState } from 'react';
import { Button } from '../../../shared/ui';
import { User } from '../../../entities/meeting';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (name: string, participants: User[]) => void;
  availableUsers: User[];
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  onCreateRoom,
  availableUsers = []
}) => {
  const [roomName, setRoomName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

  const handleToggleUser = (user: User) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.id === user.id);
      if (isSelected) {
        return prev.filter(u => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleCreate = () => {
    if (!roomName.trim() || selectedUsers.length === 0) return;
    
    onCreateRoom(roomName, selectedUsers);
    
    // Reset form
    setRoomName('');
    setSelectedUsers([]);
    onClose();
  };

  const handleClose = () => {
    setRoomName('');
    setSelectedUsers([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-96 max-h-96">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">새 채팅방 만들기</h3>
            <button
              onClick={handleClose}
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
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              참여자 선택 ({selectedUsers.length}명 선택됨)
            </label>
            <div className="max-h-32 overflow-y-auto border border-gray-200 rounded">
              {availableUsers.map(user => {
                const isSelected = selectedUsers.some(u => u.id === user.id);
                return (
                  <div
                    key={user.id}
                    className={`flex items-center justify-between p-2 hover:bg-gray-50 cursor-pointer ${
                      isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => handleToggleUser(user)}
                  >
                    <div>
                      <p className="font-medium text-gray-800">{user.email}</p>
                      <p className="text-sm text-gray-500">{user.role}</p>
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
            <Button variant="secondary" onClick={handleClose}>
              취소
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              disabled={!roomName.trim() || selectedUsers.length === 0}
            >
              생성
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};