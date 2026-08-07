import { fireEvent, render } from '@testing-library/react-native';
import { useState } from 'react';
import { Text } from 'react-native';
import { Checkbox } from './Checkbox';

// 行为契约测试（spec Testing Decisions）——自定义金色 Checkbox 切换 checked 并触发 onChange。
// 只断言可观察行为与无障碍状态，不碰勾选标记的 SVG / 颜色（视觉双端人工核对）。
// RTL v14（React 19）下 render / fireEvent 均为异步，须 await。
describe('Checkbox', () => {
  it('按下时以取反后的值触发 onChange', async () => {
    const onChange = jest.fn();
    const { getByRole } = await render(
      <Checkbox checked={false} onChange={onChange} accessibilityLabel="同意协议" />,
    );

    await fireEvent.press(getByRole('checkbox', { name: '同意协议' }));

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('已勾选时按下取反为 false', async () => {
    const onChange = jest.fn();
    const { getByRole } = await render(
      <Checkbox checked onChange={onChange} accessibilityLabel="同意协议" />,
    );

    await fireEvent.press(getByRole('checkbox', { name: '同意协议' }));

    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('通过无障碍状态暴露 checked', async () => {
    const { getByRole } = await render(
      <Checkbox checked onChange={() => {}} accessibilityLabel="同意协议" />,
    );

    const node = getByRole('checkbox', { name: '同意协议' });
    expect(node.props.accessibilityState?.checked).toBe(true);
  });

  it('受控切换：按下后新值回流并反映到无障碍状态', async () => {
    function Harness() {
      const [v, setV] = useState(false);
      return <Checkbox checked={v} onChange={setV} accessibilityLabel="同意协议" />;
    }
    const { getByRole } = await render(<Harness />);

    await fireEvent.press(getByRole('checkbox', { name: '同意协议' }));

    expect(getByRole('checkbox', { name: '同意协议' }).props.accessibilityState?.checked).toBe(true);
  });

  it('渲染 children 作为标签内容', async () => {
    const { getByText } = await render(
      <Checkbox checked={false} onChange={() => {}}>
        <Text>我已阅读并同意</Text>
      </Checkbox>,
    );

    expect(getByText('我已阅读并同意')).toBeTruthy();
  });
});
