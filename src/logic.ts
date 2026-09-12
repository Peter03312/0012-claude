/**
 * 见证锥裁决核心逻辑（纯函数，全部在浏览器本地执行，不调用任何在线接口）。
 *
 * 三个槽位固定为：导锥 guide、目标锥 target、护锥 guard。
 * 每槽状态：0 直立 / 1 弯曲 / 2 倒伏。
 */

export const CONE_STATES = [0, 1, 2] as const;

export type ConeState = (typeof CONE_STATES)[number]; // 0 | 1 | 2

export type SlotKey = 'guide' | 'target' | 'guard';

export const SLOT_ORDER: readonly SlotKey[] = ['guide', 'target', 'guard'];

export const SLOT_LABELS: Record<SlotKey, string> = {
  guide: '导锥',
  target: '目标锥',
  guard: '护锥',
};

export const STATE_LABELS: Record<ConeState, string> = {
  0: '直立',
  1: '弯曲',
  2: '倒伏',
};

export type Verdict = 'underfired' | 'onTarget' | 'overfired' | 'invalidGroup';

export const VERDICT_ORDER: readonly Verdict[] = [
  'underfired',
  'onTarget',
  'overfired',
  'invalidGroup',
];

export const VERDICT_LABELS: Record<Verdict, string> = {
  underfired: '欠烧',
  onTarget: '命中目标',
  overfired: '过烧',
  invalidGroup: '见证组无效',
};

export type RuleId = 'R0' | 'R1' | 'R2' | 'R3' | 'R4' | 'R5';

export const RULE_ORDER: readonly RuleId[] = ['R0', 'R1', 'R2', 'R3', 'R4', 'R5'];

export const RULE_TEXTS: Record<RuleId, string> = {
  R0: '顺序校验：导锥状态值 ≥ 目标锥 ≥ 护锥 不成立',
  R1: '目标锥直立（0）',
  R2: '目标锥倒伏（2）',
  R3: '目标锥弯曲（1）且护锥非直立',
  R4: '目标锥弯曲（1）、护锥直立（0）且导锥非倒伏',
  R5: '导锥倒伏（2）、目标锥弯曲（1）、护锥直立（0）',
};

export const RULE_VERDICTS: Record<RuleId, Verdict> = {
  R0: 'invalidGroup',
  R1: 'underfired',
  R2: 'overfired',
  R3: 'overfired',
  R4: 'underfired',
  R5: 'onTarget',
};

export interface ConeSelection {
  guide: ConeState;
  target: ConeState;
  guard: ConeState;
}

export interface Adjudication {
  /** 唯一裁决结果 */
  verdict: Verdict;
  /** 命中的规则编号 */
  rule: RuleId;
  /** 裁决时刻的三锥状态快照 */
  cones: ConeSelection;
}

export function isConeState(value: unknown): value is ConeState {
  return value === 0 || value === 1 || value === 2;
}

/**
 * 裁决入口。
 * 槽位缺失或含非法值时返回 null（不作裁决）；
 * 否则返回唯一裁决、命中规则与三锥快照。
 */
export function adjudicate(input: {
  guide: unknown;
  target: unknown;
  guard: unknown;
}): Adjudication | null {
  const { guide, target, guard } = input;
  if (!isConeState(guide) || !isConeState(target) || !isConeState(guard)) {
    return null;
  }
  const cones: ConeSelection = { guide, target, guard };

  // R0：先验证顺序——导锥不小于目标锥、目标锥不小于护锥，否则整组无效。
  if (!(guide >= target && target >= guard)) {
    return { verdict: 'invalidGroup', rule: 'R0', cones };
  }
  // R1 / R2：目标锥直立判欠烧，倒伏判过烧。
  if (target === 0) return { verdict: 'underfired', rule: 'R1', cones };
  if (target === 2) return { verdict: 'overfired', rule: 'R2', cones };
  // 目标锥弯曲（1）：依次检查护锥、导锥。
  if (guard !== 0) return { verdict: 'overfired', rule: 'R3', cones };
  if (guide !== 2) return { verdict: 'underfired', rule: 'R4', cones };
  // 仅 倒伏/弯曲/直立 组合命中目标。
  return { verdict: 'onTarget', rule: 'R5', cones };
}
