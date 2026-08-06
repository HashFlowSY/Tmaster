import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * 哈希明文密码。前端传明文（仅走局域网），后端只存哈希，绝不存明文。
 * 见 docs/adr/0002。
 */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
