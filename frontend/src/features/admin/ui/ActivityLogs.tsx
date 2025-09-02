import React from 'react';
import { useActivityLogs } from '../model/useActivityLogs';

export const ActivityLogs: React.FC = () => {
  const {
    activities,
    loading,
    currentPage,
    totalPages,
    totalElements,
    pageSize,
    filters,
    activityTypes,
    resultColors,
    updateFilter,
    handleSearch,
    handleClearFilters,
    handlePageChange,
    handleExcelDownload
  } = useActivityLogs();

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

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 10;
    let startPage = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(0, endPage - maxVisiblePages + 1);
    }

    // 이전 페이지 버튼
    if (currentPage > 0) {
      pages.push(
        <button
          key="prev"
          onClick={() => handlePageChange(currentPage - 1)}
          className="px-3 py-2 text-sm bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md"
        >
          이전
        </button>
      );
    }

    // 페이지 번호 버튼들
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-2 text-sm border rounded-md ${
            i === currentPage
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {i + 1}
        </button>
      );
    }

    // 다음 페이지 버튼
    if (currentPage < totalPages - 1) {
      pages.push(
        <button
          key="next"
          onClick={() => handlePageChange(currentPage + 1)}
          className="px-3 py-2 text-sm bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md"
        >
          다음
        </button>
      );
    }

    return (
      <div className="flex justify-center items-center space-x-1 mt-6">
        {pages}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">사용자 활동 로그</h2>
      
      {/* 검색 필터 */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">시작 날짜</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => updateFilter('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">종료 날짜</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => updateFilter('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">사용자 이메일</label>
            <input
              type="text"
              value={filters.userEmail}
              onChange={(e) => updateFilter('userEmail', e.target.value)}
              placeholder="사용자 이메일 검색..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">활동 유형</label>
            <select
              value={filters.activityType}
              onChange={(e) => updateFilter('activityType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체</option>
              {activityTypes.map(type => (
                <option key={type} value={type}>{getActivityTypeLabel(type)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">검색어</label>
            <input
              type="text"
              value={filters.searchTerm}
              onChange={(e) => updateFilter('searchTerm', e.target.value)}
              placeholder="활동 설명, URI 등..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end space-x-2">
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              검색
            </button>
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              초기화
            </button>
            <button
              onClick={handleExcelDownload}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Excel 다운로드
            </button>
          </div>
        </div>
      </div>

      {/* 통계 정보 */}
      <div className="mb-4 text-sm text-gray-600">
        총 {totalElements}개의 활동 로그 (페이지 {currentPage + 1} / {totalPages})
      </div>

      {/* 활동 로그 테이블 */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-600">로딩 중...</div>
        </div>
      ) : totalElements === 0 && !loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-center text-gray-500">
            <div className="text-lg mb-2">📋</div>
            <div>활동 로그에 접근할 권한이 없거나 데이터가 없습니다.</div>
            <div className="text-sm mt-1">관리자 권한이 필요합니다.</div>
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    시간
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    사용자
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    활동 유형
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    설명
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    결과
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    IP 주소
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {activities.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      검색 조건에 맞는 활동 로그가 없습니다.
                    </td>
                  </tr>
                ) : (
                  activities.map((activity) => (
                    <tr key={activity.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 border-b">
                        {formatDate(activity.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 border-b">
                        {activity.userEmail}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 border-b">
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {getActivityTypeLabel(activity.activityType)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 border-b max-w-xs truncate" title={activity.actionDescription}>
                        {activity.actionDescription}
                        {activity.requestUri && (
                          <div className="text-xs text-gray-500 mt-1">
                            {activity.httpMethod} {activity.requestUri}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm border-b">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${resultColors[activity.result as keyof typeof resultColors] || 'text-gray-600 bg-gray-100'}`}>
                          {getResultLabel(activity.result)}
                        </span>
                        {activity.errorMessage && (
                          <div className="text-xs text-red-600 mt-1" title={activity.errorMessage}>
                            {activity.errorMessage.substring(0, 50)}...
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 border-b">
                        {activity.ipAddress}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          {renderPagination()}
        </>
      )}
    </div>
  );
};