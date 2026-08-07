import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { semantic } from '../semantic';
import { gutter } from '../spacing';

export interface ScreenProps {
  children: ReactNode;
  /**
   * 固定标题区(title-row 等),渲染在内容之上、用 header 横向留白(22)。
   * 原型里标题区留白比内容区窄——两种留白由此区分(spec Primitives:content 26 / header 22)。
   */
  header?: ReactNode;
  /** true 时内容区可滚动(ScrollView);默认静态 View。 */
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  /** 覆盖/追加内容区样式(静态时作用于 View,滚动时作用于 contentContainer)。 */
  contentStyle?: StyleProp<ViewStyle>;
}

/**
 * Screen —— 每个页面的表现型骨架:安全区内边距 + `bg` 底 + 内容/标题两档横向留白。
 * 用真实 OS 状态栏(由 app/_layout 的 expo-status-bar 提供),**不画假状态栏 / 刘海**
 * (spec §10 mock-frame exclusions)。安全区顶部内边距把内容顶到真状态栏之下。
 */
export function Screen({ children, header, scroll = false, style, contentStyle }: ScreenProps) {
  const content = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.content, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, styles.content, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView style={[styles.root, style]}>
      {header != null ? <View style={styles.header}>{header}</View> : null}
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: semantic.bg },
  flex: { flex: 1 },
  header: { paddingHorizontal: gutter.header }, // 22
  content: { paddingHorizontal: gutter.content }, // 26
});
