import { fireEvent, render } from '@testing-library/react-native';
import { ListRow } from './ListRow';

// 行为契约测试（spec Testing Decisions）——ListRow 是可访问按钮，按下触发 onPress，
// 以标题为无障碍名（时间/断语/系统标签不污染）。不碰图标 / 分隔线 / 胶囊样式（视觉双端人工核对）。
// RTL v14（React 19）下 render / fireEvent 均为异步，须 await。

describe('ListRow', () => {
  it('按下整行触发 onPress', async () => {
    const onPress = jest.fn();
    const { getByRole } = await render(
      <ListRow
        icon="chart"
        title="今年适合换工作吗"
        snippet="乙巳年正官透干，宜往金水行业。"
        time="今天 09:24"
        tag="八字"
        onPress={onPress}
      />,
    );

    await fireEvent.press(getByRole('button', { name: '今年适合换工作吗' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('以标题作无障碍名（时间/断语/标签不并入）', async () => {
    const { getByRole } = await render(
      <ListRow
        icon="grid"
        title="遗失的钥匙能找回吗"
        snippet="落坎一宫近水处，今日申时前可寻回。"
        time="昨天 21:47"
        tag="奇门"
        onPress={() => {}}
      />,
    );

    expect(getByRole('button', { name: '遗失的钥匙能找回吗' })).toBeTruthy();
  });

  it('省略 snippet 时仍可渲染并按下（数据模型无预览的降级）', async () => {
    const onPress = jest.fn();
    const { getByRole } = await render(
      <ListRow icon="chart" title="今年财运走势" time="08-04" tag="八字" onPress={onPress} />,
    );

    await fireEvent.press(getByRole('button', { name: '今年财运走势' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('收藏变体（两行标题）保留按钮契约：可按下、以整段标题作无障碍名', async () => {
    const onPress = jest.fn();
    // 收藏 = 一整条对话，标题较长会截断为两行（视觉双端人工核对）；此处只断言按钮行为不被变体破坏。
    const title = '乙巳年事业要点：变动窗口农历三月至六月，利西北方，宜金融、科技。';
    const { getByRole } = await render(
      <ListRow
        variant="favorite"
        icon="bookmarkFilled"
        title={title}
        time="08-04"
        tag="八字"
        onPress={onPress}
      />,
    );

    await fireEvent.press(getByRole('button', { name: title }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
