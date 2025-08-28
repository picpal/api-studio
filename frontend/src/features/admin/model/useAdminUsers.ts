import { useState, useEffect } from 'react';
import { User } from '../ui/UserManagement';
import { createApiUrl, createFetchOptions } from '../../../config/api';

export const useAdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await fetch(createApiUrl('/admin/users'), {
        ...createFetchOptions({
          credentials: 'include'
        })
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      // Failed to load users
    } finally {
      setLoading(false);
    }
  };

  const updateUserStatus = async (userId: number, status: string) => {
    try {
      const response = await fetch(createApiUrl(`/admin/users/${userId}/status`), {
        ...createFetchOptions({
          method: 'PUT',
          credentials: 'include',
          body: JSON.stringify({ status })
        })
      });
      
      if (response.ok) {
        loadUsers();
        alert('사용자 상태가 업데이트되었습니다.');
      } else {
        const error = await response.json();
        alert(error.error || '오류가 발생했습니다.');
      }
    } catch (error) {
      alert('서버 오류가 발생했습니다.');
    }
  };

  const updateUserRole = async (userId: number, role: string) => {
    try {
      const response = await fetch(createApiUrl(`/admin/users/${userId}/role`), {
        ...createFetchOptions({
          method: 'PUT',
          credentials: 'include',
          body: JSON.stringify({ role })
        })
      });
      
      if (response.ok) {
        loadUsers();
        alert('사용자 역할이 업데이트되었습니다.');
      } else {
        const error = await response.json();
        alert(error.error || '오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Failed to update user role:', error);
      alert('서버 오류가 발생했습니다.');
    }
  };

  return {
    users,
    loading,
    updateUserStatus,
    updateUserRole,
    reloadUsers: loadUsers
  };
};