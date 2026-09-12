# 试烧窑见证锥裁决板

试烧窑开门后，三支见证锥可能都发生变化，检验员不能只看目标锥。本应用把三支锥固定为三个槽位，逐槽记录形态后在**浏览器本地**完成裁决——不调用任何在线接口，无任何网络请求。

## 锥位含义

| 槽位 | 含义 | 作用 |
| ---- | ---- | ---- |
| 导锥（guide） | 低温侧的引导锥 | 最先感知火度，用于预判烧成进程 |
| 目标锥（target） | 对应目标烧成温度的锥 | 裁决的核心对象 |
| 护锥（guard） | 高温侧的保护锥 | 兜底报警，防止过烧 |

每槽状态三选一：**0 直立 / 1 弯曲 / 2 倒伏**（数值越大表示受热越足）。

## 裁决规则

1. **R0 顺序校验**：必须满足 导锥 ≥ 目标锥 ≥ 护锥（状态值）。摆放颠倒或护锥提前弯曲等破坏该顺序时，整组仅判 **见证组无效**。
2. **R1**：目标锥直立（0）→ **欠烧**。
3. **R2**：目标锥倒伏（2）→ **过烧**。
4. 目标锥弯曲（1）时依次检查：
   - **R3**：护锥非直立 → **过烧**；
   - **R4**：护锥直立且导锥非倒伏 → **欠烧**；
   - **R5**：仅 导锥倒伏（2）、目标锥弯曲（1）、护锥直立（0）→ **命中目标**。

交互约束：

- 槽位缺失或含非法值时不作裁决，仅提示；
- 已有结果后改动任一锥，立即清除旧等级，需重新裁决；
- 每次裁决同时展示三锥状态、命中的规则，以及唯一的 欠烧 / 命中目标 / 过烧 / 见证组无效 结果。

## 本地开发

```bash
npm install
npm run dev        # 开发服务器 http://localhost:5173
npm test           # Vitest：覆盖全部 27 种组合
npm run build      # 类型检查 + 产物构建
npm run e2e        # Playwright：改选、错误清除、键盘操作（自动拉起 dev server）
```

状态卡支持键盘操作：`Tab` 切换槽位，`←` `→`（或 `↑` `↓`、`Home` `End`）移动并选择，`0` `1` `2` 直选状态，`Enter` 触发按钮。

## Docker 运行

```bash
# 启动 web（默认宿主端口 8080，可用 WEB_PORT 覆盖）
docker compose up --build web
WEB_PORT=9000 docker compose up --build web
# 打开 http://localhost:9000

# 一次性验收：Vitest 27 组合 + Playwright 端到端，跑完即退出
docker compose run --rm --build verify
# 或：docker compose up --build --exit-code-from verify verify

docker compose down
```

`verify` 服务依赖 `web` 健康检查通过后，以 `BASE_URL=http://web` 对容器内站点执行端到端验收；退出码即验收结果。

## 技术栈

Vue 3 + TypeScript + Vite；Vitest（单元，27 组合全枚举）；Playwright（端到端）；nginx 托管静态产物。裁决逻辑见 `src/logic.ts`，为纯函数，全部在浏览器执行。
