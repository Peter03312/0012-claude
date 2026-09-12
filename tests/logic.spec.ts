import { describe, expect, it } from 'vitest';
import {
  adjudicate,
  RULE_VERDICTS,
  type ConeState,
  type RuleId,
  type Verdict,
} from '../src/logic';

/**
 * 全部 27 种组合（导锥, 目标锥, 护锥），取值 0 直立 / 1 弯曲 / 2 倒伏。
 * 期望结果独立于实现手工推定：
 *  - 顺序合法（导 ≥ 目 ≥ 护）共 10 组，其余 17 组一律“见证组无效”；
 *  - 目标锥直立 → 欠烧；倒伏 → 过烧；
 *  - 目标锥弯曲：护锥非直立 → 过烧；护锥直立且导锥非倒伏 → 欠烧；
 *    仅 (2,1,0) → 命中目标。
 */
const ALL_27_CASES: Array<[ConeState, ConeState, ConeState, Verdict, RuleId]> = [
  // 导锥 = 0：仅 (0,0,0) 顺序合法
  [0, 0, 0, 'underfired', 'R1'],
  [0, 0, 1, 'invalidGroup', 'R0'],
  [0, 0, 2, 'invalidGroup', 'R0'],
  [0, 1, 0, 'invalidGroup', 'R0'],
  [0, 1, 1, 'invalidGroup', 'R0'],
  [0, 1, 2, 'invalidGroup', 'R0'],
  [0, 2, 0, 'invalidGroup', 'R0'],
  [0, 2, 1, 'invalidGroup', 'R0'],
  [0, 2, 2, 'invalidGroup', 'R0'],
  // 导锥 = 1：(1,0,0)、(1,1,0)、(1,1,1) 顺序合法
  [1, 0, 0, 'underfired', 'R1'],
  [1, 0, 1, 'invalidGroup', 'R0'],
  [1, 0, 2, 'invalidGroup', 'R0'],
  [1, 1, 0, 'underfired', 'R4'],
  [1, 1, 1, 'overfired', 'R3'],
  [1, 1, 2, 'invalidGroup', 'R0'],
  [1, 2, 0, 'invalidGroup', 'R0'],
  [1, 2, 1, 'invalidGroup', 'R0'],
  [1, 2, 2, 'invalidGroup', 'R0'],
  // 导锥 = 2：六组顺序合法
  [2, 0, 0, 'underfired', 'R1'],
  [2, 0, 1, 'invalidGroup', 'R0'],
  [2, 0, 2, 'invalidGroup', 'R0'],
  [2, 1, 0, 'onTarget', 'R5'],
  [2, 1, 1, 'overfired', 'R3'],
  [2, 1, 2, 'invalidGroup', 'R0'],
  [2, 2, 0, 'overfired', 'R2'],
  [2, 2, 1, 'overfired', 'R2'],
  [2, 2, 2, 'overfired', 'R2'],
];

describe('见证锥裁决：全部 27 种组合', () => {
  it.each(ALL_27_CASES)(
    '导锥=%i 目标锥=%i 护锥=%i → %s（%s）',
    (guide, target, guard, expectedVerdict, expectedRule) => {
      const result = adjudicate({ guide, target, guard });
      expect(result).not.toBeNull();
      expect(result!.verdict).toBe(expectedVerdict);
      expect(result!.rule).toBe(expectedRule);
      // 命中规则与裁决结果必须一致
      expect(RULE_VERDICTS[result!.rule]).toBe(result!.verdict);
      // 快照须如实记录三锥状态
      expect(result!.cones).toEqual({ guide, target, guard });
    },
  );

  it('27 种组合无一遗漏', () => {
    expect(ALL_27_CASES).toHaveLength(27);
    const keys = new Set(ALL_27_CASES.map(([g, t, d]) => `${g}${t}${d}`));
    expect(keys.size).toBe(27);
  });

  it('顺序合法的组合恰为 10 组，其余 17 组均为见证组无效', () => {
    const invalid = ALL_27_CASES.filter(([, , , v]) => v === 'invalidGroup');
    expect(invalid).toHaveLength(17);
  });
});

describe('槽位缺失或非法值：不作裁决', () => {
  it.each([
    ['槽位缺失', { guide: null, target: 1, guard: 0 }],
    ['全部缺失', { guide: null, target: null, guard: null }],
    ['undefined', { guide: 2, target: undefined, guard: 0 }],
    ['越界值 3', { guide: 3, target: 1, guard: 0 }],
    ['负值 -1', { guide: 2, target: -1, guard: 0 }],
    ['非整数 1.5', { guide: 2, target: 1, guard: 1.5 }],
    ['字符串 "1"', { guide: 2, target: '1', guard: 0 }],
    ['布尔值', { guide: true, target: 1, guard: 0 }],
  ])('%s → 返回 null', (_label, input) => {
    expect(adjudicate(input)).toBeNull();
  });
});
