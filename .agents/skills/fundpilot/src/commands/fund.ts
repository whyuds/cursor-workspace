// 基金管理命令

import type { CLIResult, Fund } from '../types';
import { addFund, listFunds, removeFund } from '../db';

export async function handleFundAdd(args: {
  code: string;
  name: string;
  type?: string;
  json?: boolean;
}): Promise<CLIResult<Fund>> {
  try {
    if (!args.code) {
      return { success: false, error: 'MISSING_CODE', message: '缺少基金代码 --code' };
    }
    if (!args.name) {
      return { success: false, error: 'MISSING_NAME', message: '缺少基金名称 --name' };
    }
    
    const validTypes = ['stock', 'bond', 'mixed', 'money', 'index', 'qdii', 'other'];
    const type = args.type || 'other';
    
    if (!validTypes.includes(type)) {
      return { 
        success: false, 
        error: 'INVALID_TYPE', 
        message: `无效的基金类型 ${type}，有效值: ${validTypes.join(', ')}` 
      };
    }
    
    const fund = await addFund({ code: args.code, name: args.name, type: type as Fund['type'] });
    return { success: true, data: fund, message: '基金添加成功' };
  } catch (err) {
    return { success: false, error: 'ERROR', message: (err as Error).message };
  }
}

export async function handleFundList(): Promise<CLIResult<Fund[]>> {
  try {
    const funds = await listFunds();
    return { success: true, data: funds, message: `共 ${funds.length} 只基金` };
  } catch (err) {
    return { success: false, error: 'ERROR', message: (err as Error).message };
  }
}

export async function handleFundRemove(args: { code: string }): Promise<CLIResult<null>> {
  try {
    if (!args.code) {
      return { success: false, error: 'MISSING_CODE', message: '缺少基金代码 --code' };
    }
    
    const removed = await removeFund(args.code);
    if (!removed) {
      return { success: false, error: 'NOT_FOUND', message: `基金 ${args.code} 不存在` };
    }
    return { success: true, message: `基金 ${args.code} 已删除` };
  } catch (err) {
    return { success: false, error: 'ERROR', message: (err as Error).message };
  }
}