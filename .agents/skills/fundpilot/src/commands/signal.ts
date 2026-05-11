// 信号计算命令

import type { CLIResult, Signal } from '../types';
import { calculateTodaySignal, calculateAllSignals } from '../services/strategy';

export async function handleSignalToday(args: {
  code: string;
  strategy?: string;
}): Promise<CLIResult<Signal>> {
  try {
    if (!args.code) {
      return { success: false, error: 'MISSING_CODE', message: '缺少基金代码 --code' };
    }
    
    const signal = await calculateTodaySignal(args.code, args.strategy || 'default');
    
    if (!signal) {
      return { success: false, error: 'CALCULATION_FAILED', message: '信号计算失败，请检查基金是否存在且有定投计划' };
    }
    
    return { success: true, data: signal, message: '信号计算完成' };
  } catch (err) {
    return { success: false, error: 'ERROR', message: (err as Error).message };
  }
}

export async function handleSignalTodayAll(args: {
  strategy?: string;
}): Promise<CLIResult<Signal[]>> {
  try {
    const signals = await calculateAllSignals(args.strategy || 'default');
    return { success: true, data: signals, message: `共计算 ${signals.length} 条信号` };
  } catch (err) {
    return { success: false, error: 'ERROR', message: (err as Error).message };
  }
}