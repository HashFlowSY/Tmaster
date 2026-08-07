import type { BaziChart, BirthProfileInput, Pillar } from '@tianji/shared';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { ApiError } from '../../../src/api/client';
import { BirthApi, ChartApi } from '../../../src/api/endpoints';
import { elementBalance, elementColor, elementLabel, elementOf } from '../../../src/chart/fiveElement';
import {
  Button,
  Card,
  ElementBars,
  HSerif,
  Icon,
  type PalaceCell,
  type PillarView,
  Pillars,
  QiMenGrid,
  Screen,
  Sub,
} from '../../../src/design/primitives';
import { semantic } from '../../../src/design/semantic';
import { spacing } from '../../../src/design/spacing';
import { fonts, tabularNums, tracking } from '../../../src/design/typography';
import { hourBranchFromTime } from '../../../src/time/hourBranch';

/**
 * 命盘页 —— 与原型 docs/ui/tianji-app-design.html 的 chart 屏 1:1（spec §8、issue 08）。
 * 三张卡：命主抬头 + 四柱八字盘（Pillars，五行色数据编码）；五行强弱（ElementBars，计数由 chart/fiveElement
 * 从四柱干支派生）；奇门局九宫（QiMenGrid）。顶部标题区含「分享」占位键。真实数据走 ChartApi + BirthApi。
 *
 * 数据边界裁定（spec Out of Scope：禁改 schema、不做排盘/命理计算）：
 * - 四柱/十神/藏干/命主 meta：来自真实 ChartApi + BirthApi。
 * - 五行强弱：清点四柱天干+地支派生（与原型示例盘 0/3/0/3/2 对齐），是既有盘数据的可视化，非新排盘。
 * - 喜用神/忌神、身强弱：属命理判断（out of scope），不编造，故五行强弱卡不含该页脚。
 * - 奇门局：无结构化 API（按 ADR-0001 由 AI 在对话文本中实时起局），故以文末 SAMPLE_QIMEN 示例排布演示版式。
 * - 大运：原型 chart 屏无此块（以奇门局取代），按「1:1 对齐原型」删去；数据仍在 ChartApi，未来可另起页承载。
 */
export default function ChartScreen() {
  const router = useRouter();
  const [chart, setChart] = useState<BaziChart | null>(null);
  const [birth, setBirth] = useState<BirthProfileInput | null>(null);
  const [missing, setMissing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      ChartApi.get()
        .then((c) => {
          if (cancelled) return;
          setChart(c);
          setMissing(false);
        })
        .catch((err) => {
          if (!cancelled && err instanceof ApiError && err.status === 404) setMissing(true);
        });
      // 命主 meta 的出生地/出生时间来自 BirthProfile；拿不到时 meta 优雅降级为纯命盘字段。
      BirthApi.get()
        .then((b) => {
          if (!cancelled) setBirth(b);
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const header = (
    <View style={styles.titleRow}>
      <HSerif variant="head">命盘</HSerif>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="分享命盘"
        onPress={() => Alert.alert('敬请期待', '分享命盘功能即将上线。')}
        style={styles.iconBtn}
        hitSlop={6}
      >
        <Icon name="share" color={semantic.textPrimary} size={18} strokeWidth={1.6} />
      </Pressable>
    </View>
  );

  if (missing) {
    return (
      <Screen header={header} contentStyle={styles.stateContent}>
        <Sub style={styles.stateText}>尚未完善生辰，补齐出生信息后即可查看命盘。</Sub>
        <Button variant="primary" onPress={() => router.push('/onboarding')}>
          去 完 善 生 辰
        </Button>
      </Screen>
    );
  }
  if (chart == null) {
    return (
      <Screen header={header} contentStyle={styles.stateContent}>
        <Sub style={styles.stateText}>加载中…</Sub>
      </Screen>
    );
  }

  const genderZao = chart.gender === 'male' ? '乾造' : '坤造';
  const dayMasterLabel = chart.gender === 'male' ? '元男' : '元女';

  // 命主 meta 三行（原型 .chart-meta）：命造 / 公历·时辰 / 出生地·真太阳时校正。全部真实字段，缺项自然省略。
  const metaLines = buildMetaLines(chart, birth);

  const pillars = [
    pillarView('年柱', chart.pillars.year),
    pillarView('月柱', chart.pillars.month),
    pillarView('日柱 · 日主', chart.pillars.day, { emphasis: true, tenGod: dayMasterLabel }),
    pillarView('时柱', chart.pillars.hour),
  ].filter((p): p is PillarView => p != null);

  const bars = elementBalance(chart);
  // 五行强弱注：原型「日主己土」——日主天干 + 其五行短名（固定查表，非排盘）。身强弱判断属命理（out of scope），不含。
  const dayMasterEl = elementOf(chart.dayMaster);
  const dayMasterNote = `日主${chart.dayMaster}${dayMasterEl != null ? elementLabel(dayMasterEl) : ''}`;

  return (
    <Screen scroll header={header} contentStyle={styles.pad}>
      {/* 命主抬头 + 八字盘 */}
      <Card>
        <View style={styles.meta}>
          <Text style={styles.metaName}>{genderZao}</Text>
          {metaLines.map((line) => (
            <Text key={line} style={styles.metaM}>
              {line}
            </Text>
          ))}
        </View>
        <Pillars pillars={pillars} />
      </Card>

      {/* 五行强弱 */}
      <Card>
        <View style={styles.sectitle}>
          <HSerif variant="sec">五行强弱</HSerif>
          <Text style={styles.note}>{dayMasterNote}</Text>
        </View>
        <ElementBars bars={bars} />
      </Card>

      {/* 奇门局（示例排布，见文首裁定与 SAMPLE_QIMEN 注释） */}
      <Card>
        <View style={styles.sectitle}>
          <HSerif variant="sec">奇门局</HSerif>
          <Text style={styles.note}>示例排布</Text>
        </View>
        <QiMenGrid cells={SAMPLE_QIMEN} />
        <Text style={styles.helper}>奇门局按起局时间实时生成，此处为版式示例。</Text>
      </Card>
    </Screen>
  );
}

/** 由一柱构造 Pillars 的视图模型：天干/地支上五行色，藏干拼接，可选强调 / 十神覆盖。降级盘 null 柱返回 null。 */
function pillarView(
  label: string,
  p: Pillar | null,
  opts?: { emphasis?: boolean; tenGod?: string },
): PillarView | null {
  if (p == null) return null;
  const stemEl = elementOf(p.stem);
  const branchEl = elementOf(p.branch);
  return {
    label,
    stem: p.stem,
    stemColor: stemEl != null ? elementColor(stemEl) : semantic.textPrimary,
    branch: p.branch,
    branchColor: branchEl != null ? elementColor(branchEl) : semantic.textPrimary,
    // 日柱天干为日主本身、schema 里 tenGod 为 null，属主传日主称谓（元男/元女）覆盖。
    tenGod: opts?.tenGod ?? p.tenGod ?? '',
    hidden: p.hiddenStems.join(''),
    emphasis: opts?.emphasis,
  };
}

/** 真太阳时相对钟表时间的校正分钟数（正=快、负=慢）；缺时间/真太阳时返回 null。 */
function solarCorrectionMinutes(
  clock: string | null,
  tst: BaziChart['trueSolarTime'],
): number | null {
  if (clock == null || tst == null) return null;
  const [h, m] = clock.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return tst.hour * 60 + tst.minute - (h * 60 + m);
}

/** 组装命主 meta 的两条说明行（命造名单列，不在此）。仅用真实字段，缺项降级。 */
function buildMetaLines(chart: BaziChart, birth: BirthProfileInput | null): string[] {
  const lines: string[] = [];

  // 行一：公历日期 + （时辰已知）时间与时辰 / （未知）时辰未知。
  const clock = birth?.birthTime ?? null;
  if (chart.pillars.hour == null) {
    lines.push(`公历 ${chart.solarDate} · 时辰未知`);
  } else if (clock != null) {
    lines.push(`公历 ${chart.solarDate} ${clock} ${hourBranchFromTime(clock).name}`);
  } else {
    lines.push(`公历 ${chart.solarDate}`);
  }

  // 行二：出生地 · 真太阳时校正；无校正数据时退回农历。
  const parts: string[] = [];
  if (birth?.birthplace) parts.push(birth.birthplace);
  const corr = solarCorrectionMinutes(clock, chart.trueSolarTime);
  if (corr != null) {
    parts.push(`真太阳时校正 ${corr >= 0 ? '+' : '-'}${Math.abs(corr)} 分`);
  } else {
    parts.push(`农历 ${chart.lunarDate}`);
  }
  lines.push(parts.join(' · '));

  return lines;
}

// 示例奇门局排布 —— 设计占位（issue 08 裁定）。结构化「奇门局」当前无 API：奇门局按 ADR-0001 由 AI 在对话消息
// 文本中实时起局，且排盘计算属 spec Out of Scope。此常量仅用于以 1:1 版式保真度演示 QiMenGrid（八门/九星/九宫
// 为奇门遁甲固定词汇，非命主个人结论）。取自原型 docs/ui/tianji-app-design.html 的示例阳遁三局，行主序（左上→右下）。
const SAMPLE_QIMEN: readonly PalaceCell[] = [
  { men: '杜', star: '天辅 · 巽四' },
  { men: '景', star: '天英 · 离九' },
  { men: '死', star: '天芮 · 坤二' },
  { men: '伤', star: '天冲 · 震三' },
  { men: '中', star: '天禽 · 中五', emphasis: 'center' },
  { men: '惊', star: '天柱 · 兑七' },
  { men: '生', star: '天任 · 艮八', emphasis: 'zhi' },
  { men: '休', star: '天蓬 · 坎一' },
  { men: '开', star: '天心 · 乾六' },
];

const styles = StyleSheet.create({
  // 原型 .apphead .title-row：横排两端对齐、padding 6/14。
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    paddingBottom: 14,
  },
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
  // 内容区：原型 .pad top 覆盖为 6、底 30；卡间距 16。
  pad: { paddingTop: 6, paddingBottom: 30, gap: spacing.lg },
  // 加载/空态：顶部留白 + 居中提示。
  stateContent: { paddingTop: 8, gap: spacing.lg },
  stateText: { textAlign: 'center', marginVertical: 8 },

  // 原型 .chart-meta：纵列、gap5、下距 16。
  meta: { gap: 5, marginBottom: 16 },
  // 原型 .chart-meta .name：衬线 22 / .14em / 象牙（命盘专属 meta 名，非通用 ramp 档）。
  metaName: {
    fontFamily: fonts.serif,
    fontSize: 22,
    letterSpacing: tracking(0.14, 22),
    color: semantic.textPrimary,
  },
  // 原型 .chart-meta .m：12.5 / muted / .03em / 等宽数字。
  metaM: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    letterSpacing: tracking(0.03, 12.5),
    color: semantic.textSecondary,
    ...tabularNums,
  },

  // 原型 .sectitle：横排、基线对齐、两端对齐、margin 4 0 14。
  sectitle: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 14,
  },
  // 原型 .sectitle .note：11.5 / muted。
  note: { fontFamily: fonts.sans, fontSize: 11.5, color: semantic.textSecondary },
  // 原型 .helper（奇门卡内居中变体）：11.5 / muted-2 / 上距 14 / .02em。
  helper: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
    letterSpacing: tracking(0.02, 11.5),
    color: semantic.textFaint,
    textAlign: 'center',
    marginTop: 14,
  },
});
