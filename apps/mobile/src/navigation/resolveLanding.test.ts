import { resolveLanding, type LandingInput } from './resolveLanding';

// 落点单一真相源（spec 实现决策 B / 测试缝 2）——穷举 (ready × authenticated × nudge × group)
// 断可观察的重定向目标（`/login` | `/onboarding` | `/chat` | null）。纯函数，无需 mock expo-router。
// prior art：conversationMeta.test.ts（只断纯函数返回，不碰组件 / 导航副作用）。
describe('resolveLanding', () => {
  // 便捷构造：默认 authed-有生辰-在启动占位，逐例覆盖单一维度。
  const input = (over: Partial<LandingInput>): LandingInput => ({
    ready: true,
    authenticated: true,
    nudgeOnboarding: false,
    group: undefined,
    ...over,
  });

  describe('boot 未完成（ready=false）一律不重定向', () => {
    // 无论其余维度取何值，都得等 boot 完成 → null。
    it.each`
      authenticated | nudgeOnboarding | group
      ${false}      | ${false}        | ${'(auth)'}
      ${true}       | ${true}         | ${'(app)'}
      ${true}       | ${false}        | ${undefined}
      ${false}      | ${true}         | ${'onboarding'}
    `(
      'ready=false, auth=$authenticated, nudge=$nudgeOnboarding, group=$group → null',
      ({ authenticated, nudgeOnboarding, group }) => {
        expect(resolveLanding(input({ ready: false, authenticated, nudgeOnboarding, group }))).toBeNull();
      },
    );
  });

  describe('未登录（ready=true, authenticated=false）', () => {
    it('已在 (auth) 组内 → null（不打扰登录/注册屏）', () => {
      expect(resolveLanding(input({ authenticated: false, group: '(auth)' }))).toBeNull();
    });

    it.each`
      group
      ${'(app)'}
      ${'onboarding'}
      ${undefined}
    `('在 $group（非 auth 组）→ /login', ({ group }) => {
      expect(resolveLanding(input({ authenticated: false, group }))).toBe('/login');
    });
  });

  describe('已登录（ready=true, authenticated=true）', () => {
    describe('在 (auth) 组内（刚登录/注册）—— 依 nudge 决定落点', () => {
      it('nudge=true → /onboarding', () => {
        expect(resolveLanding(input({ authenticated: true, nudgeOnboarding: true, group: '(auth)' }))).toBe(
          '/onboarding',
        );
      });

      it('nudge=false → /chat', () => {
        expect(resolveLanding(input({ authenticated: true, nudgeOnboarding: false, group: '(auth)' }))).toBe(
          '/chat',
        );
      });
    });

    describe('在启动占位 index（group=undefined）—— boot-landing 修复', () => {
      // 带 token 冷启动的返回用户由此从启动占位落到 /chat；boot 不引导，故 nudge 不影响。
      it.each`
        nudgeOnboarding
        ${true}
        ${false}
      `('nudge=$nudgeOnboarding → /chat', ({ nudgeOnboarding }) => {
        expect(resolveLanding(input({ authenticated: true, nudgeOnboarding, group: undefined }))).toBe('/chat');
      });
    });

    describe('已在 app / onboarding 内 —— 非常驻门禁，不弹回', () => {
      it.each`
        group           | nudgeOnboarding
        ${'(app)'}      | ${true}
        ${'(app)'}      | ${false}
        ${'onboarding'} | ${true}
        ${'onboarding'} | ${false}
      `('group=$group, nudge=$nudgeOnboarding → null', ({ group, nudgeOnboarding }) => {
        expect(resolveLanding(input({ authenticated: true, nudgeOnboarding, group }))).toBeNull();
      });
    });
  });
});
