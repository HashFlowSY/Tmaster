import { createId } from '@paralleldrive/cuid2';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app';
import { createDb } from '../db/client';
import { applyMigrations } from '../db/migrate';
import { messages } from '../db/schema';
import type { Env } from '../env';

// 集成：验证 messages.card 结构化列端到端往返（迁移 + 持久化 + toMessage 序列化）。
// 不经真实 DeepSeek 流式；直接落一条带 card 的 assistant 消息，再经 GET /messages 取回断言。
const env: Env = {
  DEEPSEEK_API_KEY: 'test-key',
  DEEPSEEK_BASE_URL: 'https://api.deepseek.com',
  DEEPSEEK_MODEL: 'deepseek-chat',
  JWT_SECRET: 'test-secret-0123456789',
  DB_PATH: ':memory:',
  PORT: 8787,
  SESSION_IDLE_MS: 6 * 60 * 60 * 1000,
  LOGIN_RATE_LIMIT_MAX: 10,
  LOGIN_RATE_LIMIT_WINDOW_MS: 10 * 60 * 1000,
  REGISTER_RATE_LIMIT_MAX: 5,
  REGISTER_RATE_LIMIT_WINDOW_MS: 60 * 60 * 1000,
};

const H = { 'Content-Type': 'application/json' };

async function setup() {
  const { db } = createDb(':memory:');
  applyMigrations(db);
  const app = createApp({ db, env });
  const reg = await app.request('/api/auth/register', {
    method: 'POST',
    headers: H,
    body: JSON.stringify({ email: 'card@x.com', password: 'password1' }),
  });
  const { data: reged } = (await reg.json()) as { data: { token: string } };
  const auth = { Authorization: `Bearer ${reged.token}`, ...H };
  // 奇门对话不需生辰（ADR-0004）。
  const convRes = await app.request('/api/conversations', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ system: 'qimen' }),
  });
  const { data: conv } = (await convRes.json()) as { data: { id: string } };
  return { db, app, auth, convId: conv.id };
}

describe('消息 card 列 round-trip', () => {
  it('带 card 的 assistant 消息经 GET /messages 原样返回结构化卡片', async () => {
    const { db, app, auth, convId } = await setup();
    const card = {
      title: '今日宜忌',
      rows: [
        { k: '宜', v: '签约 · 会友', ok: true },
        { k: '忌', v: '动土' },
      ],
    };
    db.insert(messages)
      .values({ id: createId(), conversationId: convId, role: 'assistant', content: '今天宜谈事。', card })
      .run();

    const res = await app.request(`/api/conversations/${convId}/messages`, { headers: auth });
    expect(res.status).toBe(200);
    const { data: body } = (await res.json()) as {
      data: Array<{ content: string; card?: typeof card }>;
    };
    expect(body).toHaveLength(1);
    expect(body[0]?.content).toBe('今天宜谈事。');
    expect(body[0]?.card).toEqual(card);
  });

  it('无 card 的消息序列化时不含 card 字段', async () => {
    const { db, app, auth, convId } = await setup();
    db.insert(messages)
      .values({ id: createId(), conversationId: convId, role: 'assistant', content: '纯文本回复。' })
      .run();

    const res = await app.request(`/api/conversations/${convId}/messages`, { headers: auth });
    const { data: body } = (await res.json()) as {
      data: Array<{ content: string; card?: unknown }>;
    };
    expect(body[0]?.content).toBe('纯文本回复。');
    expect(body[0]?.card).toBeUndefined();
  });
});
