import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { ApiError } from '../../src/api/client';
import { useAuth } from '../../src/auth/AuthContext';
import { LoginHero } from '../../src/components/LoginHero';
import { semantic } from '../../src/design/semantic';
import { spacing } from '../../src/design/spacing';
import { fonts, tracking } from '../../src/design/typography';
import { Button, Field, Icon, Screen, Toast } from '../../src/design/primitives';

/**
 * 登录页 —— 与原型 docs/ui/tianji-app-design.html 的 login 屏 1:1（spec §8、issue 03）。
 * 品牌区（自转罗盘 · 星野 · 呼吸辉光）由 LoginHero 承载；下方 邮箱/密码 Field + 呼吸主按钮 +
 * 注册链接 + 「其他登录方式」→ toast。真实登录走 useAuth().login，跳转由 RootNav 依登录态处理。
 */
export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

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

  const soon = () => setToast('敬请期待');

  return (
    <Screen scroll contentStyle={styles.content}>
      <LoginHero />

      <View style={styles.form}>
        <Field
          label="邮箱"
          icon="mail"
          value={email}
          onChangeText={setEmail}
          placeholder="请输入邮箱"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          inputMode="email"
        />
        <Field
          label="密码"
          icon="lock"
          value={password}
          onChangeText={setPassword}
          placeholder="请输入密码"
          secureTextEntry
          suffix="忘记密码"
        />

        <View style={styles.submit}>
          <Button variant="primary" breathe={!busy} disabled={busy} onPress={onSubmit}>
            {busy ? '登 录 中…' : '登 录'}
          </Button>
        </View>

        <View style={styles.registerRow}>
          <Text style={styles.textMute}>还没有账号？</Text>
          <Pressable onPress={() => router.push('/register')} hitSlop={8}>
            <Text style={styles.link}>注册天机账号</Text>
          </Pressable>
        </View>

        <View style={styles.or}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>其他登录方式</Text>
          <View style={styles.orLine} />
        </View>

        <View style={styles.oauth}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="其他登录方式"
            onPress={soon}
            style={styles.oauthBtn}
          >
            <Icon name="more" color={semantic.textPrimary} size={20} />
          </Pressable>
        </View>

        <Text style={styles.helper}>登录即代表同意《用户协议》与《隐私政策》</Text>
      </View>

      <Toast message={toast} onHide={() => setToast(null)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 0 }, // hero 需通栏；表单自带 26 留白
  form: { paddingHorizontal: 26, paddingTop: 34 },
  submit: { marginTop: 6 },
  registerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  // .textmute：muted / 13（原型）。
  textMute: { fontFamily: fonts.sans, fontSize: 13, color: semantic.textSecondary },
  // .link：gold-2 / 13 / .04em（原型）。
  link: {
    fontFamily: fonts.sans,
    fontSize: 13,
    letterSpacing: tracking(0.04, 13),
    color: semantic.accentBright,
  },
  // .or：居中标签 + 两侧分隔线（原型 .or）。
  or: { flexDirection: 'row', alignItems: 'center', gap: 14, marginVertical: 22 },
  orLine: { flex: 1, height: 1, backgroundColor: semantic.border },
  orText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    letterSpacing: tracking(0.1, 12),
    color: semantic.textFaint,
  },
  // .oauth 圆形按钮（原型 52×52，ink-3 底 + line 描边）。
  oauth: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  oauthBtn: {
    width: 52,
    height: 52,
    borderRadius: 999,
    backgroundColor: semantic.surfaceInput,
    borderWidth: 1,
    borderColor: semantic.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // .helper：muted-2 / 11.5，居中（原型）。
  helper: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
    letterSpacing: tracking(0.02, 11.5),
    color: semantic.textFaint,
    textAlign: 'center',
    marginTop: 26,
  },
});
