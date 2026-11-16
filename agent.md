# AGENTS.md

> 本文件是 AI 编码助手开发「平键连接挤压/剪切强度校核与 2D 可视化系统」的唯一项目规范。开发前必须通读；任何实现与本文冲突时，以本文为准。若需变更核心公式、判定规则或目录结构，必须先修改本文件并说明理由。

---

## 1. 项目定位

**系统名称**：普通平键连接挤压/剪切强度校核与 2D 工程示意可视化系统

**一句话描述**：面向《机械设计基础》课程的纯前端参数化解析校核工具，输入轴径、键尺寸、转矩和材料许用应力，实时计算挤压/剪切应力与利用率，并用 Konva 双视图展示平键装配结构与强度状态。

**必须明确的边界**：

- 本系统是**解析解校核工具**，不是有限元仿真软件。
- 不得在 UI 中宣称“应力云图”“精确仿真”“有限元结果”。
- 纵剖面允许示意比例，必须标注“纵向示意比例”。
- 首版只做普通平键静连接；半圆键、楔键、双键为扩展，不得混入核心计算模块。

---

## 2. 技术栈与约束

| 项 | 规定 |
|---|---|
| 框架 | Vue3 + Vite，使用 `<script setup lang="ts">` |
| 语言 | TypeScript，禁止 `any` 滥用；领域层必须强类型 |
| 画布 | Konva.js，分层绘制 |
| 状态 | Vue `reactive` / `computed` / composable，不引入 Pinia 除非确有跨页需求 |
| 测试 | Vitest，领域层必须有单元测试 |
| 样式 | 原生 CSS / SCSS，工程风；不强制 UI 组件库 |
| 部署 | 纯静态，无后端、无运行时网络请求 |

**禁止**：

- 引入后端服务、数据库、云函数；
- 在计算层依赖 Vue 响应式或 DOM；
- 用 `eval`、动态公式字符串求值；
- 在画布中直接写业务计算逻辑。

---

## 3. 目录结构（必须遵守）

```text
src/
  domain/
    calculation.ts      # 挤压、剪切、利用率、安全系数、状态判定（纯函数）
    validation.ts       # 输入校验、几何约束
    normalize.ts        # 单位换算（N·m ↔ N·mm 等）
    standardKeys.ts     # GB/T 1096 教学简化推荐表
    keyTypes.ts         # A/B/C 型工作长度与轮廓策略
    types.ts            # 领域类型定义
  composables/
    useKeySimulation.ts # 聚合 rawInputs → validated → results → status
  components/
    ParamPanel.vue
    SimulationCanvas.vue
    ResultPanel.vue
    FormulaPanel.vue
    MaterialPanel.vue
    StatusBadge.vue
  visualization/
    layers/background.ts
    layers/hub.ts
    layers/shaft.ts
    layers/key.ts
    layers/contact.ts
    layers/force.ts
    layers/dimensions.ts
    layers/interaction.ts
    drawCrossSection.ts
    drawLongitudinalSection.ts
  tests/
    calculation.spec.ts
    validation.spec.ts
    keyTypes.spec.ts
```

新增文件必须归入上述层级；不得在组件内实现领域公式。

---

## 4. 领域模型与计算规则（最高优先级）

### 4.1 输入类型

```ts
type KeyType = 'A' | 'B' | 'C';

interface RawInputs {
  d: string; b: string; h: string; L: string;
  type: KeyType;
  D: string; Bh: string; t1: string; t2: string;
  T: string;            // 界面单位 N·m
  sigmaPAxle: string;   // MPa
  sigmaPHub: string;    // MPa
  sigmaPKey?: string;
  enableShear: boolean;
  tauAllow?: string;
}

interface NormalizedInputs {
  d: number; b: number; h: number; L: number;
  type: KeyType;
  D: number; Bh: number; t1: number; t2: number;
  T: number;            // 内部单位 N·mm
  sigmaPAxle: number; sigmaPHub: number; sigmaPKey?: number;
  enableShear: boolean; tauAllow?: number;
}
```

**单位规则**：界面转矩用 N·m，进入领域层前必须乘 1000 转为 N·mm；长度 mm；应力 MPa。换算只在 `normalize.ts` 中做。

### 4.2 工作长度

```text
A 型：l = L - b
B 型：l = L
C 型：l = L - b / 2
```

约束 `l > 0`，否则校验失败。

### 4.3 挤压校核

```text
hk = h / 2
sigmaP = 2T / (d * hk * l)          // T 为 N·mm，结果 MPa
sigmaPAllow = min(sigmaPAxle, sigmaPHub, sigmaPKey?)
etaP = sigmaP / sigmaPAllow
Sp = etaP > 0 ? 1 / etaP : null     // 无载荷时返回 null
```

### 4.4 剪切校核（可选）

```text
tau = 2T / (d * b * l)
etaTau = tau / tauAllow
STau = etaTau > 0 ? 1 / etaTau : null
```

### 4.5 综合状态

```text
etaMax = enableShear ? max(etaP, etaTau) : etaP
```

| 条件 | status | 颜色 | 文案 |
|---|---|---|---|
| 输入非法 | `invalid` | 灰红 | 参数无效，请检查输入 |
| T=0 或应力=0 | `noLoad` | 蓝灰 | 无载荷，暂不判定失效 |
| etaMax ≤ 0.8 | `safe` | 工程蓝 | 强度满足，裕度充足 |
| 0.8 < etaMax ≤ 1.0 | `warning` | 黄色 | 强度满足，裕度偏低 |
| etaMax > 1.0 | `fail` | 红色 | 强度不足，存在失效风险 |

**强制要求**：

- 颜色只能作为辅助，必须同时输出数值、图标、中文结论。
- 任何情况下不得显示 `NaN`、`Infinity`、`undefined`。
- 除零、空值、负值必须在 `validation.ts` 拦截。

### 4.6 几何约束校验

必须校验：

- `d > 0`、`b > 0`、`h > 0`、`L > 0`；
- A 型 `L > b`；C 型 `L > b/2`；
- `D > d`；
- `Bh >= L`；
- `t1 > 0`、`t2 > 0` 且与 `h` 协调；
- 许用应力 > 0；
- 开启剪切校核时 `tauAllow > 0`。

校验失败项返回字段级错误，供 UI 定位输入框。

---

## 5. 状态与数据流

`useKeySimulation` 必须按以下顺序聚合：

```text
rawInputs
  → validation（字段级 errors）
  → normalize（仅在校验通过或部分通过时）
  → calculation（纯函数）
  → results / status
  → 画布 status + 结果面板
```

规则：

- `rawInputs` 保存字符串，允许中间输入态；
- 非法输入时保留 `lastValidResults`，画布可显示上次有效结果并加“参数无效”遮罩；
- 计算用 `computed` 派生，禁止在 `watch` 中重复写公式；
- 画布刷新用 `watch` + `requestAnimationFrame` 或 50–100ms 防抖；
- 不得整 Stage 销毁重建，按图层更新。

---

## 6. 可视化规范

### 6.1 双视图

- **横截面**：轴圆、轮毂外圆、键、轴槽、轮毂槽；等比例；标注 `d`、`D`、`b`、`h`、`t1`、`t2`。
- **纵剖面**：显示 `L`、`l`、`Bh`；水平可按长度比例，垂直可放大，必须标注“纵向示意比例”。

### 6.2 图层顺序

```text
background → hub → shaft → key → contact → force → dimensions → interaction
```

### 6.3 状态表达

- 键体填充按 `status` 取色；
- 挤压接触面橙色描边高亮；
- 剪切面用虚线示意（开启剪切时）；
- 画布角落显示 `StatusBadge`；
- 提供图例；
- 支持缩放、平移、重置，适配 `devicePixelRatio`。

### 6.4 标注

- 尺寸线不重叠，必要时做避让；
- 字体、线宽、箭头符合机械制图简图风格；
- 禁止在画布中显示未定义的“云图”。

---

## 7. 结果面板与教学增强

必须输出：

1. 工作长度 `l`；
2. 接触高度 `hk`；
3. 挤压应力 `sigmaP`；
4. `sigmaPAllow` 及取值来源（轴/毂/键取最小）；
5. 挤压利用率 `etaP`、安全系数 `Sp`；
6. 剪切结果（开启时）；
7. 综合状态与中文结论；
8. 公式代入过程（显示数值代入，保留两位小数）。

建议增强（按里程碑实现）：

- 转矩箭头、挤压力方向；
- 参数敏感性提示；
- 教材例题预设与标准答案对比；
- 截图导出、JSON 参数保存/恢复。

---

## 8. 编码规范

- 领域函数必须纯函数、可测试、无副作用；
- 公式只允许出现在 `domain/`，组件中只能引用结果；
- 所有数值展示统一格式化函数，保留两位小数；
- 类型定义集中在 `domain/types.ts`；
- 组件命名 PascalCase，文件与组件同名；
- 注释解释“为什么”，不重复代码字面；
- 提交前必须通过 `vitest run` 和 TypeScript 类型检查。

---

## 9. 测试要求

`calculation.spec.ts` 至少覆盖：

- 教材例题与标准答案误差 < 0.1%；
- A/B/C 三型工作长度；
- `T=0` 返回 `noLoad`，`Sp` 为 `null`；
- 材料取最小值；
- 剪切开启/关闭切换；
- 阈值边界：0.8、1.0 前后状态正确。

`validation.spec.ts` 至少覆盖：

- 负值、空值、`NaN`；
- `L<=b`（A 型）、`D<=d`、`Bh<L`；
- 开启剪切但未填 `tauAllow`。

---

## 10. 验收标准

1. 教材例题计算结果误差 < 0.1%；
2. 非法输入不产生 `NaN`/`Infinity`，有字段级提示；
3. 参数修改后画布 100ms 内刷新；
4. 颜色、图标、文字、数值四者一致；
5. 横截面与纵剖面均能正确表达 `d`、`b`、`h`、`L`、`l`；
6. 纯静态构建可部署运行；
7. 单元测试全部通过。

---

## 11. 里程碑与任务拆解

| 阶段 | 任务 | 完成标志 |
|---|---|---|
| M1 | `types`、`normalize`、`calculation`、`validation`、`keyTypes`、单测 | 计算模块测试通过 |
| M2 | `useKeySimulation`、`ParamPanel`、`ResultPanel`、`FormulaPanel` | 无画布也可完成校核 |
| M3 | Konva 双视图、图层、状态配色、标注、缩放平移 | 可视化闭环 |
| M4 | 教学增强、预设例题、导出、响应式 | 课程演示版 |
| M5 | A/B/C 扩展完善、双键修正、报告导出 | 扩展版 |

**每个里程碑必须单独可运行、可测试，不得跳过 M1 直接做画布。**

---

## 12. 禁止事项清单

- 禁止把挤压公式写进 Vue 组件或 Konva 图层；
- 禁止用颜色单独表达结论；
- 禁止显示 `NaN`、`Infinity`；
- 禁止宣称有限元/云图/精确仿真；
- 禁止在首版混入半圆键、楔键、双键计算；
- 禁止引入后端或运行时网络依赖；
- 禁止整 Stage 重建式刷新；
- 禁止未写测试就修改核心公式。

---

## 13. 变更流程

若需修改公式、判定阈值、单位规则或目录结构：

1. 先修改本文件对应章节；
2. 同步更新 `domain/types.ts` 与测试；
3. 在 PR/提交说明中写明变更原因与影响范围；
4. 确保验收标准仍全部满足。