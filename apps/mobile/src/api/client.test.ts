import { ApiError, apiFetch, setUnauthorizedHandler } from './client';

// apiFetch 缝（ADR-0008）：钉死客户端侧统一信封契约——
// 2xx 一处解包 `.data`→T；非 2xx 从 `.error` 抛出带 fields 的 ApiError。
// getToken 走系统钥匙串（原生），此处 mock 掉，测试保持纯函数级。
jest.mock('../auth/token', () => ({
  getToken: jest.fn(async () => null),
}));

function mockFetch(status: number, body: unknown) {
  globalThis.fetch = jest.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  })) as unknown as typeof fetch;
}

describe('apiFetch 统一信封解包', () => {
  const realFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = realFetch;
    jest.clearAllMocks();
  });

  it('2xx 解包 .data 并返回 T（各屏成功路径拿到裸 T）', async () => {
    mockFetch(200, { data: { id: 'u1', email: 'a@b.com' } });
    const user = await apiFetch<{ id: string; email: string }>('/api/account/me');
    expect(user).toEqual({ id: 'u1', email: 'a@b.com' });
  });

  it('非 2xx 从错误信封抛 ApiError，带 status / code / message / fields', async () => {
    mockFetch(400, {
      error: {
        code: 'validation',
        message: '输入有误，请检查后重试',
        fields: { email: '邮箱格式不正确', password: '密码至少 8 位' },
      },
    });
    expect.assertions(6);
    try {
      await apiFetch('/api/auth/register', { method: 'POST', auth: false, body: '{}' });
    } catch (e) {
      const err = e as ApiError;
      expect(err).toBeInstanceOf(ApiError);
      expect(err.status).toBe(400);
      expect(err.code).toBe('validation');
      expect(err.message).toBe('输入有误，请检查后重试');
      expect(err.fields).toEqual({ email: '邮箱格式不正确', password: '密码至少 8 位' });
      expect(err.name).toBe('ApiError');
    }
  });

  it('错误信封无 fields 时 err.fields 为 undefined（如凭证错误）', async () => {
    mockFetch(401, { error: { code: 'invalid_credentials', message: '邮箱或密码错误' } });
    await expect(
      apiFetch('/api/auth/login', { method: 'POST', auth: false, body: '{}' }),
    ).rejects.toMatchObject({ status: 401, code: 'invalid_credentials', fields: undefined });
  });

  it('错误响应体缺失/非法信封时给出兜底 code 与中文文案', async () => {
    globalThis.fetch = jest.fn(async () => ({
      ok: false,
      status: 502,
      text: async () => '',
    })) as unknown as typeof fetch;
    await expect(apiFetch('/api/account/me')).rejects.toMatchObject({
      status: 502,
      code: 'unknown',
    });
  });
});

// 会话在使用中失效兜底：带鉴权请求（auth 默认 true）拿到 401 → 触发全局 handler，
// 由 AuthContext 注册以清 token + 登出（RootNav 随之弹回登录）。登录/注册（auth:false）
// 的 401 是凭证错、不应登出；非 401 错误也不应登出。
describe('apiFetch 401 → unauthorized handler', () => {
  const realFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = realFetch;
    setUnauthorizedHandler(null);
    jest.clearAllMocks();
  });

  it('带鉴权请求 401 → 触发 handler', async () => {
    const onUnauthorized = jest.fn();
    setUnauthorizedHandler(onUnauthorized);
    mockFetch(401, { error: { code: 'unauthorized', message: '会话已过期，请重新登录' } });
    await expect(apiFetch('/api/account/me')).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('登录/注册（auth:false）401 不触发 handler（凭证错不应登出）', async () => {
    const onUnauthorized = jest.fn();
    setUnauthorizedHandler(onUnauthorized);
    mockFetch(401, { error: { code: 'invalid_credentials', message: '邮箱或密码错误' } });
    await expect(
      apiFetch('/api/auth/login', { method: 'POST', auth: false, body: '{}' }),
    ).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('非 401 错误不触发 handler', async () => {
    const onUnauthorized = jest.fn();
    setUnauthorizedHandler(onUnauthorized);
    mockFetch(500, { error: { code: 'internal', message: '出错了，请稍后再试' } });
    await expect(apiFetch('/api/account/me')).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});
