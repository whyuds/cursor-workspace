# FundPilot 报告模板说明

本目录包含 FundPilot 报告生成所需的模板文件。

## 模板列表

### 1. report-mobile-compact.html（推荐）

简洁紧凑版模板，适合手机阅读。

**特点**：
- 大字体（基础18px，标题28px），手机阅读舒适
- 简洁紧凑，类似Markdown渲染风格
- 自适应布局，手机友好
- 包含资讯来源链接区域（方便用户确认信息来源）
- 使用border-left标记的提示框（更简洁）

**适用场景**：用户主要用手机查看报告（大部分场景）

**模板变量**：

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `{{TITLE}}` | 页面标题（浏览器标签显示） | "基金投资分析报告 - 2026年5月10日" |
| `{{REPORT_TITLE}}` | 报告标题（页面顶部显示） | "基金投资综合分析报告" |
| `{{REPORT_META}}` | 报告元信息 | "分析时间：2026年5月10日 | 分析师：mq" |
| `{{STAT_OVERVIEW}}` | 统计概览区域 | 统计卡片网格 |
| `{{CONTENT}}` | 正文内容 | 报告主体内容 |
| `{{SOURCES_SECTION}}` | 资讯来源链接区域 | 来源链接列表 |
| `{{DECLARATION}}` | 分析师声明 | 声明文本 |
| `{{FOOTER_LINE}}` | 页脚信息 | "报告生成时间：..." |
| `{{FOOTER_DISCLAIMER}}` | 页脚免责声明 | "本报告仅供参考..." |

### 2. report-desktop.html

桌面端优化版模板，适合电脑阅读。

**特点**：
- 固定宽度布局（1200px）
- 大字体（16-36px）、舒适间距（padding 60px 80px）
- 专业配色（渐变紫色主题）
- 表格悬停效果、平滑动画过渡
- 丰富的样式组件（提示框、标签、统计卡片等）

**适用场景**：用户明确要求桌面端查看

## 使用方式

Agent 在生成报告时，应：

1. **选择合适的模板**：
```javascript
// 推荐使用简洁紧凑版（适合手机）
const template = fs.readFileSync(
  '.agents/skills/fundpilot/templates/report-mobile-compact.html',
  'utf-8'
);

// 或使用桌面端优化版
const template = fs.readFileSync(
  '.agents/skills/fundpilot/templates/report-desktop.html',
  'utf-8'
);
```

2. **替换模板变量**：
```javascript
const html = template
  .replace('{{TITLE}}', '基金投资分析报告 - 2026-05-10')
  .replace('{{REPORT_TITLE}}', '基金投资综合分析报告')
  .replace('{{REPORT_META}}', '分析时间：2026年5月10日 | 分析师：mq')
  .replace('{{STAT_OVERVIEW}}', generateStatOverview(data))
  .replace('{{CONTENT}}', generateContent(data))
  .replace('{{SOURCES_SECTION}}', generateSourcesSection(sources)) // 重要：添加来源链接
  .replace('{{DECLARATION}}', declarationText)
  .replace('{{FOOTER_LINE}}', footerLine)
  .replace('{{FOOTER_DISCLAIMER}}', disclaimerText);
```

3. **保存到媒体目录**：
```javascript
fs.writeFileSync(
  '~/.openclaw/media/qqbot/downloads/报告名称.html',
  html,
  'utf-8'
);
```

4. **发送给用户**：
```
<qqmedia>/root/.openclaw/media/qqbot/downloads/报告名称.html</qqmedia>
```

## 简洁版样式组件

### 提示框（border-left风格）

```html
<div class="tip-success">✅ 成功内容...</div>
<div class="tip-warning">⚠️ 警告内容...</div>
<div class="tip-info">ℹ️ 信息内容...</div>
```

### 引用块（Markdown风格）

```html
<blockquote>
<strong>核心持仓建议：</strong><br>
• 纳斯达克100：继续持有<br>
• 半导体：回调加仓
</blockquote>
```

### 统计卡片网格

```html
<div class="stats-grid">
<div class="stat-item">
  <div class="stat-num">22</div>
  <div class="stat-text">持仓基金</div>
</div>
<div class="stat-item">
  <div class="stat-num">7</div>
  <div class="stat-text">QDII</div>
</div>
</div>
```

### 来源链接区域

```html
<div class="sources-section">
<h4>半导体板块资讯</h4>
<div class="source-item">
  • <a href="链接地址" class="source-link">资讯标题 - 来源网站</a>
</div>
</div>
```

## 重要规范

### 资讯来源链接

生成报告时，**必须包含资讯来源链接区域**，让用户可以确认信息来源：

1. 按主题分组（半导体、医药、有色金属、新能源汽车等）
2. 每条资讯包含：
   - 链接URL
   - 资讯标题
   - 来源网站名称
3. 格式示例：
```html
<div class="source-item">
  • <a href="https://finance.sina.com.cn/xxx" class="source-link">
    熔断！半导体暴涨，这些ETF封死涨停 - 新浪财经
  </a>
</div>
```

### 数据说明

报告中需明确说明：
- 若信号或持仓估值依赖行情接口，需说明数据来源；接口失败时不得编造净值
- 搜索获取的资讯需标注来源链接

### 禁止表述

不得使用保证性词汇：
- "必买"、"稳赚"、"强烈推荐"
- "确定"、"保证"、"一定"
- 其他暗示确定性收益的表述

## 注意事项

- 所有文件使用 UTF-8 编码
- 模板变量必须完全匹配（包括大括号）
- 替换时注意转义特殊字符（如 `<`, `>`, `&`）
- 推荐使用 `report-mobile-compact.html`（大部分用户用手机）
- **必须添加资讯来源链接区域**（用户确认信息来源）