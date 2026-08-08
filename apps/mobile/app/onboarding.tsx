import type { Gender } from '@tianji/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { canSubmitBirth, daysInMonth, withDateField, type DatePart } from '../src/onboarding/birthForm';

/**
 * 生辰引导页 —— 可跳过的一次性软引导（spec 实现决策 C；ADR-0009 / onboarding-nudge issue 02）。
 * 结构:头部出口(返回/稍后) + 眉标/衬线标题/副文 + 性别·历法 SegmentedControl + 年/月/日 三格 + 时辰行 +
 * 「时辰未知」Checkbox（复用 issue 04）+ 出生地 Cascader + helper + 固定底栏「生 成 命 盘」主按钮。
 *
 * 出生时刻按**四个独立单位下拉**采集(年 / 月 / 日 / 时):点某格弹出该单位的可选列表——年只列年、月只列
 * 月、日只列**当月**合法天数(闰年 2 月 29、小月 30…,见 daysInMonth)、时只列 0–23 时。选中即写入并关闭。
 * 该下拉用统一的 RN 列表实现(OptionSheet),web / iOS / Android 一致,不依赖 @react-native-community/
 * datetimepicker(其无 web 实现,曾致 web 上「连选框都没有」)。单位合并 / 钳制逻辑抽纯函数
 * withDateField(见 birthForm.ts,表测覆盖)。
 *
 * 软引导化：头部提供离开出口(点用引导 push 进来显「返回」回来处、登录/注册 replace 进来显「稍后」进 /chat，
 * 以 router.canGoBack() 区分)；中性默认——出生地不预选、年/月/日/时未各自选定前不算已填(yearSet…/timeSet)、
 * tiles 显占位;提交闸抽纯函数 canSubmitBirth(见 birthForm.ts)杜绝照抄示例盲提交；历法点「农历」弹「敬请
 * 期待」且恒留公历(不落库/不改 schema,见 RULINGS)。
 *
 * 出生地在 Cascader 里逐级下钻(省→市→区县)并据所选地点取真实经度;命主录入后调用真实 BirthApi.save 起盘,
 * 成功进入 /chart。时辰未知勾选后 birthTime 置 null,走领域的「降级盘(三柱)」路径(CONTEXT §出生信息)。
 * 关于历法展示态的裁定见文末 RULINGS。
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

// 出生时刻**中性起点** —— 仅作各下拉未选定前的内部初值(决定「日」下拉初始按哪月列天数、列表初始滚到哪),
// 未各自选定前 tiles 显占位、不计入已填(中性默认防盲提交,spec 实现决策 C)。取通用占位 2000-01-01 12:00,
// 非旧原型示例(1994 寅时);月份 0 基。出生地则不预选(初始 path 为空,逼选到区县)。
const makeNeutralMoment = () => new Date(2000, 0, 1, 12, 0, 0, 0);

// 年份下拉范围:1900 ~ 今年(避免未来年份)。今年在运行时取一次。
const CURRENT_YEAR = new Date().getFullYear();

// 下拉行高(用于列表初始滚到当前值)与列表最大高度。
const OPT_ROW_H = 48;

// 底部弹层遮罩;半透明黑,一次性值,非通用调色板 token。
const SHEET_SCRIM = 'rgba(0,0,0,0.5)';

const pad = (n: number) => String(n).padStart(2, '0');
const toBirthDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toBirthTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

export default function Onboarding() {
  const router = useRouter();
  const [gender, setGender] = useState<Gender>('male');
  const [calendar, setCalendar] = useState<Calendar>('solar');
  const [moment, setMoment] = useState<Date>(makeNeutralMoment);
  // 各单位选定标志:未选定前不算已填(中性默认防盲提交);年/月/日须各自选定,日期方视为齐备。
  const [yearSet, setYearSet] = useState(false);
  const [monthSet, setMonthSet] = useState(false);
  const [daySet, setDaySet] = useState(false);
  const [timeSet, setTimeSet] = useState(false);
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [path, setPath] = useState<string[]>([]); // 出生地不预选,逼选到区县
  const [open, setOpen] = useState<DatePart | null>(null); // 当前展开的单位下拉
  const [busy, setBusy] = useState(false);

  const loc = viewForPath(path);
  const hour = hourBranchFromTime(toBirthTime(moment));
  const dateComplete = yearSet && monthSet && daySet;

  // 头部出口:栈里有上一屏(点用引导 push 进来)→「返回」回来处;否则(登录/注册 replace 进来)→「稍后」进 /chat。
  const canGoBack = router.canGoBack();

  // Cascader 选项:非叶子 → 下钻;叶子 → 定为选中(viewForPath 会据新 path 给出完成态)。
  const onSelectRegion = (value: string) => setPath([...path.slice(0, loc.complete ? -1 : undefined), value]);
  const onCrumbPress = (index: number) => setPath(path.slice(0, index));

  // 某单位下拉选中:只改该单位(withDateField 负责按月钳制日)+ 置对应选定标志 + 关闭。
  const onPickField = (value: number) => {
    if (open == null) return;
    const field = open;
    setMoment((m) => withDateField(m, field, value));
    if (field === 'year') setYearSet(true);
    else if (field === 'month') setMonthSet(true);
    else if (field === 'day') setDaySet(true);
    else setTimeSet(true);
    setOpen(null);
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
      dateTouched: dateComplete,
      timeTouched: timeSet,
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

      {/* 出生日期与时辰 —— 年/月/日/时各为独立下拉,未各自选定前显占位「—」/「请选择」。 */}
      <View style={styles.field}>
        <Text style={styles.label}>出生日期与时辰</Text>
        <View style={styles.grid3}>
          <PickerTile k="年" v={String(moment.getFullYear())} touched={yearSet} onPress={() => setOpen('year')} />
          <PickerTile k="月" v={pad(moment.getMonth() + 1)} touched={monthSet} onPress={() => setOpen('month')} />
          <PickerTile k="日" v={pad(moment.getDate())} touched={daySet} onPress={() => setOpen('day')} />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="选择时辰"
          disabled={timeUnknown}
          onPress={() => setOpen('hour')}
          style={[styles.picker, styles.pickerRow, timeUnknown && styles.pickerDisabled]}
        >
          <Text style={styles.pickerK}>时辰</Text>
          {timeUnknown ? (
            <Text style={styles.pickerV}>未知</Text>
          ) : timeSet ? (
            // 时辰名 + 小字所选整点「寅时 03:00」;时辰名由 hourBranchFromTime 从整点派生。
            <Text style={styles.pickerV}>
              {hour.name} <Text style={styles.pickerVSmall}>{toBirthTime(moment)}</Text>
            </Text>
          ) : (
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

      {/* 单位下拉:仅在展开时挂载,列该单位合法选项、初始滚到当前值。 */}
      {open != null && (
        <OptionSheet field={open} moment={moment} onPick={onPickField} onClose={() => setOpen(null)} />
      )}
    </Screen>
  );
}

/**
 * 年/月/日 小格(原型 .picker,竖排 k/v),点开对应单位下拉。
 * 中性默认:未选定前(touched=false)显占位「—」且转 muted 色;选定后显传入原值。
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

interface Opt {
  label: string;
  value: number;
}

/** 据当前单位与 moment 生成下拉选项(年降序、月 1–12、日按当月天数、时 0–23 附时辰名)与当前值。 */
function optionsFor(field: DatePart, moment: Date): { title: string; opts: Opt[]; current: number } {
  switch (field) {
    case 'year': {
      const opts: Opt[] = [];
      for (let y = CURRENT_YEAR; y >= 1900; y--) opts.push({ label: `${y} 年`, value: y });
      return { title: '选择出生年份', opts, current: moment.getFullYear() };
    }
    case 'month': {
      const opts: Opt[] = [];
      for (let m = 0; m < 12; m++) opts.push({ label: `${pad(m + 1)} 月`, value: m });
      return { title: '选择出生月份', opts, current: moment.getMonth() };
    }
    case 'day': {
      const total = daysInMonth(moment.getFullYear(), moment.getMonth());
      const opts: Opt[] = [];
      for (let d = 1; d <= total; d++) opts.push({ label: `${pad(d)} 日`, value: d });
      return { title: '选择出生日期', opts, current: moment.getDate() };
    }
    case 'hour': {
      const opts: Opt[] = [];
      for (let h = 0; h < 24; h++) opts.push({ label: `${pad(h)}:00 · ${hourBranchFromTime(`${pad(h)}:00`).name}`, value: h });
      return { title: '选择出生时辰', opts, current: moment.getHours() };
    }
  }
}

/**
 * 单位下拉列表 —— 底部弹层内一列可选项,选中即回传(onPick)并关闭;点背景/「完成」= 关闭不改动(保持中性默认)。
 * 用纯 RN 列表实现,web / iOS / Android 一致(不依赖原生 datetimepicker)。初始滚到当前值附近便于命主定位。
 */
function OptionSheet({
  field,
  moment,
  onPick,
  onClose,
}: {
  field: DatePart;
  moment: Date;
  onPick: (value: number) => void;
  onClose: () => void;
}) {
  const { title, opts, current } = optionsFor(field, moment);
  const currentIndex = Math.max(0, opts.findIndex((o) => o.value === current));
  const initialY = Math.max(0, (currentIndex - 2) * OPT_ROW_H);

  return (
    <Modal transparent visible animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHead}>
          <Text style={styles.sheetTitle}>{title}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="完成" onPress={onClose} hitSlop={8}>
            <Text style={styles.sheetDone}>完成</Text>
          </Pressable>
        </View>
        <ScrollView
          style={styles.optScroll}
          contentOffset={{ x: 0, y: initialY }}
          showsVerticalScrollIndicator={false}
        >
          {opts.map((o) => {
            const selected = o.value === current;
            return (
              <Pressable
                key={o.value}
                accessibilityRole="button"
                accessibilityLabel={o.label}
                accessibilityState={{ selected }}
                onPress={() => onPick(o.value)}
                style={styles.optRow}
              >
                <Text style={[styles.optLabel, selected && styles.optLabelSel]}>{o.label}</Text>
                {selected ? <Text style={styles.optCheck}>✓</Text> : null}
              </Pressable>
            );
          })}
        </ScrollView>
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
  // 未选定占位(「—」/「请选择」):同尺寸、faint 色,读作「尚未填写」。
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

  // 单位下拉底部弹层(暗色)。
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
  // 下拉列表:限高滚动;每行定高(OPT_ROW_H)以便初始滚到当前值。
  optScroll: { maxHeight: OPT_ROW_H * 6 },
  optRow: {
    height: OPT_ROW_H,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    borderBottomWidth: 1,
    borderBottomColor: semantic.borderFaint,
  },
  optLabel: { fontFamily: fonts.sans, fontSize: 16, color: semantic.textPrimary, ...tabularNums },
  optLabelSel: { color: semantic.accentBright },
  optCheck: { fontFamily: fonts.sans, fontSize: 15, color: semantic.accent },
});

// ============ RULINGS(pixel-1:1 exceptions,spec User Story 29)============
//
// · 出生时刻改为**四个单位下拉**(年/月/日/时)而非原型的年月日+时辰滚轮:原生滚轮
//   (@react-native-community/datetimepicker)无 web 实现、在本项目的 web 预览下渲染空白,故统一改用纯 RN
//   列表下拉(OptionSheet),三端一致且各单位互不干扰(年只年、月只月、日只列当月合法天数、时只时)。
//   底部弹层为原型无的一次性交互 chrome,观感克制;持久的引导屏(小格、分段控件、Cascader)仍严格 1:1。
// · 时辰按整点采集(分钟不再录入,「时只允许选择时」):birthTime 存所选整点 HH:00,时辰名由
//   hourBranchFromTime 从整点派生,仅作阅读辅助(真太阳时校正据此定时柱,CONTEXT §真太阳时)。
// · 出生地经度取所选地点就近经度(见 src/location/regions.ts + longitudes.ts):全量省市区名录,城市级挂
//   经度、区县就近继承;详见该两文件说明。
// · 历法(公历/农历)恒留公历:点「农历」弹「敬请期待」提示并**不切换**(value 恒 solar),防命主把农历
//   日期当公历静默起错盘(ADR-0009)。BirthProfileInput schema 不含历法字段(spec 禁改 schema),历法
//   不落库、不随提交发送;农历录入(含农历→公历换算 / schema 迁移)另立含迁移的工单,超出本 issue 范围。
