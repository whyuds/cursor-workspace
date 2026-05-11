// 定投计划命令

import type { CLIResult, Plan } from '../types';
import { setPlan, listPlans, getFund } from '../db';

export async function handlePlanSet(args: {
  code: string;
  amount: number;
  frequency?: string;
  enabled?: boolean;
}): Promise<CLIResult<Plan>> {
  try {
    if (!args.code) {
      return { success: false, error: 'MISSING_CODE', message: '缺少基金代码 --code' };
    }
    if (args.amount === undefined || isNaN(args.amount)) {
      return { success: false, error: 'MISSING_AMOUNT', message: '缺少定投金额 --amount' };
    }
    
    const validFrequencies = ['daily', 'weekly', 'biweekly', 'monthly'];
    const frequency = args.frequency || 'weekly';
    
    if (!validFrequencies.includes(frequency)) {
      return { 
        success: false, 
        error: 'INVALID_FREQUENCY', 
        message: `无效的定投频率 ${frequency}，有效值: ${validFrequencies.join(', ')}` 
      };
    }
    
    // 检查基金是否存在
    const fund = await getFund(args.code);
    if (!fund) {
      return { success: false, error: 'FUND_NOT_FOUND', message: `基金 ${args.code} 不存在，请先添加` };
    }
    
    const plan = await setPlan({
      code: args.code,
      amount: args.amount,
      frequency: frequency as Plan['frequency'],
      enabled: args.enabled !== false,
    });
    
    return { success: true, data: plan, message: '定投计划设置成功' };
  } catch (err) {
    return { success: false, error: 'ERROR', message: (err as Error).message };
  }
}

export async function handlePlanList(): Promise<CLIResult<Plan[]>> {
  try {
    const plans = await listPlans();
    return { success: true, data: plans, message: `共 ${plans.length} 条定投计划` };
  } catch (err) {
    return { success: false, error: 'ERROR', message: (err as Error).message };
  }
}