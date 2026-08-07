import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { durations } from '../motion';
import { radii } from '../radii';
import { semantic } from '../semantic';
import { shadows } from '../shadows';
import { fonts, tracking } from '../typography';
import { useReducedMotion } from '../useReducedMotion';

// 原型 .toast 的底色 / 描边：墨底 96% + gold@40% 描边——toast 专用一次性值（原型 §toast）。
const TOAST_BG = 'rgba(20,23,31,0.96)';
const TOAST_BORDER = 'rgba(201,162,74,0.4)';

export interface ToastProps {
  /** 非 null 即显示该文案；置 null 隐藏。（原型「敬请期待」等 data-soon 提示。） */
  message: string | null;
  /** 显示后自动隐藏时应调用它清空 message（原型 1800ms）。 */
  onHide: () => void;
  /** 自动隐藏毫秒数，默认 1800（原型 setTimeout 1800）。 */
  durationMs?: number;
}

/**
 * Toast —— Tier-2 轻提示（spec §Primitives：owning screen 改造时构建；登录页首个消费者）。
 * 屏底居中的胶囊，淡入 + 上移 12→0（原型 .toast.show），到时淡出并回调 onHide 卸载。
 * 动效走 Reanimated 并订阅「减少动态效果」。作为 aria-live 状态区（role status）供读屏播报。
 */
export function Toast({ message, onHide, durationMs = durations.toastHold }: ToastProps) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);

  const pillStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 12 }],
  }));

  useEffect(() => {
    if (message == null) return;
    progress.value = reduced ? 1 : withTiming(1, { duration: durations.input, easing: Easing.ease });
    // 停留 durationMs 后先播淡出，等淡出跑完再 onHide 卸载——否则同一 tick 卸载会吞掉退场动画。
    let hideTimer: ReturnType<typeof setTimeout>;
    const holdTimer = setTimeout(() => {
      progress.value = reduced ? 0 : withTiming(0, { duration: durations.input, easing: Easing.ease });
      hideTimer = setTimeout(onHide, reduced ? 0 : durations.input);
    }, durationMs);
    return () => {
      clearTimeout(holdTimer);
      clearTimeout(hideTimer);
    };
  }, [message, durationMs, reduced, progress, onHide]);

  if (message == null) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Animated.View
        style={[styles.pill, pillStyle]}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
      >
        <Text style={styles.text}>{message}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 70, // 原型 bottom:70px
    zIndex: 60,
  },
  pill: {
    backgroundColor: TOAST_BG,
    borderWidth: 1,
    borderColor: TOAST_BORDER,
    borderRadius: radii.md, // 12
    paddingVertical: 11,
    paddingHorizontal: 22,
    boxShadow: shadows.overlay,
  },
  text: {
    fontFamily: fonts.sans,
    fontSize: 13.5,
    letterSpacing: tracking(0.14, 13.5),
    color: semantic.textPrimary,
  },
});
