import type { CLIResult, Operation } from '../types';
export declare function handleOperationAdd(args: {
    code: string;
    type: string;
    amount: number;
    price: number;
    date?: string;
}): Promise<CLIResult<Operation>>;
export declare function handleOperationList(args: {
    code?: string;
    startDate?: string;
    endDate?: string;
}): Promise<CLIResult<Operation[]>>;
//# sourceMappingURL=operation.d.ts.map