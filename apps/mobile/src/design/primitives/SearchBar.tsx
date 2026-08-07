import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { durations, easing } from '../motion';
import { radii } from '../radii';
import { semantic } from '../semantic';
import { shadows } from '../shadows';
import { fonts, tracking } from '../typography';
import { useReducedMotion } from '../useReducedMotion';
import { Icon } from './Icon';

// 原型 .searchbar:focus-within 的边框色（gold@50%）——焦点专用一次性色，非通用 token（原型 §列表搜索）。
const FOCUS_BORDER = 'rgba(201,162,74,0.5)';

export interface SearchBarProps {
  /** 搜索词（受控）。 */
  value: string;
  /** 输入变化回调（清除按钮亦以空串触发它）。 */
  onChangeText: (text: string) => void;
  /** 占位符（原型 placeholder「搜索历史对话…」）。 */
  placeholder?: string;
  /** 输入框无障碍名（原型 input aria-label，如「搜索历史对话」）。 */
  accessibilityLabel: string;
  /** 清除后触发（在 onChangeText('') 之后）；可选。 */
  onClear?: () => void;
  /** 清除按钮无障碍名，默认「清除搜索」。 */
  clearLabel?: string;
}

const BEZIER = Easing.bezier(...easing.standard);

/**
 * SearchBar —— Tier-2 列表搜索框（历史/收藏页属主，spec §Primitives / issue 10）。
 * 原型 .searchbar：ink-3 底 + line 描边 + r12 的行，内含放大镜图标 + TextInput + 可清除按钮（仅在
 * 有输入时显示）。聚焦时金色焦点环：边框色渐入（gold@50%）+ gold-soft 3px 环，走 Reanimated 并订阅
 * 「减少动态效果」（同 Field 的焦点环裁定）。清除按钮按下即清空并回焦输入框。
 * 转发 value/onChangeText；搜索谓词是 list/listSearch 的纯函数（见其单测），本组件只承载输入 chrome。
 * 行为测试见 SearchBar.test.tsx；视觉忠实度双端人工核对（spec Testing Decisions）。
 */
export function SearchBar({
  value,
  onChangeText,
  placeholder,
  accessibilityLabel,
  onClear,
  clearLabel = '清除搜索',
}: SearchBarProps) {
  const reduced = useReducedMotion();
  const inputRef = useRef<TextInput>(null);

  // 焦点驱动 0↔1：边框色插值 + 焦点环层透明度（同 Field）。
  const focus = useSharedValue(0);
  const borderStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(focus.value, [0, 1], [semantic.border, FOCUS_BORDER]),
  }));
  const ringStyle = useAnimatedStyle(() => ({ opacity: focus.value }));

  useEffect(() => cancelAnimation(focus), [focus]);

  const setFocus = (to: number) => {
    focus.value = reduced ? to : withTiming(to, { duration: durations.input, easing: BEZIER });
  };

  const clear = () => {
    onChangeText('');
    onClear?.();
    inputRef.current?.focus();
  };

  return (
    <Animated.View style={[styles.bar, borderStyle]}>
      {/* 焦点环叠层：gold-soft 3px 环，透明度随聚焦渐入。 */}
      <Animated.View style={[styles.ring, ringStyle]} pointerEvents="none" />
      <Icon name="search" color={semantic.textSecondary} size={17} />
      <TextInput
        ref={inputRef}
        accessibilityLabel={accessibilityLabel}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocus(1)}
        onBlur={() => setFocus(0)}
        placeholder={placeholder}
        placeholderTextColor={semantic.textFaint}
        style={styles.input}
        returnKeyType="search"
      />
      {value.length > 0 ? (
        <Pressable accessibilityRole="button" accessibilityLabel={clearLabel} onPress={clear} hitSlop={8}>
          <Icon name="close" color={semantic.textSecondary} size={15} />
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // 原型 .searchbar：横排、居中、gap9、ink-3 底、line 描边、r12、padding 0/14、下外边距 14。
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: semantic.surfaceInput,
    borderWidth: 1,
    borderColor: semantic.border,
    borderRadius: radii.md, // 12
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  ring: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radii.md,
    boxShadow: shadows.focusRing,
  },
  // 原型 .searchbar input：占满、象牙、14、.02em、上下 padding 12。
  input: {
    flex: 1,
    minWidth: 0,
    color: semantic.textPrimary,
    fontFamily: fonts.sans,
    fontSize: 14,
    letterSpacing: tracking(0.02, 14),
    paddingVertical: 12,
  },
});
