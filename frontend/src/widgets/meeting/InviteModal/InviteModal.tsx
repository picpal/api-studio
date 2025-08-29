import React, { useState } from 'react';
import { Button } from '../../../shared/ui';
import { User } from '../../../entities/meeting';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInviteUser: (user: User) => void;
  availableUsers: User[];
}

export const InviteModal: React.FC<InviteModalProps> = ({
  isOpen,
  onClose,
  onInviteUser,
  availableUsers
}) => {
  const [searchUser, setSearchUser] = useState('');

  const filteredUsers = (availableUsers || []).filter(user =>
    user.email.toLowerCase().includes(searchUser.toLowerCase())
  );

  const handleInvite = (user: User) => {
    onInviteUser(user);
    setSearchUser('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-96 max-h-96">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">유저 초대</h3>
            <button
              onClick={onClose}
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
                onClick={() => handleInvite(user)}
              >
                <div>
                  <p className="font-medium text-gray-800">{user.email}</p>
                  <p className="text-sm text-gray-500">{user.role}</p>
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
  );
};