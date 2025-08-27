import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ChangePasswordModal from './ChangePasswordModal';

interface HeaderProps {
  onOpenAdmin?: () => void;
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
  currentPage?: 'api-testing' | 'test-automation' | 'pipeline-management';
  onNavigate?: (page: 'api-testing' | 'test-automation' | 'pipeline-management') => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenAdmin, onToggleSidebar, sidebarCollapsed, currentPage = 'api-testing', onNavigate }) => {
  const { user, logout } = useAuth();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  return (
    <header className="w-full bg-white border-b border-gray-200 px-3 md:px-6 py-2 md:py-4">
      <div className="flex items-center justify-between">
        {/* Logo and Navigation Menu */}
        <div className="flex items-center">
          {/* Logo - Show on tablet and PC */}
          <div className="hidden md:flex items-center mr-8">
            <div className="flex items-center">
              <img 
                src="/logo.png" 
                alt="API Tester Logo" 
                className="w-6 h-6 mr-3"
              />
              <h1 className="text-xl font-bold text-gray-800">API Studio</h1>
            </div>
          </div>

          {/* Mobile Sidebar Toggle - Only on mobile */}
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-1.5 mr-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
            title="Toggle Sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          {/* Navigation Menu - Always visible */}
          {onNavigate && (
            <nav className="flex items-center gap-1">
              <button
                onClick={() => onNavigate('api-testing')}
                className={`px-2 md:px-3 py-2 text-xs md:text-sm font-medium rounded-md transition-colors ${
                  currentPage === 'api-testing'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                API Testing
              </button>
              <button
                onClick={() => onNavigate('test-automation')}
                className={`px-2 md:px-3 py-2 text-xs md:text-sm font-medium rounded-md transition-colors ${
                  currentPage === 'test-automation'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                Test&Report
              </button>
              <button
                onClick={() => onNavigate('pipeline-management')}
                className={`px-2 md:px-3 py-2 text-xs md:text-sm font-medium rounded-md transition-colors ${
                  currentPage === 'pipeline-management'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                Pipelines
              </button>
            </nav>
          )}
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
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
            className="hidden md:block p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="로그아웃"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
          
          {/* Mobile Logout Button */}
          <button
            onClick={logout}
            className="md:hidden p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="로그아웃"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
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