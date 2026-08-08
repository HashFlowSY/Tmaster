import type { LoginInput, RegisterInput } from '@tianji/shared';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import { ApiError, setUnauthorizedHandler } from '../api/client';
import { AuthApi, BirthApi } from '../api/endpoints';
import { clearToken, getToken, setToken } from './token';

interface AuthContextValue {
  ready: boolean;
  authenticated: boolean;
  /**
   * 是否需要生辰软引导（ADR-0009 / spec 实现决策 A）——由 `RootNav`/`resolveLanding` 据此决定
   * 登录 / 注册后落 `/onboarding` 还是 `/chat`。仅由显式 `login`（查 `BirthApi.get`）/ `register`（新用户恒真）
   * 置真；boot（会话恢复）与 `logout` 复位为 `false`——冷启动不引导，无生辰者交页面内点用引导承接。
   */
  nudgeOnboarding: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  // boot 默认不引导；只由 login/register 置真、logout 复位——见 nudgeOnboarding 契约注释。
  const [nudgeOnboarding, setNudgeOnboarding] = useState(false);

  useEffect(() => {
    let active = true;

    // 明确登出：清本地 token + 置未登录。用于 boot 时 me() 判定无效，及运行期任一请求 401 兜底。
    const applyLoggedOut = async () => {
      await clearToken();
      if (active) setAuthenticated(false);
    };

    // 启动引导：本地无 token 直接未登录；有 token 则**向服务端 me() 确认会话仍有效**，
    // 不再仅凭 token 存在即视为已登录（token 可能已过期/被吊销/服务端已重置）。
    (async () => {
      const token = await getToken();
      if (token) {
        try {
          await AuthApi.me();
          if (active) setAuthenticated(true);
        } catch (err) {
          if (err instanceof ApiError && err.status === 401) {
            // 服务端明确判定无效 → 清 token 登出（此时服务端会话已失效，不留僵尸 session）。
            await applyLoggedOut();
          } else if (active) {
            // 网络不可达等非 401 → 保持乐观：不丢弃可能仍有效的会话（避免徒增服务端僵尸 session
            // 与无谓的重新登录）；后续请求会自然重试，真失效时再由运行期 401 兜底登出。
            setAuthenticated(true);
          }
        }
      } else if (active) {
        setAuthenticated(false);
      }
      if (active) {
        // 引导完成后再挂运行期兜底：会话在使用中失效（任一带鉴权请求 401）→ 登出，RootNav 弹回登录。
        // 挂在此处而非 boot 前——boot 的 me() 401 已由上面 catch 处理，避免与 handler 重复触发登出。
        // 与 setReady 同步执行：ready 翻真、屏幕开始取数时，兜底钩子必已就位。
        setUnauthorizedHandler(() => {
          void applyLoggedOut();
        });
        setReady(true);
      }
    })();

    return () => {
      active = false;
      setUnauthorizedHandler(null);
    };
  }, []);

  const login = async (input: LoginInput) => {
    const res = await AuthApi.login(input);
    await setToken(res.token);
    // 写 token 后、翻 authenticated 前查生辰决定引导落点：get 成功(有盘)→ 不引导；
    // 404 无盘 / 网络失败 / 任何非成功 → 引导（fail-toward-引导，因可随时「稍后」跳过故安全）。
    let nudge = false;
    try {
      await BirthApi.get();
    } catch {
      nudge = true;
    }
    // nudge 先于 authenticated 置位——同一次批处理内二者一起翻，RootNav 首次读到即正确（消竞态）。
    setNudgeOnboarding(nudge);
    setAuthenticated(true);
  };

  const register = async (input: RegisterInput) => {
    const res = await AuthApi.register(input);
    await setToken(res.token);
    setNudgeOnboarding(true); // 新用户必无生辰，直接置真、不查询（省一次往返）
    setAuthenticated(true);
  };

  const logout = async () => {
    try {
      await AuthApi.logout();
    } catch {
      // 网络失败也要清本地 token
    }
    await clearToken();
    setNudgeOnboarding(false); // 复位：下次登录重新按生辰判定，不记忆「已跳过」
    setAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ ready, authenticated, nudgeOnboarding, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth 必须在 AuthProvider 内使用');
  return ctx;
}
