import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/auth/AuthContext';
import { semantic } from '../src/design/semantic';
import { resolveLanding } from '../src/navigation/resolveLanding';

// 导航守卫：落点决策全交 resolveLanding（纯函数、可穷举单测），本组件仅为其薄包装——
// 读 auth 态 + 当前路由组，算出目标，非 null 即 replace。注册屏不再自行跳转，落点单一来源在此。
function RootNav() {
  const { ready, authenticated, nudgeOnboarding } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const target = resolveLanding({ ready, authenticated, nudgeOnboarding, group: segments[0] });
    if (target) router.replace(target);
  }, [ready, authenticated, nudgeOnboarding, segments, router]);

  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: semantic.bg } }}
    />
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <RootNav />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
