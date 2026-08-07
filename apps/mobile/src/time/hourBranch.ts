// 墙钟 HH:mm → 12 双时辰（地支）。生辰引导 picker 用它把用户选的钟表时间展示为「寅时 03:00 – 05:00」，
// 提交仍以精确 HH:mm 存 birthTime（真太阳时校正据此进行，见 CONTEXT §真太阳时）。纯函数，测试见 hourBranch.test.ts。

// 地支顺序，索引 0 = 子。
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;

export interface HourBranch {
  /** 时辰名，如「寅时」。 */
  name: string;
  /** 时钟区间，如「03:00 – 05:00」（子时跨午夜 → 「23:00 – 01:00」）。 */
  range: string;
}

/** 把整点小时补零成 "HH:00"。 */
function hhmm(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

/**
 * 把墙钟时间映射到所属双时辰。时辰边界落在整奇数点（子 23:00 起、丑 01:00、寅 03:00…），
 * 故只看小时、分钟不影响归属；子时跨午夜（23:00–次日 01:00）。
 */
export function hourBranchFromTime(time: string): HourBranch {
  const hour = Number(time.slice(0, 2));
  // index：子时含 23、0 点；其余每两小时进一位。floor((h+1)/2) % 12 恰好落到对应地支。
  const index = Math.floor((hour + 1) / 2) % 12;
  // 该时辰起点小时：子时特判 23，其余为 2*index-1。
  const startHour = index === 0 ? 23 : 2 * index - 1;
  const endHour = (startHour + 2) % 24;
  return {
    name: `${BRANCHES[index]}时`,
    range: `${hhmm(startHour)} – ${hhmm(endHour)}`,
  };
}
