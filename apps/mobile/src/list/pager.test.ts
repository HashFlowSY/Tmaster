import { pageView, slicePage } from './pager';

// 纯逻辑 seam（spec Testing Decisions / issue 10）——分页区间计算。
// 只测可观察输出（当前页区间、总页数、clamp），不碰组件。上/下一页可用性属渲染控件的表现层，
// 由 Pager 自 page/totalPages 派生并在 Pager.test.tsx 覆盖，不入本纯模型。
// 原型每页固定 6 行、共 3 页 18 段；区间计算提取为纯函数，属主页据此切片扁平全集。

describe('pageView', () => {
  it('首页：起于 0、区间为首页 6 项', () => {
    expect(pageView(18, 6, 1)).toEqual({ page: 1, totalPages: 3, start: 0, end: 6 });
  });

  it('中间页：区间正确', () => {
    expect(pageView(18, 6, 2)).toEqual({ page: 2, totalPages: 3, start: 6, end: 12 });
  });

  it('末页：区间到全集末尾', () => {
    expect(pageView(18, 6, 3)).toEqual({ page: 3, totalPages: 3, start: 12, end: 18 });
  });

  it('不满一页的末页：end 收敛到全集长度（非页边界）', () => {
    // 14 条 / 每页 6 → 3 页；第 3 页仅 2 条（下标 12..14）。
    expect(pageView(14, 6, 3)).toEqual({ page: 3, totalPages: 3, start: 12, end: 14 });
  });

  it('请求页越界向下 clamp 到 1', () => {
    expect(pageView(18, 6, 0)).toMatchObject({ page: 1, start: 0, end: 6 });
    expect(pageView(18, 6, -5)).toMatchObject({ page: 1 });
  });

  it('请求页越界向上 clamp 到末页', () => {
    expect(pageView(18, 6, 99)).toEqual({ page: 3, totalPages: 3, start: 12, end: 18 });
  });

  it('空全集：单页、区间为空', () => {
    expect(pageView(0, 6, 1)).toEqual({ page: 1, totalPages: 1, start: 0, end: 0 });
  });

  it('单页放得下的短全集：只有一页、区间覆盖全集', () => {
    expect(pageView(4, 6, 1)).toEqual({ page: 1, totalPages: 1, start: 0, end: 4 });
  });
});

describe('slicePage', () => {
  const items = Array.from({ length: 14 }, (_, i) => i);

  it('按当前页区间切出该页的项', () => {
    expect(slicePage(items, pageView(14, 6, 1))).toEqual([0, 1, 2, 3, 4, 5]);
    expect(slicePage(items, pageView(14, 6, 3))).toEqual([12, 13]);
  });

  it('空全集切出空数组', () => {
    expect(slicePage([], pageView(0, 6, 1))).toEqual([]);
  });
});
