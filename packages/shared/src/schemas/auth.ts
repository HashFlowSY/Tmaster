import { z } from 'zod';

export const emailSchema = z.string().trim().toLowerCase().email('邮箱格式不正确');

/** 密码策略：明文由前端传输（仅走局域网），后端 bcrypt 哈希，绝不存明文。 */
export const passwordSchema = z
  .string()
  .min(8, '密码至少 8 位')
  .max(72, '密码过长'); // bcrypt 上限 72 字节

export const RegisterInputSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});
export type RegisterInput = z.infer<typeof RegisterInputSchema>;

export const LoginInputSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, '请输入密码'),
});
export type LoginInput = z.infer<typeof LoginInputSchema>;

/** 对外暴露的用户信息，绝不含 password_hash。 */
export const PublicUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  createdAt: z.string(),
});
export type PublicUser = z.infer<typeof PublicUserSchema>;

export const AuthResponseSchema = z.object({
  token: z.string(),
  user: PublicUserSchema,
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
