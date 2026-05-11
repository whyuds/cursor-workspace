import type { CLIResult, Fund } from '../types';
export declare function handleFundAdd(args: {
    code: string;
    name: string;
    type?: string;
    json?: boolean;
}): Promise<CLIResult<Fund>>;
export declare function handleFundList(): Promise<CLIResult<Fund[]>>;
export declare function handleFundRemove(args: {
    code: string;
}): Promise<CLIResult<null>>;
//# sourceMappingURL=fund.d.ts.map