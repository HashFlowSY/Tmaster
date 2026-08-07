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
  const body = (await res.json()) as { token: string };
  return { res, token: body.token };
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

  it('注册返回 token 与用户', async () => {
    const app = makeApp();
    const { res } = await register(app, 'a@b.com');
    expect(res.status).toBe(201);
    const again = await register(app, 'a@b.com'); // 重复邮箱
    expect(again.res.status).toBe(409);
  });

  it('未认证访问受保护路由 → 401；公共登录路由不被守卫波及', async () => {
    const app = makeApp();
    expect((await app.request('/api/account/me')).status).toBe(401);
    // 登录端点本身可达（校验失败是 400/401，而非因守卫 401 缺凭证）
    const bad = await app.request('/api/auth/login', {
      method: 'POST',
      headers: H,
      body: JSON.stringify({ email: 'none@x.com', password: 'password1' }),
    });
    expect(bad.status).toBe(401);
  });

  it('登录后可访问 me；错误密码 401', async () => {
    const app = makeApp();
    await register(app, 'a@b.com');
    const bad = await app.request('/api/auth/login', {
      method: 'POST',
      headers: H,
      body: JSON.stringify({ email: 'a@b.com', password: 'wrong-pass' }),
    });
    expect(bad.status).toBe(401);
    const login = await app.request('/api/auth/login', {
      method: 'POST',
      headers: H,
      body: JSON.stringify({ email: 'a@b.com', password: 'password1' }),
    });
    const { token } = (await login.json()) as { token: string };
    const me = await app.request('/api/account/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(me.status).toBe(200);
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
    const chartBody = (await chart.json()) as { dayMaster: string; pillars: { day: { stem: string } } };
    expect(chartBody.pillars.day.stem).toBe(chartBody.dayMaster);
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
