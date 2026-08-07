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

/**
 * 会话在使用中失效的兜底钩子：任一「带鉴权」请求（`auth` 默认 true）拿到 401 时触发，
 * 由 `AuthContext` 注册以清本地 token + 登出（RootNav 随之弹回登录）。集中在 `apiFetch` 一处，
 * 使任一屏遇到过期/吊销会话都会被送回登录，而非卡在「看似已登录、实则每个请求都 401」的空壳。
 * 登录/注册走 `auth:false`，其 401 是凭证错、不在此登出。
 */
type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
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
    // 带鉴权请求的 401 = 会话已失效（过期/吊销/服务端重置）→ 通知上层登出。
    // 凭证错的 401 只出现在登录/注册（auth:false），不触发。
    if (res.status === 401 && auth) unauthorizedHandler?.();
    throw new ApiError(
      res.status,
      err?.code ?? 'unknown',
      err?.message ?? `请求失败 (${res.status})`,
      err?.fields,
    );
  }
  return (body as ApiSuccess<T>).data;
}
