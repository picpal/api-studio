import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ChangePasswordModal from './ChangePasswordModal';

interface HeaderProps {
  onOpenAdmin?: () => void;
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onOpenAdmin, onToggleSidebar, sidebarCollapsed }) => {
  const { user, logout } = useAuth();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  return (
    <header className="w-full bg-white border-b border-gray-200 px-3 md:px-6 py-2 md:py-4">
      <div className="flex items-center justify-between">
        {/* Desktop Logo and Title */}
        <div className="hidden md:flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white text-sm font-bold">
            📘
          </div>
          <h1 className="text-xl font-semibold text-gray-800 m-0">Verification Page</h1>
        </div>
        
        {/* Mobile Logo and Menu */}
        <div className="md:hidden flex items-center gap-3">
          {/* Mobile Sidebar Toggle */}
          <button
            onClick={onToggleSidebar}
            className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
            title="Toggle Sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center text-white text-sm font-bold">
            📘
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          {/* Desktop Email */}
          <span className="hidden md:block text-sm text-gray-600">
            {user?.email}
          </span>
          
          {/* Desktop Buttons */}
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
            title="비밀번호 변경"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </button>
          {user?.role === 'ADMIN' && (
            <button
              onClick={onOpenAdmin}
              className="hidden md:block p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="관리자 설정"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          )}
          
          {/* Desktop Logout Button */}
          <button
            onClick={logout}
            className="hidden md:block px-3 py-1.5 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded border border-red-300 transition-colors"
          >
            로그아웃
          </button>
          
          {/* Mobile Logout Button (X only) */}
          <button
            onClick={logout}
            className="md:hidden p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="로그아웃"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      <ChangePasswordModal 
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={() => {
          // 비밀번호 변경 성공 시 추가 작업이 필요하면 여기에 추가
        }}
      />
    </header>
  );
};

export default Header;