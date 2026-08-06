import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'tianji.jwt';

/** JWT 存于 Expo SecureStore（系统钥匙串），不落普通存储。 */
export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
