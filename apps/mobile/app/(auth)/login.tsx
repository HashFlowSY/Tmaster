import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { ApiError } from '../../src/api/client';
import { useAuth } from '../../src/auth/AuthContext';
import { theme } from '../../src/theme';
import { Field, GhostButton, Muted, PrimaryButton, Screen, Title } from '../../src/ui';

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    setBusy(true);
    try {
      await login({ email, password });
      // 跳转由 RootNav 处理
    } catch (err) {
      Alert.alert('登录失败', err instanceof ApiError ? err.message : '网络错误');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Title>天机</Title>
        <Muted>邮箱登录</Muted>
        <Field
          placeholder="邮箱"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Field placeholder="密码" secureTextEntry value={password} onChangeText={setPassword} />
        <PrimaryButton label={busy ? '登录中…' : '登录'} onPress={onSubmit} disabled={busy} />
        <GhostButton label="没有账号？去注册" onPress={() => router.push('/register')} />
        <Pressable onPress={() => Alert.alert('敬请期待')}>
          <Text style={{ color: theme.textDim, textAlign: 'center', marginTop: 8 }}>
            其他方式登录
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
