"use strict";
// 操作记录命令
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleOperationAdd = handleOperationAdd;
exports.handleOperationList = handleOperationList;
const db_1 = require("../db");
async function handleOperationAdd(args) {
    try {
        if (!args.code) {
            return { success: false, error: 'MISSING_CODE', message: '缺少基金代码 --code' };
        }
        if (!args.type) {
            return { success: false, error: 'MISSING_TYPE', message: '缺少操作类型 --type' };
        }
        if (args.amount === undefined || isNaN(args.amount)) {
            return { success: false, error: 'MISSING_AMOUNT', message: '缺少金额 --amount' };
        }
        if (args.price === undefined || isNaN(args.price)) {
            return { success: false, error: 'MISSING_PRICE', message: '缺少价格 --price' };
        }
        const validTypes = ['buy', 'sell', 'dividend'];
        if (!validTypes.includes(args.type)) {
            return {
                success: false,
                error: 'INVALID_TYPE',
                message: `无效的操作类型 ${args.type}，有效值: ${validTypes.join(', ')}`
            };
        }
        // 检查基金是否存在
        const fund = await (0, db_1.getFund)(args.code);
        if (!fund) {
            return { success: false, error: 'FUND_NOT_FOUND', message: `基金 ${args.code} 不存在，请先添加` };
        }
        // 日期处理
        const date = args.date || new Date().toISOString().split('T')[0];
        // 验证日期格式
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return { success: false, error: 'INVALID_DATE', message: '日期格式应为 YYYY-MM-DD' };
        }
        const operation = await (0, db_1.addOperation)({
            code: args.code,
            type: args.type,
            amount: args.amount,
            price: args.price,
            date,
        });
        return { success: true, data: operation, message: '操作记录添加成功' };
    }
    catch (err) {
        return { success: false, error: 'ERROR', message: err.message };
    }
}
async function handleOperationList(args) {
    try {
        const operations = await (0, db_1.listOperations)({
            code: args.code,
            startDate: args.startDate,
            endDate: args.endDate,
        });
        return { success: true, data: operations, message: `共 ${operations.length} 条操作记录` };
    }
    catch (err) {
        return { success: false, error: 'ERROR', message: err.message };
    }
}
//# sourceMappingURL=operation.js.map