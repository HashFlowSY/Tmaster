import { fireEvent, render } from '@testing-library/react-native';
import { useState } from 'react';
import { Field } from './Field';

// 行为契约测试（spec Testing Decisions）——断言 value/onChangeText 转发与 focus 回调，
// **不**断言焦点环样式（那是变更探测器，视觉由双端人工核对）。RTL v14 下 render/fireEvent 须 await。
describe('Field', () => {
  it('转发 value 与 onChangeText', async () => {
    const onChangeText = jest.fn();
    const { getByLabelText } = await render(
      <Field label="邮箱" value="abc" onChangeText={onChangeText} />,
    );

    const input = getByLabelText('邮箱');
    expect(input.props.value).toBe('abc');

    await fireEvent.changeText(input, 'abcd');
    expect(onChangeText).toHaveBeenCalledWith('abcd');
  });

  it('通过回调上报 focus / blur（不断言焦点环样式）', async () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    const { getByLabelText } = await render(
      <Field label="密码" value="" onChangeText={() => {}} onFocus={onFocus} onBlur={onBlur} />,
    );

    const input = getByLabelText('密码');
    await fireEvent(input, 'focus');
    expect(onFocus).toHaveBeenCalledTimes(1);

    await fireEvent(input, 'blur');
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('受控输入：changeText 驱动的新值回流到 input', async () => {
    function Harness() {
      const [v, setV] = useState('');
      return <Field label="邮箱" value={v} onChangeText={setV} />;
    }
    const { getByLabelText } = await render(<Harness />);
    const input = getByLabelText('邮箱');

    await fireEvent.changeText(input, 'chenyu@example.com');
    expect(getByLabelText('邮箱').props.value).toBe('chenyu@example.com');
  });

  it('点击 suffix 触发 onSuffixPress', async () => {
    const onSuffixPress = jest.fn();
    const { getByText } = await render(
      <Field label="密码" value="" onChangeText={() => {}} suffix="忘记密码" onSuffixPress={onSuffixPress} />,
    );

    await fireEvent.press(getByText('忘记密码'));
    expect(onSuffixPress).toHaveBeenCalledTimes(1);
  });

  // issue 02：错误态。断言错误文本被渲染出来（不断言边框色值——那是视觉，交人工核对）。
  it('传入 error 时渲染错误文本', async () => {
    const { getByText } = await render(
      <Field label="邮箱" value="bad" onChangeText={() => {}} error="邮箱格式不正确" />,
    );
    expect(getByText('邮箱格式不正确')).toBeTruthy();
  });

  it('不传 error 时不渲染错误文本（现状不变）', async () => {
    const { queryByText } = await render(<Field label="邮箱" value="" onChangeText={() => {}} />);
    expect(queryByText('邮箱格式不正确')).toBeNull();
  });

  // issue 02：显/隐切换。断言点击眼睛翻转 secureTextEntry（行为，不断样式）。
  it('secureTextEntry 字段：点击显/隐切换翻转 secureTextEntry', async () => {
    const { getByLabelText } = await render(
      <Field label="密码" value="s3cret12" onChangeText={() => {}} secureTextEntry />,
    );

    // 初始隐藏：input 的 secureTextEntry 为 true。
    expect(getByLabelText('密码').props.secureTextEntry).toBe(true);

    // 点「显示密码」→ 翻为可见。
    await fireEvent.press(getByLabelText('显示密码'));
    expect(getByLabelText('密码').props.secureTextEntry).toBe(false);

    // 再点「隐藏密码」→ 翻回隐藏。
    await fireEvent.press(getByLabelText('隐藏密码'));
    expect(getByLabelText('密码').props.secureTextEntry).toBe(true);
  });

  it('非 secureTextEntry 字段：不渲染显/隐切换（现状不变）', async () => {
    const { queryByLabelText } = await render(<Field label="邮箱" value="" onChangeText={() => {}} />);
    expect(queryByLabelText('显示密码')).toBeNull();
  });
});
