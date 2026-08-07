import { Stack } from 'expo-router';
import { semantic } from '../../src/design/semantic';

/**
 * (app) —— 登录后路由组外壳。一个 Stack:主区 (tabs)（对话/命盘/我的,带 BottomNav,无原生头)
 * 铺底,历史对话 / 我的收藏作为从「我的」推入的二级页叠在其上（顶部返回而非底栏——与原型一致）。
 * header/内容底色统一走设计系统 token（暖墨 ink + 金）。
 * 历史页（issue 10）/ 收藏页（issue 11）/ 开源许可页（issue 12）均已自绘衬线标题栏 + 返回键,
 * 故 headerShown:false（不叠原生头）。
 */
export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: semantic.bg },
        headerTintColor: semantic.accent,
        headerTitleStyle: { color: semantic.textPrimary },
        contentStyle: { backgroundColor: semantic.bg },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="history" options={{ headerShown: false }} />
      <Stack.Screen name="favorites" options={{ headerShown: false }} />
      <Stack.Screen name="licenses" options={{ headerShown: false }} />
    </Stack>
  );
}
