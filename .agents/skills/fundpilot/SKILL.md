---
name: fundpilot
description: "基金浮动定投助手 - 管理基金自选、持仓、定投计划、浮动策略、今日信号计算、操作记录、周/月复盘报告。"
metadata:
  {
    "openclaw":
      {
        "emoji": "📊",
        "requires": { "bins": ["node"] },
        "cli": ".agents/skills/fundpilot/dist/index.js",
      },
  }
---

# FundPilot - 基金浮动定投助手

## 概述

FundPilot 是一个基金浮动定投助手 CLI 工具，帮助 AI Agent 管理基金自选、持仓、定投计划，并根据策略计算投资信号。

⚠️ **重要声明**: 本工具仅为计算辅助工具，不提供任何投资建议。所有投资决策由用户自行负责。

## Agent 使用指南

### 何时调用

当用户需要：
- 管理基金自选列表
- 记录持仓信息
- 设置定投计划
- 配置浮动定投策略
- 查看今日投资信号
- 记录买卖操作
- 查看周/月度报告

### 必须遵守

1. **所有命令必须加 `--json` 参数** - 本 CLI 只输出 JSON 格式
2. **不要输出保证性表述** - 禁止使用"必买"、"稳赚"、"强烈推荐"等词汇
3. **客观呈现数据** - 只展示计算结果，不替用户做决策

### 调用方式

```bash
node .agents/skills/fundpilot/dist/index.js <command> --json
```

或直接：

```bash
cd .agents/skills/fundpilot && node dist/index.js fund list --json
```

### JSON 输出格式

成功响应：
```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}
```

错误响应：
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "错误详情"
}
```

### 解读结果

Agent 应：
1. 检查 `success` 字段判断成功/失败
2. 从 `data` 字段获取返回数据
3. 使用 `message` 向用户展示简洁说明
4. 错误时从 `error` 获取错误码，从 `message` 获取详细信息

## 命令列表

### 基金管理

```bash
# 添加基金
fundpilot fund add --code=000001 --name="华夏成长混合" --type=stock --json

# 列出所有基金
fundpilot fund list --json

# 删除基金
fundpilot fund remove --code=000001 --json
```

**基金类型**: `stock` (股票型), `bond` (债券型), `mixed` (混合型), `money` (货币型), `index` (指数型), `qdii` (QDII), `other` (其他)

### 持仓管理

```bash
# 更新持仓
fundpilot position upsert --code=000001 --shares=1000 --cost=1.5 --json

# 列出所有持仓
fundpilot position list --json
```

### 定投计划

```bash
# 设置定投计划
fundpilot plan set --code=000001 --amount=500 --frequency=weekly --json

# 列出所有计划
fundpilot plan list --json
```

**定投频率**: `daily` (每日), `weekly` (每周), `biweekly` (双周), `monthly` (每月)

### 策略管理

```bash
# 设置策略
fundpilot strategy set --name=default --rules='{"smallDrop":0.02,"bigDrop":0.05,"smallBuyRatio":1,"bigBuyRatio":2,"pauseThreshold":0.03}' --json

# 列出所有策略
fundpilot strategy list --json
```

**策略参数说明**:
- `smallDrop`: 小跌阈值 (小数，如 0.02 = 2%)
- `bigDrop`: 大跌阈值 (小数，如 0.05 = 5%)
- `smallBuyRatio`: 小跌买入倍数 (如 1 = 正常金额)
- `bigBuyRatio`: 大跌买入倍数 (如 2 = 双倍金额)
- `pauseThreshold`: 暂停买入阈值 (小数，如 0.03 = 上涨 3% 暂停)

可选参数：
- `monthlyBudgetCap`: 月度预算上限
- `maxPositionRatio`: 单只基金最大仓位比例
- `cashCushionRatio`: 现金安全垫比例

### 信号计算

```bash
# 计算单只基金今日信号
fundpilot signal today --code=000001 --json

# 计算所有基金今日信号
fundpilot signal today-all --json
```

**信号解读**:
- `action: "buy"` - 建议买入，`amount` 为建议金额
- `action: "hold"` - 观望，按原计划执行
- `action: "pause"` - 建议暂停买入

⚠️ **注意**: 当前使用 Mock 行情数据，信号仅供参考

### 操作记录

```bash
# 添加操作记录
fundpilot operation add --code=000001 --type=buy --amount=500 --price=1.5 --date=2024-01-15 --json

# 列出操作记录
fundpilot operation list --json
fundpilot operation list --code=000001 --json
fundpilot operation list --start-date=2024-01-01 --end-date=2024-01-31 --json
```

**操作类型**: `buy` (买入), `sell` (卖出), `dividend` (分红)

### 报告

```bash
# 周报告
fundpilot report weekly --json

# 月报告
fundpilot report monthly --json
```

### HTML 报告生成（推荐）

当用户需要发送分析报告时，**优先使用 HTML 格式**（排版美观、无乱码问题）。

#### 模板系统

FundPilot 提供了专业的 HTML 报告模板。

**模板位置**: `.agents/skills/fundpilot/templates/`（相对于 cursor-workspace 仓库根目录）

**可用模板**:

1. **`report-mobile-compact.html`** - 简洁紧凑版（推荐，适合手机）
   - 大字体（基础18px，标题28px）
   - 简洁紧凑，类似Markdown渲染风格
   - 手机友好，自适应布局
   - 包含资讯来源链接区域
   - **适用场景**：用户主要用手机查看报告

2. **`report-desktop.html`** - 桌面端优化版（适合电脑）
   - 固定宽度1200px
   - 渐变紫色主题，丰富动画效果
   - **适用场景**：用户明确要求桌面端查看

**推荐使用** `report-mobile-compact.html`，因为大部分用户用手机查看报告。

#### 使用方式

**1. 读取模板**
```javascript
// Agent 应通过 read 工具读取模板文件
const template = read('.agents/skills/fundpilot/templates/report-desktop.html');
```

**2. 模板变量**

模板使用 `{{变量名}}` 格式的占位符，Agent 需替换这些变量：

| 变量名 | 说明 |
|--------|------|
| `{{TITLE}}` | 页面标题（浏览器标签） |
| `{{REPORT_TITLE}}` | 报告标题（页面顶部） |
| `{{REPORT_META}}` | 报告元信息 |
| `{{STAT_OVERVIEW}}` | 统计概览区域 |
| `{{CONTENT}}` | 正文内容 |
| `{{DECLARATION}}` | 分析师声明 |
| `{{FOOTER_LINE1}}` | 页脚第一行 |
| `{{FOOTER_LINE2}}` | 页脚第二行 |
| `{{FOOTER_DISCLAIMER}}` | 页脚免责声明 |

**3. 替换并保存**
```javascript
// 生成最终 HTML
const html = template
  .replace('{{TITLE}}', '基金投资分析报告 - 2026-05-10')
  .replace('{{REPORT_TITLE}}', '基金投资综合分析报告')
  .replace('{{REPORT_META}}', '分析时间：2026年5月10日 | 分析师：mq')
  .replace('{{STAT_OVERVIEW}}', '...统计卡片HTML...')
  .replace('{{CONTENT}}', '...正文HTML...')
  .replace('{{DECLARATION}}', '本报告仅为投资分析辅助工具...')
  .replace('{{FOOTER_LINE1}}', '报告生成时间：...')
  .replace('{{FOOTER_LINE2}}', '分析师：...')
  .replace('{{FOOTER_DISCLAIMER}}', '本报告仅供参考...');

// 保存到媒体目录
write('~/.openclaw/media/qqbot/downloads/报告名称.html', html);
```

**4. 发送给用户**
```
<qqmedia>/root/.openclaw/media/qqbot/downloads/报告名称.html</qqmedia>
```

#### 样式组件

模板提供了丰富的样式组件，可直接在 `{{CONTENT}}` 中使用：

**提示框**:
```html
<div class="highlight">💡 提示内容...</div>
<div class="warning">⚠️ 警告内容...</div>
<div class="success">✅ 成功内容...</div>
<div class="info">ℹ️ 信息内容...</div>
```

**标签**:
```html
<span class="badge badge-qdii">QDII</span>
<span class="badge badge-index">指数</span>
<span class="badge badge-mixed">混合</span>
```

**统计卡片**:
```html
<div class="stat-box">
  <div class="stat-value">22</div>
  <div class="stat-label">持仓基金数</div>
</div>
```

**汇总卡片**（紫色渐变背景）:
```html
<div class="summary-card">
  <h3>🎯 核心持仓建议</h3>
  <ul>
    <li>纳斯达克100系列：继续持有</li>
  </ul>
</div>
```

#### 详细说明

完整的模板说明请查看：`.agents/skills/fundpilot/templates/README.md`

#### 优势

- UTF-8 编码，无乱码问题
- 专业的桌面端排版，大字体舒适阅读
- 支持表格、颜色、渐变、动画效果
- 用户可在浏览器中打开查看完整效果
- 模板化管理，便于统一修改样式
- 文件小、加载快

---

### TXT 文本报告（备选）

如果用户设备不支持 HTML，可使用 TXT 格式（纯文本、无排版）。

**保存路径**: `~/.openclaw/media/qqbot/downloads/报告名称.txt`

**注意**: TXT 文件需使用 UTF-8 编码保存。

## 策略逻辑

### 核心规则

1. **小跌小买**: 跌幅 ≥ smallDrop 且 < bigDrop，按正常金额买入
2. **大跌大买**: 跌幅 ≥ bigDrop，按 bigBuyRatio 倍买入
3. **上涨暂停**: 涨幅 ≥ pauseThreshold，暂停买入
4. **其他情况**: 观望，按计划执行

### 示例

策略配置：
```json
{
  "smallDrop": 0.02,
  "bigDrop": 0.05,
  "smallBuyRatio": 1,
  "bigBuyRatio": 2,
  "pauseThreshold": 0.03
}
```

场景：
- 基金跌 3% → 小跌，正常买入 (baseAmount × 1)
- 基金跌 6% → 大跌，双倍买入 (baseAmount × 2)
- 基金涨 4% → 超过暂停阈值，建议暂停
- 基金涨 2% → 未超暂停阈值，按计划执行

## 数据存储

所有数据存储在本 skill 目录下的 `.fundpilot/fundpilot.db`（与 `package.json` 同级，SQLite 数据库）

## 注意事项

1. **行情数据**: 当前使用 Mock 数据，实际使用需接入真实 API
2. **无真实交易**: 本工具不执行任何真实交易，只做记录和计算
3. **风险提示**: 基金投资有风险，历史数据不代表未来收益
4. **策略验证**: 在使用策略前，建议回测验证效果
5. **禁止表述**: 不得使用"必买"、"稳赚"、"强烈推荐"等保证性词汇

## 错误码

| 错误码 | 说明 |
|--------|------|
| MISSING_CODE | 缺少基金代码 |
| MISSING_NAME | 缺少基金名称 |
| MISSING_AMOUNT | 缺少金额 |
| MISSING_SHARES | 缺少份额 |
| MISSING_COST | 缺少成本 |
| MISSING_PRICE | 缺少价格 |
| MISSING_TYPE | 缺少操作类型 |
| MISSING_RULES | 缺少策略规则 |
| INVALID_TYPE | 无效的类型值 |
| INVALID_FREQUENCY | 无效的频率值 |
| INVALID_RULES | 规则 JSON 解析失败 |
| FUND_NOT_FOUND | 基金不存在 |
| NOT_FOUND | 记录不存在 |
| CALCULATION_FAILED | 计算失败 |
| ERROR | 其他错误 |