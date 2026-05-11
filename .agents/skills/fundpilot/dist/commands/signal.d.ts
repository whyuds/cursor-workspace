import type { CLIResult, Signal } from '../types';
export declare function handleSignalToday(args: {
    code: string;
    strategy?: string;
}): Promise<CLIResult<Signal>>;
export declare function handleSignalTodayAll(args: {
    strategy?: string;
}): Promise<CLIResult<Signal[]>>;
//# sourceMappingURL=signal.d.ts.map