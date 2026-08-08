/**
 * 落点单一真相源（spec 实现决策 B；ADR-0009）——把「登录后落哪一屏」从散落在注册屏 / RootNav
 * 的命令式跳转，收敛成一个可穷举、可单测的纯函数。RootNav 只是它的薄包装：调此函数、依非 null
 * 结果 `router.replace`。抽纯的收益：真值表可全覆盖（无需 mock expo-router），且顺带把两处既有缺陷
 * ——注册屏 `replace` 与 RootNav 抢跑（竞态 / 死返回键）、带 token 冷启动卡启动占位——收进同一处正确逻辑。
 */

/** 落点目标；null = 不重定向（停在当前屏）。 */
export type Landing = '/login' | '/onboarding' | '/chat';

export interface LandingInput {
  /** boot（会话恢复）是否已完成——未完成前不做任何重定向。 */
  ready: boolean;
  /** 是否已登录。 */
  authenticated: boolean;
  /** 是否需要生辰软引导（仅登录 / 注册时置真；boot / 登出为 false）。 */
  nudgeOnboarding: boolean;
  /**
   * 当前路由组 = `useSegments()[0]`：
   * `'(auth)'`（登录 / 注册）| `'(app)'`（登录后主区）| `'onboarding'`（生辰引导）| `undefined`（启动占位 index）。
   */
  group: string | undefined;
}

/**
 * 真值表（spec 实现决策 B 定稿）：
 *
 * | ready | authenticated | group        | 结果                                   |
 * | ----- | ------------- | ------------ | -------------------------------------- |
 * | false | —             | —            | null（等 boot 完成）                    |
 * | true  | false         | '(auth)'     | null                                    |
 * | true  | false         | 其它          | '/login'                                |
 * | true  | true          | '(auth)'     | nudge ? '/onboarding' : '/chat'（落点） |
 * | true  | true          | undefined    | '/chat'（boot-landing 修复；boot 不引导）|
 * | true  | true          | 其它（内部）   | null（非常驻门禁，不弹回）                |
 */
export function resolveLanding(input: LandingInput): Landing | null {
  const { ready, authenticated, nudgeOnboarding, group } = input;

  if (!ready) return null; // boot 未完成——静待，不闪任何屏

  if (!authenticated) {
    // 已在登录 / 注册屏则不打扰；否则一律赶回登录。
    return group === '(auth)' ? null : '/login';
  }

  // 已登录：刚从登录 / 注册屏进来 → 依 nudge 落引导或主页（单一落点，注册屏不再自跳）。
  if (group === '(auth)') {
    return nudgeOnboarding ? '/onboarding' : '/chat';
  }

  // 已登录且停在启动占位 index：带 token 冷启动的返回用户由此落主页（补 ADR-0003 遗留缺口）。
  if (group === undefined) {
    return '/chat';
  }

  // 已登录且已在 (app) / onboarding 内：非常驻门禁，不弹回，让页面内导航自便。
  return null;
}
