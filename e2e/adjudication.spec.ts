import { expect, test, type Page } from '@playwright/test';

async function pick(page: Page, slot: 'guide' | 'target' | 'guard', state: 0 | 1 | 2) {
  await page.getByTestId(`${slot}-${state}`).click();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('槽位未选齐：不作裁决并提示，补选后错误立即清除', async ({ page }) => {
  await page.getByTestId('judge').click();
  await expect(page.getByTestId('error')).toContainText('不作裁决');
  await expect(page.getByTestId('result')).toHaveCount(0);

  // 补选任一槽位 → 错误提示立即清除
  await pick(page, 'guide', 0);
  await expect(page.getByTestId('error')).toHaveCount(0);
});

test('倒伏/弯曲/直立：命中目标，并同时展示三锥状态、命中规则与唯一结果', async ({ page }) => {
  await pick(page, 'guide', 2);
  await pick(page, 'target', 1);
  await pick(page, 'guard', 0);
  await page.getByTestId('judge').click();

  await expect(page.getByTestId('summary-guide')).toContainText('导锥');
  await expect(page.getByTestId('summary-guide')).toContainText('倒伏（2）');
  await expect(page.getByTestId('summary-target')).toContainText('弯曲（1）');
  await expect(page.getByTestId('summary-guard')).toContainText('直立（0）');
  await expect(page.getByTestId('rule')).toContainText('R5');
  await expect(page.getByTestId('verdict')).toHaveText('命中目标');

  // 四个裁决项中有且仅有一个被命中
  await expect(page.locator('.verdict-chip.hit')).toHaveCount(1);
  await expect(page.getByTestId('chip-onTarget')).toHaveClass(/hit/);
});

test('已有结果后改选任一锥：旧等级立即清除，重新裁决给出唯一新结果', async ({ page }) => {
  await pick(page, 'guide', 2);
  await pick(page, 'target', 1);
  await pick(page, 'guard', 0);
  await page.getByTestId('judge').click();
  await expect(page.getByTestId('verdict')).toHaveText('命中目标');

  // 改选护锥 0 → 1：旧结果立即消失
  await pick(page, 'guard', 1);
  await expect(page.getByTestId('result')).toHaveCount(0);

  // 重新裁决：目标锥弯曲且护锥非直立 → 过烧（R3）
  await page.getByTestId('judge').click();
  await expect(page.getByTestId('verdict')).toHaveText('过烧');
  await expect(page.getByTestId('rule')).toContainText('R3');
  await expect(page.getByTestId('summary-guard')).toContainText('弯曲（1）');
  await expect(page.locator('.verdict-chip.hit')).toHaveCount(1);
  await expect(page.getByTestId('chip-overfired')).toHaveClass(/hit/);
});

test('顺序颠倒（导锥 < 目标锥）：整组判见证组无效，改动后清除', async ({ page }) => {
  await pick(page, 'guide', 0);
  await pick(page, 'target', 1);
  await pick(page, 'guard', 0);
  await page.getByTestId('judge').click();

  await expect(page.getByTestId('verdict')).toHaveText('见证组无效');
  await expect(page.getByTestId('rule')).toContainText('R0');
  await expect(page.getByTestId('chip-invalidGroup')).toHaveClass(/hit/);

  // 把目标锥改回直立：结果清除，重新裁决 → 欠烧（R1）
  await pick(page, 'target', 0);
  await expect(page.getByTestId('result')).toHaveCount(0);
  await page.getByTestId('judge').click();
  await expect(page.getByTestId('verdict')).toHaveText('欠烧');
  await expect(page.getByTestId('rule')).toContainText('R1');
});

test('状态卡支持键盘操作：方向键移动选择，数字键直选', async ({ page }) => {
  await page.getByTestId('guide-0').focus();
  await page.keyboard.press('ArrowRight'); // 0 → 1
  await expect(page.getByTestId('guide-current')).toContainText('弯曲（1）');
  await page.keyboard.press('ArrowRight'); // 1 → 2
  await expect(page.getByTestId('guide-current')).toContainText('倒伏（2）');
  await page.keyboard.press('ArrowLeft'); // 2 → 1
  await expect(page.getByTestId('guide-current')).toContainText('弯曲（1）');
  await page.keyboard.press('2'); // 数字键直选倒伏
  await expect(page.getByTestId('guide-current')).toContainText('倒伏（2）');

  // 焦点随选择移动，继续按键作用于新位置
  await expect(page.getByTestId('guide-2')).toBeFocused();

  // 目标锥、护锥同样可用键盘选定后完成裁决
  await page.getByTestId('target-0').focus();
  await page.keyboard.press('1');
  await page.getByTestId('guard-0').focus();
  await page.keyboard.press('0');
  await page.getByTestId('judge').click();
  await expect(page.getByTestId('verdict')).toHaveText('命中目标');
});

test('清空重选：三槽回到未选择且不残留结果', async ({ page }) => {
  await pick(page, 'guide', 2);
  await pick(page, 'target', 2);
  await pick(page, 'guard', 2);
  await page.getByTestId('judge').click();
  await expect(page.getByTestId('verdict')).toHaveText('过烧');

  await page.getByTestId('reset').click();
  await expect(page.getByTestId('result')).toHaveCount(0);
  await expect(page.getByTestId('guide-current')).toContainText('未选择');
  await expect(page.getByTestId('target-current')).toContainText('未选择');
  await expect(page.getByTestId('guard-current')).toContainText('未选择');
});
