import type { Gender } from '@tianji/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { ApiError } from '../src/api/client';
import { BirthApi } from '../src/api/endpoints';
import { radii } from '../src/design/radii';
import { semantic } from '../src/design/semantic';
import { fonts, tabularNums, tracking } from '../src/design/typography';
import {
  Button,
  Cascader,
  Checkbox,
  Eyebrow,
  HSerif,
  Icon,
  Screen,
  SegmentedControl,
  Sub,
} from '../src/design/primitives';

/**
 * 生辰引导页 —— 与原型 docs/ui/tianji-app-design.html 的 onboarding 屏 1:1（spec §8、issue 05）。
 * 结构:返回头 + 步骤条 + 眉标/衬线标题/副文 + 性别·历法 SegmentedControl + 年月日/时辰 picker +
 * 「时辰未知」Checkbox（复用 issue 04）+ 出生地 Cascader + helper + 「生 成 命 盘」主按钮。
 *
 * 命主录入出生信息后调用真实 BirthApi.save 起盘,成功进入 /chart（沿用旧页的提交与跳转契约）。
 * 时辰未知勾选后 birthTime 置 null,走领域的「降级盘（三柱）」路径（issue note;CONTEXT §出生信息）。
 *
 * 关于 picker 与 longitude 的裁定见文末 RULINGS。
 */

const GENDER_OPTIONS = [
  { label: '乾造 · 男', value: 'male' },
  { label: '坤造 · 女', value: 'female' },
] as const satisfies readonly { label: string; value: Gender }[];

const CALENDAR_OPTIONS = [
  { label: '公历', value: 'solar' },
  { label: '农历', value: 'lunar' },
] as const;
type Calendar = (typeof CALENDAR_OPTIONS)[number]['value'];

// 出生日期与时辰 —— 原型静态展示值（1994/02/14 · 寅时 03:00–05:00）。
// picker 目前为展示态（见文末 RULINGS：无 datetime 依赖、无 picker primitive 在本 issue 范围内），
// 以原型默认值播种,保证提交出的 BirthProfileInput 合法。
const BIRTH_YEAR = '1994';
const BIRTH_MONTH = '02';
const BIRTH_DAY = '14';
const HOUR_BRANCH = '寅时';
const HOUR_RANGE = '03:00 – 05:00';
const BIRTH_TIME = '03:00'; // 寅时起点,提交用

// 出生地 —— 原型固定省/市（浙江省/杭州市）+ 区县列表。longitude 取杭州代表值供真太阳时校正
// （精确经度需地理编码,超出本 issue 范围,见文末 RULINGS）。
const HANGZHOU_LONGITUDE = 120.15;
const DISTRICTS = [
  { label: '西湖区', value: '西湖区' },
  { label: '上城区', value: '上城区' },
  { label: '拱墅区', value: '拱墅区' },
  { label: '滨江区', value: '滨江区' },
  { label: '余杭区', value: '余杭区' },
  { label: '萧山区', value: '萧山区' },
] as const;

export default function Onboarding() {
  const router = useRouter();
  const [gender, setGender] = useState<Gender>('male');
  const [calendar, setCalendar] = useState<Calendar>('solar');
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [district, setDistrict] = useState<string>('西湖区');
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    setBusy(true);
    try {
      await BirthApi.save({
        birthDate: `${BIRTH_YEAR}-${BIRTH_MONTH}-${BIRTH_DAY}`,
        birthTime: timeUnknown ? null : BIRTH_TIME,
        timeUnknown,
        birthplace: `浙江省杭州市${district}`,
        longitude: HANGZHOU_LONGITUDE,
        gender,
      });
      router.replace('/chart');
    } catch (err) {
      Alert.alert('起盘失败', err instanceof ApiError ? err.message : '请检查填写');
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
            accessibilityLabel="返回"
            onPress={() => router.back()}
            style={styles.iconBtn}
            hitSlop={6}
          >
            <Icon name="back" color={semantic.textPrimary} size={18} />
          </Pressable>
          <View />
        </View>
      }
    >
      {/* 步骤条:三段,前两段点亮(原型 .steps)。 */}
      <View style={styles.steps}>
        <View style={[styles.step, styles.stepOn]} />
        <View style={[styles.step, styles.stepOn]} />
        <View style={styles.step} />
      </View>

      <Eyebrow>Step 02 · 录入生辰</Eyebrow>
      <HSerif variant="l" style={styles.title}>
        录入你的生辰，为你起盘
      </HSerif>
      <Sub style={styles.sub}>
        四柱八字与奇门遁甲皆以出生的年月日时与地点为根。信息越准确，命盘越精细。
      </Sub>

      {/* 性别 */}
      <View style={styles.field}>
        <Text style={styles.label}>性别</Text>
        <SegmentedControl
          options={GENDER_OPTIONS}
          value={gender}
          onChange={setGender}
          accessibilityLabel="性别"
        />
      </View>

      {/* 历法(公历/农历)—— 展示态本地状态;出生信息 schema 不含历法字段,不随提交发送。 */}
      <View style={styles.field}>
        <Text style={styles.label}>历法</Text>
        <SegmentedControl
          options={CALENDAR_OPTIONS}
          value={calendar}
          onChange={setCalendar}
          accessibilityLabel="历法"
        />
      </View>

      {/* 出生日期与时辰 */}
      <View style={styles.field}>
        <Text style={styles.label}>出生日期与时辰</Text>
        <View style={styles.grid3}>
          <PickerTile k="年" v={BIRTH_YEAR} />
          <PickerTile k="月" v={BIRTH_MONTH} />
          <PickerTile k="日" v={BIRTH_DAY} />
        </View>
        <View style={[styles.picker, styles.pickerRow]}>
          <Text style={styles.pickerK}>时辰</Text>
          <Text style={styles.pickerV}>
            {HOUR_BRANCH} <Text style={styles.pickerVSmall}>{HOUR_RANGE}</Text>
          </Text>
        </View>
        <View style={styles.unknown}>
          <Checkbox
            checked={timeUnknown}
            onChange={setTimeUnknown}
            accessibilityLabel="出生时辰不确定，按未知时辰起盘"
          >
            <Text style={styles.unknownText}>出生时辰不确定（按未知时辰起盘）</Text>
          </Checkbox>
        </View>
      </View>

      {/* 出生地点 */}
      <View style={styles.field}>
        <Text style={styles.label}>
          出生地点 <Text style={styles.labelFaint}>· 精确到区县</Text>
        </Text>
        <Cascader
          crumbs={[
            { label: '浙江省' },
            { label: '杭州市' },
            { label: district || '选择区县', current: true },
          ]}
          options={DISTRICTS}
          selected={district}
          onSelect={setDistrict}
        />
        <Text style={styles.helper}>
          出生地用于换算「真太阳时」，校正后的时辰更贴合本地天象。
        </Text>
      </View>

      <View style={styles.submit}>
        <Button variant="primary" disabled={busy} onPress={onSubmit}>
          {busy ? '起 盘 中…' : '生 成 命 盘'}
        </Button>
      </View>
    </Screen>
  );
}

/** 年/月/日 picker 小格(原型 .picker,竖排 k/v)。 */
function PickerTile({ k, v }: { k: string; v: string }) {
  return (
    <View style={styles.picker}>
      <Text style={styles.pickerK}>{k}</Text>
      <Text style={styles.pickerV}>{v}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // 返回头:原型 .apphead .title-row。
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
  // 步骤条:原型 .steps margin:4 0 22;.s height3 r2 ink-4;.s.on gold。
  steps: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: 22 },
  step: { flex: 1, height: 3, borderRadius: 2, backgroundColor: semantic.surfaceTrack },
  stepOn: { backgroundColor: semantic.accent },

  title: { marginTop: 12, marginBottom: 8 }, // 原型 h-serif margin:12 0 8
  sub: { marginBottom: 24 }, // 原型 .sub margin-bottom:24

  // 原型 .field margin-bottom:16。
  field: { marginBottom: 16 },
  // 原型 .field label：12.5 / muted / .06em / 下 8。
  label: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    letterSpacing: tracking(0.06, 12.5),
    color: semantic.textSecondary,
    marginBottom: 8,
  },
  // 「· 精确到区县」：muted-2（原型内联 color:var(--muted-2)）。
  labelFaint: { color: semantic.textFaint },

  // 原型 .grid-3：三等分 gap10。
  grid3: { flexDirection: 'row', gap: 10 },
  // 原型 .picker：ink-3 底 + line 描边 + r12 + padding 12-14 + 竖排 gap3。
  picker: {
    flex: 1,
    backgroundColor: semantic.surfaceInput,
    borderWidth: 1,
    borderColor: semantic.border,
    borderRadius: radii.md, // 12
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 3,
  },
  // 时辰整行:横排两端对齐,上 10（原型内联 margin-top:10;flex-direction:row;space-between）。
  pickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  // 原型 .picker .k：11 / muted / .06em。
  pickerK: { fontFamily: fonts.sans, fontSize: 11, letterSpacing: tracking(0.06, 11), color: semantic.textSecondary },
  // 原型 .picker .v：17 / 象牙 / 等宽数字。
  pickerV: { fontFamily: fonts.sans, fontSize: 17, color: semantic.textPrimary, ...tabularNums },
  // 原型 .picker .v small：12 / muted。
  pickerVSmall: { fontFamily: fonts.sans, fontSize: 12, color: semantic.textSecondary },

  // 「时辰未知」行:原型 label.row margin-top:12。
  unknown: { marginTop: 12 },
  // 原型:12.5 / muted（Checkbox 已提供 flex-start + gap9 的行布局）。
  unknownText: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    lineHeight: 12.5 * 1.4,
    color: semantic.textSecondary,
  },

  // 原型 .helper：11.5 / muted-2 / .02em / 上 7。
  helper: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
    letterSpacing: tracking(0.02, 11.5),
    lineHeight: 11.5 * 1.5,
    color: semantic.textFaint,
    marginTop: 7,
  },

  // 主按钮:原型 margin-top:8。
  submit: { marginTop: 8 },
});

// ============ RULINGS(pixel-1:1 exceptions,spec User Story 29)============
//
// · 年/月/日/时辰 picker 为展示态:原型这些 .picker 是静态展示格(无实际选择交互),
//   且真实滚轮选择需 datetime 依赖——超出 spec「final four」依赖决策,亦非 spec Tier-1/Tier-2
//   列出的 primitive。故以原型默认值播种为展示格,交互式日期选择留待后续 ticket。
// · longitude 取杭州代表值(120.15):真太阳时校正需要经度,但区县→精确经度需地理编码,
//   属 spec Out of Scope（命理计算 / 无新依赖）。以城市代表经度桥接,保证提交合法。
// · 历法(公历/农历)为展示态本地状态:BirthProfileInput schema 不含历法字段(spec 禁止改 schema),
//   故仅渲染 SegmentedControl,不随提交发送。
