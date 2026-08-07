import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { ApiError } from '../../src/api/client';
import { useAuth } from '../../src/auth/AuthContext';
import { semantic } from '../../src/design/semantic';
import { fonts, tracking } from '../../src/design/typography';
import { Button, Checkbox, Eyebrow, Field, HSerif, Icon, Screen, Sub } from '../../src/design/primitives';

/**
 * 注册页 —— 与原型 docs/ui/tianji-app-design.html 的 register 屏 1:1（spec §8、issue 04）。
 * 结构:返回头 + 眉标/衬线标题/副文 + 三个 Field(密码带辅助说明) + 金色 consent Checkbox(《用户协议》/
 * 《隐私政策》为 gold-2 文字) + 「注 册 并 起 盘」主按钮 + 「直接登录」返回登录。真实注册走
 * useAuth().register,成功后进入生辰引导;两次密码不一致 / 未同意协议以 Alert 反馈(沿用本仓 Alert 约定)。
 */
export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);

  const goLogin = () => router.back();

  const onSubmit = async () => {
    if (password !== confirm) {
      Alert.alert('两次密码不一致');
      return;
    }
    if (!consent) {
      Alert.alert('请先阅读并同意《用户协议》与《隐私政策》');
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
    <Screen
      scroll
      header={
        <View style={styles.titleRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="返回登录"
            onPress={goLogin}
            style={styles.iconBtn}
            hitSlop={6}
          >
            <Icon name="back" color={semantic.textPrimary} size={18} />
          </Pressable>
        </View>
      }
    >
      <View style={styles.head}>
        <Eyebrow>Create account</Eyebrow>
        <HSerif variant="xl" style={styles.title}>
          开启你的命理之旅
        </HSerif>
        <Sub style={styles.sub}>注册后可保存命盘、留存对话，随时向天机追问运势流年。</Sub>
      </View>

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
        placeholder="8 位以上，含字母与数字"
        secureTextEntry
        autoComplete="new-password"
        helper="建议使用字母、数字组合，避免使用生日等易被推算的信息。"
      />
      <Field
        label="确认密码"
        icon="lockCheck"
        value={confirm}
        onChangeText={setConfirm}
        placeholder="请再次输入密码"
        secureTextEntry
        autoComplete="new-password"
      />

      <View style={styles.consent}>
        <Checkbox
          checked={consent}
          onChange={setConsent}
          accessibilityLabel="我已阅读并同意用户协议与隐私政策"
        >
          <Text style={styles.consentText}>
            我已阅读并同意 <Text style={styles.consentLink}>《用户协议》</Text> 与{' '}
            <Text style={styles.consentLink}>《隐私政策》</Text>
          </Text>
        </Checkbox>
      </View>

      <Button variant="primary" disabled={busy} onPress={onSubmit}>
        {busy ? '注 册 中…' : '注 册 并 起 盘'}
      </Button>

      <View style={styles.between}>
        <Text style={styles.textMute}>已有账号？</Text>
        <Pressable onPress={goLogin} hitSlop={8}>
          <Text style={styles.link}>直接登录</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  // 返回头:原型 .apphead .title-row（padding 6/14，左侧 icon-btn，右侧留空）。
  titleRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 6, paddingBottom: 14 },
  // 原型 .icon-btn：38×38 / ink-2 底 / line 描边 / r11。
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: semantic.surface,
    borderWidth: 1,
    borderColor: semantic.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  head: { paddingTop: 2 }, // 原型 .pad padding-top:2px
  title: { marginTop: 12, marginBottom: 8 }, // 原型 h-serif margin:12 0 8
  sub: { marginBottom: 26 }, // 原型 .sub margin-bottom:26
  // consent 行:原型 label.row margin:18 0 22;上一个 .field 已给 16 下边距,块级外边距合并到 18 → 此处 +2。
  consent: { marginTop: 2, marginBottom: 22 },
  // 原型 consent 文字:muted / 12.5 / 行高 1.6。
  consentText: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    lineHeight: 12.5 * 1.6,
    color: semantic.textSecondary,
  },
  // 《用户协议》/《隐私政策》：gold-2（原型内联 color:var(--gold-2)）。
  consentLink: { color: semantic.accentBright },
  // 原型 .between margin-top:16，居中，gap:8。
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 },
  // 原型 .textmute：muted / 13。
  textMute: { fontFamily: fonts.sans, fontSize: 13, color: semantic.textSecondary },
  // 原型 .link：gold-2 / 13 / .04em。
  link: {
    fontFamily: fonts.sans,
    fontSize: 13,
    letterSpacing: tracking(0.04, 13),
    color: semantic.accentBright,
  },
});
