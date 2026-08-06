/** 拼接 API 地址。纯函数，无原生依赖，便于单测。 */
export function joinApiUrl(base: string, path: string): string {
  const b = base.replace(/\/+$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
}
