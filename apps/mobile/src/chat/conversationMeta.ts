import { type System, systemLabel } from '@tianji/shared';

/**
 * 对话切换器每项的副标题（原型 .opt-m，如「八字 · 今天 09:24」）。
 * 纯函数：系统标签 + 「相对更新时间」拼成一行。`now` 由调用方注入而非函数内取 `Date.now()`，
 * 以便单测断言确定（spec Testing Decisions 的纯逻辑 seam）。
 */
export function conversationMeta(system: System, updatedAtIso: string, now: Date): string {
  return `${systemLabel(system)} · ${relativeTime(new Date(updatedAtIso), now)}`;
}

// 相对时间：今天 → 「今天 HH:mm」；昨天 → 「昨天 HH:mm」；更早 → 零补齐「MM-DD」。
// 全用本地日历分量比较与格式化，避免 UTC 偏移把「今天」算成「昨天」。
function relativeTime(then: Date, now: Date): string {
  const dayDiff = calendarDayDiff(then, now);
  if (dayDiff === 0) return `今天 ${hhmm(then)}`;
  if (dayDiff === 1) return `昨天 ${hhmm(then)}`;
  return `${pad(then.getMonth() + 1)}-${pad(then.getDate())}`;
}

// now 与 then 相差的整日历日数（按本地零点归一，非 24h 差）。now 更晚为正。
function calendarDayDiff(then: Date, now: Date): number {
  const MS_PER_DAY = 86_400_000;
  const thenMidnight = new Date(then.getFullYear(), then.getMonth(), then.getDate()).getTime();
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((nowMidnight - thenMidnight) / MS_PER_DAY);
}

function hhmm(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
