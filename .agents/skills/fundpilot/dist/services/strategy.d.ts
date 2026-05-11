import type { Signal, Plan } from '../types';
/**
 * 计算今日信号
 */
export declare function calculateTodaySignal(code: string, strategyName?: string): Promise<Signal | null>;
/**
 * 计算所有基金的今日信号
 */
export declare function calculateAllSignals(strategyName?: string): Promise<Signal[]>;
/**
 * 检查是否应该在今天执行定投
 */
export declare function shouldExecuteToday(plan: Plan): boolean;
//# sourceMappingURL=strategy.d.ts.map