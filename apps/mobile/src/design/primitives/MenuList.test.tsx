import { fireEvent, render } from '@testing-library/react-native';
import type { MenuRow } from './MenuList';
import { MenuList } from './MenuList';

// 行为契约测试（spec Testing Decisions）——MenuList 的每行是可访问按钮,按下触发该行 onPress。
// 只断言可观察行为与无障碍名,不碰图标 / 分隔线 / danger 配色 / 尾部 › 样式（视觉双端人工核对）。
// RTL v14（React 19）下 render / fireEvent 均为异步,须 await。

describe('MenuList', () => {
  it('按下某一行时仅触发该行的 onPress', async () => {
    const onChart = jest.fn();
    const onHistory = jest.fn();
    const rows: MenuRow[] = [
      { key: 'chart', icon: 'chart', label: '我的命盘', meta: '己巳日 · 乾造', onPress: onChart },
      { key: 'history', icon: 'clock', label: '历史对话', meta: '128 段', onPress: onHistory },
    ];
    const { getByRole } = await render(<MenuList rows={rows} />);

    await fireEvent.press(getByRole('button', { name: '我的命盘' }));

    expect(onChart).toHaveBeenCalledTimes(1);
    expect(onHistory).not.toHaveBeenCalled();
  });

  it('每行以其 label 暴露为可访问按钮（尾部 meta/› 不污染无障碍名）', async () => {
    const rows: MenuRow[] = [
      { key: 'favorites', icon: 'bookmark', label: '我的收藏', meta: '12 条', onPress: () => {} },
    ];
    const { getByRole } = await render(<MenuList rows={rows} />);

    expect(getByRole('button', { name: '我的收藏' })).toBeTruthy();
  });

  it('danger 行同样可按下触发 onPress（危险样式不拦截点击）', async () => {
    const onLogout = jest.fn();
    const rows: MenuRow[] = [
      { key: 'logout', icon: 'logout', label: '退出登录', danger: true, onPress: onLogout },
    ];
    const { getByRole } = await render(<MenuList rows={rows} />);

    await fireEvent.press(getByRole('button', { name: '退出登录' }));

    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
