"use strict";
// 持仓管理命令
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePositionUpsert = handlePositionUpsert;
exports.handlePositionList = handlePositionList;
const db_1 = require("../db");
const quote_1 = require("../services/quote");
async function handlePositionUpsert(args) {
    try {
        if (!args.code) {
            return { success: false, error: 'MISSING_CODE', message: '缺少基金代码 --code' };
        }
        if (args.shares === undefined || isNaN(args.shares)) {
            return { success: false, error: 'MISSING_SHARES', message: '缺少份额 --shares' };
        }
        // 检查基金是否存在（getQuote 依赖基金已在库中）
        const fund = await (0, db_1.getFund)(args.code);
        if (!fund) {
            return { success: false, error: 'FUND_NOT_FOUND', message: `基金 ${args.code} 不存在，请先添加` };
        }
        let cost = args.cost;
        if (cost === undefined || isNaN(cost)) {
            const existing = await (0, db_1.getPosition)(args.code);
            if (existing) {
                cost = existing.cost;
            }
            else {
                const quote = await (0, quote_1.getQuote)(args.code);
                if (quote && quote.price > 0) {
                    cost = quote.price;
                }
                else {
                    return {
                        success: false,
                        error: 'MISSING_COST',
                        message: '新持仓未指定 --cost，且未能从天天基金拉取有效净值/估值，请手动指定成本单价',
                    };
                }
            }
        }
        const position = await (0, db_1.upsertPosition)({
            code: args.code,
            shares: args.shares,
            cost,
        });
        return { success: true, data: position, message: '持仓更新成功' };
    }
    catch (err) {
        return { success: false, error: 'ERROR', message: err.message };
    }
}
async function handlePositionList() {
    try {
        const positions = await (0, db_1.listPositions)();
        return { success: true, data: positions, message: `共 ${positions.length} 条持仓记录` };
    }
    catch (err) {
        return { success: false, error: 'ERROR', message: err.message };
    }
}
//# sourceMappingURL=position.js.map