<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import ConeSlotCard from './components/ConeSlotCard.vue';
import {
  adjudicate,
  isConeState,
  RULE_ORDER,
  RULE_TEXTS,
  RULE_VERDICTS,
  SLOT_LABELS,
  SLOT_ORDER,
  STATE_LABELS,
  VERDICT_LABELS,
  VERDICT_ORDER,
  type Adjudication,
  type ConeState,
  type SlotKey,
} from './logic';

const selection = reactive<Record<SlotKey, ConeState | null>>({
  guide: null,
  target: null,
  guard: null,
});

const result = ref<Adjudication | null>(null);
const errorMsg = ref('');

// 已有结果后改动任一锥：立即清除旧等级与提示，等待重新裁决。
watch(selection, () => {
  result.value = null;
  errorMsg.value = '';
});

function judge(): void {
  const snapshot = {
    guide: selection.guide,
    target: selection.target,
    guard: selection.guard,
  };
  if (
    !isConeState(snapshot.guide) ||
    !isConeState(snapshot.target) ||
    !isConeState(snapshot.guard)
  ) {
    errorMsg.value = '三个槽位尚未选齐（每槽须为 0 直立 / 1 弯曲 / 2 倒伏），不作裁决。';
    result.value = null;
    return;
  }
  const adjudication = adjudicate(snapshot);
  if (!adjudication) {
    errorMsg.value = '存在非法状态值，不作裁决。';
    result.value = null;
    return;
  }
  errorMsg.value = '';
  result.value = adjudication;
}

function reset(): void {
  selection.guide = null;
  selection.target = null;
  selection.guard = null;
  result.value = null;
  errorMsg.value = '';
}
</script>

<template>
  <main class="board">
    <header class="board-header">
      <h1>试烧窑见证锥裁决板</h1>
      <p class="intro">
        开窑后逐槽记录三支见证锥形态：<strong>0 直立 · 1 弯曲 · 2 倒伏</strong>。
        全部判定均在浏览器本地完成，不调用任何在线接口。
      </p>
      <p class="kbd-hint">键盘操作：Tab 切换槽位，← → 或 0 / 1 / 2 选择状态，Enter 触发按钮。</p>
    </header>

    <div class="cards">
      <ConeSlotCard v-model="selection.guide" slot-key="guide" />
      <ConeSlotCard v-model="selection.target" slot-key="target" />
      <ConeSlotCard v-model="selection.guard" slot-key="guard" />
    </div>

    <div class="actions">
      <button type="button" class="judge" data-testid="judge" @click="judge">开始裁决</button>
      <button type="button" class="reset" data-testid="reset" @click="reset">清空重选</button>
    </div>

    <p v-if="errorMsg" class="error" role="alert" data-testid="error">{{ errorMsg }}</p>

    <section v-if="result" class="result" data-testid="result" aria-live="polite">
      <h2>裁决结果</h2>
      <ul class="summary">
        <li v-for="slot in SLOT_ORDER" :key="slot" :data-testid="`summary-${slot}`">
          <strong>{{ SLOT_LABELS[slot] }}</strong>：
          {{ STATE_LABELS[result.cones[slot]] }}（{{ result.cones[slot] }}）
        </li>
      </ul>
      <p class="rule" data-testid="rule">
        命中规则 <strong>{{ result.rule }}</strong>：{{ RULE_TEXTS[result.rule] }}
      </p>
      <div class="verdicts" aria-label="裁决项">
        <span
          v-for="v in VERDICT_ORDER"
          :key="v"
          class="verdict-chip"
          :class="{ hit: result.verdict === v }"
          :data-testid="`chip-${v}`"
        >
          {{ VERDICT_LABELS[v] }}
        </span>
      </div>
      <p class="final">
        唯一裁决：<strong class="final-verdict" data-testid="verdict">{{ VERDICT_LABELS[result.verdict] }}</strong>
      </p>
    </section>

    <footer class="rules">
      <h2>裁决规则</h2>
      <ol>
        <li v-for="rule in RULE_ORDER" :key="rule">
          <strong>{{ rule }}</strong> — {{ RULE_TEXTS[rule] }} → {{ VERDICT_LABELS[RULE_VERDICTS[rule]] }}
        </li>
      </ol>
    </footer>
  </main>
</template>
