#!/usr/bin/env node
/**
 * 从 FundPilot SQLite 生成持仓展示 HTML（workspace 根目录 holdings-display.html）
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/** scripts → fundpilot → skills → agents → workspace */
const ROOT = path.resolve(__dirname, '../../../../');
const CLI = path.join(__dirname, '../dist/index.js');
const OUT = path.join(ROOT, 'holdings-display.html');

function run(cmd) {
  return execSync(cmd, { encoding: 'utf8', cwd: ROOT });
}

const fundsJson = JSON.parse(run(`node "${CLI}" fund list --json`));
const posJson = JSON.parse(run(`node "${CLI}" position list --json`));

const nameByCode = Object.fromEntries(fundsJson.data.map((f) => [f.code, f.name]));

const rows = posJson.data.map((p) => ({
  code: p.code,
  name: nameByCode[p.code] || p.code,
  amount: p.shares,
}));

rows.sort((a, b) => b.amount - a.amount);

const total = rows.reduce((s, r) => s + r.amount, 0);
const fmt = (n) =>
  n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const genTime = new Date().toISOString().replace('T', ' ').substring(0, 19);

const tbody = rows
  .map(
    (r, i) =>
      `        <tr><td class="idx">${i + 1}</td><td class="name">${escapeHtml(r.name)}</td><td class="code">${escapeHtml(r.code)}</td><td class="amt">${fmt(r.amount)}</td></tr>`
  )
  .join('\n');

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>持仓一览 · FundPilot</title>
<style>
:root {
  --bg: #f4f5f7;
  --card: #ffffff;
  --text: #1a1d21;
  --muted: #6b7280;
  --accent: #5b21b6;
  --border: #e5e7eb;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  background: var(--bg);
  color: var(--text);
  font-size: 16px;
  line-height: 1.55;
  padding: 16px;
  padding-bottom: 48px;
}
.wrap {
  max-width: 720px;
  margin: 0 auto;
}
header {
  background: linear-gradient(135deg, #5b21b6 0%, #7c3aed 50%, #a78bfa 100%);
  color: #fff;
  padding: 22px 20px;
  border-radius: 14px;
  margin-bottom: 18px;
  box-shadow: 0 8px 24px rgba(91, 33, 182, 0.22);
}
header h1 {
  margin: 0 0 8px 0;
  font-size: 1.35rem;
  font-weight: 700;
}
header .meta {
  opacity: 0.92;
  font-size: 0.88rem;
}
.summary {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-bottom: 18px;
}
.stat {
  background: var(--card);
  border-radius: 12px;
  padding: 16px 18px;
  border: 1px solid var(--border);
  text-align: center;
}
.stat .num {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--accent);
  letter-spacing: -0.02em;
}
.stat .lbl {
  font-size: 0.85rem;
  color: var(--muted);
  margin-top: 4px;
}
.card {
  background: var(--card);
  border-radius: 12px;
  border: 1px solid var(--border);
  overflow: hidden;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.92rem;
}
thead th {
  background: #f9fafb;
  text-align: left;
  padding: 10px 12px;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid var(--border);
}
tbody td {
  padding: 11px 12px;
  border-bottom: 1px solid var(--border);
  vertical-align: top;
}
tbody tr:last-child td { border-bottom: none; }
tbody tr:nth-child(even) { background: #fafafa; }
.code { font-variant-numeric: tabular-nums; color: var(--muted); font-size: 0.82rem; }
.amt { font-variant-numeric: tabular-nums; font-weight: 600; text-align: right; white-space: nowrap; }
.name { font-weight: 500; }
.idx { color: var(--muted); width: 2.5rem; }
tfoot td {
  font-weight: 700;
  background: #f3f4f6;
  padding: 12px;
}
.note {
  margin-top: 16px;
  padding: 12px 14px;
  font-size: 0.82rem;
  color: var(--muted);
  background: #fefce8;
  border: 1px solid #fde047;
  border-radius: 10px;
}
footer {
  margin-top: 24px;
  font-size: 0.78rem;
  color: var(--muted);
  text-align: center;
}
@media (min-width: 480px) {
  .summary { grid-template-columns: 1fr 1fr; }
}
</style>
</head>
<body>
<div class="wrap">
  <header>
    <h1>持仓一览</h1>
    <div class="meta">数据来源：FundPilot 本地库 · 生成时间 ${escapeHtml(genTime)}</div>
  </header>

  <div class="summary">
    <div class="stat">
      <div class="num">¥ ${fmt(total)}</div>
      <div class="lbl">持仓金额合计（元）</div>
    </div>
    <div class="stat">
      <div class="num">${rows.length}</div>
      <div class="lbl">持有基金只数</div>
    </div>
  </div>

  <div class="card">
    <table>
      <thead>
        <tr>
          <th class="idx">#</th>
          <th>基金名称</th>
          <th>代码</th>
          <th style="text-align:right">持仓金额（元）</th>
        </tr>
      </thead>
      <tbody>
${tbody}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3">合计</td>
          <td class="amt">${fmt(total)}</td>
        </tr>
      </tfoot>
    </table>
  </div>

  <div class="note">
    <strong>说明：</strong>「持仓金额」来自本地持仓记录；若与代销 APP 不一致，请以平台为准。本页由脚本从数据库生成，仅为展示辅助，不构成投资建议。
  </div>

  <footer>
    FundPilot · 基金浮动定投助手 · 工具仅供参考
  </footer>
</div>
</body>
</html>
`;

fs.writeFileSync(OUT, html, 'utf8');
console.log('OK', OUT);
