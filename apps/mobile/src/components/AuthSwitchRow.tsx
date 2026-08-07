import { Pressable, StyleSheet, Text, View } from 'react-native';
import { semantic } from '../design/semantic';
import { fonts, tracking } from '../design/typography';

export interface AuthSwitchRowProps {
  /** 前缀提示语（原型 .textmute，如「还没有账号？」/「已有账号？」）。 */
  prompt: string;
  /** 链接文字（原型 .link，如「注册天机账号」/「直接登录」）。 */
  linkLabel: string;
  /** 链接点击回调。 */
  onPress: () => void;
  /** true 时整行居中 + gap 8（注册页 .between 覆盖）；默认两端对齐（登录页 .between）。 */
  centered?: boolean;
}

/**
 * 登录/注册页底部「切换到另一屏」提示行 —— 原型 .between + .textmute + .link 的复用件
 * （登录页 494-497 / 注册页 551-554）：muted 提示语 + gold-2 链接。登录页两端对齐、注册页居中。
 * 两屏共用,置于 src/components/（auth 共享复合件,不入 DS primitive——同 LoginHero 的定位）。
 */
export function AuthSwitchRow({ prompt, linkLabel, onPress, centered = false }: AuthSwitchRowProps) {
  return (
    <View style={[styles.row, centered && styles.centered]}>
      <Text style={styles.prompt}>{prompt}</Text>
      <Pressable accessibilityRole="button" onPress={onPress} hitSlop={8}>
        <Text style={styles.link}>{linkLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  // 原型 .between：两端对齐 + margin-top 16。
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  // 注册页 .between 内联覆盖：居中 + gap 8。
  centered: { justifyContent: 'center', gap: 8 },
  // 原型 .textmute：muted / 13。
  prompt: { fontFamily: fonts.sans, fontSize: 13, color: semantic.textSecondary },
  // 原型 .link：gold-2 / 13 / .04em。
  link: {
    fontFamily: fonts.sans,
    fontSize: 13,
    letterSpacing: tracking(0.04, 13),
    color: semantic.accentBright,
  },
});
