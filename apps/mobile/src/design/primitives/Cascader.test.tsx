import { fireEvent, render } from '@testing-library/react-native';
import { Cascader } from './Cascader';

// 行为契约测试（spec Testing Decisions）——Cascader 按下某个选项时以其 value 触发 onSelect。
// 只断言可观察行为与无障碍选中态，不碰 ✓ 标记 / gold-2 文字样式（视觉双端人工核对）。
// RTL v14（React 19）下 render / fireEvent 均为异步，须 await。
const CRUMBS = [
  { label: '浙江省' },
  { label: '杭州市' },
  { label: '西湖区', current: true },
] as const;

const OPTIONS = [
  { label: '西湖区', value: 'xihu' },
  { label: '上城区', value: 'shangcheng' },
  { label: '拱墅区', value: 'gongshu' },
] as const;

describe('Cascader', () => {
  it('按下某个选项时以其 value 触发 onSelect', async () => {
    const onSelect = jest.fn();
    const { getByRole } = await render(
      <Cascader crumbs={CRUMBS} options={OPTIONS} selected="xihu" onSelect={onSelect} />,
    );

    await fireEvent.press(getByRole('button', { name: '上城区' }));

    expect(onSelect).toHaveBeenCalledWith('shangcheng');
  });

  it('通过无障碍状态暴露当前选中项', async () => {
    const { getByRole } = await render(
      <Cascader crumbs={CRUMBS} options={OPTIONS} selected="xihu" onSelect={() => {}} />,
    );

    expect(getByRole('button', { name: '西湖区' }).props.accessibilityState?.selected).toBe(true);
    expect(getByRole('button', { name: '上城区' }).props.accessibilityState?.selected).toBe(false);
  });

  it('渲染面包屑各级文字', async () => {
    const { getByText } = await render(
      <Cascader crumbs={CRUMBS} options={OPTIONS} onSelect={() => {}} />,
    );

    expect(getByText('浙江省')).toBeTruthy();
    expect(getByText('杭州市')).toBeTruthy();
  });
});
