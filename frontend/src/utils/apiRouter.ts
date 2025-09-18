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

const PG_PROXY_PREFIX = '/pg-proxy';
const DEFAULT_PG_HOSTS = [
  'https://pg.bluewalnut.co.kr',
  'https://devpg.bluewalnut.co.kr',
];

const resolveEnvVar = (key: string): string | undefined => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key] as string;
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return undefined;
};

const PG_HOSTS = (() => {
  const envHost = resolveEnvVar('VITE_PG_BASE_URL');
  if (!envHost) {
    return DEFAULT_PG_HOSTS;
  }

  return [envHost, ...DEFAULT_PG_HOSTS.filter((host) => host !== envHost)];
})();

const isDevEnvironment = (): boolean => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return Boolean(import.meta.env.DEV);
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NODE_ENV === 'development';
  }
  return false;
};

const getProxiedUrl = (url: string): string | null => {
  if (!isDevEnvironment()) {
    return null;
  }

  const matchedHost = PG_HOSTS.find((host) => url.startsWith(host));
  if (!matchedHost) {
    return null;
  }

  return url.replace(matchedHost, PG_PROXY_PREFIX);
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
  const proxiedUrl = isExternal ? getProxiedUrl(url) : null;
  const finalUrl = proxiedUrl || url;

  return {
    method: method.toLowerCase(),
    url: finalUrl,
    params,
    headers,
    data,
    // 내부 API만 쿠키 전송 (세션 인증)
    // 외부 API는 CORS 정책에 따름
    withCredentials: proxiedUrl ? false : !isExternal,
  };
};
