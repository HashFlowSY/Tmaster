import { Stack } from 'expo-router';
import { semantic } from '../../src/design/semantic';

// (auth) 路由组外壳：无原生头，内容底为设计系统的 bg（暖墨 ink），避免旧灰底闪现。
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: semantic.bg } }}
    />
  );
}
