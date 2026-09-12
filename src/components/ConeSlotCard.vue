<script setup lang="ts">
import { ref } from 'vue';
import {
  CONE_STATES,
  STATE_LABELS,
  SLOT_LABELS,
  type ConeState,
  type SlotKey,
} from '../logic';

defineProps<{ slotKey: SlotKey }>();

const model = defineModel<ConeState | null>({ required: true });

/** 漫游 tabindex 当前聚焦的选项下标 */
const activeIndex = ref(0);
const optionEls = ref<(HTMLButtonElement | null)[]>([]);

function select(state: ConeState): void {
  model.value = state;
  activeIndex.value = CONE_STATES.indexOf(state);
}

function focusOption(index: number): void {
  activeIndex.value = index;
  optionEls.value[index]?.focus();
}

function onKeydown(event: KeyboardEvent): void {
  let next: number | null = null;
  switch (event.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      next = Math.min(activeIndex.value + 1, CONE_STATES.length - 1);
      break;
    case 'ArrowLeft':
    case 'ArrowUp':
      next = Math.max(activeIndex.value - 1, 0);
      break;
    case 'Home':
      next = 0;
      break;
    case 'End':
      next = CONE_STATES.length - 1;
      break;
    case '0':
    case '1':
    case '2':
      next = Number(event.key);
      break;
    default:
      return; // Tab / Enter / 空格等保持原生行为
  }
  event.preventDefault();
  select(CONE_STATES[next]);
  focusOption(next);
}
</script>

<template>
  <section class="cone-card" :data-testid="`card-${slotKey}`">
    <h3 class="card-title">{{ SLOT_LABELS[slotKey] }}</h3>
    <div
      class="options"
      role="radiogroup"
      :aria-label="`${SLOT_LABELS[slotKey]}状态`"
      @keydown="onKeydown"
    >
      <button
        v-for="(state, i) in CONE_STATES"
        :key="state"
        :ref="(el) => { optionEls[i] = el as HTMLButtonElement | null }"
        type="button"
        role="radio"
        :aria-checked="model === state"
        class="option"
        :class="{ selected: model === state }"
        :tabindex="i === activeIndex ? 0 : -1"
        :data-testid="`${slotKey}-${state}`"
        @click="select(state)"
        @focus="activeIndex = i"
      >
        <span class="state-value">{{ state }}</span>
        <span class="state-label">{{ STATE_LABELS[state] }}</span>
      </button>
    </div>
    <p class="current" :data-testid="`${slotKey}-current`">
      当前：{{ model === null ? '未选择' : `${STATE_LABELS[model]}（${model}）` }}
    </p>
  </section>
</template>
