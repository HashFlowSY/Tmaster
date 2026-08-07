// 列表搜索谓词（历史/收藏共用的纯逻辑 seam，spec Testing Decisions / issue 10）。
// 1:1 于原型 docs/ui/tianji-app-design.html 的 runListSearch：搜索词去首尾空白 + 小写后，
// 对「行的可搜文本」做大小写不敏感子串匹配；空词为「清除态」——显示全部、不过滤。
// 搜索作用于扁平全集（跨所有分页），故提取为与组件无关的纯函数，单测直接断言其输出。

/** 归一化搜索词：去首尾空白 + 小写。返回空串表示未在搜索（清除态）。 */
export function normalizeQuery(raw: string): string {
  return raw.trim().toLowerCase();
}

/**
 * 行是否命中搜索词。空词（清除态）恒命中——显示全部；否则归一化词为 `searchText` 的
 * 大小写不敏感子串即命中（原型 `r.textContent.toLowerCase().indexOf(q) >= 0`）。
 */
export function rowMatchesQuery(searchText: string, rawQuery: string): boolean {
  const q = normalizeQuery(rawQuery);
  if (q === '') return true;
  return searchText.toLowerCase().includes(q);
}

/**
 * 跨全集过滤：空词返回原全集（清除态，不过滤）；否则保留可搜文本命中该词的行。
 * `toText` 把一行拼成可搜文本（标题+断语+时间+系统标签，对应原型 .convrow 的 textContent），
 * 搜索因此作用于全部页（原型搜索时展开所有 pagegroup 一起过滤），与分页无关。
 */
export function filterRows<T>(rows: readonly T[], rawQuery: string, toText: (row: T) => string): T[] {
  if (normalizeQuery(rawQuery) === '') return rows.slice();
  return rows.filter((row) => rowMatchesQuery(toText(row), rawQuery));
}
