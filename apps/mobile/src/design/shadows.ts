// 阴影 / 焦点环 —— 用新架构内建 `boxShadow` 字符串（ADR-0005，零依赖，不引 expo-blur）。
// 值 1:1 取自原型 box-shadow。RN 新架构的 `boxShadow` 接受 CSS 式字符串。
export const shadows = {
  goldButton: '0px 10px 30px rgba(201,162,74,0.28)', // .btn-primary
  goldSm: '0px 6px 20px rgba(201,162,74,0.28)',
  focusRing: '0px 0px 0px 3px rgba(201,162,74,0.14)', // .input:focus-within（gold-soft 3px 环）
  segRing: 'inset 0px 0px 0px 1px rgba(201,162,74,0.35)', // .seg button[aria-pressed] 选中项内描边
  menu: '0px 22px 55px rgba(0,0,0,0.55)', // .tabdrop 下拉
  overlay: '0px 12px 40px rgba(0,0,0,0.5)', // .toast
  breatheLow: '0px 10px 30px rgba(201,162,74,0.22)', // breathe 关键帧谷
  breatheHigh: '0px 12px 40px rgba(201,162,74,0.42)', // breathe 关键帧峰
} as const satisfies Record<string, string>;

export type ShadowToken = keyof typeof shadows;
