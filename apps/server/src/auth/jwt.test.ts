import { describe, expect, it } from 'vitest';
import { signToken, verifyToken } from './jwt';

const secret = 'test-secret-0123456789';

describe('jwt', () => {
  it('签发的 token 可被验证并保留 sub/sid', async () => {
    const token = await signToken({ sub: 'u1', sid: 's1' }, secret);
    expect(await verifyToken(token, secret)).toEqual({ sub: 'u1', sid: 's1' });
  });

  it('错误密钥验证失败', async () => {
    const token = await signToken({ sub: 'u1', sid: 's1' }, secret);
    await expect(verifyToken(token, 'a-different-secret-000')).rejects.toBeDefined();
  });
});
