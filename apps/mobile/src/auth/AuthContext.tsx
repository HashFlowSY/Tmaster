import type { LoginInput, RegisterInput } from '@tianji/shared';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
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
    getToken().then((token) => {
      setAuthenticated(Boolean(token));
      setReady(true);
    });
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
