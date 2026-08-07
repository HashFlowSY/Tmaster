import { fireEvent, render } from '@testing-library/react-native';
import { useState } from 'react';
import { SearchBar } from './SearchBar';

// 行为契约测试（spec Testing Decisions）——SearchBar 转发 onChangeText；清除按钮仅在有输入时出现，
// 按下以空串触发 onChangeText。不断言焦点环 / 边框样式（视觉双端人工核对）。
// RTL v14（React 19）下 render / fireEvent 均为异步，须 await。

describe('SearchBar', () => {
  it('输入时转发 onChangeText', async () => {
    const onChangeText = jest.fn();
    const { getByLabelText } = await render(
      <SearchBar value="" onChangeText={onChangeText} accessibilityLabel="搜索历史对话" />,
    );

    await fireEvent.changeText(getByLabelText('搜索历史对话'), '换工作');

    expect(onChangeText).toHaveBeenCalledWith('换工作');
  });

  it('空输入时不渲染清除按钮', async () => {
    const { queryByRole } = await render(
      <SearchBar value="" onChangeText={() => {}} accessibilityLabel="搜索历史对话" />,
    );

    expect(queryByRole('button', { name: '清除搜索' })).toBeNull();
  });

  it('有输入时渲染清除按钮，按下以空串触发 onChangeText', async () => {
    const onChangeText = jest.fn();
    const { getByRole } = await render(
      <SearchBar value="换工作" onChangeText={onChangeText} accessibilityLabel="搜索历史对话" />,
    );

    await fireEvent.press(getByRole('button', { name: '清除搜索' }));

    expect(onChangeText).toHaveBeenCalledWith('');
  });

  it('受控清除：清除后按钮消失', async () => {
    function Harness() {
      const [v, setV] = useState('换工作');
      return <SearchBar value={v} onChangeText={setV} accessibilityLabel="搜索历史对话" />;
    }
    const { getByRole, queryByRole } = await render(<Harness />);

    await fireEvent.press(getByRole('button', { name: '清除搜索' }));

    expect(queryByRole('button', { name: '清除搜索' })).toBeNull();
  });
});
