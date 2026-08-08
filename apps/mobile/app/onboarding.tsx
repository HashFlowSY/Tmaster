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
import { canSubmitBirth, commitSpinner, type SpinnerMode } from '../src/onboarding/birthForm';

/**
 * 生辰引导页 —— 可跳过的一次性软引导（spec 实现决策 C；ADR-0009 / onboarding-nudge issue 02）。
 * 结构:头部出口(返回/稍后) + 眉标/衬线标题/副文 + 性别·历法 SegmentedControl + 年月日/时辰 picker +
 * 「时辰未知」Checkbox（复用 issue 04）+ 出生地 Cascader + helper + 「生 成 命 盘」主按钮。
 *
 * 软引导化(本 issue)：头部提供离开出口(点用引导 push 进来显「返回」回来处、登录/注册 replace 进来
 * 显「稍后」进 /chat，以 router.canGoBack() 区分)；中性默认——出生地不预选、出生时刻未经滚轮确认前
 * 不算已填(dateTouched/timeTouched)、tiles 显占位；提交闸抽纯函数 canSubmitBirth(见 birthForm.ts)
 * 杜绝照抄示例盲提交；历法点「农历」弹「敬请期待」且恒留公历(不落库/不改 schema，见 RULINGS)；
 * 移除三段步骤条、眉标改「完善生辰」。既有采集逻辑(BirthApi.save/原生滚轮/Cascader 取真经度/时辰未知
 * 降级盘/busy·错误处理)保持不变。
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

// 出生时刻的滚轮**中性起点** —— 仅作 picker 打开时的初始滚轮位置,未经滚轮确认前不显示、不计入已填
// (中性默认防盲提交,spec 实现决策 C)。刻意取通用占位值 2000-01-01 12:00(而非旧原型示例 1994-02-14
// 寅时),这样即便命主打开滚轮不拨动直接「确定」,提交的也是显然的中性值而非一个像真人生辰的示例;月份 0 基。
// 出生地则不预选(初始 path 为空,逼选到区县)。
const makeNeutralMoment = () => new Date(2000, 0, 1, 12, 0, 0, 0);

// 底部弹层遮罩(原型无此态——picker 为原生输入 chrome);半透明黑,一次性值,非通用调色板 token。
const SHEET_SCRIM = 'rgba(0,0,0,0.5)';

const pad = (n: number) => String(n).padStart(2, '0');
const toBirthDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toBirthTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

export default function Onboarding() {
  const router = useRouter();
  const [gender, setGender] = useState<Gender>('male');
  const [calendar, setCalendar] = useState<Calendar>('solar');
  const [moment, setMoment] = useState<Date>(makeNeutralMoment);
  // 触碰标志:出生日期/时辰未经滚轮确认前不算已填(中性默认防盲提交)。
  const [dateTouched, setDateTouched] = useState(false);
  const [timeTouched, setTimeTouched] = useState(false);
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [path, setPath] = useState<string[]>([]); // 出生地不预选,逼选到区县
  const [picker, setPicker] = useState<SpinnerMode | null>(null);
  const [busy, setBusy] = useState(false);

  const loc = viewForPath(path);
  const hour = hourBranchFromTime(toBirthTime(moment));

  // 头部出口:栈里有上一屏(点用引导 push 进来)→「返回」回来处;否则(登录/注册 replace 进来)→「稍后」进 /chat。
  const canGoBack = router.canGoBack();

  // Cascader 选项:非叶子 → 下钻;叶子 → 定为选中(viewForPath 会据新 path 给出完成态)。
  const onSelectRegion = (value: string) => setPath([...path.slice(0, loc.complete ? -1 : undefined), value]);
  const onCrumbPress = (index: number) => setPath(path.slice(0, index));

  // 滚轮确认出生时刻:同步值 + 置对应触碰标志(该半从占位转为已填)。
  const onMomentChange = (d: Date, mode: SpinnerMode) => {
    setMoment(d);
    if (mode === 'date') setDateTouched(true);
    else setTimeTouched(true);
  };

  // 历法:「农历」暂未支持——弹「敬请期待」且不切换,控件恒留公历(不落库/不改 schema,见 RULINGS)。
  const onCalendarChange = (value: Calendar) => {
    if (value === 'lunar') {
      Alert.alert('农历', '农历录入敬请期待，当前请以公历填写出生日期。');
      return;
    }
    setCalendar(value);
  };

  const canSubmit =
    canSubmitBirth({
      locComplete: loc.complete,
      hasLongitude: loc.longitude != null,
      dateTouched,
      timeTouched,
      timeUnknown,
    }) && !busy;

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
      footer={
        // 固定底栏:主按钮常驻可见,不随 Cascader 选项撑高而被挤出屏外(问题 3)。
        <Button variant="primary" disabled={!canSubmit} onPress={onSubmit}>
          {busy ? '起 盘 中…' : '生 成 命 盘'}
        </Button>
      }
      header={
        <View style={styles.titleRow}>
          {canGoBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="返回"
              onPress={() => router.back()}
              style={styles.iconBtn}
              hitSlop={10}
            >
              <Icon name="back" color={semantic.textPrimary} size={18} />
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="稍后填写"
              onPress={() => router.replace('/chat')}
              style={styles.later}
              hitSlop={10}
            >
              <Text style={styles.laterText}>稍后</Text>
            </Pressable>
          )}
        </View>
      }
    >
      <Eyebrow>完善生辰</Eyebrow>
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

      {/* 历法(公历/农历)—— 点「农历」弹「敬请期待」且不切换(恒公历);schema 不含历法字段,不随提交发送(见 RULINGS)。 */}
      <View style={styles.field}>
        <Text style={styles.label}>历法</Text>
        <SegmentedControl
          options={CALENDAR_OPTIONS}
          value={calendar}
          onChange={onCalendarChange}
          accessibilityLabel="历法"
        />
      </View>

      {/* 出生日期与时辰 */}
      <View style={styles.field}>
        <Text style={styles.label}>出生日期与时辰</Text>
        {/* 未经滚轮确认前显占位「—」(中性默认;不算已填)——占位/muted 规则收在 PickerTile 内,此处只给原值 + touched。 */}
        <View style={styles.grid3}>
          <PickerTile k="年" v={String(moment.getFullYear())} touched={dateTouched} onPress={() => setPicker('date')} />
          <PickerTile k="月" v={pad(moment.getMonth() + 1)} touched={dateTouched} onPress={() => setPicker('date')} />
          <PickerTile k="日" v={pad(moment.getDate())} touched={dateTouched} onPress={() => setPicker('date')} />
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
          ) : timeTouched ? (
            // 原型 .picker .v：时辰名 + 小字时钟区间「寅时 03:00 – 05:00」；提交仍存所选精确 HH:mm。
            <Text style={styles.pickerV}>
              {hour.name} <Text style={styles.pickerVSmall}>{hour.range}</Text>
            </Text>
          ) : (
            // 未经滚轮确认前显占位(中性默认;不算已填)。
            <Text style={[styles.pickerV, styles.pickerVMuted]}>请选择</Text>
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

      {/* 仅在打开时挂载,保证每次打开都以 moment 为草稿初值(问题 1:草稿+确定)。 */}
      {picker != null && (
        <DobSpinner
          mode={picker}
          value={moment}
          onCommit={onMomentChange}
          onClose={() => setPicker(null)}
        />
      )}
    </Screen>
  );
}

/**
 * 年/月/日 picker 小格(原型 .picker,竖排 k/v),点开日期滚轮。
 * 中性默认:未经滚轮确认前(touched=false)显占位「—」且转 muted 色;确认后显传入原值。
 */
function PickerTile({ k, v, touched, onPress }: { k: string; v: string; touched: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`选择${k}`}
      onPress={onPress}
      style={styles.picker}
    >
      <Text style={styles.pickerK}>{k}</Text>
      <Text style={[styles.pickerV, !touched && styles.pickerVMuted]}>{touched ? v : '—'}</Text>
    </Pressable>
  );
}

// 滚轮视觉 chrome(两端共用):暗色主题 + 象牙字 + 金色高亮 + 24 小时制。
const SPINNER_CHROME = {
  display: 'spinner',
  themeVariant: 'dark',
  textColor: semantic.textPrimary,
  accentColor: semantic.accent,
  is24Hour: true,
} as const;

/**
 * 出生时刻滚轮选择器 —— 草稿 + 确定模型(问题 1 修复)。仅在打开时挂载(父层条件渲染),故 `draft` 每次以
 * `value` 为初值。
 * - iOS:内嵌进暗色底部弹层;拨动滚轮只更新 `draft`,点「确定」才 `onCommit`——**即便未拨动**,确定也算一次
 *   明确选择(→ 置 touched,修「点开确定却仍显占位」);点背景 = 取消,不提交(保持中性默认)。
 * - Android:系统对话框自身即确认 UI,`'set'`(确定)提交、其余(`'dismissed'`)仅关闭。
 * 合并只改该滚轮负责的一半(日期半 / 时辰半),逻辑抽纯函数 `commitSpinner`(见 birthForm.ts,表测覆盖)。
 */
function DobSpinner({
  mode,
  value,
  onCommit,
  onClose,
}: {
  mode: SpinnerMode;
  value: Date;
  onCommit: (d: Date, mode: SpinnerMode) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(value);

  if (Platform.OS !== 'ios') {
    const onAndroidChange = (event: DateTimePickerEvent, picked?: Date) => {
      onClose();
      if (event.type === 'set' && picked != null) onCommit(commitSpinner(value, picked, mode), mode);
    };
    return <DateTimePicker value={value} mode={mode} onChange={onAndroidChange} {...SPINNER_CHROME} />;
  }

  // iOS:拨动只更新草稿;确定提交草稿(未拨动 → draft===value,仍提交以置 touched)。
  const onIosChange = (_event: DateTimePickerEvent, picked?: Date) => {
    if (picked != null) setDraft((d) => commitSpinner(d, picked, mode));
  };
  const confirm = () => {
    onCommit(draft, mode);
    onClose();
  };

  return (
    <Modal transparent visible animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHead}>
          <Text style={styles.sheetTitle}>{mode === 'date' ? '选择出生日期' : '选择出生时辰'}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="确定" onPress={confirm} hitSlop={8}>
            <Text style={styles.sheetDone}>确定</Text>
          </Pressable>
        </View>
        <DateTimePicker value={draft} mode={mode} onChange={onIosChange} {...SPINNER_CHROME} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // 头部出口行:与登录/注册对齐(paddingTop 24);左「返回」图标钮或右推的「稍后」文字钮。
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
  // 「稍后」软出口:无上一屏时(登录/注册进入)显示,marginLeft:auto 推到右侧;文字钮观感克制。
  later: { marginLeft: 'auto', paddingVertical: 8, paddingHorizontal: 4 },
  laterText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    letterSpacing: tracking(0.04, 14),
    color: semantic.textSecondary,
  },

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
  // 未确认占位(「—」/「请选择」):同尺寸、faint 色,读作「尚未填写」。
  pickerVMuted: { color: semantic.textFaint },
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
// · 历法(公历/农历)恒留公历:点「农历」弹「敬请期待」提示并**不切换**(value 恒 solar),防命主把农历
//   日期当公历静默起错盘(ADR-0009)。BirthProfileInput schema 不含历法字段(spec 禁改 schema),历法
//   不落库、不随提交发送;农历录入(含农历→公历换算 / schema 迁移)另立含迁移的工单,超出本 issue 范围。
