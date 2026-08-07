import { clearToken, getToken, setToken } from './token.web';

describe('Web token storage', () => {
  beforeEach(async () => {
    await clearToken();
  });

  it('只在当前 JavaScript 会话内保存并清除 token', async () => {
    expect(await getToken()).toBeNull();

    await setToken('test-token');
    expect(await getToken()).toBe('test-token');

    await clearToken();
    expect(await getToken()).toBeNull();
  });
});
