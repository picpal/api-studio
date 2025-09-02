import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './components/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { globalNotificationService } from './shared/lib/globalNotificationService';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, login, logout } = useAuth();

  // 사용자 인증 상태 변화 감지하여 전역 알림 서비스 관리
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      // 로그인된 상태에서 전역 알림 서비스 초기화
      globalNotificationService.initialize();
    } else if (!isAuthenticated && !isLoading) {
      // 로그아웃 상태에서 전역 알림 서비스 연결 해제
      globalNotificationService.disconnect();
    }

    // 컴포넌트 언마운트 시 정리
    return () => {
      if (!isAuthenticated) {
        globalNotificationService.disconnect();
      }
    };
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xl font-bold mx-auto mb-4">
            📘
          </div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => {}} />;
  }

  return <Layout />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
