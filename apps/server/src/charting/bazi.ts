import {
  type BaziChart,
  type DecadeFortune as DomainDecadeFortune,
  type Gender as DomainGender,
  type Pillar,
  toTrueSolarTime,
} from '@tianji/shared';
import { ChildLimit, Gender, type HeavenStem, type SixtyCycle, SolarDay, SolarTime } from 'tyme4ts';

/**
 * 排八字的输入。时间按出生地墙钟理解，经度用于真太阳时校正。
 * timeUnknown 或 birthTime 为 null 时产出降级盘（仅年月日三柱、无大运）。
 */
export interface BaziInput {
  birthDate: string; // YYYY-MM-DD
  birthTime: string | null; // HH:mm
  timeUnknown: boolean;
  longitude: number;
  gender: DomainGender;
}

function ymd(date: string): [number, number, number] {
  const p = date.split('-');
  return [Number(p[0]), Number(p[1]), Number(p[2])];
}

function hm(time: string): [number, number] {
  const p = time.split(':');
  return [Number(p[0]), Number(p[1])];
}

/** SixtyCycle（干支）→ 领域 Pillar。日柱天干即日主，其十神记为 null。 */
function toPillar(cycle: SixtyCycle, dayMaster: HeavenStem, isDayPillar: boolean): Pillar {
  const stem = cycle.getHeavenStem();
  const branch = cycle.getEarthBranch();
  return {
    stem: stem.getName(),
    branch: branch.getName(),
    ganZhi: cycle.getName(),
    hiddenStems: branch.getHideHeavenStems().map((h) => h.getHeavenStem().getName()),
    tenGod: isDayPillar ? null : dayMaster.getTenStar(stem).getName(),
  };
}

/** 起大运：从 ChildLimit 的起运开始，连续取 count 步。 */
function computeDecadeFortunes(
  birthTime: SolarTime,
  gender: Gender,
  count = 8,
): DomainDecadeFortune[] {
  const childLimit = ChildLimit.fromSolarTime(birthTime, gender);
  const out: DomainDecadeFortune[] = [];
  let df = childLimit.getStartDecadeFortune();
  for (let i = 0; i < count; i++) {
    out.push({ startAge: df.getStartAge(), ganZhi: df.getSixtyCycle().getName() });
    df = df.next(1);
  }
  return out;
}

/**
 * 确定性排八字（tyme4ts）。这是 ground truth，注入 DeepSeek 供解读；见 ADR 0001。
 */
export function computeBaziChart(input: BaziInput): BaziChart {
  const tymeGender = input.gender === 'male' ? Gender.MAN : Gender.WOMAN;
  const [yy, mm, dd] = ymd(input.birthDate);

  // —— 降级盘：时辰未知，仅年月日三柱 ——
  if (input.timeUnknown || input.birthTime === null) {
    const day = SolarDay.fromYmd(yy, mm, dd).getSixtyCycleDay();
    const dayCycle = day.getSixtyCycle();
    const dayMaster = dayCycle.getHeavenStem();
    return {
      gender: input.gender,
      solarDate: input.birthDate,
      lunarDate: SolarDay.fromYmd(yy, mm, dd).getLunarDay().toString(),
      trueSolarTime: null,
      dayMaster: dayMaster.getName(),
      zodiac: day.getYear().getEarthBranch().getZodiac().getName(),
      pillars: {
        year: toPillar(day.getYear(), dayMaster, false),
        month: toPillar(day.getMonth(), dayMaster, false),
        day: toPillar(dayCycle, dayMaster, true),
        hour: null,
      },
      decadeFortunes: [],
    };
  }

  // —— 完整盘：先做真太阳时校正，再排四柱 ——
  const [hh, min] = hm(input.birthTime);
  const tst = toTrueSolarTime({ year: yy, month: mm, day: dd, hour: hh, minute: min }, input.longitude);
  const birthTime = SolarTime.fromYmdHms(tst.year, tst.month, tst.day, tst.hour, tst.minute, 0);
  const eightChar = birthTime.getSixtyCycleHour().getEightChar();
  const dayMaster = eightChar.getDay().getHeavenStem();

  return {
    gender: input.gender,
    solarDate: input.birthDate,
    lunarDate: birthTime.getSolarDay().getLunarDay().toString(),
    trueSolarTime: { hour: tst.hour, minute: tst.minute },
    dayMaster: dayMaster.getName(),
    zodiac: eightChar.getYear().getEarthBranch().getZodiac().getName(),
    pillars: {
      year: toPillar(eightChar.getYear(), dayMaster, false),
      month: toPillar(eightChar.getMonth(), dayMaster, false),
      day: toPillar(eightChar.getDay(), dayMaster, true),
      hour: toPillar(eightChar.getHour(), dayMaster, false),
    },
    decadeFortunes: computeDecadeFortunes(birthTime, tymeGender),
  };
}
