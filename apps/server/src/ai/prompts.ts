import type { BaziChart, System } from '@tianji/shared';
import type { ChatMessage } from './deepseek';

// 人设内容为占位，可后续调整（用户已表示「内容不用担心」）。

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
  return `${BAZI_PERSONA}\n\n【命盘（权威，请勿自行重排）】\n${JSON.stringify(chart, null, 2)}`;
}

/** 奇门系统提示：奇门局由模型生成，见 ADR 0001 的准确性取舍。 */
export function qimenSystemPrompt(nowText: string): string {
  return `${QIMEN_PERSONA}\n\n【起局参考时间】${nowText}`;
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
