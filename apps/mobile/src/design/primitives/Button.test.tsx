import { fireEvent, render } from '@testing-library/react-native';
import { Button } from './Button';

// 行为契约测试（spec Testing Decisions）——只断言可观察的外部行为，不碰样式 / 渐变 / 阴影。
// 视觉忠实度（金渐变、呼吸辉光、按压缩放）由双端人工核对，不在此断言。
// RTL v14（React 19）下 render / fireEvent 均为异步，须 await。
describe('Button', () => {
  it('按下时触发 onPress', async () => {
    const onPress = jest.fn();
    const { getByRole } = await render(
      <Button variant="primary" onPress={onPress}>
        登 录
      </Button>,
    );

    await fireEvent.press(getByRole('button', { name: '登 录' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('disabled 时按下不触发 onPress（惰性）', async () => {
    const onPress = jest.fn();
    const { getByRole } = await render(
      <Button variant="primary" disabled onPress={onPress}>
        登 录
      </Button>,
    );

    await fireEvent.press(getByRole('button', { name: '登 录' }));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('disabled 通过无障碍状态暴露', async () => {
    const { getByRole } = await render(
      <Button variant="ghost" disabled onPress={() => {}}>
        取 消
      </Button>,
    );

    const node = getByRole('button', { name: '取 消' });
    expect(node.props.accessibilityState?.disabled).toBe(true);
  });

  it('ghost 变体同样触发 onPress', async () => {
    const onPress = jest.fn();
    const { getByRole } = await render(
      <Button variant="ghost" onPress={onPress}>
        注 册
      </Button>,
    );

    await fireEvent.press(getByRole('button', { name: '注 册' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('breathe 开启时仍可渲染并触发 onPress', async () => {
    const onPress = jest.fn();
    const { getByRole } = await render(
      <Button variant="primary" breathe onPress={onPress}>
        登 录
      </Button>,
    );

    await fireEvent.press(getByRole('button', { name: '登 录' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
