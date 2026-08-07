import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { durations, easing } from '../motion';
import { radii } from '../radii';
import { semantic } from '../semantic';
import { fonts, tracking } from '../typography';
import { useReducedMotion } from '../useReducedMotion';
import { Icon } from './Icon';

// 发送图标色 —— 金底上的深墨金（同 Button primary 文字），金色渐变上的一次性对比色，非通用 token。
const SEND_ICON_COLOR = '#241a06';
// 圆形发送按钮直径（原型 .send 40×40）。
const SEND_SIZE = 40;

export interface ComposerProps {
  /** 输入内容（受控）。 */
  value: string;
  /** 输入变化回调。 */
  onChangeText: (text: string) => void;
  /** 按下发送按钮触发。 */
  onSend: () => void;
  /** 占位符（原型 placeholder「向天机追问…」）。 */
  placeholder?: string;
  /** true 时发送按钮惰性：不触发 onSend、无按压反馈、降透明度（流式回复中或空输入时）。 */
  sendDisabled?: boolean;
  /** 输入框获得/失去焦点回调（转发给调用方，如收起菜单）。 */
  onFocus?: () => void;
  onBlur?: () => void;
}

const BEZIER = Easing.bezier(...easing.standard);

/**
 * Composer —— Tier-2 对话输入条（spec §Primitives / issue 07，对话页属主）。
 * 结构：ink 底 + 顶描边的行；左侧 ink-3 胶囊输入盒（原型 .composer .box，r22），右侧 40×40 圆形
 * 金渐变发送按钮（原型 .send，gold-2→gold 180°）内嵌纸飞机图标。发送按压缩放 .94 走 Reanimated 并
 * 订阅「减少动态效果」。转发 value/onChangeText 与 focus 回调；行为（发送 / 输入转发 / disabled 惰性）
 * 由 Composer.test 覆盖，视觉忠实度双端人工核对。
 */
export function Composer({
  value,
  onChangeText,
  onSend,
  placeholder = '向天机追问…',
  sendDisabled = false,
  onFocus,
  onBlur,
}: ComposerProps) {
  const reduced = useReducedMotion();

  const press = useSharedValue(0);
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(press.value, [0, 1], [1, 0.94]) }],
  }));
  const setPress = (to: number) => {
    press.value = reduced ? to : withTiming(to, { duration: durations.pressFast, easing: BEZIER });
  };

  return (
    <View style={styles.composer}>
      <View style={styles.box}>
        <TextInput
          accessibilityLabel="输入消息"
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          placeholderTextColor={semantic.textFaint}
          style={styles.input}
          returnKeyType="send"
          onSubmitEditing={() => {
            if (!sendDisabled) onSend();
          }}
        />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="发送"
        accessibilityState={{ disabled: sendDisabled }}
        disabled={sendDisabled}
        onPress={onSend}
        onPressIn={() => !sendDisabled && setPress(1)}
        onPressOut={() => !sendDisabled && setPress(0)}
      >
        <Animated.View style={[styles.send, sendDisabled && styles.sendDisabled, pressStyle]}>
          <LinearGradient
            colors={[semantic.accentBright, semantic.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Icon name="send" color={SEND_ICON_COLOR} size={18} />
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  // 原型 .composer：行、ink 底、顶描边、padding 10-18（底部安全区由外层 KeyboardAvoidingView / inset 处理）。
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderTopWidth: 1,
    borderTopColor: semantic.border,
    backgroundColor: semantic.bg,
  },
  // 原型 .composer .box：ink-3 底 + line 描边 + r22 胶囊。
  box: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: semantic.surfaceInput,
    borderWidth: 1,
    borderColor: semantic.border,
    borderRadius: radii.xl, // 22
    paddingLeft: 16,
    paddingRight: 8,
  },
  // 原型 .composer input：14.5 / 象牙 / 上下 padding 12。
  input: {
    flex: 1,
    color: semantic.textPrimary,
    fontFamily: fonts.sans,
    fontSize: 14.5,
    letterSpacing: tracking(0.02, 14.5),
    paddingVertical: 12,
  },
  // 原型 .send：40×40 圆、金渐变（渐变前底色兜底）。
  send: {
    width: SEND_SIZE,
    height: SEND_SIZE,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: semantic.accent,
  },
  sendDisabled: { opacity: 0.4 },
});
