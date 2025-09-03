import React, { useState } from 'react';
import { createApiUrl, createFetchOptions } from '../../../config/api';

interface ApiKey {
  id: number;
  keyName: string;
  maskedKey: string;
  description: string;
  user: {
    id: number;
    email: string;
    role: string;
  };
  allowedFolderIds: number[];
  createdAt: string;
  expiresAt: string | null;
  isActive: boolean;
}

interface User {
  id: number;
  email: string;
  role: string;
}

interface Folder {
  id: number;
  name: string;
}

interface ApiKeyManagementProps {
  users: User[];
  folders: Folder[];
}

export const ApiKeyManagement: React.FC<ApiKeyManagementProps> = ({
  users,
  folders
}) => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [keyName, setKeyName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFolders, setSelectedFolders] = useState<number[]>([]);
  const [expiresAt, setExpiresAt] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const handleCreateApiKey = async () => {
    if (!selectedUser || !keyName.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(createApiUrl('/admin/api-keys'), createFetchOptions({
        method: 'POST',
        body: JSON.stringify({
          userId: selectedUser,
          keyName,
          description,
          allowedFolderIds: selectedFolders,
          expiresAt: expiresAt || null
        })
      }));

      if (response.ok) {
        const data = await response.json();
        setGeneratedKey(data.keyValue);
        loadApiKeys();
        resetForm();
      }
    } catch (error) {
      console.error('API 키 생성 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadApiKeys = async () => {
    try {
      const response = await fetch(createApiUrl('/admin/api-keys'), createFetchOptions());
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data);
      }
    } catch (error) {
      console.error('API 키 목록 로드 실패:', error);
    }
  };

  const handleDeleteKey = async (keyId: number) => {
    if (!window.confirm('정말로 이 API 키를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }
    
    try {
      const response = await fetch(createApiUrl(`/admin/api-keys/${keyId}`), createFetchOptions({
        method: 'DELETE'
      }));
      if (response.ok) {
        loadApiKeys();
      }
    } catch (error) {
      console.error('API 키 삭제 실패:', error);
    }
  };

  const resetForm = () => {
    setSelectedUser(null);
    setKeyName('');
    setDescription('');
    setSelectedFolders([]);
    setExpiresAt('');
    setShowCreateModal(false);
  };

  const toggleFolder = (folderId: number) => {
    setSelectedFolders(prev =>
      prev.includes(folderId)
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  };

  React.useEffect(() => {
    loadApiKeys();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-800">API 키 관리</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          새 API 키 생성
        </button>
      </div>

      {/* API 키 목록 */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">키 이름</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">사용자</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">키 접두사</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">허용 폴더</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">생성일</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작업</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {apiKeys.map((key) => (
              <tr key={key.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {key.keyName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {key.user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                  {key.maskedKey}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {key.allowedFolderIds.length === 0 ? '모든 폴더' : `${key.allowedFolderIds.length}개 폴더`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(key.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    key.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {key.isActive ? '활성' : '비활성'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleDeleteKey(key.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">새 API 키 생성</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  사용자 선택
                </label>
                <select
                  value={selectedUser || ''}
                  onChange={(e) => setSelectedUser(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">사용자를 선택하세요</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.email} ({user.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  키 이름
                </label>
                <input
                  type="text"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="예: 테스트용 API 키"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  설명
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-20"
                  placeholder="API 키 사용 목적을 설명하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  접근 허용 폴더 (선택하지 않으면 모든 폴더 접근 가능)
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {folders.map((folder) => (
                    <label key={folder.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedFolders.includes(folder.id)}
                        onChange={() => toggleFolder(folder.id)}
                        className="mr-2"
                      />
                      <span className="text-sm">{folder.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  만료일 (선택사항)
                </label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={resetForm}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleCreateApiKey}
                disabled={loading || !selectedUser || !keyName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'API 키 생성'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 생성된 키 표시 모달 */}
      {generatedKey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-green-600">API 키가 생성되었습니다!</h3>
            <div className="bg-gray-100 p-4 rounded-md mb-4">
              <p className="text-sm text-gray-600 mb-2">생성된 API 키:</p>
              <code className="text-sm font-mono bg-white p-2 rounded border block break-all">
                {generatedKey}
              </code>
            </div>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <p className="text-sm text-yellow-700">
                <strong>주의:</strong> 이 키는 다시 표시되지 않습니다. 안전한 곳에 저장하세요.
              </p>
            </div>
            <button
              onClick={() => setGeneratedKey(null)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
};