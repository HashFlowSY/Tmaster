import { fireEvent, render } from '@testing-library/react-native';
import { Composer } from './Composer';

// 行为契约测试（spec Testing Decisions）——对话页底部 Composer 的输入转发与发送。
// 只断言可观察行为与无障碍状态，不碰渐变发送按钮 / 输入框样式（视觉双端人工核对）。
// RTL v14（React 19）下 render / fireEvent 均为异步，须 await。
describe('Composer', () => {
  it('输入时转发 onChangeText', async () => {
    const onChangeText = jest.fn();
    const { getByLabelText } = await render(
      <Composer value="" onChangeText={onChangeText} onSend={() => {}} />,
    );

    await fireEvent.changeText(getByLabelText('输入消息'), '我今年适合换工作吗？');

    expect(onChangeText).toHaveBeenCalledWith('我今年适合换工作吗？');
  });

  it('按下发送按钮触发 onSend', async () => {
    const onSend = jest.fn();
    const { getByRole } = await render(
      <Composer value="你好" onChangeText={() => {}} onSend={onSend} />,
    );

    await fireEvent.press(getByRole('button', { name: '发送' }));

    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it('sendDisabled 时发送按钮惰性：不触发 onSend 且无障碍状态为 disabled', async () => {
    const onSend = jest.fn();
    const { getByRole } = await render(
      <Composer value="" onChangeText={() => {}} onSend={onSend} sendDisabled />,
    );

    const send = getByRole('button', { name: '发送' });
    expect(send.props.accessibilityState?.disabled).toBe(true);

    await fireEvent.press(send);

    expect(onSend).not.toHaveBeenCalled();
  });

  it('转发 value 到输入框', async () => {
    const { getByLabelText } = await render(
      <Composer value="已输入的内容" onChangeText={() => {}} onSend={() => {}} />,
    );

    expect(getByLabelText('输入消息').props.value).toBe('已输入的内容');
  });
});
