import { fireEvent, render } from '@testing-library/react-native';
import { useState } from 'react';
import { TabDrop, type TabDropItem } from './TabDrop';

// 行为契约测试（spec Testing Decisions）——对话切换器 TabDrop 的开合与选择。
// 只断言可观察行为与无障碍状态（expanded / selected / 可见标签），不碰 caret 旋转 / 菜单动效样式
// （视觉双端人工核对）。RTL v14（React 19）下 render / fireEvent 均为异步，须 await。
const ITEMS: readonly TabDropItem[] = [
  { key: 'c1', title: '今年适合换工作吗', meta: '八字 · 今天 09:24' },
  { key: 'c2', title: '今日宜忌与吉时', meta: '八字 · 今天 08:10' },
  { key: 'c3', title: '遗失的钥匙能找回吗', meta: '奇门 · 昨天 21:47' },
] as const;

describe('TabDrop', () => {
  it('折叠时显示当前对话标签，菜单项不可见', async () => {
    const { getByText, queryByRole } = await render(
      <TabDrop items={ITEMS} selectedKey="c1" onSelect={() => {}} />,
    );

    expect(getByText('今年适合换工作吗')).toBeTruthy();
    // 折叠态：其余对话的选项按钮尚未渲染。
    expect(queryByRole('button', { name: '遗失的钥匙能找回吗' })).toBeNull();
  });

  it('按下开关切换 expanded 并展开菜单项', async () => {
    const { getByRole, queryByRole } = await render(
      <TabDrop items={ITEMS} selectedKey="c1" onSelect={() => {}} />,
    );

    const trigger = getByRole('button', { name: '切换对话' });
    expect(trigger.props.accessibilityState?.expanded).toBe(false);

    await fireEvent.press(trigger);

    expect(trigger.props.accessibilityState?.expanded).toBe(true);
    expect(queryByRole('button', { name: '遗失的钥匙能找回吗' })).not.toBeNull();
  });

  it('按下某个对话项以其 key 触发 onSelect', async () => {
    const onSelect = jest.fn();
    const { getByRole } = await render(
      <TabDrop items={ITEMS} selectedKey="c1" onSelect={onSelect} />,
    );

    await fireEvent.press(getByRole('button', { name: '切换对话' }));
    await fireEvent.press(getByRole('button', { name: '遗失的钥匙能找回吗' }));

    expect(onSelect).toHaveBeenCalledWith('c3');
  });

  it('展开后当前对话项通过无障碍状态暴露 selected', async () => {
    const { getByRole } = await render(
      <TabDrop items={ITEMS} selectedKey="c1" onSelect={() => {}} />,
    );

    await fireEvent.press(getByRole('button', { name: '切换对话' }));

    expect(getByRole('button', { name: '今年适合换工作吗' }).props.accessibilityState?.selected).toBe(
      true,
    );
    expect(getByRole('button', { name: '今日宜忌与吉时' }).props.accessibilityState?.selected).toBe(
      false,
    );
  });

  it('提供 onNew 时展开菜单顶部有「新对话」入口，按下触发 onNew 并收起', async () => {
    const onNew = jest.fn();
    const { getByRole, queryByRole } = await render(
      <TabDrop items={ITEMS} selectedKey="c1" onSelect={() => {}} onNew={onNew} />,
    );

    // 折叠态：新对话入口尚未渲染。
    expect(queryByRole('button', { name: '新对话' })).toBeNull();

    await fireEvent.press(getByRole('button', { name: '切换对话' }));
    await fireEvent.press(getByRole('button', { name: '新对话' }));

    expect(onNew).toHaveBeenCalledTimes(1);
    expect(queryByRole('button', { name: '新对话' })).toBeNull(); // 收起
  });

  it('未提供 onNew 时不渲染新对话入口', async () => {
    const { getByRole, queryByRole } = await render(
      <TabDrop items={ITEMS} selectedKey="c1" onSelect={() => {}} />,
    );

    await fireEvent.press(getByRole('button', { name: '切换对话' }));

    expect(queryByRole('button', { name: '新对话' })).toBeNull();
  });

  it('选择后菜单收起（再次折叠）', async () => {
    function Harness() {
      const [sel, setSel] = useState('c1');
      return <TabDrop items={ITEMS} selectedKey={sel} onSelect={setSel} />;
    }
    const { getByRole, queryByRole } = await render(<Harness />);

    await fireEvent.press(getByRole('button', { name: '切换对话' }));
    await fireEvent.press(getByRole('button', { name: '今日宜忌与吉时' }));

    // 收起后其余项按钮消失，开关回到未展开。
    expect(queryByRole('button', { name: '遗失的钥匙能找回吗' })).toBeNull();
    expect(getByRole('button', { name: '切换对话' }).props.accessibilityState?.expanded).toBe(false);
  });
});
