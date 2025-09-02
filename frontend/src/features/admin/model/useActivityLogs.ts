import { useState, useEffect } from 'react';
import { UserActivity, ActivityLogsResponse } from '../../../entities/activity-log';
import { api } from '../../../services/api';
import { createApiUrl, createFetchOptions } from '../../../config/api';

export interface ActivityFilters {
  startDate: string;
  endDate: string;
  searchTerm: string;
  activityType: string;
  userEmail: string;
}

export const useActivityLogs = () => {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize] = useState(20);
  
  // 검색 필터
  const [filters, setFilters] = useState<ActivityFilters>({
    startDate: '',
    endDate: '',
    searchTerm: '',
    activityType: '',
    userEmail: ''
  });
  
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
  
  const loadActivities = async (page = 0, newFilters = filters) => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: page.toString(),
        size: pageSize.toString()
      });
      
      if (newFilters.startDate) params.append('startDate', newFilters.startDate);
      if (newFilters.endDate) params.append('endDate', newFilters.endDate);
      if (newFilters.searchTerm) params.append('searchTerm', newFilters.searchTerm);
      if (newFilters.activityType) params.append('activityType', newFilters.activityType);
      if (newFilters.userEmail) params.append('userEmail', newFilters.userEmail);
      
      const url = createApiUrl(`/admin/activities?${params}`);
      const response = await fetch(url, createFetchOptions());
      
      if (response.status === 403) {
        console.warn('Access denied to activity logs - insufficient permissions');
        setActivities([]);
        setTotalPages(0);
        setTotalElements(0);
        return;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ActivityLogsResponse = await response.json();
      
      // API 응답 구조에 맞게 조정
      if (result.content) {
        setActivities(result.content);
        setTotalPages(result.totalPages);
        setTotalElements(result.totalElements);
        setCurrentPage(result.currentPage);
      } else if ((result as any).activities) {
        // 기존 구조 지원
        const legacyResult = result as any;
        setActivities(legacyResult.activities);
        setTotalPages(legacyResult.totalPages);
        setTotalElements(legacyResult.totalElements);
        setCurrentPage(legacyResult.currentPage);
      }
      
    } catch (error) {
      console.error('Failed to load activities:', error);
      setActivities([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  // 초기 로드
  useEffect(() => {
    loadActivities(0, filters);
  }, []);

  const handleSearch = () => {
    setCurrentPage(0);
    loadActivities(0, filters);
  };

  const handleClearFilters = () => {
    const emptyFilters = {
      startDate: '',
      endDate: '',
      searchTerm: '',
      activityType: '',
      userEmail: ''
    };
    setFilters(emptyFilters);
    setCurrentPage(0);
    loadActivities(0, emptyFilters);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadActivities(page, filters);
  };

  const handleExcelDownload = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.searchTerm) params.append('searchTerm', filters.searchTerm);
      if (filters.activityType) params.append('activityType', filters.activityType);
      if (filters.userEmail) params.append('userEmail', filters.userEmail);
      
      const response = await fetch(createApiUrl(`/admin/activities/export?${params}`), createFetchOptions());
      
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
        throw new Error('Excel 파일 다운로드에 실패했습니다.');
      }
    } catch (error) {
      console.error('Excel 다운로드 실패:', error);
      alert('Excel 파일 다운로드에 실패했습니다.');
    }
  };

  const updateFilter = (key: keyof ActivityFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return {
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
    handleExcelDownload,
    reload: () => loadActivities(currentPage, filters)
  };
};