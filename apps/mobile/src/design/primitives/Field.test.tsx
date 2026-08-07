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
});
