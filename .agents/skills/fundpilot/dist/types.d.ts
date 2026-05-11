export interface Fund {
    code: string;
    name: string;
    type: 'stock' | 'bond' | 'mixed' | 'money' | 'index' | 'qdii' | 'other';
    created_at: string;
}
export interface Position {
    code: string;
    shares: number;
    cost: number;
    updated_at: string;
}
export interface Plan {
    code: string;
    amount: number;
    frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
    enabled: boolean;
    created_at: string;
}
export interface StrategyRule {
    smallDrop: number;
    bigDrop: number;
    smallBuyRatio: number;
    bigBuyRatio: number;
    pauseThreshold: number;
    monthlyBudgetCap?: number;
    maxPositionRatio?: number;
    cashCushionRatio?: number;
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
    change_rate: number;
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
//# sourceMappingURL=types.d.ts.map