import { Database as SqlJsDatabase } from 'sql.js';
import type { Fund, Position, Plan, Strategy, Operation } from './types';
declare function initDatabase(): Promise<SqlJsDatabase>;
export declare function addFund(fund: Omit<Fund, 'created_at'>): Promise<Fund>;
export declare function getFund(code: string): Promise<Fund | undefined>;
export declare function listFunds(): Promise<Fund[]>;
export declare function removeFund(code: string): Promise<boolean>;
export declare function upsertPosition(position: Omit<Position, 'updated_at'>): Promise<Position>;
export declare function getPosition(code: string): Promise<Position | undefined>;
export declare function listPositions(): Promise<Position[]>;
export declare function setPlan(plan: Omit<Plan, 'created_at' | 'enabled'> & {
    enabled?: boolean;
}): Promise<Plan>;
export declare function getPlan(code: string): Promise<Plan | undefined>;
export declare function listPlans(): Promise<Plan[]>;
export declare function setStrategy(name: string, rules: Strategy['rules']): Promise<Strategy>;
export declare function getStrategy(name: string): Promise<Strategy | undefined>;
export declare function listStrategies(): Promise<Strategy[]>;
export declare function addOperation(op: Omit<Operation, 'id' | 'created_at'>): Promise<Operation>;
export declare function listOperations(options?: {
    code?: string;
    startDate?: string;
    endDate?: string;
}): Promise<Operation[]>;
export { initDatabase };
//# sourceMappingURL=db.d.ts.map