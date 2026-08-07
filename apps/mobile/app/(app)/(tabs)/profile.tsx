import type { PublicUser } from '@tianji/shared';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthApi } from '../../../src/api/endpoints';
import { useAuth } from '../../../src/auth/AuthContext';
import { theme } from '../../../src/theme';
import { Muted, Screen, Title } from '../../../src/ui';

export default function ProfileScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const [user, setUser] = useState<PublicUser | null>(null);

  useEffect(() => {
    AuthApi.me()
      .then(setUser)
      .catch(() => {});
  }, []);

  const items: { label: string; onPress: () => void }[] = [
    { label: '我的命盘', onPress: () => router.push('/chart') },
    { label: '历史对话', onPress: () => router.push('/history') },
    { label: '我的收藏', onPress: () => router.push('/favorites') },
    { label: '完善/修改生辰', onPress: () => router.push('/onboarding') },
  ];

  return (
    <Screen>
      <Title>我的</Title>
      <Muted>{user ? user.email : '加载中…'}</Muted>
      <View style={{ height: 16 }} />
      {items.map((it) => (
        <Pressable key={it.label} style={styles.row} onPress={it.onPress}>
          <Text style={styles.rowText}>{it.label}</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      ))}
      <Pressable style={styles.logout} onPress={logout}>
        <Text style={styles.logoutText}>退出登录</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomColor: theme.border,
    borderBottomWidth: 1,
  },
  rowText: { color: theme.text, fontSize: 16 },
  chevron: { color: theme.textDim, fontSize: 20 },
  logout: { marginTop: 32, alignItems: 'center', paddingVertical: 14 },
  logoutText: { color: theme.danger, fontSize: 16 },
});
