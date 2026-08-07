import type { BaziChart, System } from '@tianji/shared';
import { CARD_MARKER } from './card';
import type { ChatMessage } from './deepseek';

// 人设内容为占位，可后续调整（用户已表示「内容不用担心」）。

/**
 * 可选「要点卡」指令：当回复含可归纳的结构化要点（宜忌 / 方位 / 时间窗口等）时，
 * 允许模型在正文之后另起一行，输出恰好一行 `§CARD§{JSON}`。服务端据此剥出卡片（见 ai/card.ts），
 * 客户端渲染为 KvCard。正文照常自然书写、勿提及此格式；无要点则不输出该行。
 */
const CARD_INSTRUCTION = [
  '',
  '【可选要点卡】若你的回答含可归纳的结构化要点，可在正文之后另起一行、输出恰好一行：',
  `${CARD_MARKER}{"title":"卡片小标题","rows":[{"k":"键","v":"值","ok":true}]}`,
  '其中 rows 为若干「键—值」项，ok 仅在该项明确吉利/宜时置 true（可省略）。',
  '正文请自然书写、不要提及此格式；若无要点，则不要输出该行。',
].join('\n');

const BAZI_PERSONA = [
  '你是一位严谨、克制的四柱八字命理师。',
  '解读须紧扣下方命盘数据，不臆造、不重排；命盘由排盘引擎确定性算出，以它为准。',
  '语气平实，避免绝对化的吉凶断言，给出可参考的分析而非宿命结论。',
].join('\n');

const QIMEN_PERSONA = [
  '你是一位奇门遁甲起局与解读师。',
  '请依用户所问之事与给定的起局时间起局，并解读。',
  '语气平实，避免绝对化断言。',
].join('\n');

/** 八字系统提示：注入确定性命盘作为 ground truth。 */
export function baziSystemPrompt(chart: BaziChart): string {
  return `${BAZI_PERSONA}\n\n【命盘（权威，请勿自行重排）】\n${JSON.stringify(chart, null, 2)}${CARD_INSTRUCTION}`;
}

/** 奇门系统提示：奇门局由模型生成，见 ADR 0001 的准确性取舍。 */
export function qimenSystemPrompt(nowText: string): string {
  return `${QIMEN_PERSONA}\n\n【起局参考时间】${nowText}${CARD_INSTRUCTION}`;
}

/**
 * 组装发给 DeepSeek 的消息序列。
 * TODO(Q13): 历史注入窗口与每用户用量上限，待用户给方案；当前注入全部历史。
 */
export function buildChatMessages(
  system: System,
  params: { chart: BaziChart | null; nowText: string; history: ChatMessage[] },
): ChatMessage[] {
  const systemPrompt =
    system === 'bazi' && params.chart
      ? baziSystemPrompt(params.chart)
      : qimenSystemPrompt(params.nowText);
  return [{ role: 'system', content: systemPrompt }, ...params.history];
}
