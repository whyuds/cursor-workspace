import type { CLIResult, Plan } from '../types';
export declare function handlePlanSet(args: {
    code: string;
    amount: number;
    frequency?: string;
    enabled?: boolean;
}): Promise<CLIResult<Plan>>;
export declare function handlePlanList(): Promise<CLIResult<Plan[]>>;
//# sourceMappingURL=plan.d.ts.map