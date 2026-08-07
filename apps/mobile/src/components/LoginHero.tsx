import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Circle, Defs, RadialGradient, Stop, Svg } from 'react-native-svg';
import { durations, easing } from '../design/motion';
import { MarkRing, MarkTaiji } from '../design/primitives';
import { semantic } from '../design/semantic';
import { fonts, tracking } from '../design/typography';
import { useReducedMotion } from '../design/useReducedMotion';

const MARK = 96;
const GLOW_INSET = 14; // 原型 .mark .glow{inset:-14px}
const GLOW = MARK + GLOW_INSET * 2;

// 星野光点（原型 .starfield 的 6 个 radial-gradient 点：位置% / 尺寸 / 色与透明度 1:1）。
const STARS = [
  { left: '18%', top: '30%', size: 1, color: semantic.textPrimary, opacity: 0.7 },
  { left: '72%', top: '20%', size: 1, color: semantic.textPrimary, opacity: 0.5 },
  { left: '44%', top: '62%', size: 1.5, color: semantic.accentBright, opacity: 0.6 },
  { left: '88%', top: '55%', size: 1, color: semantic.textPrimary, opacity: 0.45 },
  { left: '30%', top: '78%', size: 1, color: semantic.textPrimary, opacity: 0.4 },
  { left: '60%', top: '42%', size: 1, color: semantic.textPrimary, opacity: 0.35 },
] as const;

const BEZIER = Easing.bezier(...easing.standard);

export interface LoginHeroProps {
  /**
   * 输入聚焦时收缩让位（issue 06 / spec User Story 15）：为真时 hero 高度归零 + 淡出，把空间让给表单，
   * 失焦（false）恢复。过渡走 Reanimated 并订阅「减少动态效果」——减动效时瞬时切换、不做补间。
   */
  collapsed?: boolean;
}

/**
 * LoginHero —— 登录页品牌区（原型 .entry-hero），登录屏专属复合件（非 DS primitive，单屏消费）。
 * 三处常驻动效均订阅系统「减少动态效果」（spec User Story 15）：
 *  - 星野 twinkle：整层 opacity .55↔1，6s 往复（原型 @keyframes twinkle）。
 *  - 罗盘 spin：仅外圈 MarkRing 自转 360°，60s 线性（原型 .ring-spin，太极静止）。
 *  - 辉光 breathe：SVG 径向渐变的 opacity 脉动，5s 往复（裁定：glow → RadialGradient + Reanimated opacity）。
 *
 * 另有聚焦收缩（issue 06）：`collapsed` 为真时整块高度→0 + 淡出，让位于表单；首次布局用 onLayout 量得
 * 自然高度作为展开态目标，据此在 [full,0] 间补间（减动效则瞬时）。
 */
export function LoginHero({ collapsed = false }: LoginHeroProps) {
  const reduced = useReducedMotion();

  const twinkle = useSharedValue(reduced ? 0.7 : 0.55);
  const spin = useSharedValue(0);
  const glow = useSharedValue(reduced ? 1 : 0.7);

  // 聚焦收缩：progress 0=展开 / 1=收起；fullHeight 为首次布局量得的自然高度（收缩目标从此值补间到 0）。
  const [fullHeight, setFullHeight] = useState<number | null>(null);
  const collapse = useSharedValue(0);

  useEffect(() => {
    const to = collapsed ? 1 : 0;
    collapse.value = reduced ? to : withTiming(to, { duration: durations.standard, easing: BEZIER });
  }, [collapsed, reduced, collapse]);

  const collapseStyle = useAnimatedStyle(() => {
    if (fullHeight == null) return {}; // 未量得高度前不干预自然布局
    return {
      height: interpolate(collapse.value, [0, 1], [fullHeight, 0]),
      opacity: interpolate(collapse.value, [0, 1], [1, 0]),
    };
  });

  // 只在首次（未量得时）记录自然高度，避免设定 height 后 onLayout 回读形成反馈环。
  const onLayout = (e: LayoutChangeEvent) => {
    if (fullHeight == null) setFullHeight(e.nativeEvent.layout.height);
  };

  useEffect(() => {
    if (reduced) {
      cancelAnimation(twinkle);
      cancelAnimation(spin);
      cancelAnimation(glow);
      twinkle.value = 0.7;
      spin.value = 0;
      glow.value = 1;
      return;
    }
    twinkle.value = withRepeat(
      withTiming(1, { duration: durations.twinkle / 2, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    spin.value = withRepeat(withTiming(360, { duration: durations.spin, easing: Easing.linear }), -1);
    glow.value = withRepeat(
      withTiming(1, { duration: durations.breatheGlow / 2, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    return () => {
      cancelAnimation(twinkle);
      cancelAnimation(spin);
      cancelAnimation(glow);
    };
  }, [reduced, twinkle, spin, glow]);

  const twinkleStyle = useAnimatedStyle(() => ({ opacity: twinkle.value }));
  const spinStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value}deg` }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  return (
    <Animated.View style={[styles.collapse, collapseStyle]} onLayout={onLayout}>
    <View style={styles.hero}>
      <Animated.View style={[StyleSheet.absoluteFill, twinkleStyle]} pointerEvents="none">
        {STARS.map((s, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: s.left,
              top: s.top,
              width: s.size * 2,
              height: s.size * 2,
              borderRadius: s.size,
              backgroundColor: s.color,
              opacity: s.opacity,
            }}
          />
        ))}
      </Animated.View>

      <View style={styles.mark}>
        <Animated.View style={[styles.glow, glowStyle]} pointerEvents="none">
          <Svg width={GLOW} height={GLOW}>
            <Defs>
              <RadialGradient id="loginGlow" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor={semantic.accent} stopOpacity={0.28} />
                <Stop offset="0.68" stopColor={semantic.accent} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={GLOW / 2} cy={GLOW / 2} r={GLOW / 2} fill="url(#loginGlow)" />
          </Svg>
        </Animated.View>
        <Animated.View style={spinStyle}>
          <MarkRing size={MARK} />
        </Animated.View>
        <View style={StyleSheet.absoluteFill}>
          <MarkTaiji size={MARK} />
        </View>
      </View>

      <Text style={styles.brandName} accessibilityRole="header">
        天 机
      </Text>
      <Text style={styles.brandLine}>观天之道 执天之行</Text>
    </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // 收缩容器：overflow hidden 使高度补间时内容被裁而非溢出（配合聚焦收缩）。
  collapse: { overflow: 'hidden' },
  hero: {
    position: 'relative',
    alignItems: 'center',
    paddingTop: 34,
    paddingBottom: 8,
    overflow: 'hidden',
  },
  mark: {
    position: 'relative',
    width: MARK,
    height: MARK,
    marginTop: 6,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    left: -GLOW_INSET,
    top: -GLOW_INSET,
    width: GLOW,
    height: GLOW,
  },
  // 品牌名：34pt 衬线大字距（原型 .brand-name，含 padding-left:.42em 抵消末字距）。
  brandName: {
    fontFamily: fonts.serif,
    fontSize: 34,
    letterSpacing: tracking(0.42, 34),
    paddingLeft: tracking(0.42, 34),
    color: semantic.textPrimary,
    marginBottom: 12,
  },
  // 品牌副线：13.5pt 衬线 gold-2（原型 .brand-line）。
  brandLine: {
    fontFamily: fonts.serif,
    fontSize: 13.5,
    letterSpacing: tracking(0.34, 13.5),
    paddingLeft: tracking(0.34, 13.5),
    color: semantic.accentBright,
  },
});
