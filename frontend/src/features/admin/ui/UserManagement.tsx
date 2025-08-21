import React from 'react';

export interface User {
  id: number;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

interface UserManagementProps {
  users: User[];
  onUpdateUserStatus: (userId: number, status: string) => void;
  onUpdateUserRole: (userId: number, role: string) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  users,
  onUpdateUserStatus,
  onUpdateUserRole
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'text-green-600 bg-green-50';
      case 'PENDING': return 'text-yellow-600 bg-yellow-50';
      case 'REJECTED': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'text-purple-600 bg-purple-50';
      case 'USER': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return '관리자';
      case 'USER': return '일반 사용자';
      default: return role;
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">사용자 목록</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                이메일
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                역할
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                상태
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                가입일
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                작업
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                    {getRoleLabel(user.role)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex flex-col space-y-1">
                    {/* 상태 변경 버튼 */}
                    <div className="flex space-x-2">
                      {user.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => onUpdateUserStatus(user.id, 'APPROVED')}
                            className="text-green-600 hover:text-green-900"
                          >
                            승인
                          </button>
                          <button
                            onClick={() => onUpdateUserStatus(user.id, 'REJECTED')}
                            className="text-red-600 hover:text-red-900"
                          >
                            거부
                          </button>
                        </>
                      )}
                      {user.status === 'APPROVED' && (
                        <button
                          onClick={() => onUpdateUserStatus(user.id, 'REJECTED')}
                          className="text-red-600 hover:text-red-900"
                        >
                          차단
                        </button>
                      )}
                      {user.status === 'REJECTED' && (
                        <button
                          onClick={() => onUpdateUserStatus(user.id, 'APPROVED')}
                          className="text-green-600 hover:text-green-900"
                        >
                          재승인
                        </button>
                      )}
                    </div>
                    
                    {/* 역할 변경 버튼 */}
                    {user.status === 'APPROVED' && (
                      <div className="flex space-x-2">
                        {user.role === 'USER' && (
                          <button
                            onClick={() => onUpdateUserRole(user.id, 'ADMIN')}
                            className="text-purple-600 hover:text-purple-900 text-xs"
                          >
                            관리자로 승격
                          </button>
                        )}
                        {user.role === 'ADMIN' && (
                          <button
                            onClick={() => onUpdateUserRole(user.id, 'USER')}
                            className="text-blue-600 hover:text-blue-900 text-xs"
                          >
                            일반 사용자로 변경
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};