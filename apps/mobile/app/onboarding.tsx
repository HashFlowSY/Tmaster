import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import type { Gender } from '@tianji/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
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
import { hourBranchFromTime } from '../src/time/hourBranch';
import { viewForPath } from '../src/location/regions';

/**
 * 生辰引导页 —— 与原型 docs/ui/tianji-app-design.html 的 onboarding 屏 1:1（spec §8、issue 05）。
 * 结构:返回头 + 步骤条 + 眉标/衬线标题/副文 + 性别·历法 SegmentedControl + 年月日/时辰 picker +
 * 「时辰未知」Checkbox（复用 issue 04）+ 出生地 Cascader + helper + 「生 成 命 盘」主按钮。
 *
 * 交互:年月日/时辰点开滚轮选择器采集真实出生时刻;出生地在 Cascader 里逐级下钻(省→市→区县),
 * 并据所选地点取真实经度。命主录入后调用真实 BirthApi.save 起盘,成功进入 /chart(沿用旧页提交与跳转契约)。
 * 时辰未知勾选后 birthTime 置 null,走领域的「降级盘(三柱)」路径(issue note;CONTEXT §出生信息)。
 *
 * 关于滚轮选择器为原生控件、历法展示态的裁定见文末 RULINGS。
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

// 出生地初值 —— 与原型一致默认 浙江省/杭州市/西湖区(区县 ✓ 已选)。
const DEFAULT_PATH = ['浙江省', '杭州市', '西湖区'];
// 出生时刻初值 —— 原型静态展示的 1994-02-14 寅时(03:00);月份 0 基,1 = 二月。
const makeDefaultMoment = () => new Date(1994, 1, 14, 3, 0, 0, 0);

// 底部弹层遮罩(原型无此态——picker 为原生输入 chrome);半透明黑,一次性值,非通用调色板 token。
const SHEET_SCRIM = 'rgba(0,0,0,0.5)';

const pad = (n: number) => String(n).padStart(2, '0');
const toBirthDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toBirthTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

export default function Onboarding() {
  const router = useRouter();
  const [gender, setGender] = useState<Gender>('male');
  const [calendar, setCalendar] = useState<Calendar>('solar');
  const [moment, setMoment] = useState<Date>(makeDefaultMoment);
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [path, setPath] = useState<string[]>(DEFAULT_PATH);
  const [picker, setPicker] = useState<'date' | 'time' | null>(null);
  const [busy, setBusy] = useState(false);

  const loc = viewForPath(path);
  const hour = hourBranchFromTime(toBirthTime(moment));

  // Cascader 选项:非叶子 → 下钻;叶子 → 定为选中(viewForPath 会据新 path 给出完成态)。
  const onSelectRegion = (value: string) => setPath([...path.slice(0, loc.complete ? -1 : undefined), value]);
  const onCrumbPress = (index: number) => setPath(path.slice(0, index));

  const canSubmit = loc.complete && loc.longitude != null && !busy;

  const onSubmit = async () => {
    if (loc.longitude == null) {
      Alert.alert('请先选择出生地点（精确到区县）');
      return;
    }
    setBusy(true);
    try {
      await BirthApi.save({
        birthDate: toBirthDate(moment),
        birthTime: timeUnknown ? null : toBirthTime(moment),
        timeUnknown,
        birthplace: loc.birthplace,
        longitude: loc.longitude,
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

      {/* 历法(公历/农历)—— 展示态本地状态;出生信息 schema 不含历法字段,不随提交发送(见 RULINGS)。 */}
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
          <PickerTile k="年" v={String(moment.getFullYear())} onPress={() => setPicker('date')} />
          <PickerTile k="月" v={pad(moment.getMonth() + 1)} onPress={() => setPicker('date')} />
          <PickerTile k="日" v={pad(moment.getDate())} onPress={() => setPicker('date')} />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="选择时辰"
          disabled={timeUnknown}
          onPress={() => setPicker('time')}
          style={[styles.picker, styles.pickerRow, timeUnknown && styles.pickerDisabled]}
        >
          <Text style={styles.pickerK}>时辰</Text>
          {timeUnknown ? (
            <Text style={styles.pickerV}>未知</Text>
          ) : (
            // 原型 .picker .v：时辰名 + 小字时钟区间「寅时 03:00 – 05:00」；提交仍存所选精确 HH:mm。
            <Text style={styles.pickerV}>
              {hour.name} <Text style={styles.pickerVSmall}>{hour.range}</Text>
            </Text>
          )}
        </Pressable>
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
          crumbs={loc.crumbs}
          options={loc.options}
          selected={loc.selected}
          onSelect={onSelectRegion}
          onCrumbPress={onCrumbPress}
        />
        <Text style={styles.helper}>
          出生地用于换算「真太阳时」，校正后的时辰更贴合本地天象。
        </Text>
      </View>

      <View style={styles.submit}>
        <Button variant="primary" disabled={!canSubmit} onPress={onSubmit}>
          {busy ? '起 盘 中…' : '生 成 命 盘'}
        </Button>
      </View>

      <DobSpinner
        mode={picker}
        value={moment}
        onChange={setMoment}
        onClose={() => setPicker(null)}
      />
    </Screen>
  );
}

/** 年/月/日 picker 小格(原型 .picker,竖排 k/v),点开日期滚轮。 */
function PickerTile({ k, v, onPress }: { k: string; v: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`选择${k}`}
      onPress={onPress}
      style={styles.picker}
    >
      <Text style={styles.pickerK}>{k}</Text>
      <Text style={styles.pickerV}>{v}</Text>
    </Pressable>
  );
}

/**
 * 出生时刻滚轮选择器。RN 原生 DateTimePicker(display=spinner):iOS 内嵌进暗色底部弹层 + 确定;
 * Android 走系统对话框(无法嵌入自定义容器)。改动只改所选时刻的日期部分或时间部分,另一半保持不变。
 */
function DobSpinner({
  mode,
  value,
  onChange,
  onClose,
}: {
  mode: 'date' | 'time' | null;
  value: Date;
  onChange: (d: Date) => void;
  onClose: () => void;
}) {
  if (mode == null) return null;

  const apply = (event: DateTimePickerEvent, picked?: Date) => {
    // Android 选完即关(对话框);iOS 内嵌,保持打开由确定/背景关闭。
    if (Platform.OS !== 'ios') onClose();
    if (event.type === 'dismissed' || picked == null) return;
    const next = new Date(value);
    if (mode === 'date') next.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
    else next.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
    onChange(next);
  };

  const spinner = (
    <DateTimePicker
      value={value}
      mode={mode}
      display="spinner"
      onChange={apply}
      themeVariant="dark"
      textColor={semantic.textPrimary}
      accentColor={semantic.accent}
      is24Hour
    />
  );

  if (Platform.OS !== 'ios') return spinner;

  return (
    <Modal transparent visible animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHead}>
          <Text style={styles.sheetTitle}>{mode === 'date' ? '选择出生日期' : '选择出生时辰'}</Text>
          <Pressable accessibilityRole="button" onPress={onClose} hitSlop={8}>
            <Text style={styles.sheetDone}>确定</Text>
          </Pressable>
        </View>
        {spinner}
      </View>
    </Modal>
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
  pickerDisabled: { opacity: 0.5 },
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

  // iOS 滚轮底部弹层(暗色,原型无此态——picker 为原生输入 chrome,见 RULINGS)。
  sheetBackdrop: { flex: 1, backgroundColor: SHEET_SCRIM },
  sheet: {
    backgroundColor: semantic.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    borderTopWidth: 1,
    borderColor: semantic.border,
    paddingBottom: 24,
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: semantic.borderFaint,
  },
  sheetTitle: {
    fontFamily: fonts.sans,
    fontSize: 14,
    letterSpacing: tracking(0.04, 14),
    color: semantic.textSecondary,
  },
  sheetDone: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    letterSpacing: tracking(0.04, 15),
    color: semantic.accentBright,
  },
});

// ============ RULINGS(pixel-1:1 exceptions,spec User Story 29)============
//
// · 年月日/时辰滚轮为**原生输入 chrome**:采用 @react-native-community/datetimepicker(display=spinner)。
//   spec 的 1:1 判据是「iOS≡Android 渲染一致」,针对的是被设计的**屏幕表面**;瞬态的系统选择器与键盘、
//   真机状态栏同属原生输入 chrome(spec 本就用真 OS 状态栏),其两端外观差异可接受。持久的引导屏(picker 小格、
//   分段控件、Cascader)仍严格 1:1。iOS 内嵌进暗色底部弹层统一观感,Android 走系统对话框。
// · 时辰展示为「时辰名 + 精确 HH:mm」:领域按精确墙钟时间存 birthTime(真太阳时校正据此定时柱,
//   CONTEXT §真太阳时),时辰名由 hourBranchFromTime 从时间派生,仅作阅读辅助。
// · 出生地经度取所选地点就近经度(见 src/location/regions.ts):精选省/市/区县子集,城市级挂真实经度、
//   区县就近继承;非全国穷举,可扩充。全量地理编码超出 spec Out of Scope,但经度已随所选地点真实变化。
// · 历法(公历/农历)为展示态本地状态:BirthProfileInput schema 不含历法字段(spec 禁改 schema),
//   故仅渲染 SegmentedControl,不随提交发送;农历→公历 换算属日历计算,超出本 issue 范围。
