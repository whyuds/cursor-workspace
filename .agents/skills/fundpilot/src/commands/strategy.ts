// 策略管理命令

import type { CLIResult, Strategy, StrategyRule } from '../types';
import { setStrategy, listStrategies } from '../db';

export async function handleStrategySet(args: {
  name: string;
  rules: string;
}): Promise<CLIResult<Strategy>> {
  try {
    if (!args.name) {
      return { success: false, error: 'MISSING_NAME', message: '缺少策略名称 --name' };
    }
    if (!args.rules) {
      return { success: false, error: 'MISSING_RULES', message: '缺少策略规则 --rules' };
    }
    
    let rules: StrategyRule;
    try {
      rules = JSON.parse(args.rules);
    } catch {
      return { success: false, error: 'INVALID_RULES', message: '规则 JSON 解析失败，请检查格式' };
    }
    
    // 验证必要字段
    if (typeof rules.smallDrop !== 'number' || rules.smallDrop < 0 || rules.smallDrop > 1) {
      return { success: false, error: 'INVALID_SMALL_DROP', message: 'smallDrop 必须是 0-1 之间的小数' };
    }
    if (typeof rules.bigDrop !== 'number' || rules.bigDrop < 0 || rules.bigDrop > 1) {
      return { success: false, error: 'INVALID_BIG_DROP', message: 'bigDrop 必须是 0-1 之间的小数' };
    }
    if (typeof rules.smallBuyRatio !== 'number' || rules.smallBuyRatio < 0) {
      return { success: false, error: 'INVALID_SMALL_BUY_RATIO', message: 'smallBuyRatio 必须是大于等于 0 的数字' };
    }
    if (typeof rules.bigBuyRatio !== 'number' || rules.bigBuyRatio < 0) {
      return { success: false, error: 'INVALID_BIG_BUY_RATIO', message: 'bigBuyRatio 必须是大于等于 0 的数字' };
    }
    if (typeof rules.pauseThreshold !== 'number' || rules.pauseThreshold < 0 || rules.pauseThreshold > 1) {
      return { success: false, error: 'INVALID_PAUSE_THRESHOLD', message: 'pauseThreshold 必须是 0-1 之间的小数' };
    }
    
    const strategy = await setStrategy(args.name, rules);
    return { success: true, data: strategy, message: '策略设置成功' };
  } catch (err) {
    return { success: false, error: 'ERROR', message: (err as Error).message };
  }
}

export async function handleStrategyList(): Promise<CLIResult<Strategy[]>> {
  try {
    const strategies = await listStrategies();
    return { success: true, data: strategies, message: `共 ${strategies.length} 条策略` };
  } catch (err) {
    return { success: false, error: 'ERROR', message: (err as Error).message };
  }
}