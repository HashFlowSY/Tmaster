import { Stack } from 'expo-router';
import { theme } from '../../src/theme';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.bg },
        headerTintColor: theme.gold,
        headerTitleStyle: { color: theme.text },
        contentStyle: { backgroundColor: theme.bg },
      }}
    >
      <Stack.Screen name="chat" options={{ title: '天机' }} />
      <Stack.Screen name="chart" options={{ title: '命盘' }} />
      <Stack.Screen name="profile" options={{ title: '我的' }} />
      <Stack.Screen name="history" options={{ title: '历史对话' }} />
      <Stack.Screen name="favorites" options={{ title: '我的收藏' }} />
    </Stack>
  );
}
