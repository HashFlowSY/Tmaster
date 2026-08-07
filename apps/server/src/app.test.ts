import { describe, expect, it } from 'vitest';
import { createApp } from './app';
import { createDb } from './db/client';
import { applyMigrations } from './db/migrate';
import type { Env } from './env';

const env: Env = {
  DEEPSEEK_API_KEY: 'test-key',
  DEEPSEEK_BASE_URL: 'https://api.deepseek.com',
  DEEPSEEK_MODEL: 'deepseek-chat',
  JWT_SECRET: 'test-secret-0123456789',
  DB_PATH: ':memory:',
  PORT: 8787,
  SESSION_IDLE_MS: 6 * 60 * 60 * 1000,
};

const H = { 'Content-Type': 'application/json' };

function makeApp() {
  const { db } = createDb(':memory:');
  applyMigrations(db);
  return createApp({ db, env });
}

async function register(app: ReturnType<typeof createApp>, email: string) {
  const res = await app.request('/api/auth/register', {
    method: 'POST',
    headers: H,
    body: JSON.stringify({ email, password: 'password1' }),
  });
  const body = (await res.json()) as { data?: { token: string; user: { email: string } } };
  return { res, token: body.data?.token, body };
}

describe('集成：认证与对话网关', () => {
  it('允许本地 Web 前端跨域调用 API', async () => {
    const app = makeApp();
    const res = await app.request('/api/auth/register', {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:8081',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type,authorization',
      },
    });

    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:8081');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    expect(res.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type');
    expect(res.headers.get('Access-Control-Allow-Headers')).toContain('Authorization');

    const blocked = await app.request('/api/auth/register', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://example.com',
        'Access-Control-Request-Method': 'POST',
      },
    });
    expect(blocked.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });

  it('注册成功包进 {data}（token + user）；重复邮箱走 email_taken 错误信封', async () => {
    const app = makeApp();
    const { res, body } = await register(app, 'a@b.com');
    expect(res.status).toBe(201);
    expect(typeof body.data?.token).toBe('string');
    expect(body.data?.user.email).toBe('a@b.com');

    const again = await register(app, 'a@b.com'); // 重复邮箱
    expect(again.res.status).toBe(409);
    const errBody = again.body as unknown as { error: { code: string; message: string } };
    expect(errBody.error.code).toBe('email_taken');
    expect(errBody.error.message).toBe('该邮箱已注册');
  });

  it('zod 校验失败走统一 validation 信封，带字段级 fields', async () => {
    const app = makeApp();
    const res = await app.request('/api/auth/register', {
      method: 'POST',
      headers: H,
      body: JSON.stringify({ email: 'not-an-email', password: 'short' }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as {
      error: { code: string; message: string; fields?: Record<string, string> };
    };
    expect(body.error.code).toBe('validation');
    expect(typeof body.error.message).toBe('string');
    expect(body.error.fields?.email).toBe('邮箱格式不正确');
    expect(body.error.fields?.password).toBe('密码至少 8 位');
    // 成功与错误互斥：错误信封不带 data。
    expect((body as { data?: unknown }).data).toBeUndefined();
  });

  it('未认证访问受保护路由 → 401 unauthorized 信封；公共登录路由不被守卫波及', async () => {
    const app = makeApp();
    const guarded = await app.request('/api/account/me');
    expect(guarded.status).toBe(401);
    const guardedBody = (await guarded.json()) as { error: { code: string } };
    expect(guardedBody.error.code).toBe('unauthorized');
    // 登录端点本身可达（校验失败是 400/401，而非因守卫 401 缺凭证）
    const bad = await app.request('/api/auth/login', {
      method: 'POST',
      headers: H,
      body: JSON.stringify({ email: 'none@x.com', password: 'password1' }),
    });
    expect(bad.status).toBe(401);
  });

  it('登录成功包进 {data}；错误密码走 invalid_credentials 信封', async () => {
    const app = makeApp();
    await register(app, 'a@b.com');
    const bad = await app.request('/api/auth/login', {
      method: 'POST',
      headers: H,
      body: JSON.stringify({ email: 'a@b.com', password: 'wrong-pass' }),
    });
    expect(bad.status).toBe(401);
    const badBody = (await bad.json()) as { error: { code: string; message: string } };
    expect(badBody.error.code).toBe('invalid_credentials');
    expect(badBody.error.message).toBe('邮箱或密码错误');

    const login = await app.request('/api/auth/login', {
      method: 'POST',
      headers: H,
      body: JSON.stringify({ email: 'a@b.com', password: 'password1' }),
    });
    const { data } = (await login.json()) as { data: { token: string } };
    const me = await app.request('/api/account/me', {
      headers: { Authorization: `Bearer ${data.token}` },
    });
    expect(me.status).toBe(200);
    // 代表性成功端点的信封形状：{ data: { id, email, createdAt } }。
    const meBody = (await me.json()) as { data: { id: string; email: string; createdAt: string } };
    expect(meBody.data.email).toBe('a@b.com');
    expect(typeof meBody.data.id).toBe('string');
    expect(typeof meBody.data.createdAt).toBe('string');
  });

  it('八字对话需先完善生辰（409），奇门不需要（201）', async () => {
    const app = makeApp();
    const { token } = await register(app, 'c@d.com');
    const auth = { Authorization: `Bearer ${token}`, ...H };

    const blocked = await app.request('/api/conversations', {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ system: 'bazi' }),
    });
    expect(blocked.status).toBe(409);

    const qimen = await app.request('/api/conversations', {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ system: 'qimen' }),
    });
    expect(qimen.status).toBe(201);

    const birth = await app.request('/api/birth-profile', {
      method: 'PUT',
      headers: auth,
      body: JSON.stringify({
        birthDate: '1990-06-15',
        birthTime: '14:30',
        timeUnknown: false,
        birthplace: '北京',
        longitude: 116.4,
        gender: 'male',
      }),
    });
    expect(birth.status).toBe(200);

    const bazi = await app.request('/api/conversations', {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ system: 'bazi' }),
    });
    expect(bazi.status).toBe(201);

    const chart = await app.request('/api/bazi-chart', { headers: auth });
    expect(chart.status).toBe(200);
    const chartBody = (await chart.json()) as {
      data: { dayMaster: string; pillars: { day: { stem: string } } };
    };
    expect(chartBody.data.pillars.day.stem).toBe(chartBody.data.dayMaster);
  });

  it('登出后 token 失效', async () => {
    const app = makeApp();
    const { token } = await register(app, 'e@f.com');
    const auth = { Authorization: `Bearer ${token}` };
    expect((await app.request('/api/account/me', { headers: auth })).status).toBe(200);
    const out = await app.request('/api/account/logout', { method: 'POST', headers: auth });
    expect(out.status).toBe(200);
    expect((await app.request('/api/account/me', { headers: auth })).status).toBe(401);
  });
});
