import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Circle, Defs, RadialGradient, Stop, Svg } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { durations, easing } from '../motion';
import { radii } from '../radii';
import { semantic } from '../semantic';
import { typeRamp } from '../typography';
import { useReducedMotion } from '../useReducedMotion';
import { Icon } from './Icon';

// me 气泡的金色渐变（原型 .msg.me .bubble linear-gradient 180deg）——气泡专用一次性色。
const ME_GRADIENT = ['rgba(201,162,74,0.16)', 'rgba(201,162,74,0.09)'] as const;
const ME_BORDER = 'rgba(201,162,74,0.3)'; // 原型 .msg.me .bubble border-color
// AI 头像的离心径向渐变与描边（原型 .avatar radial-gradient + border gold@.35）——头像专用一次性色。
const AVATAR_INNER = '#2a2f3f';
const AVATAR_OUTER = '#14171f';
const AVATAR_BORDER = 'rgba(201,162,74,0.35)';
const AVATAR_SIZE = 34;
// 气泡「尖角」半径（原型 border-top-*-radius:5，指向说话人一侧）。
const CORNER = 5;

const BEZIER = Easing.bezier(...easing.standard);

/** AI 头像：离心径向渐变圆 + 金描边 + 中心太极（原型 .avatar，spec §7 裁定 radial→svg RadialGradient）。 */
function ChatAvatar() {
  return (
    <View style={styles.avatar}>
      <Svg width={AVATAR_SIZE} height={AVATAR_SIZE} style={StyleSheet.absoluteFill}>
        <Defs>
          {/* 原型 circle at 40% 35%：离心高光。 */}
          <RadialGradient id="avatarBg" cx="40%" cy="35%" r="75%">
            <Stop offset="0" stopColor={AVATAR_INNER} />
            <Stop offset="1" stopColor={AVATAR_OUTER} />
          </RadialGradient>
        </Defs>
        <Circle cx={AVATAR_SIZE / 2} cy={AVATAR_SIZE / 2} r={AVATAR_SIZE / 2} fill="url(#avatarBg)" />
      </Svg>
      <Icon name="taiji" color={semantic.accentBright} size={16} />
    </View>
  );
}

export interface ChatMessageProps {
  /** 'user' = 命主（右侧金渐变气泡，无头像）；'assistant' = AI（左侧带太极头像）。 */
  role: 'user' | 'assistant';
  /** 气泡正文（原型 .bubble 文本，可含行内强调节点）。 */
  children: ReactNode;
  /**
   * 可选内嵌键值卡（原型 AI 气泡里的 .card）——通常仅 AI 消息使用。对话页据 shared 的
   * `Message.card`（可选字段）在此挂入 <KvCard>；纯文本回复不传。
   */
  card?: ReactNode;
  /** 入场动画（原型 .msgin：淡入 + 上移 10→0）。默认 true；减动效时静态出现。 */
  animateIn?: boolean;
}

/**
 * ChatMessage —— Tier-2 对话气泡（spec §Primitives / issue 07）。
 * AI 消息：左侧太极头像 + ink-3 气泡（左上尖角）；命主消息：右对齐、金色渐变气泡（右上尖角、gold@.3 描边、
 * 无头像）。可内嵌 KvCard。挂载时播 msgin 入场（淡入 + 上移），走 Reanimated 并订阅「减少动态效果」。
 * 纯表现型（无交互），视觉忠实度双端人工核对，故不设行为测试。
 */
export function ChatMessage({ role, children, card, animateIn = true }: ChatMessageProps) {
  const reduced = useReducedMotion();
  const isMe = role === 'user';

  // 入场 0→1：透明度 + 上移。挂载时跑一次（原型 .msgin 一次性动画）。
  const enter = useSharedValue(animateIn && !reduced ? 0 : 1);
  const enterStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ translateY: (1 - enter.value) * 10 }],
  }));
  useEffect(() => {
    if (animateIn && !reduced) {
      enter.value = withTiming(1, { duration: durations.msgIn, easing: BEZIER });
    } else {
      enter.value = 1;
    }
  }, [animateIn, reduced, enter]);

  return (
    <Animated.View style={[styles.row, isMe ? styles.rowMe : styles.rowAi, enterStyle]}>
      {isMe ? null : <ChatAvatar />}
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleAi]}>
        {isMe ? (
          <LinearGradient
            colors={ME_GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        <Text style={styles.text}>{children}</Text>
        {card}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // 原型 .msg：横排、gap10、max-width 88%。
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, maxWidth: '88%' },
  rowAi: { alignSelf: 'flex-start' },
  // 原型 .msg.me：靠右、行内反向（无头像，故仅靠右）。
  rowMe: { alignSelf: 'flex-end' },
  // 原型 .avatar：34×34 圆、金描边、裁剪径向渐变到圆、居中放太极。
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radii.round,
    borderWidth: 1,
    borderColor: AVATAR_BORDER,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 原型 .bubble：padding 13-15、r16、裁剪 me 渐变到圆角。可收缩以在 88% 内换行。
  bubble: {
    flexShrink: 1,
    borderWidth: 1,
    borderRadius: radii.lg, // 16
    paddingVertical: 13,
    paddingHorizontal: 15,
    overflow: 'hidden',
  },
  // AI 气泡：ink-3 底 + line 描边，左上尖角（原型 .msg .bubble border-top-left-radius:5）。
  bubbleAi: {
    backgroundColor: semantic.surfaceInput,
    borderColor: semantic.border,
    borderTopLeftRadius: CORNER,
  },
  // me 气泡：金渐变（渐变前底色兜底）+ gold@.3 描边，右上尖角（原型 .msg.me .bubble）。
  bubbleMe: {
    backgroundColor: semantic.accentSoft,
    borderColor: ME_BORDER,
    borderTopRightRadius: CORNER,
  },
  // 原型 .bubble：14.5 / 1.72 行高 / 象牙。
  text: typeRamp.bubble,
});
