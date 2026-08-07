import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../src/auth/AuthContext';
import {
  loginFieldError,
  mapAuthError,
  validateLogin,
  type FieldErrors,
  type LoginField,
} from '../../src/auth/formLogic';
import { AuthSwitchRow } from '../../src/components/AuthSwitchRow';
import { LoginHero } from '../../src/components/LoginHero';
import { semantic } from '../../src/design/semantic';
import { fonts, tracking } from '../../src/design/typography';
import { Button, Field, Icon, Screen, Toast } from '../../src/design/primitives';

/**
 * 登录页（issue 06 重做）—— 复用注册的当场校验 / 错误就地 / 键盘友好范式（布局仍保留品牌区通栏，
 * 不套注册的弹性留白）。
 *
 * 交互（spec §D / §B）：邮箱、密码失焦即校验，提交做总校验；错误就地画进对应 `Field`（无 `Alert`）；
 * 凭证错误经 `mapAuthError` 落到密码框下方「邮箱或密码错误」（`invalid_credentials`），限流 / 网络 /
 * internal 走 `Toast`。校验与错误→字段映射复用票 02 纯函数，本屏只做接线。登录成功不在此跳转——由
 * `RootNav` 依 auth 态自动进入对话主页（现状不变）。
 *
 * 布局（spec §D）：`Screen` 开 `avoidKeyboard`；`LoginHero` 在任一输入聚焦时收缩淡出、失焦恢复，
 * 把空间让给表单（尊重 reduce-motion）。品牌区通栏，表单自带 26 横向留白。
 *
 * 范围外（spec Out of Scope）：《用户协议》《隐私政策》维持纯说明文案、不可点；`忘记密码` 与「其他登录
 * 方式」维持惰性占位，本次不接。
 */
export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // 字段级错误（缺席即该字段无错）+ 已聚焦收缩 hero 的焦点态（任一字段聚焦即收起）。
  const [errors, setErrors] = useState<FieldErrors>({});
  const [focused, setFocused] = useState<Record<LoginField, boolean>>({
    email: false,
    password: false,
  });
  const heroCollapsed = focused.email || focused.password;

  const patchError = (field: LoginField, message: string | undefined) =>
    setErrors((prev) => ({ ...prev, [field]: message }));

  // 聚焦：收起 hero；失焦：展开 hero + 就地校验该字段（复用票 02 纯函数）。
  const onFocusField = (field: LoginField) => () =>
    setFocused((prev) => ({ ...prev, [field]: true }));
  const onBlurField = (field: LoginField) => () => {
    setFocused((prev) => ({ ...prev, [field]: false }));
    patchError(field, loginFieldError(field, { email, password }));
  };

  const onChangeEmail = (v: string) => {
    setEmail(v);
    if (errors.email != null) patchError('email', undefined); // 边改边清自身旧错
  };
  const onChangePassword = (v: string) => {
    setPassword(v);
    if (errors.password != null) patchError('password', undefined);
  };

  const onSubmit = async () => {
    // 提交总校验：全字段就地标错。任一不过即不发请求。
    const fieldErrors = validateLogin({ email, password });
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    setBusy(true);
    try {
      await login({ email, password });
      // 跳转由 RootNav 依 auth 态处理（现状不变）
    } catch (err) {
      const presentation = mapAuthError(err);
      if (presentation.kind === 'fields') {
        setErrors((prev) => ({ ...prev, ...presentation.fields }));
      } else {
        setToast(presentation.message);
      }
    } finally {
      setBusy(false);
    }
  };

  const soon = () => setToast('敬请期待');

  return (
    <Screen scroll avoidKeyboard contentStyle={styles.content}>
      <LoginHero collapsed={heroCollapsed} />

      <View style={styles.form}>
        <Field
          label="邮箱"
          icon="mail"
          value={email}
          onChangeText={onChangeEmail}
          onFocus={onFocusField('email')}
          onBlur={onBlurField('email')}
          error={errors.email}
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
          onChangeText={onChangePassword}
          onFocus={onFocusField('password')}
          onBlur={onBlurField('password')}
          error={errors.password}
          placeholder="请输入密码"
          secureTextEntry
          suffix="忘记密码"
        />

        <View style={styles.submit}>
          <Button variant="primary" breathe={!busy} disabled={busy} onPress={onSubmit}>
            {busy ? '登 录 中…' : '登 录'}
          </Button>
        </View>

        <AuthSwitchRow
          prompt="还没有账号？"
          linkLabel="注册天机账号"
          onPress={() => router.push('/register')}
        />

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
  // .helper：muted-2 / 11.5，居中（原型）。登录页法务维持纯文案、不可点（spec Out of Scope）。
  helper: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
    letterSpacing: tracking(0.02, 11.5),
    color: semantic.textFaint,
    textAlign: 'center',
    marginTop: 26,
  },
});
