import { fireEvent, render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomNav, type BottomNavItem } from './BottomNav';

// 行为契约测试（spec Testing Decisions）——BottomNav 以被按 tab 的 key 触发 onSelect，
// 并通过无障碍选中态暴露当前 tab。只断言可观察行为，不碰底色 / 描边 / 字距样式（视觉双端人工核对）。
// RTL v14（React 19）下 render / fireEvent 均为异步，须 await。
//
// BottomNav 用 useSafeAreaInsets 取底部安全区内边距——包一层带 initialMetrics 的 SafeAreaProvider，
// 让 hook 在 jest 里拿到确定的 insets（无需真实原生测量）。
const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const ITEMS: readonly BottomNavItem[] = [
  { key: 'chat', label: '对话', icon: 'chat' },
  { key: 'chart', label: '命盘', icon: 'chart' },
  { key: 'profile', label: '我的', icon: 'user' },
] as const;

function renderNav(ui: React.ReactElement) {
  return render(<SafeAreaProvider initialMetrics={METRICS}>{ui}</SafeAreaProvider>);
}

describe('BottomNav', () => {
  it('按下某个 tab 时以其 key 触发 onSelect', async () => {
    const onSelect = jest.fn();
    const { getByRole } = await renderNav(
      <BottomNav items={ITEMS} activeKey="chat" onSelect={onSelect} />,
    );

    await fireEvent.press(getByRole('button', { name: '命盘' }));

    expect(onSelect).toHaveBeenCalledWith('chart');
  });

  it('按下当前已选 tab 仍以其 key 触发 onSelect', async () => {
    const onSelect = jest.fn();
    const { getByRole } = await renderNav(
      <BottomNav items={ITEMS} activeKey="chat" onSelect={onSelect} />,
    );

    await fireEvent.press(getByRole('button', { name: '对话' }));

    expect(onSelect).toHaveBeenCalledWith('chat');
  });

  it('通过无障碍状态暴露当前选中 tab', async () => {
    const { getByRole } = await renderNav(
      <BottomNav items={ITEMS} activeKey="profile" onSelect={() => {}} />,
    );

    expect(getByRole('button', { name: '我的' }).props.accessibilityState?.selected).toBe(true);
    expect(getByRole('button', { name: '对话' }).props.accessibilityState?.selected).toBe(false);
  });

  it('渲染传入的每一个 tab', async () => {
    const { getByRole } = await renderNav(
      <BottomNav items={ITEMS} activeKey="chat" onSelect={() => {}} />,
    );

    for (const item of ITEMS) {
      expect(getByRole('button', { name: item.label })).toBeTruthy();
    }
  });
});
