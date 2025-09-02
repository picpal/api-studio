export interface UserActivity {
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

export interface ActivityLogsResponse {
  content: UserActivity[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}