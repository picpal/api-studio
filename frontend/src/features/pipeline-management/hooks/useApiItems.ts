import { useState, useEffect } from 'react';
import { ApiItem } from '@/entities/pipeline';
import { pipelineApi } from '../api/pipelineApi';
import { useAuth } from '@/contexts/AuthContext';

export const useApiItems = () => {
  const { isAuthenticated, isLoading: authLoading, authReady } = useAuth();
  const [apiItems, setApiItems] = useState<ApiItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchApiItems = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await pipelineApi.fetchApiItems();
      setApiItems(data);
    } catch (err: any) {
      console.error('Failed to fetch API items:', err);
      // 403 에러는 인증 문제일 수 있으므로 별도 처리하지 않음 (인터셉터에서 처리됨)
      if (err.response?.status === 403) {
        setLoading(false);
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to fetch API items');
    } finally {
      setLoading(false);
    }
  };

  // 인증 상태에 따른 데이터 로드/정리
  useEffect(() => {
    if (isAuthenticated && !authLoading && authReady) {
      fetchApiItems();
    } else if (!isAuthenticated && !authLoading) {
      // 로그아웃 시 데이터 정리
      setApiItems([]);
      setError(null);
      setLoading(false);
    }
  }, [isAuthenticated, authLoading, authReady]);

  // auth-error 이벤트 리스너
  useEffect(() => {
    const handleAuthError = () => {
      setApiItems([]);
      setError(null);
      setLoading(false);
    };

    window.addEventListener('auth-error', handleAuthError);

    return () => {
      window.removeEventListener('auth-error', handleAuthError);
    };
  }, []);

  return {
    apiItems,
    loading,
    error
  };
};