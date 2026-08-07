// 分页区间计算（历史/收藏共用的纯逻辑 seam，spec Testing Decisions / issue 10）。
// 原型 docs/ui/tianji-app-design.html 每页固定若干行、共若干页；这里把「给定全集大小/每页数/请求页
// → 当前页区间 + clamp 后的页码/总页数」抽成纯函数，属主页据此切片扁平全集。
// 上/下一页可用性与页码序列属渲染控件的表现层，由 `Pager` 组件自 page/totalPages 派生，不入本模型
// （避免产出无人消费的字段）。

export interface PageView {
  /** 当前页（1-based，已 clamp 到 [1, totalPages]）。 */
  page: number;
  /** 总页数（至少 1，空全集也占一页）。 */
  totalPages: number;
  /** 当前页起始下标（0-based，含）。 */
  start: number;
  /** 当前页结束下标（0-based，不含）——不满一页时收敛到全集长度。 */
  end: number;
}

/**
 * 计算某一页的区间与 clamp 后的页码。`requestedPage` 越界会 clamp 到 [1, totalPages]。
 * `pageSize` 归一到至少 1，避免除零；空全集得到单空页（totalPages 1、区间 [0,0)）。
 */
export function pageView(totalItems: number, pageSize: number, requestedPage: number): PageView {
  const total = Math.max(0, Math.floor(totalItems));
  const size = Math.max(1, Math.floor(pageSize));
  const totalPages = Math.max(1, Math.ceil(total / size));
  const page = Math.min(totalPages, Math.max(1, Math.floor(requestedPage)));
  const start = (page - 1) * size;
  const end = Math.min(total, start + size);
  return { page, totalPages, start, end };
}

/** 按当前页区间从全集切出该页的项。 */
export function slicePage<T>(items: readonly T[], view: PageView): T[] {
  return items.slice(view.start, view.end);
}
