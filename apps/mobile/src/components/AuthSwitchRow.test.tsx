import { fireEvent, render } from '@testing-library/react-native';
import { AuthSwitchRow } from './AuthSwitchRow';

// 行为契约测试（spec Testing Decisions）——只断言可观察行为：提示语/链接渲染、点击链接触发 onPress。
// 不断言布局/颜色（视觉双端人工核对）。RTL v14（React 19）下 render / fireEvent 均须 await。
describe('AuthSwitchRow', () => {
  it('渲染提示语与链接文字', async () => {
    const { getByText } = await render(
      <AuthSwitchRow prompt="还没有账号？" linkLabel="注册天机账号" onPress={() => {}} />,
    );

    expect(getByText('还没有账号？')).toBeTruthy();
    expect(getByText('注册天机账号')).toBeTruthy();
  });

  it('点击链接触发 onPress', async () => {
    const onPress = jest.fn();
    const { getByRole } = await render(
      <AuthSwitchRow prompt="已有账号？" linkLabel="直接登录" onPress={onPress} centered />,
    );

    await fireEvent.press(getByRole('button', { name: '直接登录' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
