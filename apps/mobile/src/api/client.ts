import type { ApiErrorBody, ApiSuccess } from '@tianji/shared';
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
    /** 字段级校验错误（字段名 → 中文），仅 validation 信封携带。 */
    public fields?: Record<string, string>,
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

  // 统一信封（ADR-0008）：非 2xx → 从 { error } 抛出带 fields 的 ApiError；
  // 2xx → 解包 { data }。各屏成功路径拿到的仍是裸 T，无需改动。
  // 错误信封形状复用共享 ApiErrorBody（服务器可能返回非法体，故按 Partial 宽松取用）。
  if (!res.ok) {
    const err = (body as { error?: Partial<ApiErrorBody['error']> }).error;
    throw new ApiError(
      res.status,
      err?.code ?? 'unknown',
      err?.message ?? `请求失败 (${res.status})`,
      err?.fields,
    );
  }
  return (body as ApiSuccess<T>).data;
}
