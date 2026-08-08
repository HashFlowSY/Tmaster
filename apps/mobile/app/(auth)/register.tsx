import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../src/auth/AuthContext';
import {
  confirmError,
  mapAuthError,
  registerFieldError,
  validateRegister,
  type FieldErrors,
  type RegisterField,
} from '../../src/auth/formLogic';
import { AuthSwitchRow } from '../../src/components/AuthSwitchRow';
import { semantic } from '../../src/design/semantic';
import { fonts, tracking } from '../../src/design/typography';
import { Button, Checkbox, Eyebrow, Field, HSerif, Icon, Screen, Sub, Toast } from '../../src/design/primitives';

/**
 * 注册页（issue 05 重做）—— 一条当场校验、错误就地、键盘友好、留白从容的注册流。
 *
 * 交互（spec §D / §B）：邮箱、密码失焦即校验；确认密码在两框都碰过后随输入实时比对；提交做总校验。
 * 所有错误就地画进对应 `Field`（无 `Alert`）；服务端错误经 `mapAuthError` 落到字段（`email_taken` →
 * 邮箱）或 `Toast`（限流 / 网络 / internal）。《用户协议》《隐私政策》为可点链接，跳票 03 的法务页；
 * 未勾选同意时就地提示、不弹窗。校验与错误→字段映射复用票 02 的纯函数（本屏只做接线）。
 *
 * 布局（spec §D）：`Screen` 开 `avoidKeyboard`；内容容器 `flexGrow:1` + flex 列，页脚经弹性间隔
 * 下沉——高屏有呼吸、矮屏自然滚动。呼吸留白仅经本屏 `contentStyle`，不动全局 `Screen`（不回归其余 8 屏）。
 * 成功后**不自行跳转**：由 RootNav/resolveLanding 依 `nudgeOnboarding` 单一决定落点（新用户 → `/onboarding`，
 * 见 ADR-0009 / 票 01，消除旧 `replace` 竞态与死返回键）；提交中按钮加载态并禁重复点击。
 */
export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // 字段级错误（缺席即该字段无错）+ 已碰过的字段（失焦或提交后置真）+ 未勾选同意的就地提示。
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<RegisterField, boolean>>>({});
  const [consentError, setConsentError] = useState(false);

  const goLogin = () => router.back();

  const patchError = (field: RegisterField, message: string | undefined) =>
    setErrors((prev) => ({ ...prev, [field]: message }));

  // 失焦校验：标记已碰过 + 就地校验该字段（复用票 02 纯函数）。
  const onBlurField = (field: RegisterField) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    patchError(field, registerFieldError(field, { email, password, confirm }));
  };

  const onChangeEmail = (v: string) => {
    setEmail(v);
    if (errors.email != null) patchError('email', undefined); // 边改边清自身旧错
  };

  // 确认密码的实时错误：两框都碰过、或当前正显示确认错误时，随任一框输入重算——
  // 后者确保已出现的「不一致」提示随用户改到一致而即时消失，不滞留（spec User Story 3）。
  const liveConfirmError = (prev: FieldErrors, pw: string, cf: string): string | undefined =>
    (touched.password && touched.confirm) || prev.confirm != null ? confirmError(pw, cf) : prev.confirm;

  // 密码 / 确认密码改动：清自身旧错，并按上述规则实时更新确认密码错误。
  const onChangePassword = (v: string) => {
    setPassword(v);
    setErrors((prev) => ({ ...prev, password: undefined, confirm: liveConfirmError(prev, v, confirm) }));
  };
  const onChangeConfirm = (v: string) => {
    setConfirm(v);
    setErrors((prev) => ({ ...prev, confirm: liveConfirmError(prev, password, v) }));
  };

  const onChangeConsent = (v: boolean) => {
    setConsent(v);
    if (v) setConsentError(false);
  };

  const onSubmit = async () => {
    // 提交总校验：全字段就地标错、全部标记已碰过，未勾选同意就地提示。任一不过即不发请求。
    const fieldErrors = validateRegister({ email, password, confirm });
    setErrors(fieldErrors);
    setTouched({ email: true, password: true, confirm: true });
    setConsentError(!consent);
    if (Object.keys(fieldErrors).length > 0 || !consent) return;

    setBusy(true);
    try {
      await register({ email, password });
      // 落点不在此跳转：register() 置 nudgeOnboarding=true 后，由 RootNav/resolveLanding 单一决定
      // 落 /onboarding（消除原 replace 与 RootNav 抢跑的竞态与死返回键，见 ADR-0009 / 票 01）。
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

  return (
    <Screen
      scroll
      avoidKeyboard
      contentStyle={styles.content}
      header={
        <View style={styles.titleRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="返回登录"
            onPress={goLogin}
            style={styles.iconBtn}
            hitSlop={10}
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
        autoComplete="new-password"
        helper="密码至少 8 位；建议混用字母与数字，避免使用生日等易被推算的信息。"
      />
      <Field
        label="确认密码"
        icon="lockCheck"
        value={confirm}
        onChangeText={onChangeConfirm}
        onBlur={onBlurField('confirm')}
        error={errors.confirm}
        placeholder="请再次输入密码"
        secureTextEntry
        autoComplete="new-password"
      />

      <View style={styles.consent}>
        <Checkbox
          checked={consent}
          onChange={onChangeConsent}
          accessibilityLabel="我已阅读并同意用户协议与隐私政策"
        >
          <Text style={styles.consentText}>
            我已阅读并同意{' '}
            <Text
              style={styles.consentLink}
              accessibilityRole="link"
              onPress={() => router.push('/legal?doc=terms')}
            >
              《用户协议》
            </Text>{' '}
            与{' '}
            <Text
              style={styles.consentLink}
              accessibilityRole="link"
              onPress={() => router.push('/legal?doc=privacy')}
            >
              《隐私政策》
            </Text>
          </Text>
        </Checkbox>
        {consentError ? (
          <Text style={styles.consentHint}>请先阅读并勾选同意《用户协议》与《隐私政策》</Text>
        ) : null}
      </View>

      <Button variant="primary" disabled={busy} onPress={onSubmit}>
        {busy ? '注 册 中…' : '注 册 并 起 盘'}
      </Button>

      <View style={styles.spacer} />

      <AuthSwitchRow prompt="已有账号？" linkLabel="直接登录" onPress={goLogin} centered />

      <Toast message={toast} onHide={() => setToast(null)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  // 呼吸留白（仅本屏，经 contentStyle）：flexGrow 撑满视口，令弹性间隔在高屏把页脚下沉；矮屏自然滚动。
  content: { flexGrow: 1, paddingTop: 8, paddingBottom: 30 },
  // 返回头:左侧 icon-btn、右侧留空。顶部留 24 让返回键从安全区边缘明显下沉——避免贴着状态栏、
  // 触感局促(原 6 太贴顶);与本屏「呼吸从容」一致，也给返回键更舒展的点按余地。
  titleRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 24, paddingBottom: 14 },
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
  // 《用户协议》/《隐私政策》：gold-2（原型内联 color:var(--gold-2)），可点跳法务页。
  consentLink: { color: semantic.accentBright },
  // 未勾选同意的就地提示（spec §B：不弹窗、克制内联），危险色、贴 consent 行下方。
  consentHint: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
    letterSpacing: tracking(0.02, 11.5),
    lineHeight: 11.5 * 1.5,
    color: semantic.danger,
    marginTop: 8,
  },
  // 弹性间隔：把「直接登录」页脚推向底部（高屏有呼吸），矮屏塌陷为 0 交由滚动。
  spacer: { flexGrow: 1, minHeight: 20 },
});
