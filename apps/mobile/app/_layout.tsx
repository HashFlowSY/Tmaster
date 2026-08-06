import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/auth/AuthContext';
import { theme } from '../src/theme';

function RootNav() {
  const { ready, authenticated } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!authenticated && !inAuthGroup) {
      router.replace('/login');
    } else if (authenticated && inAuthGroup) {
      router.replace('/chat');
    }
  }, [ready, authenticated, segments, router]);

  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.bg } }}
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
