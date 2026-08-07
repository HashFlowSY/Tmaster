import { fireEvent, render } from '@testing-library/react-native';
import { TitleBar } from './TitleBar';

// 行为契约测试（spec Testing Decisions）——TitleBar 的返回键是可访问按钮，按下触发 onBack；
// 标题文本渲染出来。不断言样式 / 布局（视觉双端人工核对）。RTL v14（React 19）下 render / fireEvent 均异步。

describe('TitleBar', () => {
  it('按下返回键触发 onBack', async () => {
    const onBack = jest.fn();
    const { getByRole } = await render(<TitleBar title="我的收藏" onBack={onBack} />);

    await fireEvent.press(getByRole('button', { name: '返回' }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('渲染传入的标题文本', async () => {
    const { getByText } = await render(<TitleBar title="历史对话" onBack={() => {}} />);

    expect(getByText('历史对话')).toBeTruthy();
  });

  it('可覆盖返回键无障碍名', async () => {
    const { getByRole } = await render(
      <TitleBar title="我的收藏" onBack={() => {}} backLabel="返回我的" />,
    );

    expect(getByRole('button', { name: '返回我的' })).toBeTruthy();
  });
});
