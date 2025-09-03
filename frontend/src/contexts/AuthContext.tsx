import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../services/api';

interface User {
  id: number;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authReady: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  const checkAuth = async () => {
    try {
      const data = await authApi.me();
      setUser(data.user);
      setAuthReady(true);
      console.log('🔐 Auth check successful, session ready');
    } catch (error) {
      setUser(null);
      setAuthReady(false);
      console.log('🔐 Auth check failed');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔑 Starting login process...');
      const data = await authApi.login(email, password);
      setUser(data.user);
      console.log('🔑 Login API successful, verifying session...');
      
      // 로그인 후 세션이 실제로 준비되었는지 확인
      setTimeout(async () => {
        try {
          await authApi.me(); // 세션 검증
          setAuthReady(true);
          console.log('🔑 Session verified, ready for API calls');
        } catch (error) {
          console.log('🔑 Session verification failed, retrying...');
          // 재시도 로직
          setTimeout(async () => {
            try {
              await authApi.me();
              setAuthReady(true);
              console.log('🔑 Session verified on retry');
            } catch (err) {
              console.error('🔑 Session verification failed completely');
              setAuthReady(false);
            }
          }, 500);
        }
      }, 100);
      
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      console.log('🔒 Starting logout...');
      await authApi.logout();
    } catch (error) {
      // Logout failed
    } finally {
      setUser(null);
      setAuthReady(false);
      console.log('🔒 Logout complete, auth cleared');
    }
  };

  useEffect(() => {
    checkAuth();

    // 401 에러 발생 시 자동 로그아웃 처리
    const handleAuthError = () => {
      console.log('🚨 Auth error detected, clearing auth state');
      setUser(null);
      setAuthReady(false);
    };

    window.addEventListener('auth-error', handleAuthError);

    return () => {
      window.removeEventListener('auth-error', handleAuthError);
    };
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    authReady,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};