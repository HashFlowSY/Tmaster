import type { LoginInput, RegisterInput } from '@tianji/shared';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import { ApiError, setUnauthorizedHandler } from '../api/client';
import { AuthApi } from '../api/endpoints';
import { clearToken, getToken, setToken } from './token';

interface AuthContextValue {
  ready: boolean;
  authenticated: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

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
    setAuthenticated(true);
  };

  const register = async (input: RegisterInput) => {
    const res = await AuthApi.register(input);
    await setToken(res.token);
    setAuthenticated(true);
  };

  const logout = async () => {
    try {
      await AuthApi.logout();
    } catch {
      // 网络失败也要清本地 token
    }
    await clearToken();
    setAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ ready, authenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth 必须在 AuthProvider 内使用');
  return ctx;
}
