import { StyleSheet, Text, View } from 'react-native';
import { radii } from '../radii';
import { semantic } from '../semantic';
import { fonts, tracking } from '../typography';

export interface PersonaProps {
  /** 分类标签（原型 .persona 首个 span，如「命主」「奇门」「今日」）——muted 小字。 */
  label: string;
  /** 主体/锚点（原型 .persona b，如「林辰宇」「时家奇门 · 阳遁三局」）——象牙 Medium。 */
  name: string;
  /** 右侧descriptor（原型 .persona .tag，如「己巳日 · 乾造」）——gold-2 衬线、靠右，可省略。 */
  tag?: string;
}

/**
 * Persona —— Tier-2 对话线程的人物/情境抬头（spec §Primitives / issue 07）。
 * 原型 .persona：ink-2 底 + line 描边 + r12 的一行——分类标签（muted）· 主体名（象牙 Medium）·
 * 右侧金色衬线 tag。纯表现型（无交互）；视觉忠实度双端人工核对，故不设行为测试（同 Card/Screen）。
 */
export function Persona({ label, name, tag }: PersonaProps) {
  return (
    <View style={styles.persona}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>
      {tag != null ? (
        <Text style={styles.tag} numberOfLines={1}>
          {tag}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // 原型 .persona：横排、gap9、ink-2 底、line 描边、r12、padding 9-13、12.5 muted。
  persona: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: semantic.surface,
    borderWidth: 1,
    borderColor: semantic.border,
    borderRadius: radii.md, // 12
    paddingVertical: 9,
    paddingHorizontal: 13,
  },
  // 原型 .persona span：12.5 / muted。
  label: { fontFamily: fonts.sans, fontSize: 12.5, color: semantic.textSecondary },
  // 原型 .persona b：象牙 / Medium（字重由 family 承载）。可收缩以让 tag 靠右。
  name: { flexShrink: 1, fontFamily: fonts.sansMedium, fontSize: 12.5, color: semantic.textPrimary },
  // 原型 .persona .tag：靠右（margin-left:auto）、gold-2 衬线、.1em。
  tag: {
    marginLeft: 'auto',
    fontFamily: fonts.serif,
    fontSize: 12.5,
    letterSpacing: tracking(0.1, 12.5),
    color: semantic.accentBright,
  },
});
