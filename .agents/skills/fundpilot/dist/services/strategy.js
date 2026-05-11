"use strict";
// 定投策略计算服务
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateTodaySignal = calculateTodaySignal;
exports.calculateAllSignals = calculateAllSignals;
exports.shouldExecuteToday = shouldExecuteToday;
const db_1 = require("../db");
const quote_1 = require("./quote");
/**
 * 计算今日信号
 */
async function calculateTodaySignal(code, strategyName = 'default') {
    const fund = (await (0, db_1.listFunds)()).find(f => f.code === code);
    if (!fund) {
        return null;
    }
    const strategy = await (0, db_1.getStrategy)(strategyName);
    if (!strategy) {
        return null;
    }
    const quote = await (0, quote_1.getQuote)(code);
    if (!quote) {
        return null;
    }
    const plans = await (0, db_1.listPlans)();
    const positions = await (0, db_1.listPositions)();
    const plan = plans.find(p => p.code === code);
    const position = positions.find(p => p.code === code);
    return calculateSignal(quote, strategy.rules, plan, position, strategyName);
}
/**
 * 计算所有基金的今日信号
 */
async function calculateAllSignals(strategyName = 'default') {
    const strategy = await (0, db_1.getStrategy)(strategyName);
    if (!strategy) {
        return [];
    }
    const quotes = await (0, quote_1.getAllQuotes)();
    const plans = await (0, db_1.listPlans)();
    const positions = await (0, db_1.listPositions)();
    return quotes.map(quote => {
        const plan = plans.find(p => p.code === quote.code);
        const position = positions.find(p => p.code === quote.code);
        return calculateSignal(quote, strategy.rules, plan, position, strategyName);
    });
}
/**
 * 核心信号计算逻辑
 */
function calculateSignal(quote, rules, plan, position, strategyName) {
    const baseAmount = plan?.amount || 0;
    const changeRate = quote.change_rate;
    // 默认信号
    let action = 'hold';
    let amount = 0;
    let reason = '';
    // 策略逻辑
    const absChange = Math.abs(changeRate);
    if (changeRate < 0) {
        // 下跌情况
        if (absChange >= rules.bigDrop) {
            // 大跌大买
            action = 'buy';
            amount = baseAmount * (rules.bigBuyRatio || 2);
            reason = `大跌 ${(absChange * 100).toFixed(2)}%，超过阈值 ${(rules.bigDrop * 100).toFixed(2)}%，建议 ${(rules.bigBuyRatio || 2)}倍买入`;
        }
        else if (absChange >= rules.smallDrop) {
            // 小跌小买
            action = 'buy';
            amount = baseAmount * (rules.smallBuyRatio || 1);
            reason = `小跌 ${(absChange * 100).toFixed(2)}%，超过阈值 ${(rules.smallDrop * 100).toFixed(2)}%，建议正常买入`;
        }
        else {
            // 跌幅不足，观望
            action = 'hold';
            reason = `跌幅 ${(absChange * 100).toFixed(2)}%，未达买入阈值 ${(rules.smallDrop * 100).toFixed(2)}%`;
        }
    }
    else if (changeRate > 0) {
        // 上涨情况
        if (changeRate >= rules.pauseThreshold) {
            // 大涨暂停
            action = 'pause';
            reason = `上涨 ${(changeRate * 100).toFixed(2)}%，超过暂停阈值 ${(rules.pauseThreshold * 100).toFixed(2)}%，建议暂停买入`;
        }
        else {
            // 小涨正常
            action = 'hold';
            reason = `小涨 ${(changeRate * 100).toFixed(2)}%，未达暂停阈值，按计划执行`;
        }
    }
    else {
        // 不涨不跌
        action = 'hold';
        reason = '无涨跌，按计划执行';
    }
    // 额外检查：月度预算上限
    if (action === 'buy' && rules.monthlyBudgetCap && amount > 0) {
        // 这里简化处理，实际需要统计本月已买入金额
        // 暂时保留接口
    }
    // 额外检查：仓位限制
    if (action === 'buy' && rules.maxPositionRatio && position) {
        // 简化处理，实际需要计算总资产
        // 暂时保留接口
    }
    return {
        code: quote.code,
        name: quote.name,
        action,
        amount: Math.round(amount * 100) / 100,
        reason,
        change_rate: changeRate,
        strategy_name: strategyName,
    };
}
/**
 * 检查是否应该在今天执行定投
 */
function shouldExecuteToday(plan) {
    if (!plan.enabled)
        return false;
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=周日, 1=周一...
    const dayOfMonth = today.getDate();
    switch (plan.frequency) {
        case 'daily':
            return true;
        case 'weekly':
            // 默认周三执行
            return dayOfWeek === 3;
        case 'biweekly':
            // 双周，默认第一周和第三周的周三
            const weekOfMonth = Math.ceil(dayOfMonth / 7);
            return dayOfWeek === 3 && (weekOfMonth === 1 || weekOfMonth === 3);
        case 'monthly':
            // 每月第一天
            return dayOfMonth === 1;
        default:
            return false;
    }
}
//# sourceMappingURL=strategy.js.map