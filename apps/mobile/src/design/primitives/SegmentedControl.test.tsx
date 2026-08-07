import { fireEvent, render } from '@testing-library/react-native';
import { useState } from 'react';
import { SegmentedControl } from './SegmentedControl';

// 行为契约测试（spec Testing Decisions）——SegmentedControl 以被选项的 value 触发 onChange。
// 只断言可观察行为与无障碍选中态，不碰 accentSoft 填充 / 内描边样式（视觉双端人工核对）。
// RTL v14（React 19）下 render / fireEvent 均为异步，须 await。
const OPTIONS = [
  { label: '乾造 · 男', value: 'male' },
  { label: '坤造 · 女', value: 'female' },
] as const;

describe('SegmentedControl', () => {
  it('按下某一项时以该项的 value 触发 onChange', async () => {
    const onChange = jest.fn();
    const { getByRole } = await render(
      <SegmentedControl options={OPTIONS} value="male" onChange={onChange} />,
    );

    await fireEvent.press(getByRole('button', { name: '坤造 · 女' }));

    expect(onChange).toHaveBeenCalledWith('female');
  });

  it('按下当前已选项仍以其 value 触发 onChange', async () => {
    const onChange = jest.fn();
    const { getByRole } = await render(
      <SegmentedControl options={OPTIONS} value="male" onChange={onChange} />,
    );

    await fireEvent.press(getByRole('button', { name: '乾造 · 男' }));

    expect(onChange).toHaveBeenCalledWith('male');
  });

  it('通过无障碍状态暴露当前选中项', async () => {
    const { getByRole } = await render(
      <SegmentedControl options={OPTIONS} value="female" onChange={() => {}} />,
    );

    expect(getByRole('button', { name: '坤造 · 女' }).props.accessibilityState?.selected).toBe(true);
    expect(getByRole('button', { name: '乾造 · 男' }).props.accessibilityState?.selected).toBe(false);
  });

  it('受控切换：选中项回流并反映到无障碍状态', async () => {
    function Harness() {
      const [v, setV] = useState<'male' | 'female'>('male');
      return <SegmentedControl options={OPTIONS} value={v} onChange={setV} />;
    }
    const { getByRole } = await render(<Harness />);

    await fireEvent.press(getByRole('button', { name: '坤造 · 女' }));

    expect(getByRole('button', { name: '坤造 · 女' }).props.accessibilityState?.selected).toBe(true);
  });
});
