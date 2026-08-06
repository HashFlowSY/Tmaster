import { z } from 'zod';

/** 命理系统。对话按此分型，创建后不可更改。 */
export const SystemSchema = z.enum(['bazi', 'qimen']);
export type System = z.infer<typeof SystemSchema>;

/** 命理系统的中文标签（前后端共用，避免多处硬编码）。 */
export function systemLabel(system: System): string {
  return system === 'bazi' ? '八字' : '奇门';
}

/** 命主性别（八字排大运需要）。 */
export const GenderSchema = z.enum(['male', 'female']);
export type Gender = z.infer<typeof GenderSchema>;

/** 消息角色。 */
export const RoleSchema = z.enum(['user', 'assistant']);
export type Role = z.infer<typeof RoleSchema>;

/** 统一错误信封。 */
export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;
