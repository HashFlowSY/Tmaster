import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password';

describe('password', () => {
  it('哈希不等于明文，且可正确校验', async () => {
    const hash = await hashPassword('s3cret-pw');
    expect(hash).not.toBe('s3cret-pw');
    expect(await verifyPassword('s3cret-pw', hash)).toBe(true);
    expect(await verifyPassword('wrong-pw', hash)).toBe(false);
  });

  it('相同明文两次哈希不同（加盐）', async () => {
    const a = await hashPassword('same');
    const b = await hashPassword('same');
    expect(a).not.toBe(b);
  });
});
