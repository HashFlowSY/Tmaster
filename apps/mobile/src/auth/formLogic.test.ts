import { ApiError } from '../api/client';
import {
  confirmError,
  loginFieldError,
  mapAuthError,
  registerFieldError,
  validateLogin,
  validateRegister,
} from './formLogic';

// 纯函数单测（spec Testing Decisions 缝 3）：客户端校验（复用共享 zod）+「服务端错误信封 → 字段/Toast」映射。
// 只断可观察输出（哪个字段有错 / 走 Toast），不耦合实现。

describe('客户端字段校验（复用 @tianji/shared zod）', () => {
  describe('registerFieldError', () => {
    it('邮箱格式非法 → 邮箱字段报错', () => {
      expect(registerFieldError('email', { email: 'not-an-email', password: '', confirm: '' })).toBeTruthy();
    });

    it('合法邮箱 → 无错', () => {
      expect(
        registerFieldError('email', { email: 'chenyu@example.com', password: '', confirm: '' }),
      ).toBeUndefined();
    });

    it('密码短于 8 位 → 密码字段报错', () => {
      expect(registerFieldError('password', { email: '', password: 'abc', confirm: '' })).toBeTruthy();
    });

    it('密码达 8 位 → 无错', () => {
      expect(
        registerFieldError('password', { email: '', password: 'abcd1234', confirm: '' }),
      ).toBeUndefined();
    });

    it('两次密码不一致 → 确认密码字段报错', () => {
      expect(
        registerFieldError('confirm', { email: '', password: 'abcd1234', confirm: 'abcd12' }),
      ).toBeTruthy();
    });

    it('两次密码一致 → 确认密码无错', () => {
      expect(
        registerFieldError('confirm', { email: '', password: 'abcd1234', confirm: 'abcd1234' }),
      ).toBeUndefined();
    });
  });

  describe('confirmError', () => {
    it('一致返回 undefined，不一致返回文案', () => {
      expect(confirmError('abcd1234', 'abcd1234')).toBeUndefined();
      expect(confirmError('abcd1234', 'x')).toBeTruthy();
    });
  });

  describe('loginFieldError', () => {
    it('邮箱非法 → 报错；密码为空 → 报错', () => {
      expect(loginFieldError('email', { email: 'bad', password: 'x' })).toBeTruthy();
      expect(loginFieldError('password', { email: 'chenyu@example.com', password: '' })).toBeTruthy();
    });

    it('登录密码只要求非空（不套注册的 8 位下限）', () => {
      // 与注册不同：登录已存在的账号密码可能任意长度，仅校验非空。
      expect(loginFieldError('password', { email: 'chenyu@example.com', password: 'x' })).toBeUndefined();
    });
  });

  describe('validateRegister / validateLogin（提交时全量）', () => {
    it('全非法 → 三个字段都有错', () => {
      const errors = validateRegister({ email: 'bad', password: 'abc', confirm: 'zzz' });
      expect(errors.email).toBeTruthy();
      expect(errors.password).toBeTruthy();
      expect(errors.confirm).toBeTruthy();
    });

    it('全合法 → 空对象', () => {
      const errors = validateRegister({
        email: 'chenyu@example.com',
        password: 'abcd1234',
        confirm: 'abcd1234',
      });
      expect(errors).toEqual({});
    });

    it('登录全合法 → 空对象；缺失 → 有错', () => {
      expect(validateLogin({ email: 'chenyu@example.com', password: 'x' })).toEqual({});
      const errors = validateLogin({ email: '', password: '' });
      expect(errors.email).toBeTruthy();
      expect(errors.password).toBeTruthy();
    });
  });
});

describe('mapAuthError（服务端错误信封 → 落点）', () => {
  it('validation + fields → 字段内联（仅取 email/password）', () => {
    const err = new ApiError(400, 'validation', '校验失败', {
      email: '邮箱格式不正确',
      password: '密码至少 8 位',
      unknownField: '应被忽略',
    });
    const p = mapAuthError(err);
    expect(p.kind).toBe('fields');
    if (p.kind === 'fields') {
      expect(p.fields.email).toBe('邮箱格式不正确');
      expect(p.fields.password).toBe('密码至少 8 位');
      expect('unknownField' in p.fields).toBe(false);
    }
  });

  it('validation 但无可用字段 → 回退 Toast', () => {
    const err = new ApiError(400, 'validation', '请求参数有误', {});
    const p = mapAuthError(err);
    expect(p.kind).toBe('toast');
  });

  it('email_taken → 邮箱字段内联「该邮箱已注册」', () => {
    const p = mapAuthError(new ApiError(409, 'email_taken', '邮箱已被占用'));
    expect(p.kind).toBe('fields');
    if (p.kind === 'fields') expect(p.fields.email).toBeTruthy();
  });

  it('invalid_credentials → 密码字段内联', () => {
    const p = mapAuthError(new ApiError(401, 'invalid_credentials', '凭证无效'));
    expect(p.kind).toBe('fields');
    if (p.kind === 'fields') expect(p.fields.password).toBeTruthy();
  });

  it('rate_limited → Toast', () => {
    const p = mapAuthError(new ApiError(429, 'rate_limited', '太频繁'));
    expect(p.kind).toBe('toast');
  });

  it('internal → Toast', () => {
    const p = mapAuthError(new ApiError(500, 'internal', '服务器开小差'));
    expect(p.kind).toBe('toast');
  });

  it('非 ApiError（网络异常 / 普通 Error）→ Toast', () => {
    expect(mapAuthError(new Error('Network request failed')).kind).toBe('toast');
    expect(mapAuthError(undefined).kind).toBe('toast');
  });
});
