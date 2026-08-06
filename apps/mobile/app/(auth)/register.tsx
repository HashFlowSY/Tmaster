import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { ApiError } from '../../src/api/client';
import { useAuth } from '../../src/auth/AuthContext';
import { Field, GhostButton, Muted, PrimaryButton, Screen, Title } from '../../src/ui';

export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    if (password !== confirm) {
      Alert.alert('两次密码不一致');
      return;
    }
    setBusy(true);
    try {
      await register({ email, password });
      router.replace('/onboarding');
    } catch (err) {
      Alert.alert('注册失败', err instanceof ApiError ? err.message : '网络错误');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Title>注册</Title>
        <Muted>邮箱 + 密码</Muted>
        <Field
          placeholder="邮箱"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Field placeholder="密码（至少 8 位）" secureTextEntry value={password} onChangeText={setPassword} />
        <Field placeholder="确认密码" secureTextEntry value={confirm} onChangeText={setConfirm} />
        <PrimaryButton label={busy ? '提交中…' : '注册'} onPress={onSubmit} disabled={busy} />
        <GhostButton label="已有账号？去登录" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
