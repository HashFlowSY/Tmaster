import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { durations, easing } from '../motion';
import { radii } from '../radii';
import { semantic } from '../semantic';
import { shadows } from '../shadows';
import { typeRamp } from '../typography';
import { useReducedMotion } from '../useReducedMotion';

// primary 按钮文字色（原型 .btn-primary color:#241a06）——金底上的深墨金,一次性值,非通用 token。
const PRIMARY_LABEL_COLOR = '#241a06';

export interface ButtonProps {
  /** primary = 金色渐变主按钮；ghost = 透明描边次按钮（原型 .btn-primary / .btn-ghost）。 */
  variant: 'primary' | 'ghost';
  onPress: () => void;
  /** 呼吸辉光（原型 .btn-breathe）——按裁定用 Reanimated 对辉光层做 opacity 脉动，减动效时静止。仅 primary 有意义。 */
  breathe?: boolean;
  /** true 时惰性：不触发 onPress、无按压反馈、降透明度（原型 disabled 态）。 */
  disabled?: boolean;
  /** 按钮文字。 */
  children: ReactNode;
}

const BEZIER = Easing.bezier(...easing.standard);

/**
 * Button —— Tier-1 交互 primitive（spec §Primitives）。
 * primary = 金渐变（gold-2→gold 180°）+ 金辉 boxShadow + r14；ghost = 透明 + line 描边。
 * 按压缩放（.99 + 下移 1pt）与 breathe 辉光皆走 Reanimated，并订阅系统「减少动态效果」。
 * 视觉忠实度双端人工核对；此处只保证行为（onPress / disabled 惰性）——由 Button.test 覆盖。
 */
export function Button({ variant, onPress, breathe = false, disabled = false, children }: ButtonProps) {
  const reduced = useReducedMotion();
  const isPrimary = variant === 'primary';

  // 按压反馈：0→1 驱动缩放 / 下移。
  const press = useSharedValue(0);
  const pressStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(press.value, [0, 1], [1, 0.99]) },
      { translateY: interpolate(press.value, [0, 1], [0, 1]) },
    ],
  }));

  // 呼吸辉光层透明度：0↔1 往复（原型 3.6s 一个来回）。
  const glow = useSharedValue(0);
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  useEffect(() => {
    if (breathe && isPrimary && !reduced) {
      glow.value = withRepeat(
        withTiming(1, { duration: durations.breatheButton / 2, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      cancelAnimation(glow);
      glow.value = 0;
    }
    return () => cancelAnimation(glow);
  }, [breathe, isPrimary, reduced, glow]);

  const setPress = (to: number) => {
    press.value = reduced ? to : withTiming(to, { duration: durations.pressFast, easing: BEZIER });
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => !disabled && setPress(1)}
      onPressOut={() => !disabled && setPress(0)}
    >
      <View style={styles.wrapper}>
        {breathe && isPrimary ? (
          <Animated.View style={[styles.glow, glowStyle]} pointerEvents="none" />
        ) : null}
        <Animated.View
          style={[
            styles.box,
            isPrimary ? styles.primaryBox : styles.ghostBox,
            disabled && styles.disabled,
            pressStyle,
          ]}
        >
          {isPrimary ? (
            <LinearGradient
              colors={[semantic.accentBright, semantic.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          ) : null}
          <Text style={[styles.label, isPrimary ? styles.primaryLabel : styles.ghostLabel]}>
            {children}
          </Text>
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'relative' },
  // 辉光层：与按钮同尺寸叠在其后，用 breathe 峰值阴影，透明度由动画脉动（裁定：opacity-on-glow-layer）。
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radii.button,
    boxShadow: shadows.breatheHigh,
  },
  box: {
    width: '100%',
    borderRadius: radii.button, // 14
    paddingVertical: 15,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden', // 裁剪渐变到圆角
  },
  primaryBox: {
    backgroundColor: semantic.accent, // 渐变加载前的底色兜底
    boxShadow: shadows.goldButton, // 静态金辉（原型 .btn-primary）
  },
  ghostBox: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: semantic.border,
  },
  disabled: { opacity: 0.4 },
  label: { ...typeRamp.button, textAlign: 'center' },
  // primary 文字用原型的深墨金；ghost 用象牙。
  primaryLabel: { color: PRIMARY_LABEL_COLOR },
  ghostLabel: { color: semantic.textPrimary },
});
