"use strict";
// 持仓管理命令
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePositionUpsert = handlePositionUpsert;
exports.handlePositionList = handlePositionList;
const db_1 = require("../db");
async function handlePositionUpsert(args) {
    try {
        if (!args.code) {
            return { success: false, error: 'MISSING_CODE', message: '缺少基金代码 --code' };
        }
        if (args.shares === undefined || isNaN(args.shares)) {
            return { success: false, error: 'MISSING_SHARES', message: '缺少份额 --shares' };
        }
        if (args.cost === undefined || isNaN(args.cost)) {
            return { success: false, error: 'MISSING_COST', message: '缺少成本 --cost' };
        }
        // 检查基金是否存在
        const fund = await (0, db_1.getFund)(args.code);
        if (!fund) {
            return { success: false, error: 'FUND_NOT_FOUND', message: `基金 ${args.code} 不存在，请先添加` };
        }
        const position = await (0, db_1.upsertPosition)({
            code: args.code,
            shares: args.shares,
            cost: args.cost,
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