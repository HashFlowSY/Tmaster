import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ApiError, setUnauthorizedHandler } from '../api/client';
import { AuthApi, BirthApi } from '../api/endpoints';
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
  BirthApi: {
    get: jest.fn(),
  },
}));
jest.mock('./token', () => ({
  getToken: jest.fn(),
  setToken: jest.fn(async () => {}),
  clearToken: jest.fn(async () => {}),
}));

const mockedMe = AuthApi.me as jest.Mock;
const mockedLogin = AuthApi.login as jest.Mock;
const mockedRegister = AuthApi.register as jest.Mock;
const mockedGetBirth = BirthApi.get as jest.Mock;
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

// 引导判定标志 nudgeOnboarding（spec 实现决策 A / 测试缝 1）——登录 / 注册后是否需要生辰软引导。
// 复用启动引导测试的 endpoints/token mock，扩测**可观察的 nudge 值**（不断内部函数被调、不断样式）：
//   登录 + 有生辰(200) → false；登录 + 404 / 网络失败 → true（fail-toward-引导）；注册 → true 且不查生辰。
// prior art：本文件既有 ready/authenticated 断言。
function NudgeProbe() {
  const { ready, authenticated, nudgeOnboarding, login, register } = useAuth();
  return (
    <>
      <Text>{`ready:${ready} auth:${authenticated} nudge:${nudgeOnboarding}`}</Text>
      <Text onPress={() => void login({ email: 'a@b.com', password: 'pw12345678' })}>trigger-login</Text>
      <Text onPress={() => void register({ email: 'a@b.com', password: 'pw12345678' })}>trigger-register</Text>
    </>
  );
}

describe('AuthContext 引导判定 nudgeOnboarding', () => {
  const authResponse = { token: 'jwt-new', user: { id: 'u1', email: 'a@b.com', createdAt: '2026-01-01' } };

  beforeEach(() => {
    mockedGetToken.mockResolvedValue(null); // boot 落未登录，隔离出「登录 / 注册前」的干净起点
    mockedLogin.mockResolvedValue(authResponse);
    mockedRegister.mockResolvedValue(authResponse);
  });

  afterEach(() => {
    setUnauthorizedHandler(null);
    jest.clearAllMocks();
  });

  // boot 完成后应停在「未登录、nudge=false」——boot 不引导（nudge 只由显式 login/register 置真）。
  // 挂载包在 act 内，令 boot 异步 IIFE 的 setReady/setAuthenticated 在 act 环境内 settle（无 act 告警）。
  async function bootUnauthenticated() {
    await act(async () => {
      render(
        <AuthProvider>
          <NudgeProbe />
        </AuthProvider>,
      );
    });
    await waitFor(() => expect(screen.getByText('ready:true auth:false nudge:false')).toBeTruthy());
  }

  // 触发 login/register（fire-and-forget 的异步链）并在 act 内 flush 到 settle——
  // 令其尾部的 setState 落在 act 环境内，避免「environment not configured to support act」告警。
  async function press(label: string) {
    await act(async () => {
      fireEvent.press(screen.getByText(label));
    });
  }

  it('登录 + 有生辰(BirthApi.get 成功) → nudge=false', async () => {
    mockedGetBirth.mockResolvedValue({ birthDate: '1994-01-01' });
    await bootUnauthenticated();
    await press('trigger-login');
    await waitFor(() => expect(screen.getByText('ready:true auth:true nudge:false')).toBeTruthy());
    expect(mockedGetBirth).toHaveBeenCalledTimes(1);
  });

  it('登录 + 无生辰(404 not_found) → nudge=true（fail-toward-引导）', async () => {
    mockedGetBirth.mockRejectedValue(new ApiError(404, 'not_found', '尚未建立生辰档案'));
    await bootUnauthenticated();
    await press('trigger-login');
    await waitFor(() => expect(screen.getByText('ready:true auth:true nudge:true')).toBeTruthy());
  });

  it('登录 + 网络失败 → nudge=true（fail-toward-引导）', async () => {
    mockedGetBirth.mockRejectedValue(new TypeError('Network request failed'));
    await bootUnauthenticated();
    await press('trigger-login');
    await waitFor(() => expect(screen.getByText('ready:true auth:true nudge:true')).toBeTruthy());
  });

  it('注册 → nudge=true 且不查生辰（新用户必无盘，省一次往返）', async () => {
    await bootUnauthenticated();
    await press('trigger-register');
    await waitFor(() => expect(screen.getByText('ready:true auth:true nudge:true')).toBeTruthy());
    expect(mockedGetBirth).not.toHaveBeenCalled();
  });

  it('boot 恢复有效会话 → 已登录但 nudge=false 且不查生辰（boot 不引导）', async () => {
    // 决策 A：boot / 恢复会话不查、不置 nudge——冷启动不打扰，无生辰返回用户交页面内点用引导承接。
    mockedGetToken.mockResolvedValue('jwt-valid');
    mockedMe.mockResolvedValue({ id: 'u1', email: 'a@b.com', createdAt: '2026-01-01' });
    await act(async () => {
      render(
        <AuthProvider>
          <NudgeProbe />
        </AuthProvider>,
      );
    });
    await waitFor(() => expect(screen.getByText('ready:true auth:true nudge:false')).toBeTruthy());
    expect(mockedGetBirth).not.toHaveBeenCalled();
  });
});
