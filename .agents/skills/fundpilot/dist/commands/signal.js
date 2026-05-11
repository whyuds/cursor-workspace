"use strict";
// 信号计算命令
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSignalToday = handleSignalToday;
exports.handleSignalTodayAll = handleSignalTodayAll;
const strategy_1 = require("../services/strategy");
async function handleSignalToday(args) {
    try {
        if (!args.code) {
            return { success: false, error: 'MISSING_CODE', message: '缺少基金代码 --code' };
        }
        const signal = await (0, strategy_1.calculateTodaySignal)(args.code, args.strategy || 'default');
        if (!signal) {
            return {
                success: false,
                error: 'CALCULATION_FAILED',
                message: '信号计算失败，请检查基金是否存在、策略是否配置、以及行情接口是否可正常拉取',
            };
        }
        return { success: true, data: signal, message: '信号计算完成' };
    }
    catch (err) {
        return { success: false, error: 'ERROR', message: err.message };
    }
}
async function handleSignalTodayAll(args) {
    try {
        const signals = await (0, strategy_1.calculateAllSignals)(args.strategy || 'default');
        return { success: true, data: signals, message: `共计算 ${signals.length} 条信号` };
    }
    catch (err) {
        return { success: false, error: 'ERROR', message: err.message };
    }
}
//# sourceMappingURL=signal.js.map