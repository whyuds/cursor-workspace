#!/usr/bin/env node

import { Command } from 'commander';
import type { CLIResult } from './types';
import { initDatabase } from './db';
import { handleFundAdd, handleFundList, handleFundRemove } from './commands/fund';
import { handlePositionUpsert, handlePositionList } from './commands/position';
import { handlePlanSet, handlePlanList } from './commands/plan';
import { handleStrategySet, handleStrategyList } from './commands/strategy';
import { handleSignalToday, handleSignalTodayAll } from './commands/signal';
import { handleOperationAdd, handleOperationList } from './commands/operation';
import { handleReportWeekly, handleReportMonthly } from './commands/report';

const program = new Command();

program
  .name('fundpilot')
  .description('基金浮动定投助手 CLI')
  .version('1.0.0');

// 输出 JSON 结果的辅助函数
function output<T>(result: CLIResult<T>) {
  console.log(JSON.stringify(result, null, 2));
}

// 异步命令执行器
async function runAsync<T>(handler: () => Promise<CLIResult<T>>): Promise<void> {
  try {
    await initDatabase();
    const result = await handler();
    output(result);
  } catch (err) {
    output({
      success: false,
      error: 'CLI_ERROR',
      message: (err as Error).message,
    });
  }
}

// ============ fund 命令 ============
const fundCmd = program.command('fund').description('基金管理');

fundCmd
  .command('add')
  .description('添加基金')
  .requiredOption('--code <code>', '基金代码')
  .requiredOption('--name <name>', '基金名称')
  .option('--type <type>', '基金类型 (stock/bond/mixed/money/index/qdii/other)', 'other')
  .option('--json', '输出 JSON 格式', true)
  .action(async (options) => {
    await runAsync(() => handleFundAdd(options));
  });

fundCmd
  .command('list')
  .description('列出所有基金')
  .option('--json', '输出 JSON 格式', true)
  .action(async () => {
    await runAsync(() => handleFundList());
  });

fundCmd
  .command('remove')
  .description('删除基金')
  .requiredOption('--code <code>', '基金代码')
  .option('--json', '输出 JSON 格式', true)
  .action(async (options) => {
    await runAsync(() => handleFundRemove(options));
  });

// ============ position 命令 ============
const positionCmd = program.command('position').description('持仓管理');

positionCmd
  .command('upsert')
  .description('更新持仓')
  .requiredOption('--code <code>', '基金代码')
  .requiredOption('--shares <shares>', '份额', parseFloat)
  .requiredOption('--cost <cost>', '成本', parseFloat)
  .option('--json', '输出 JSON 格式', true)
  .action(async (options) => {
    await runAsync(() => handlePositionUpsert(options));
  });

positionCmd
  .command('list')
  .description('列出所有持仓')
  .option('--json', '输出 JSON 格式', true)
  .action(async () => {
    await runAsync(() => handlePositionList());
  });

// ============ plan 命令 ============
const planCmd = program.command('plan').description('定投计划管理');

planCmd
  .command('set')
  .description('设置定投计划')
  .requiredOption('--code <code>', '基金代码')
  .requiredOption('--amount <amount>', '定投金额', parseFloat)
  .option('--frequency <frequency>', '定投频率 (daily/weekly/biweekly/monthly)', 'weekly')
  .option('--enabled', '是否启用', true)
  .option('--json', '输出 JSON 格式', true)
  .action(async (options) => {
    await runAsync(() => handlePlanSet(options));
  });

planCmd
  .command('list')
  .description('列出所有定投计划')
  .option('--json', '输出 JSON 格式', true)
  .action(async () => {
    await runAsync(() => handlePlanList());
  });

// ============ strategy 命令 ============
const strategyCmd = program.command('strategy').description('策略管理');

strategyCmd
  .command('set')
  .description('设置策略')
  .requiredOption('--name <name>', '策略名称')
  .requiredOption('--rules <rules>', '策略规则 JSON')
  .option('--json', '输出 JSON 格式', true)
  .action(async (options) => {
    await runAsync(() => handleStrategySet(options));
  });

strategyCmd
  .command('list')
  .description('列出所有策略')
  .option('--json', '输出 JSON 格式', true)
  .action(async () => {
    await runAsync(() => handleStrategyList());
  });

// ============ signal 命令 ============
const signalCmd = program.command('signal').description('信号计算');

signalCmd
  .command('today')
  .description('计算单只基金今日信号')
  .requiredOption('--code <code>', '基金代码')
  .option('--strategy <strategy>', '策略名称', 'default')
  .option('--json', '输出 JSON 格式', true)
  .action(async (options) => {
    await runAsync(() => handleSignalToday(options));
  });

signalCmd
  .command('today-all')
  .description('计算所有基金今日信号')
  .option('--strategy <strategy>', '策略名称', 'default')
  .option('--json', '输出 JSON 格式', true)
  .action(async (options) => {
    await runAsync(() => handleSignalTodayAll(options));
  });

// ============ operation 命令 ============
const operationCmd = program.command('operation').description('操作记录');

operationCmd
  .command('add')
  .description('添加操作记录')
  .requiredOption('--code <code>', '基金代码')
  .requiredOption('--type <type>', '操作类型 (buy/sell/dividend)')
  .requiredOption('--amount <amount>', '金额', parseFloat)
  .requiredOption('--price <price>', '价格', parseFloat)
  .option('--date <date>', '日期 (YYYY-MM-DD)')
  .option('--json', '输出 JSON 格式', true)
  .action(async (options) => {
    await runAsync(() => handleOperationAdd(options));
  });

operationCmd
  .command('list')
  .description('列出操作记录')
  .option('--code <code>', '基金代码')
  .option('--start-date <startDate>', '开始日期')
  .option('--end-date <endDate>', '结束日期')
  .option('--json', '输出 JSON 格式', true)
  .action(async (options) => {
    await runAsync(() => handleOperationList(options));
  });

// ============ report 命令 ============
const reportCmd = program.command('report').description('报告生成');

reportCmd
  .command('weekly')
  .description('生成周报告')
  .option('--end-date <endDate>', '结束日期 (YYYY-MM-DD)')
  .option('--json', '输出 JSON 格式', true)
  .action(async (options) => {
    await runAsync(() => handleReportWeekly(options));
  });

reportCmd
  .command('monthly')
  .description('生成月报告')
  .option('--end-date <endDate>', '结束日期 (YYYY-MM-DD)')
  .option('--json', '输出 JSON 格式', true)
  .action(async (options) => {
    await runAsync(() => handleReportMonthly(options));
  });

// 错误处理
program.exitOverride();

try {
  program.parse();
} catch (err) {
  // commander 会自己处理帮助输出，这里只捕获真正的错误
  if (err instanceof Error && !err.message.includes('outputHelp')) {
    output({
      success: false,
      error: 'CLI_ERROR',
      message: err.message,
    });
  }
}