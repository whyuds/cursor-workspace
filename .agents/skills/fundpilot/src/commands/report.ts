// 报告命令

import type { CLIResult, Report, Operation } from '../types';
import { listOperations, listFunds } from '../db';

export async function handleReportWeekly(args?: { endDate?: string }): Promise<CLIResult<Report>> {
  try {
    const endDateStr = args?.endDate || new Date().toISOString().split('T')[0];
    const endDate = new Date(endDateStr);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 6); // 最近 7 天
    
    const startDateStr = startDate.toISOString().split('T')[0];
    
    return generateReport('weekly', startDateStr, endDateStr);
  } catch (err) {
    return { success: false, error: 'ERROR', message: (err as Error).message };
  }
}

export async function handleReportMonthly(args?: { endDate?: string }): Promise<CLIResult<Report>> {
  try {
    const endDateStr = args?.endDate || new Date().toISOString().split('T')[0];
    const endDate = new Date(endDateStr);
    const startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1); // 本月第一天
    
    const startDateStr = startDate.toISOString().split('T')[0];
    
    return generateReport('monthly', startDateStr, endDateStr);
  } catch (err) {
    return { success: false, error: 'ERROR', message: (err as Error).message };
  }
}

async function generateReport(period: string, startDateStr: string, endDateStr: string): Promise<CLIResult<Report>> {
  const operations = await listOperations({ startDate: startDateStr, endDate: endDateStr });
  const funds = await listFunds();
  
  // 按基金分组统计
  const fundMap = new Map<string, {
    code: string;
    name: string;
    buy_count: number;
    sell_count: number;
    total_buy: number;
    total_sell: number;
  }>();
  
  funds.forEach(f => {
    fundMap.set(f.code, {
      code: f.code,
      name: f.name,
      buy_count: 0,
      sell_count: 0,
      total_buy: 0,
      total_sell: 0,
    });
  });
  
  let totalBuy = 0;
  let totalSell = 0;
  let totalDividend = 0;
  
  operations.forEach((op: Operation) => {
    let fund = fundMap.get(op.code);
    if (!fund) {
      fund = {
        code: op.code,
        name: '未知基金',
        buy_count: 0,
        sell_count: 0,
        total_buy: 0,
        total_sell: 0,
      };
      fundMap.set(op.code, fund);
    }
    
    if (op.type === 'buy') {
      fund.buy_count++;
      fund.total_buy += op.amount;
      totalBuy += op.amount;
    } else if (op.type === 'sell') {
      fund.sell_count++;
      fund.total_sell += op.amount;
      totalSell += op.amount;
    } else if (op.type === 'dividend') {
      totalDividend += op.amount;
    }
  });
  
  const report: Report = {
    period,
    start_date: startDateStr,
    end_date: endDateStr,
    total_buy: Math.round(totalBuy * 100) / 100,
    total_sell: Math.round(totalSell * 100) / 100,
    total_dividend: Math.round(totalDividend * 100) / 100,
    net_invested: Math.round((totalBuy - totalSell) * 100) / 100,
    funds: Array.from(fundMap.values()).filter(f => f.buy_count > 0 || f.sell_count > 0).map(f => ({
      code: f.code,
      name: f.name,
      buy_count: f.buy_count,
      sell_count: f.sell_count,
      total_buy: Math.round(f.total_buy * 100) / 100,
      total_sell: Math.round(f.total_sell * 100) / 100,
    })),
  };
  
  return { success: true, data: report, message: `${period === 'weekly' ? '周' : '月'}报告生成成功` };
}