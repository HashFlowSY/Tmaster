import { render, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ApiError, setUnauthorizedHandler } from '../api/client';
import { AuthApi } from '../api/endpoints';
import { AuthProvider, useAuth } from './AuthContext';
import { clearToken, getToken } from './token';

// AuthContext 启动引导契约：本地有 token 时必须向服务端 `me()` 确认会话是否仍有效，
// 而非仅凭 token 存在即视为已登录（修复：token 失效/吊销/服务端重置后仍被当成已登录）。
// 断言外部可观察行为（ready/authenticated + 是否清 token），不耦合内部实现。
jest.mock('../api/endpoints', () => ({
  AuthApi: {
    me: jest.fn(),
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  },
}));
jest.mock('./token', () => ({
  getToken: jest.fn(),
  setToken: jest.fn(async () => {}),
  clearToken: jest.fn(async () => {}),
}));

const mockedMe = AuthApi.me as jest.Mock;
const mockedGetToken = getToken as jest.Mock;
const mockedClearToken = clearToken as jest.Mock;

function Probe() {
  const { ready, authenticated } = useAuth();
  return <Text>{`ready:${ready} auth:${authenticated}`}</Text>;
}

async function renderBoot() {
  await render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
}

describe('AuthContext 启动引导', () => {
  afterEach(() => {
    setUnauthorizedHandler(null); // 显式复位模块级兜底钩子，隔离用例（不依赖 RTL cleanup 时序）
    jest.clearAllMocks();
  });

  it('本地无 token → 未登录，且不打扰服务端（不调 me）', async () => {
    mockedGetToken.mockResolvedValue(null);
    await renderBoot();
    await waitFor(() => expect(screen.getByText('ready:true auth:false')).toBeTruthy());
    expect(mockedMe).not.toHaveBeenCalled();
  });

  it('本地有 token 且 me() 成功 → 已登录（服务端确认会话有效）', async () => {
    mockedGetToken.mockResolvedValue('jwt-abc');
    mockedMe.mockResolvedValue({ id: 'u1', email: 'a@b.com' });
    await renderBoot();
    await waitFor(() => expect(screen.getByText('ready:true auth:true')).toBeTruthy());
    expect(mockedMe).toHaveBeenCalledTimes(1);
  });

  it('本地有 token 但 me() 返回 401 → 判为无效：清本地 token 并登出', async () => {
    mockedGetToken.mockResolvedValue('jwt-stale');
    mockedMe.mockRejectedValue(new ApiError(401, 'unauthorized', '会话已过期，请重新登录'));
    await renderBoot();
    await waitFor(() => expect(screen.getByText('ready:true auth:false')).toBeTruthy());
    expect(mockedClearToken).toHaveBeenCalledTimes(1);
  });

  it('本地有 token 但 me() 遇网络错误（非 401）→ 保持乐观登录，且不丢弃 token', async () => {
    mockedGetToken.mockResolvedValue('jwt-maybe-valid');
    mockedMe.mockRejectedValue(new TypeError('Network request failed'));
    await renderBoot();
    await waitFor(() => expect(screen.getByText('ready:true auth:true')).toBeTruthy());
    expect(mockedClearToken).not.toHaveBeenCalled();
  });
});
