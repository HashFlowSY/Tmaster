import { render } from '@testing-library/react-native';
import { Fragment } from 'react';
import { Icon, iconNames } from './Icon';
import { LoginMark } from './LoginMark';

// Icon 是表现型组件——按 spec Testing Decisions 不断言样式 / 路径 / 颜色常量(那是变更探测器,
// 视觉忠实度由双端人工核对)。这里只兑现 issue 02 的验收点:「一个组件测试断言它能渲染」,
// 并顺带覆盖「渲染全部 ~22 个图标而不抛错」。
//
// RTL v14(React 19)下 render 为异步,须 await;且同一测试内避免 render→立即 unmount 的
// 重叠 act(),故「全量」用单次 render 把所有图标放进一棵树,由「渲染不抛错 + 根节点数 == 图标数」兜底。
describe('Icon', () => {
  it('渲染图标集中的每一个而不抛错', async () => {
    expect(iconNames.length).toBeGreaterThanOrEqual(22);

    // 给每个图标一个无障碍标签(→ role="image"),渲染进一棵树,再按角色计数。
    // 数量 == 图标数 ⇒ 每个都渲染成功且无一抛错(任一图标几何非法都会让 render 抛错)。
    const { getAllByRole } = await render(
      <Fragment>
        {iconNames.map((name) => (
          <Icon key={name} name={name} accessibilityLabel={name} />
        ))}
      </Fragment>,
    );

    expect(getAllByRole('image')).toHaveLength(iconNames.length);
  });

  it('提供 accessibilityLabel 时可按无障碍标签查到', async () => {
    const { getByLabelText } = await render(<Icon name="search" accessibilityLabel="搜索" />);
    expect(getByLabelText('搜索')).toBeTruthy();
  });

  it('接受自定义 color / size / strokeWidth 仍能渲染', async () => {
    const { toJSON } = await render(<Icon name="search" color="#ffffff" size={40} strokeWidth={3} />);
    expect(toJSON()).toBeTruthy();
  });

  it('渲染填充图标(crown)而不抛错', async () => {
    const { toJSON } = await render(<Icon name="crown" color="#c9a24a" />);
    expect(toJSON()).toBeTruthy();
  });
});

// 登录品牌标记属 issue 02「Icon 渲染 ~22 图标 + 登录标记」中的登录标记部分——移植路径较多,
// 用一条渲染冒烟兜底(仍不断言路径 / 颜色 / 样式)。
describe('LoginMark', () => {
  it('渲染登录品牌标记而不抛错', async () => {
    const { getByLabelText } = await render(<LoginMark />);
    expect(getByLabelText('天机')).toBeTruthy();
  });
});
