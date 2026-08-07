import { fireEvent, render } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';

// 冒烟测试：证明 @testing-library/react-native 测试台已就位并可运行——
// 渲染 RN 组件、按无障碍角色查询、派发 press 事件。
// 用就地的最小组件，不依赖任何尚未构建的 primitive（Button/Field 等在 issue 02+）。
function Probe({ onPress }: { onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <Text>点我</Text>
    </Pressable>
  );
}

// 注意：RTL v14（React 19）里 `render` 与 `fireEvent.*` 都是异步的，须 `await`。
// issue 02+ 的 Button/Field/SegmentedControl 行为测试照此模式写。
describe('RTL 测试台', () => {
  it('渲染、按角色查询、并派发 press', async () => {
    const onPress = jest.fn();
    const { getByRole } = await render(<Probe onPress={onPress} />);

    await fireEvent.press(getByRole('button', { name: '点我' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
