"use strict";
// 基金管理命令
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleFundAdd = handleFundAdd;
exports.handleFundList = handleFundList;
exports.handleFundRemove = handleFundRemove;
const db_1 = require("../db");
async function handleFundAdd(args) {
    try {
        if (!args.code) {
            return { success: false, error: 'MISSING_CODE', message: '缺少基金代码 --code' };
        }
        if (!args.name) {
            return { success: false, error: 'MISSING_NAME', message: '缺少基金名称 --name' };
        }
        const validTypes = ['stock', 'bond', 'mixed', 'money', 'index', 'qdii', 'other'];
        const type = args.type || 'other';
        if (!validTypes.includes(type)) {
            return {
                success: false,
                error: 'INVALID_TYPE',
                message: `无效的基金类型 ${type}，有效值: ${validTypes.join(', ')}`
            };
        }
        const fund = await (0, db_1.addFund)({ code: args.code, name: args.name, type: type });
        return { success: true, data: fund, message: '基金添加成功' };
    }
    catch (err) {
        return { success: false, error: 'ERROR', message: err.message };
    }
}
async function handleFundList() {
    try {
        const funds = await (0, db_1.listFunds)();
        return { success: true, data: funds, message: `共 ${funds.length} 只基金` };
    }
    catch (err) {
        return { success: false, error: 'ERROR', message: err.message };
    }
}
async function handleFundRemove(args) {
    try {
        if (!args.code) {
            return { success: false, error: 'MISSING_CODE', message: '缺少基金代码 --code' };
        }
        const removed = await (0, db_1.removeFund)(args.code);
        if (!removed) {
            return { success: false, error: 'NOT_FOUND', message: `基金 ${args.code} 不存在` };
        }
        return { success: true, message: `基金 ${args.code} 已删除` };
    }
    catch (err) {
        return { success: false, error: 'ERROR', message: err.message };
    }
}
//# sourceMappingURL=fund.js.map