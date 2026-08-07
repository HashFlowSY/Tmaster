import { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
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
import type { IconName } from './icons';

// 原型 .input:focus-within 的边框色（gold@55%）——焦点专用一次性色，非通用 token（原型 §输入框）。
const FOCUS_BORDER = 'rgba(201,162,74,0.55)';

export interface FieldProps
  extends Omit<TextInputProps, 'onFocus' | 'onBlur' | 'placeholderTextColor' | 'style'> {
  /** 字段标签（原型 .field label），同时用作 TextInput 的无障碍标签。 */
  label: string;
  /** 前置图标名（原型 .input .ic）。 */
  icon?: IconName;
  /** 尾缀文字（原型 .suffix，如「忘记密码」），可点。 */
  suffix?: string;
  /** 尾缀点击回调。 */
  onSuffixPress?: () => void;
  /** 输入框下方的辅助说明文字（原型 .field .helper，如注册页密码建议）。 */
  helper?: string;
  /**
   * 字段级错误文案（issue 02）。有值即进错误态：危险色边框 + 错误行（叠加于 helper 位置）；
   * 不传则与现状完全一致。文案由客户端校验 / 服务端错误信封映射产出（见 src/auth/formLogic）。
   */
  error?: string;
  /** 获得焦点时上报（spec：Field 通过回调上报 focus，而非由样式断言）。 */
  onFocus?: () => void;
  /** 失去焦点时上报。 */
  onBlur?: () => void;
}

const BEZIER = Easing.bezier(...easing.standard);

/**
 * Field —— Tier-1 交互 primitive（spec §Primitives）。
 * 结构：标签 + 输入行（前置图标 · TextInput · 可选尾缀）。聚焦时金色焦点环：
 * 边框色渐入 + gold-soft 3px 环（原型 .input:focus-within），走 Reanimated 并订阅「减少动态效果」。
 * 转发 value/onChangeText 等 TextInputProps；focus 经 onFocus/onBlur 回调上报——由 Field.test 覆盖，
 * 测试只断言回调与值转发，不断言焦点环样式（spec Testing Decisions）。
 */
export function Field({
  label,
  icon,
  suffix,
  onSuffixPress,
  helper,
  error,
  onFocus,
  onBlur,
  secureTextEntry,
  ...rest
}: FieldProps) {
  const reduced = useReducedMotion();

  // 显/隐切换（issue 02）：仅密码字段（secureTextEntry）内建；默认隐藏，点击眼睛翻转。
  // 非密码字段不渲染切换、行为与现状一致。
  const isPassword = secureTextEntry === true;
  const [revealed, setRevealed] = useState(false);
  const secure = isPassword ? !revealed : secureTextEntry;

  // 焦点驱动 0↔1：边框色插值 + 焦点环层透明度。
  const focus = useSharedValue(0);
  const borderStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(focus.value, [0, 1], [semantic.border, FOCUS_BORDER]),
  }));
  const ringStyle = useAnimatedStyle(() => ({ opacity: focus.value }));

  useEffect(() => cancelAnimation(focus), [focus]);

  const setFocus = (to: number) => {
    focus.value = reduced ? to : withTiming(to, { duration: durations.input, easing: BEZIER });
  };

  const handleFocus = () => {
    setFocus(1);
    onFocus?.();
  };
  const handleBlur = () => {
    setFocus(0);
    onBlur?.();
  };

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {/* 错误态边框（issue 02）：静态危险色叠在动画边框之后，聚焦与否都压过焦点色。 */}
      <Animated.View style={[styles.input, borderStyle, error != null && styles.inputError]}>
        {/* 焦点环叠层：gold-soft 3px 环，透明度随聚焦渐入（裁定：焦点环走 Reanimated）。 */}
        <Animated.View style={[styles.ring, ringStyle]} pointerEvents="none" />
        {icon != null ? <Icon name={icon} color={semantic.textSecondary} size={17} /> : null}
        <TextInput
          placeholderTextColor={semantic.textFaint}
          {...rest}
          secureTextEntry={secure}
          accessibilityLabel={label}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={styles.textInput}
        />
        {isPassword ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? '隐藏密码' : '显示密码'}
            onPress={() => setRevealed((v) => !v)}
            hitSlop={8}
          >
            <Icon name={revealed ? 'eyeOff' : 'eye'} color={semantic.textSecondary} size={18} />
          </Pressable>
        ) : null}
        {suffix != null ? (
          <Pressable onPress={onSuffixPress} hitSlop={8}>
            <Text style={styles.suffix}>{suffix}</Text>
          </Pressable>
        ) : null}
      </Animated.View>
      {/* 错误行占据 helper 位置：有 error 显错误文本，否则显 helper（不传两者则无下方行，与现状一致）。 */}
      {error != null ? (
        <Text style={styles.error}>{error}</Text>
      ) : helper != null ? (
        <Text style={styles.helper}>{helper}</Text>
      ) : null}
    </View>
  );
}

// helper / error 行共用的排版尺寸（原型 .field .helper）；两者只在颜色上分岔，故抽出防漂移。
const subText = {
  fontFamily: fonts.sans,
  fontSize: 11.5,
  letterSpacing: tracking(0.02, 11.5),
  lineHeight: 11.5 * 1.5,
  marginTop: 7,
} as const;

const styles = StyleSheet.create({
  field: { marginBottom: 16 },
  // 标签：无衬线 12.5 / muted / .06em 字距（原型 .field label）。非 type ramp 档，就地成样。
  label: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    letterSpacing: tracking(0.06, 12.5),
    color: semantic.textSecondary,
    marginBottom: 8,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: semantic.surfaceInput,
    borderWidth: 1,
    borderColor: semantic.border,
    borderRadius: radii.input, // 13
    paddingHorizontal: 14,
  },
  // 错误态边框（issue 02）：危险色实线，覆盖焦点色（spec §C：red 边框 + 错误行）。
  inputError: { borderColor: semantic.danger },
  ring: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radii.input,
    boxShadow: shadows.focusRing,
  },
  textInput: {
    flex: 1,
    color: semantic.textPrimary,
    fontFamily: fonts.sans,
    fontSize: 15,
    letterSpacing: tracking(0.02, 15),
    paddingVertical: 14,
  },
  // 尾缀：gold-2 / 12.5 / .04em（原型 .input .suffix）。
  suffix: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    letterSpacing: tracking(0.04, 12.5),
    color: semantic.accentBright,
  },
  // 辅助说明：muted-2 / 11.5 / .02em，紧贴输入框下方（原型 .field .helper）。
  helper: { ...subText, color: semantic.textFaint },
  // 错误行（issue 02）：与 helper 同位同排版，仅改危险色（spec §C：错误行）。共用 subText 排版，防漂移。
  error: { ...subText, color: semantic.danger },
});
