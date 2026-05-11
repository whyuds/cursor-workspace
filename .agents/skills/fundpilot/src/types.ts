// 类型定义

export interface Fund {
  code: string;
  name: string;
  type: 'stock' | 'bond' | 'mixed' | 'money' | 'index' | 'qdii' | 'other';
  created_at: string;
}

export interface Position {
  code: string;
  shares: number;
  cost: number; // 成本价
  updated_at: string;
}

export interface Plan {
  code: string;
  amount: number; // 定投金额
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  enabled: boolean;
  created_at: string;
}

export interface StrategyRule {
  smallDrop: number; // 小跌阈值，如 0.02 = 2%
  bigDrop: number; // 大跌阈值，如 0.05 = 5%
  smallBuyRatio: number; // 小跌买入倍数，如 1 = 正常
  bigBuyRatio: number; // 大跌买入倍数，如 2 = 加倍
  pauseThreshold: number; // 暂停阈值，如 0.03 = 上涨 3% 暂停
  monthlyBudgetCap?: number; // 月度预算上限
  maxPositionRatio?: number; // 单只基金最大仓位比例
  cashCushionRatio?: number; // 现金安全垫比例
}

export interface Strategy {
  name: string;
  rules: StrategyRule;
  created_at: string;
}

export type OperationType = 'buy' | 'sell' | 'dividend';

export interface Operation {
  id?: number;
  code: string;
  type: OperationType;
  amount: number;
  price: number;
  date: string;
  created_at: string;
}

export interface Quote {
  code: string;
  name: string;
  price: number;
  change_rate: number; // 涨跌幅，小数，如 0.02 = 2%
  date: string;
}

export interface Signal {
  code: string;
  name: string;
  action: 'buy' | 'hold' | 'pause';
  amount: number;
  reason: string;
  change_rate: number;
  strategy_name: string;
}

// CLI 输出格式
export interface CLIResult<T = unknown> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
}

export interface Report {
  period: string;
  start_date: string;
  end_date: string;
  total_buy: number;
  total_sell: number;
  total_dividend: number;
  net_invested: number;
  funds: Array<{
    code: string;
    name: string;
    buy_count: number;
    sell_count: number;
    total_buy: number;
    total_sell: number;
  }>;
}