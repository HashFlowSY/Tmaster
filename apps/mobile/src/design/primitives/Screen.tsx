import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
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
  /**
   * true 时用 KeyboardAvoidingView 包裹,键盘弹起时内容避让(issue 02,供 auth 等表单屏)。
   * 默认 false:不包裹、行为与现状一致(键盘避让效果交真机人工核对,不进单测)。
   */
  avoidKeyboard?: boolean;
  /**
   * 固定底栏,渲染在(可滚动)内容区**之外**、贴屏底常驻(如生辰引导的「生成命盘」主按钮)。
   * 用内容横向留白(26)+ 顶部细线分隔;安全区底部 inset 由 SafeAreaView 提供。滚动时长内容不会盖住它
   * ——footer 是列布局的兄弟节点,ScrollView(flex:1)自动为其让出高度。
   */
  footer?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** 覆盖/追加内容区样式(静态时作用于 View,滚动时作用于 contentContainer)。 */
  contentStyle?: StyleProp<ViewStyle>;
}

/**
 * Screen —— 每个页面的表现型骨架:安全区内边距 + `bg` 底 + 内容/标题两档横向留白。
 * 用真实 OS 状态栏(由 app/_layout 的 expo-status-bar 提供),**不画假状态栏 / 刘海**
 * (spec §10 mock-frame exclusions)。安全区顶部内边距把内容顶到真状态栏之下。
 */
export function Screen({
  children,
  header,
  scroll = false,
  avoidKeyboard = false,
  footer,
  style,
  contentStyle,
}: ScreenProps) {
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

  const body = (
    <>
      {header != null ? <View style={styles.header}>{header}</View> : null}
      {content}
      {footer != null ? <View style={styles.footer}>{footer}</View> : null}
    </>
  );

  return (
    <SafeAreaView style={[styles.root, style]}>
      {avoidKeyboard ? (
        // iOS 用 padding 避让;Android 交由系统 windowSoftInputMode(adjustResize)处理,不叠加 behavior。
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: semantic.bg },
  flex: { flex: 1 },
  header: { paddingHorizontal: gutter.header }, // 22
  content: { paddingHorizontal: gutter.content }, // 26
  // 固定底栏:内容横向留白 + 顶部细线,与滚动内容区隔开;贴屏底常驻。
  // paddingBottom 保证在无底部安全区 inset 的设备上按钮也不贴屏底(有 inset 时 SafeAreaView 再叠加)。
  footer: {
    paddingHorizontal: gutter.content, // 26
    paddingTop: 12,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: semantic.borderFaint,
  },
});
