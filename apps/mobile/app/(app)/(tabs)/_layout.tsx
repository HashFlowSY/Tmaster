import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { BottomNav, type BottomNavItem } from '../../../src/design/primitives';
import { semantic } from '../../../src/design/semantic';

// 主 tab 配置：key = 路由名（= 文件名），label/icon 供 BottomNav 渲染（原型底栏三项：对话/命盘/我的）。
// 历史对话 / 我的收藏不在此——它们是从「我的」推入的二级页（(app) Stack），本身不带底栏。
const TABS: readonly BottomNavItem[] = [
  { key: 'chat', label: '对话', icon: 'chat' },
  { key: 'chart', label: '命盘', icon: 'chart' },
  { key: 'profile', label: '我的', icon: 'user' },
] as const;

// 从 expo-router Tabs 组件推导 tabBar 回调的入参类型，避免深引 @react-navigation/bottom-tabs 内部路径。
type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

/**
 * 把 react-navigation 的 state/navigation 桥到解耦的 BottomNav（spec：BottomNav 整合 expo-router Tabs）。
 * 当前激活 tab 由 state.index 决定；按下时按 react-navigation 惯例先发可拦截的 tabPress 事件，
 * 未被拦截且不是当前 tab 才 navigate——与内建底栏行为一致（重复点当前 tab 不重复入栈）。
 */
function TabBar({ state, navigation }: TabBarProps) {
  const activeKey = state.routes[state.index]?.name ?? '';
  return (
    <BottomNav
      items={TABS}
      activeKey={activeKey}
      onSelect={(key) => {
        const route = state.routes.find((r) => r.name === key);
        if (!route) return;
        const event = navigation.emit({
          type: 'tabPress',
          target: route.key,
          canPreventDefault: true,
        });
        if (route.name !== activeKey && !event.defaultPrevented) {
          navigation.navigate(route.name);
        }
      }}
    />
  );
}

/**
 * (app)/(tabs) —— 登录后主区的 tab 外壳。三个主 section（对话/命盘/我的）挂在这层 Tabs 上，
 * 用自定义 BottomNav 作 tabBar；无原生头（各页自渲染标题），场景底为设计系统 bg（暖墨 ink）。
 */
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={TabBar}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: semantic.bg } }}
    >
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="chart" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
