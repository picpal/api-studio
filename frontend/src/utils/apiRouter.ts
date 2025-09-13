/**
 * API 라우팅 유틸리티
 * 외부 API는 직접 호출, 내부 API는 백엔드 경유
 */

/**
 * 외부 API 여부 확인
 */
export const isExternalApi = (url: string): boolean => {
  return url.startsWith('http://') || url.startsWith('https://');
};

/**
 * Axios 설정 생성
 */
export const createAxiosConfig = (
  method: string,
  url: string,
  params?: Record<string, any>,
  headers?: Record<string, string>,
  data?: any
): any => {
  const isExternal = isExternalApi(url);

  return {
    method: method.toLowerCase(),
    url,
    params,
    headers,
    data,
    // 내부 API만 쿠키 전송 (세션 인증)
    // 외부 API는 CORS 정책에 따름
    withCredentials: !isExternal,
  };
};