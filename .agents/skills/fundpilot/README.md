# FundPilot

<div align="center">

**基金浮动定投助手 CLI**

为 AI Agent 设计的基金管理工具

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

## 功能特性

- 📊 **基金自选管理** - 添加、删除、查看基金列表
- 💼 **持仓记录** - 管理基金持仓和成本
- 📅 **定投计划** - 设置每日/每周/双周/每月定投
- 🎯 **浮动策略** - 小跌小买、大跌大买、上涨暂停
- 📈 **信号计算** - 根据策略计算今日操作建议
- 📝 **操作记录** - 记录买卖分红操作
- 📋 **报告生成** - 周/月度投资报告
- 🗂️ **日度分析归档** - 周期性 Agent 可按模板生成持仓分析并维护历史索引

## 安装

```bash
cd .agents/skills/fundpilot
npm install
npm run build
npm link  # 可选，全局链接
```

## 快速开始

### 添加基金

```bash
fundpilot fund add --code=000001 --name="华夏成长混合" --type=stock --json
```

### 设置定投计划

```bash
fundpilot plan set --code=000001 --amount=500 --frequency=weekly --json
```

### 查看今日信号

```bash
fundpilot signal today --code=000001 --json
```

### 记录买入操作

```bash
fundpilot operation add --code=000001 --type=buy --amount=500 --price=1.5 --json
```

## 命令文档

详细命令说明请参考 [SKILL.md](./SKILL.md)

## 周期性日度持仓分析

面向天级调度 Agent 的静态入口位于 [index.html](./index.html)。Agent 每次完成持仓分析后，应使用 [daily-position-analysis-template.html](./templates/daily-position-analysis-template.html) 生成报告，保存到 [analysis-history/](./analysis-history/)，并把最新报告链接追加到 `index.html` 的历史列表顶部。

固定分析结构包括：一句话结论、数据来源与缺口、持仓概览、单只基金诊断、行情与风格观察、相关资讯摘要、操作建议与资金纪律、风险提示和下次观察点。

## 输出格式

所有命令输出 JSON 格式：

**成功**:
```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}
```

**失败**:
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "错误详情"
}
```

## 策略逻辑

默认策略：
- 小跌 (2%-5%): 正常买入
- 大跌 (>5%): 双倍买入
- 大涨 (>3%): 暂停买入

可自定义策略参数，详见 SKILL.md。

## 数据存储

SQLite 数据库: `.fundpilot/fundpilot.db`（位于本 skill 目录下，**默认随仓库版本管理**；公开仓库请注意数据敏感性）

## 技术栈

- Node.js + TypeScript
- Commander.js (CLI)
- better-sqlite3 (数据存储)

## 免责声明

⚠️ **本工具仅供计算辅助，不提供任何投资建议。**

- 行情数据来自天天基金接口；拉取失败时相关功能会报错，无本地模拟行情
- 不执行任何真实交易
- 投资有风险，决策需谨慎

## License

MIT