// 动效 token —— 纯 TS,零运行时（ADR-0005）。订阅系统「减少动态效果」的运行时 hook
// 见 ./useReducedMotion（另置以保持本层纯净）。

// 动效时长（ms），1:1 取自原型 transition / animation。
export const durations = {
  pressFast: 120, // transform .12s（按压反馈）
  base: 200, // 菜单 / 分段 .2s
  standard: 220, // .22s 主过渡
  input: 250, // 焦点环 / toast .25s
  shadow: 300, // box-shadow .3s
  screenIn: 500, // .screen 入场
  msgIn: 450, // .msgin 气泡入场
  breatheButton: 3600, // .btn-breathe 呼吸
  breatheGlow: 5000, // 登录罗盘 .glow 呼吸
  twinkle: 6000, // 星野闪烁
  spin: 60000, // 罗盘自转
} as const;

// 主减速缓动 cubic-bezier(.16,1,.3,1)，原型入场/过渡通用。
// 以控制点元组表达,供 reanimated `Easing.bezier(...)` 或 Animated 使用。
export const easing = {
  standard: [0.16, 1, 0.3, 1] as const,
} as const;

export type DurationToken = keyof typeof durations;

/**
 * 减动效纯逻辑：开启「减少动态效果」时把时长归零(对应原型
 * `@media (prefers-reduced-motion:reduce){*{animation:none;transition:none}}`)。
 * 纯函数,便于单测;动画层据此把时长换成 0。
 */
export function resolveDuration(reduced: boolean, ms: number): number {
  return reduced ? 0 : ms;
}
