import { StyleSheet, Text, View } from 'react-native';
import { radii } from '../radii';
import { semantic } from '../semantic';
import { fonts, tabularNums, tracking, typeRamp } from '../typography';

export interface PillarView {
  /** 柱名（原型 .plabel，如「年柱」「日柱 · 日主」）。 */
  label: string;
  /** 天干字。 */
  stem: string;
  /** 天干的五行数据编码色（由 chart/fiveElement 派生注入）。 */
  stemColor: string;
  /** 地支字。 */
  branch: string;
  /** 地支的五行数据编码色。 */
  branchColor: string;
  /** 十神（原型 .ten）；日柱天干为日主本身、无十神，属主页面填「元男/元女」等日主称谓。空串则留白。 */
  tenGod: string;
  /** 藏干（原型 .hide），如「戊辛丁」。空串则留白。 */
  hidden: string;
  /** true = 日柱金色强调（金边 + 内金环 + gold-2 柱名）。 */
  emphasis?: boolean;
}

export interface PillarsProps {
  /** 四柱（年/月/日/时）；降级盘可只传三柱。 */
  pillars: readonly PillarView[];
}

// 日柱强调的一次性金色描边值（原型内联 border-color:rgba(201,162,74,.4) + inset 0 0 0 1px rgba(201,162,74,.14)）——
// 命盘专属、非通用 token，就地成常量（同 README「一次性色」裁定）。
const EMPHASIS_BORDER = 'rgba(201,162,74,0.4)';
const EMPHASIS_RING = 'inset 0px 0px 0px 1px rgba(201,162,74,0.14)';

/**
 * Pillars —— Tier-2「八字盘」四柱网格（spec §Primitives / issue 08；裁定 text + View，不用 SVG）。
 * 原型 .pillars：4 列等宽、gap8；每柱 .pillar 为 ink-3 底 + line 描边 + r12 的居中列——柱名（.plabel）、
 * 大号衬线天干/地支（.gan/.zhi，**五行色由属主注入**）、十神（.ten）、藏干（.hide）。日柱金色强调。
 * 纯表现型：五行色作为已派生的字符串传入，Pillars 自身不引 palette.wx*（数据编码色收敛在 chart/fiveElement）。
 * 视觉忠实度双端人工核对，故不设行为测试（同 Card/Persona）。
 */
export function Pillars({ pillars }: PillarsProps) {
  return (
    <View style={styles.grid}>
      {pillars.map((p, i) => (
        <View
          key={`${p.label}-${i}`}
          style={[styles.pillar, p.emphasis === true && styles.pillarEmphasis]}
        >
          <Text style={[styles.plabel, p.emphasis === true && styles.plabelEmphasis]} numberOfLines={1}>
            {p.label}
          </Text>
          <Text style={[styles.ganZhi, { color: p.stemColor }]}>{p.stem}</Text>
          <Text style={[styles.ganZhi, { color: p.branchColor }]}>{p.branch}</Text>
          {p.tenGod !== '' ? <Text style={styles.ten}>{p.tenGod}</Text> : null}
          {p.hidden !== '' ? <Text style={styles.hide}>{p.hidden}</Text> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // 原型 .pillars：4 列等宽网格、gap8。RN 无 grid，用等分 flex 行 + gap 等价。
  grid: { flexDirection: 'row', gap: 8 },
  // 原型 .pillar：ink-3 底、line 描边、r12、padding 12/6、居中。
  pillar: {
    flex: 1,
    backgroundColor: semantic.surfaceInput,
    borderWidth: 1,
    borderColor: semantic.border,
    borderRadius: radii.md, // 12
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  // 日柱强调：金边 + 内金环（原型内联 box-shadow inset）。
  pillarEmphasis: { borderColor: EMPHASIS_BORDER, boxShadow: EMPHASIS_RING },
  // 原型 .plabel：11 / muted / .14em / 下距 10。
  plabel: {
    fontFamily: fonts.sans,
    fontSize: 11,
    letterSpacing: tracking(0.14, 11),
    color: semantic.textSecondary,
    marginBottom: 10,
  },
  // 日柱柱名转 gold-2（原型 .plabel color:var(--gold-2)）。
  plabelEmphasis: { color: semantic.accentBright },
  // 原型 .gan/.zhi：衬线 27 / 行高 1.25；等宽数字对齐（八字盘数值裁定），行内色由五行注入。
  ganZhi: { ...typeRamp.pillarGanZhi, ...tabularNums, textAlign: 'center' },
  // 原型 .ten：10.5 / muted / 上距 2 / .06em。
  ten: {
    fontFamily: fonts.sans,
    fontSize: 10.5,
    letterSpacing: tracking(0.06, 10.5),
    color: semantic.textSecondary,
    marginTop: 2,
  },
  // 原型 .hide：10.5 / muted-2 / 上距 9 / .08em。
  hide: {
    fontFamily: fonts.sans,
    fontSize: 10.5,
    letterSpacing: tracking(0.08, 10.5),
    color: semantic.textFaint,
    marginTop: 9,
  },
});
