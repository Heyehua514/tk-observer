# TK观察工作台前端视觉重置设计

## 目标

在不改变业务逻辑、数据 Hook、路由、权限和组件结构的前提下，将现有通用后台样式重置为高端商业控制台。结果通过共享 Token 和共享组件覆盖五个工作台，首轮只针对总览与商务增加页面级强调。

## 设计方向

主题为“信号轨道”。TK观察的核心是观察、判断和推进，因此界面使用克制的运营网格、低速扫描线和明确的状态色表达持续运行，而不是营销页式大渐变或装饰插画。

### 色彩

- 墨黑蓝 `#172033`：主要文字与深色基础面。
- 瓷白 `#F7F9FC`：工作区背景。
- 电光蓝 `#2563EB`：主操作、选中状态和核心数据。
- 海盐绿 `#0F9F83`：完成、成交和健康趋势。
- 琥珀金 `#C78318`：待处理、风险和提醒。
- 珊瑚红 `#D14D41`：失败、逾期和破坏性操作。

颜色通过 `theme.css` 的语义 Token 提供，组件不新增硬编码主题色。

### 字体

- 标题和正文：系统中文字体栈，优先 `PingFang SC`，保证 Tauri 离线可用。
- 英文和数据：Inter，开启 tabular figures。
- 页面标题保持 24px，不使用营销型超大字号。
- 表头与辅助标签使用 12px，不强制全大写中文。

### 形态

- 卡片半径 8px，边框清楚，阴影只在 hover 或重点层级出现。
- 主操作按钮使用蓝色，次操作保持中性。
- 表格保持高密度，行 hover 不超过 `scale(1.002)`，减少扫描抖动。
- Tab 使用下划线和轻背景表达当前上下文，不做药丸堆叠。
- 侧边栏采用深色运营轨道，与浅色内容区形成稳定分区。

### 动效

- 页面进入 200ms，离场 120ms。
- 指标卡按 40ms 间隔入场。
- 应用壳扫描线 12 秒循环，只移动 opacity/transform。
- 使用 `prefers-reduced-motion` 时关闭扫描线、stagger 和缩放。
- 图表继续使用现有 800ms Recharts 动画。

## 结构

```text
深色侧边运营轨道 | 顶部上下文栏
                 | 信号状态条
                 | 页面标题 + 主操作
                 | 核心指标
                 | 工作区内容
```

## 组件边界

- `styles/theme.css`：三层语义 Token、亮暗主题、状态色和阴影。
- `styles/index.css`：工作区纹理、扫描线、页面容器和 reduced-motion。
- `components/layout/app-shell.tsx`：只增加背景与状态轨道，不改变 Outlet 和 Provider。
- `components/layout/app-sidebar.tsx`：只调整视觉与品牌标识，不改变角色过滤。
- `components/ui/*`：只调整 className，不改变 Radix 结构和 props。
- `components/shared/page-header.tsx`：增加稳定的数据属性和标题视觉。
- `features/overview` 与 `features/business/dashboard`：只增加语义 className 和现有 Framer Motion 入场，不修改查询。

## 数据与错误边界

- PocketBase、TanStack Query、表单、Toast、路由和权限判断完全不变。
- 动画不控制业务状态，加载失败继续使用现有 EmptyState。
- WebView 不支持复杂效果时仍显示纯色背景和正常内容。

## 验收

- 五角色页面继承统一色彩、卡片、表格、Tab、按钮与侧边栏。
- 总览和商务首屏有清晰的经营层级，不出现营销页式大 Hero。
- 浅色、深色、1024px 与移动布局不溢出。
- 键盘焦点、ARIA、拖拽和 reduced-motion 不退化。
- 现有业务测试与 eval 全过，并新增共享视觉契约测试和视觉质量 eval。

