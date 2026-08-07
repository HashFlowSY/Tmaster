let token: string | null = null;

/**
 * Web 仅用于本地浏览器验证：token 只保存在当前 JavaScript 会话内，
 * 不写入 localStorage；刷新页面后会自然失效。原生端仍由 token.ts 使用 SecureStore。
 */
export async function getToken(): Promise<string | null> {
  return token;
}

export async function setToken(nextToken: string): Promise<void> {
  token = nextToken;
}

export async function clearToken(): Promise<void> {
  token = null;
}
