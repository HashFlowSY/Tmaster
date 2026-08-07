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
 * 登录页（issue 06 重做）—— 复用注册的当场校验 / 错误就地 / 键盘友好范式。
 *
 * 交互（spec §D / §B）：邮箱、密码失焦即校验，提交做总校验；错误就地画进对应 `Field`（无 `Alert`）；
 * 凭证错误经 `mapAuthError` 落到密码框下方「邮箱或密码错误」（`invalid_credentials`），限流 / 网络 /
 * internal 走 `Toast`。校验与错误→字段映射复用票 02 纯函数，本屏只做接线。登录成功不在此跳转——由
 * `RootNav` 依 auth 态自动进入对话主页（现状不变）。
 *
 * 布局：品牌区通栏、页面静态——聚焦输入时不做整页上移 / hero 收缩（按需求取消，保持沉稳）。
 * 内容以 `flexGrow` 撑满视口，弹性间隔把「其他登录方式」下沉至底部、与底边留合理距离；矮屏自然滚动。
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

  // 字段级错误（缺席即该字段无错）。
  const [errors, setErrors] = useState<FieldErrors>({});

  const patchError = (field: LoginField, message: string | undefined) =>
    setErrors((prev) => ({ ...prev, [field]: message }));

  // 失焦即就地校验该字段（复用票 02 纯函数）。
  const onBlurField = (field: LoginField) => () =>
    patchError(field, loginFieldError(field, { email, password }));

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
    <Screen scroll contentStyle={styles.content}>
      <LoginHero />

      <View style={styles.form}>
        <Field
          label="邮箱"
          icon="mail"
          value={email}
          onChangeText={onChangeEmail}
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

        {/* 弹性间隔：把「其他登录方式」下沉至底部（高屏），矮屏塌陷为 minHeight 交由滚动。 */}
        <View style={styles.spacer} />

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
  // flexGrow 撑满视口，令弹性间隔在高屏把「其他登录方式」下沉；hero 需通栏故横向留白归零。
  content: { flexGrow: 1, paddingHorizontal: 0 },
  // 表单以 flex 撑满 hero 之下的余量，令内部弹性间隔生效；自带 26 横向留白 + 底部呼吸。
  form: { flex: 1, paddingHorizontal: 26, paddingTop: 34, paddingBottom: 30 },
  submit: { marginTop: 6 },
  // 弹性间隔：高屏把「其他登录方式」推向底部，矮屏塌陷为 minHeight 交由滚动。
  spacer: { flexGrow: 1, minHeight: 28 },
  // .or：居中标签 + 两侧分隔线（原型 .or）。
  or: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 22 },
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
    marginTop: 22,
  },
});
