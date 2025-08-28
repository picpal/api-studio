import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { createApiUrl, createFetchOptions } from '../config/api';

interface UserActivity {
  id: number;
  userEmail: string;
  activityType: string;
  actionDescription: string;
  requestUri?: string;
  httpMethod?: string;
  ipAddress?: string;
  userAgent?: string;
  result: string;
  errorMessage?: string;
  createdAt: string;
  sessionId?: string;
}

interface ActivityLogsResponse {
  activities: UserActivity[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
  pageSize: number;
}

const ActivityLogs: React.FC = () => {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize] = useState(20);
  
  // 검색 필터
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activityType, setActivityType] = useState('');
  const [userEmail, setUserEmail] = useState('');
  
  const activityTypes = [
    'LOGIN', 'LOGOUT', 'API_CALL', 'PASSWORD_CHANGE', 
    'FOLDER_CREATE', 'FOLDER_UPDATE', 'FOLDER_DELETE',
    'ITEM_CREATE', 'ITEM_UPDATE', 'ITEM_DELETE', 'ADMIN_ACTION'
  ];
  
  const resultColors = {
    SUCCESS: 'text-green-600 bg-green-100',
    FAILURE: 'text-red-600 bg-red-100',
    BLOCKED: 'text-orange-600 bg-orange-100'
  };
  
  const loadActivities = async (page = 0) => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: page.toString(),
        size: pageSize.toString()
      });
      
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (searchTerm) params.append('searchTerm', searchTerm);
      if (activityType) params.append('activityType', activityType);
      if (userEmail) params.append('userEmail', userEmail);
      
      const response = await api.get<ActivityLogsResponse>(`/admin/activities?${params}`);
      
      setActivities(response.data.activities);
      setCurrentPage(response.data.currentPage);
      setTotalPages(response.data.totalPages);
      setTotalElements(response.data.totalElements);
    } catch (error) {
      console.error('활동 로그 로딩 실패:', error);
      alert('활동 로그를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = () => {
    setCurrentPage(0);
    loadActivities(0);
  };
  
  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
    setActivityType('');
    setUserEmail('');
    setCurrentPage(0);
    loadActivities(0);
  };
  
  const handleExcelDownload = async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (searchTerm) params.append('searchTerm', searchTerm);
      if (activityType) params.append('activityType', activityType);
      if (userEmail) params.append('userEmail', userEmail);
      
      const response = await fetch(createApiUrl(`/admin/activities/export?${params}`), {
        ...createFetchOptions({
          method: 'GET',
          credentials: 'include'
        })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `user_activities_${new Date().toISOString().slice(0, 10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Excel 파일 다운로드에 실패했습니다.');
      }
    } catch (error) {
      console.error('Excel 다운로드 실패:', error);
      alert('Excel 파일 다운로드에 실패했습니다.');
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };
  
  const getActivityTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'LOGIN': '로그인',
      'LOGOUT': '로그아웃',
      'API_CALL': 'API 호출',
      'PASSWORD_CHANGE': '비밀번호 변경',
      'FOLDER_CREATE': '폴더 생성',
      'FOLDER_UPDATE': '폴더 수정',
      'FOLDER_DELETE': '폴더 삭제',
      'ITEM_CREATE': '아이템 생성',
      'ITEM_UPDATE': '아이템 수정',
      'ITEM_DELETE': '아이템 삭제',
      'ADMIN_ACTION': '관리자 액션'
    };
    return labels[type] || type;
  };
  
  const getResultLabel = (result: string) => {
    const labels: { [key: string]: string } = {
      'SUCCESS': '성공',
      'FAILURE': '실패',
      'BLOCKED': '차단됨'
    };
    return labels[result] || result;
  };
  
  useEffect(() => {
    loadActivities();
  }, []);
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">사용자 활동 로그</h2>
        <button
          onClick={handleExcelDownload}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Excel 다운로드
        </button>
      </div>
      
      {/* 검색 필터 */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4">검색 필터</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">시작 날짜</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">종료 날짜</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">활동 유형</label>
            <select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">모든 유형</option>
              {activityTypes.map(type => (
                <option key={type} value={type}>{getActivityTypeLabel(type)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">사용자 이메일</label>
            <input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="사용자 이메일"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">검색어</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="검색어 입력"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={handleSearch}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              검색
            </button>
            <button
              onClick={handleReset}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              초기화
            </button>
          </div>
        </div>
      </div>
      
      {/* 결과 통계 */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <p className="text-sm text-gray-600">
          전체 {totalElements}개의 활동 중 {activities.length}개 표시
          {currentPage > 0 && ` (페이지 ${currentPage + 1}/${totalPages})`}
        </p>
      </div>
      
      {/* 활동 로그 테이블 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">사용자</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">활동 유형</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">설명</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP 주소</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">결과</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">시간</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activities.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        활동 로그가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    activities.map((activity) => (
                      <tr key={activity.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {activity.userEmail || '알 수 없음'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                            {getActivityTypeLabel(activity.activityType)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="max-w-xs truncate" title={activity.actionDescription}>
                            {activity.actionDescription}
                          </div>
                          {activity.requestUri && (
                            <div className="text-xs text-gray-500 mt-1">
                              {activity.httpMethod} {activity.requestUri}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {activity.ipAddress || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 text-xs rounded-full ${resultColors[activity.result as keyof typeof resultColors]}`}>
                            {getResultLabel(activity.result)}
                          </span>
                          {activity.errorMessage && (
                            <div className="text-xs text-red-600 mt-1 max-w-xs truncate" title={activity.errorMessage}>
                              {activity.errorMessage}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(activity.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadActivities(currentPage - 1)}
                    disabled={currentPage === 0}
                    className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    이전
                  </button>
                  <span className="text-sm text-gray-700">
                    페이지 {currentPage + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => loadActivities(currentPage + 1)}
                    disabled={currentPage === totalPages - 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    다음
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ActivityLogs;