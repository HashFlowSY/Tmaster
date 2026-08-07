import { LoginInputSchema, RegisterInputSchema } from '@tianji/shared';

/**
 * auth 表单纯逻辑（issue 02 / spec 缝 3）—— 客户端校验 + 「服务端错误信封 → 落点」映射。
 *
 * 全部为无副作用纯函数：注册/登录屏只做接线（值、聚焦、提交），把「怎么算错、错落哪」交给本模块，
 * 因此这部分可脱离 RN 单测、屏幕保持薄。校验规则复用 `@tianji/shared` 的 zod（单一真源，前后端不漂移）。
 */

export type RegisterField = 'email' | 'password' | 'confirm';
export type LoginField = 'email' | 'password';

/** 字段级错误：字段名 → 中文错误文案（缺席即该字段无错）。 */
export type FieldErrors = Partial<Record<RegisterField, string>>;

export interface RegisterValues {
  email: string;
  password: string;
  confirm: string;
}
export interface LoginValues {
  email: string;
  password: string;
}

/** 无法归到单一字段的错误落点：字段内联 or 全局 Toast（spec §B 映射表）。 */
export type ErrorPresentation =
  | { kind: 'fields'; fields: FieldErrors }
  | { kind: 'toast'; message: string };

/**
 * 只描述本模块用到的 zod 能力（`safeParse`）——mobile 未直接依赖 zod，故用结构化类型而非 import
 * `ZodTypeAny`；`@tianji/shared` 导出的各 schema 结构上满足此形状。
 */
interface Parseable {
  safeParse(value: unknown):
    | { success: true }
    | { success: false; error: { issues: { message: string }[] } };
}

/** 取 zod 首条 issue 文案；通过即 undefined。只暴露文案、不外泄 ZodError 结构。 */
function firstIssue(schema: Parseable, value: unknown): string | undefined {
  const result = schema.safeParse(value);
  return result.success ? undefined : result.error.issues[0]?.message;
}

/**
 * 两次密码比对——客户端专属（服务端 `RegisterInputSchema` 无 confirm 字段）。
 * 一致返回 undefined；不一致返回就地文案（spec User Story 3）。
 */
export function confirmError(password: string, confirm: string): string | undefined {
  return password === confirm ? undefined : '两次输入的密码不一致';
}

/** 注册单字段校验（失焦时用）。email/password 复用共享 zod，confirm 走本地比对。 */
export function registerFieldError(field: RegisterField, values: RegisterValues): string | undefined {
  switch (field) {
    case 'email':
      return firstIssue(RegisterInputSchema.shape.email, values.email);
    case 'password':
      return firstIssue(RegisterInputSchema.shape.password, values.password);
    case 'confirm':
      return confirmError(values.password, values.confirm);
  }
}

/** 登录单字段校验（失焦时用）。登录密码仅要求非空（min(1)），不套注册的 8 位下限。 */
export function loginFieldError(field: LoginField, values: LoginValues): string | undefined {
  switch (field) {
    case 'email':
      return firstIssue(LoginInputSchema.shape.email, values.email);
    case 'password':
      return firstIssue(LoginInputSchema.shape.password, values.password);
  }
}

/** 提交前全量校验注册；无错返回空对象。逐字段复用 `registerFieldError`，保证与失焦校验一致。 */
export function validateRegister(values: RegisterValues): FieldErrors {
  const errors: FieldErrors = {};
  for (const field of ['email', 'password', 'confirm'] as const) {
    const message = registerFieldError(field, values);
    if (message !== undefined) errors[field] = message;
  }
  return errors;
}

/** 提交前全量校验登录；无错返回空对象。 */
export function validateLogin(values: LoginValues): FieldErrors {
  const errors: FieldErrors = {};
  for (const field of ['email', 'password'] as const) {
    const message = loginFieldError(field, values);
    if (message !== undefined) errors[field] = message;
  }
  return errors;
}

/** 服务端校验信封只可能回填这些字段（confirm 是客户端概念，服务端不产生）。 */
const SERVER_FIELDS: readonly RegisterField[] = ['email', 'password'];

const NETWORK_MESSAGE = '网络连接异常，请检查网络后重试';
const FALLBACK_MESSAGE = '出错了，请稍后再试';
const RATE_LIMITED_MESSAGE = '操作过于频繁，请稍后再试';

/** 结构化窄化：ApiError 及任何带 string `code`/`message` 的错误信封形状（不 import ApiError，保持纯净）。 */
interface ApiErrorLike {
  code: string;
  message: string;
  fields?: Record<string, string>;
}
function asApiError(err: unknown): ApiErrorLike | null {
  if (err != null && typeof err === 'object' && 'code' in err && 'message' in err) {
    const e = err as { code: unknown; message: unknown; fields?: unknown };
    if (typeof e.code === 'string' && typeof e.message === 'string') {
      const fields =
        e.fields != null && typeof e.fields === 'object'
          ? (e.fields as Record<string, string>)
          : undefined;
      return { code: e.code, message: e.message, fields };
    }
  }
  return null;
}

/** 从服务端 `fields` 里只挑已知字段（丢弃未知键），得到可安全内联的映射。 */
function pickServerFields(fields: Record<string, string> | undefined): FieldErrors {
  const out: FieldErrors = {};
  if (!fields) return out;
  for (const key of SERVER_FIELDS) {
    const message = fields[key];
    if (typeof message === 'string') out[key] = message;
  }
  return out;
}

/**
 * 服务端错误信封 → UI 落点（spec §B 映射表）。注册/登录共用同一份映射：
 * - `validation`（带 fields）→ 各字段就地内联；无可用字段则回退 Toast
 * - `email_taken`（注册）→ 邮箱字段「该邮箱已注册」
 * - `invalid_credentials`（登录）→ 密码字段「邮箱或密码错误」
 * - `rate_limited` / `internal` / 其他码 / 网络异常（非 ApiError）→ Toast
 *
 * 每个码只在其对应流程出现（注册不会收 invalid_credentials，登录不会收 email_taken），故一份映射足矣。
 */
export function mapAuthError(err: unknown): ErrorPresentation {
  const api = asApiError(err);
  if (!api) return { kind: 'toast', message: NETWORK_MESSAGE };

  switch (api.code) {
    case 'validation': {
      const fields = pickServerFields(api.fields);
      return Object.keys(fields).length > 0
        ? { kind: 'fields', fields }
        : { kind: 'toast', message: api.message || FALLBACK_MESSAGE };
    }
    case 'email_taken':
      return { kind: 'fields', fields: { email: '该邮箱已注册' } };
    case 'invalid_credentials':
      return { kind: 'fields', fields: { password: '邮箱或密码错误' } };
    case 'rate_limited':
      return { kind: 'toast', message: api.message || RATE_LIMITED_MESSAGE };
    default:
      return { kind: 'toast', message: api.message || FALLBACK_MESSAGE };
  }
}
