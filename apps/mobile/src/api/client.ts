import { getToken } from '../auth/token';
import { joinApiUrl } from './url';

/** EAS 通过 EXPO_PUBLIC_API_URL 注入（局域网 http 地址，见 ADR 0002）。 */
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export function apiUrl(path: string): string {
  return joinApiUrl(BASE_URL, path);
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface FetchOptions extends RequestInit {
  /** 默认带上 Authorization；注册/登录传 false。 */
  auth?: boolean;
}

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { auth = true, headers: initHeaders, ...rest } = options;
  const headers = new Headers(initHeaders);
  headers.set('Content-Type', 'application/json');
  if (auth) {
    const token = await getToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(apiUrl(path), { ...rest, headers });
  const text = await res.text();
  const body: unknown = text ? JSON.parse(text) : {};

  if (!res.ok) {
    const err = (body as { error?: { code?: string; message?: string } }).error;
    throw new ApiError(res.status, err?.code ?? 'unknown', err?.message ?? `请求失败 (${res.status})`);
  }
  return body as T;
}
