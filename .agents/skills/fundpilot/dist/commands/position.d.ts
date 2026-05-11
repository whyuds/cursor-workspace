import type { CLIResult, Position } from '../types';
export declare function handlePositionUpsert(args: {
    code: string;
    shares: number;
    cost: number;
}): Promise<CLIResult<Position>>;
export declare function handlePositionList(): Promise<CLIResult<Position[]>>;
//# sourceMappingURL=position.d.ts.map