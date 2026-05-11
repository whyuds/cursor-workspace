// 持仓管理命令

import type { CLIResult, Position } from '../types';
import { upsertPosition, listPositions, getFund, getPosition } from '../db';
import { getQuote } from '../services/quote';

export async function handlePositionUpsert(args: {
  code: string;
  shares: number;
  cost?: number;
}): Promise<CLIResult<Position>> {
  try {
    if (!args.code) {
      return { success: false, error: 'MISSING_CODE', message: '缺少基金代码 --code' };
    }
    if (args.shares === undefined || isNaN(args.shares)) {
      return { success: false, error: 'MISSING_SHARES', message: '缺少份额 --shares' };
    }

    // 检查基金是否存在（getQuote 依赖基金已在库中）
    const fund = await getFund(args.code);
    if (!fund) {
      return { success: false, error: 'FUND_NOT_FOUND', message: `基金 ${args.code} 不存在，请先添加` };
    }

    let cost = args.cost;
    if (cost === undefined || isNaN(cost)) {
      const existing = await getPosition(args.code);
      if (existing) {
        cost = existing.cost;
      } else {
        const quote = await getQuote(args.code);
        if (quote && quote.price > 0) {
          cost = quote.price;
        } else {
          return {
            success: false,
            error: 'MISSING_COST',
            message: '新持仓未指定 --cost，且未能从天天基金拉取有效净值/估值，请手动指定成本单价',
          };
        }
      }
    }

    const position = await upsertPosition({
      code: args.code,
      shares: args.shares,
      cost,
    });
    
    return { success: true, data: position, message: '持仓更新成功' };
  } catch (err) {
    return { success: false, error: 'ERROR', message: (err as Error).message };
  }
}

export async function handlePositionList(): Promise<CLIResult<Position[]>> {
  try {
    const positions = await listPositions();
    return { success: true, data: positions, message: `共 ${positions.length} 条持仓记录` };
  } catch (err) {
    return { success: false, error: 'ERROR', message: (err as Error).message };
  }
}