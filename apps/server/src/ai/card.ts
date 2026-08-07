import { type MessageCard, MessageCardSchema } from '@tianji/shared';

/**
 * 结构化「要点卡」尾块标记。模型被要求（见 prompts.ts）在正文之后可选地追加恰好一行：
 * `§CARD§{...一行 JSON...}`。用罕见的 § 包裹，几乎不会与正常正文冲突。
 */
export const CARD_MARKER = '§CARD§';

/**
 * 流式转发时可安全吐给客户端的可见前缀长度。绝不吐出 marker 及其后的卡片 JSON；
 * 也不吐出结尾处「可能是 marker 前缀」的半截（marker 可能跨 chunk 到达，先扣住等补全）。
 */
export function visibleCardPrefixLen(acc: string, marker: string = CARD_MARKER): number {
  const idx = acc.indexOf(marker);
  if (idx >= 0) return idx;
  // 结尾若是 marker 的某个前缀 → 暂扣，等下一 chunk 判定。
  const maxHold = Math.min(marker.length - 1, acc.length);
  for (let n = maxHold; n > 0; n--) {
    if (marker.startsWith(acc.slice(acc.length - n))) return acc.length - n;
  }
  return acc.length;
}

/**
 * 从完整回复里剥出正文与可选卡片。marker 之后应为一行可解析的 MessageCard JSON；
 * 解析失败或不合 schema 则丢弃尾块、只保留正文（不把原始 JSON 泄露给用户）。
 */
export function extractCard(raw: string, marker: string = CARD_MARKER): {
  content: string;
  card?: MessageCard;
} {
  const idx = raw.indexOf(marker);
  if (idx < 0) return { content: raw.trim() };
  const content = raw.slice(0, idx).trim();
  const card = safeParseCard(raw.slice(idx + marker.length).trim());
  return card ? { content, card } : { content };
}

function safeParseCard(tail: string): MessageCard | undefined {
  let json: unknown;
  try {
    json = JSON.parse(tail);
  } catch {
    return undefined;
  }
  const parsed = MessageCardSchema.safeParse(json);
  return parsed.success ? parsed.data : undefined;
}
