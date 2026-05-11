"use strict";
// 行情数据服务（接入天天基金真实数据，失败时降级到 Mock）
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQuote = getQuote;
exports.getAllQuotes = getAllQuotes;
exports.getQuotes = getQuotes;
exports.getHistoryQuotes = getHistoryQuotes;
const db_1 = require("../db");
// 天天基金 API (JSONP 格式)
const EASTMONEY_API = 'http://fundgz.1234567.com.cn/js';
// API 超时时间（毫秒）
const API_TIMEOUT = 5000;
/**
 * 解析 JSONP 响应
 * 格式: jsonpgz({"fundcode":"110022",...});
 */
function parseJSONP(jsonp) {
    try {
        // 提取括号内的 JSON
        const match = jsonp.match(/jsonpgz\((\{.*?\})\);?/);
        if (!match || !match[1]) {
            return null;
        }
        return JSON.parse(match[1]);
    }
    catch {
        return null;
    }
}
/**
 * 从天天基金获取单只基金实时行情
 */
async function fetchRealQuote(code) {
    const url = `${EASTMONEY_API}/${code}.js`;
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'http://fund.eastmoney.com/',
            },
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
            return null;
        }
        const text = await response.text();
        const data = parseJSONP(text);
        if (!data) {
            return null;
        }
        // 转换数据格式
        // 优先使用估值(gsz)，如果没有估值则用净值(dwjz)
        const price = data.gsz ? parseFloat(data.gsz) : parseFloat(data.dwjz);
        // gszzl 是百分比字符串，如 "-0.44"，需要转换为小数
        const changeRate = data.gszzl ? parseFloat(data.gszzl) / 100 : 0;
        // 估值时间或净值日期
        const date = data.gztime ? data.gztime.split(' ')[0] : data.jzrq;
        return {
            code: data.fundcode,
            name: data.name,
            price,
            change_rate: changeRate,
            date,
        };
    }
    catch (error) {
        // 网络错误、超时等
        return null;
    }
}
// ============ Mock 数据生成器（降级备用） ============
function generateMockQuote(code, name) {
    // 使用日期作为种子，同一天返回相同数据
    const today = new Date().toISOString().split('T')[0];
    const seed = hashCode(code + today);
    // 生成 -8% 到 +8% 之间的涨跌幅
    const change_rate = ((seed % 1600) - 800) / 10000;
    // 基础价格 0.5 - 5.0
    const basePrice = 0.5 + (Math.abs(seed % 450)) / 100;
    const price = Math.round(basePrice * 10000) / 10000;
    return {
        code,
        name,
        price,
        change_rate,
        date: today,
    };
}
function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
}
// ============ 导出接口 ============
/**
 * 获取单只基金的行情数据
 * 优先从天天基金获取真实数据，失败则降级到 Mock
 */
async function getQuote(code) {
    const funds = await (0, db_1.listFunds)();
    const fund = funds.find(f => f.code === code);
    if (!fund)
        return null;
    // 尝试获取真实行情
    const realQuote = await fetchRealQuote(code);
    if (realQuote) {
        return realQuote;
    }
    // 降级到 Mock 数据
    console.error(`[Quote] Failed to fetch real quote for ${code}, using mock data`);
    return generateMockQuote(code, fund.name);
}
/**
 * 获取所有基金的行情数据
 */
async function getAllQuotes() {
    const funds = await (0, db_1.listFunds)();
    // 批量获取真实行情
    const quotes = await Promise.all(funds.map(async (f) => {
        const realQuote = await fetchRealQuote(f.code);
        if (realQuote) {
            return realQuote;
        }
        // 降级到 Mock
        console.error(`[Quote] Failed to fetch real quote for ${f.code}, using mock data`);
        return generateMockQuote(f.code, f.name);
    }));
    return quotes;
}
/**
 * 批量获取行情数据
 */
async function getQuotes(codes) {
    const funds = await (0, db_1.listFunds)();
    const quotes = await Promise.all(codes.map(async (code) => {
        const fund = funds.find(f => f.code === code);
        if (!fund) {
            return {
                code,
                name: '未知基金',
                price: 1,
                change_rate: 0,
                date: new Date().toISOString().split('T')[0],
            };
        }
        const realQuote = await fetchRealQuote(code);
        if (realQuote) {
            return realQuote;
        }
        console.error(`[Quote] Failed to fetch real quote for ${code}, using mock data`);
        return generateMockQuote(code, fund.name);
    }));
    return quotes;
}
/**
 * 获取历史行情数据（仍使用 Mock，因为免费 API 不提供历史数据）
 * @param code 基金代码
 * @param days 天数
 */
async function getHistoryQuotes(code, days = 30) {
    const fund = (await (0, db_1.listFunds)()).find(f => f.code === code);
    const name = fund?.name || '未知基金';
    const quotes = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        // 使用不同的种子生成历史数据
        const seed = hashCode(code + dateStr);
        const change_rate = ((seed % 1600) - 800) / 10000;
        const basePrice = 0.5 + (Math.abs(seed % 450)) / 100;
        const price = Math.round(basePrice * 10000) / 10000;
        quotes.push({ code, name, price, change_rate, date: dateStr });
    }
    return quotes;
}
// 预留接口：真实行情数据获取器
// export interface QuoteProvider {
//   getQuote(code: string): Promise<Quote | null>;
//   getQuotes(codes: string[]): Promise<Quote[]>;
// }
//
// let quoteProvider: QuoteProvider | null = null;
//
// export function setQuoteProvider(provider: QuoteProvider) {
//   quoteProvider = provider;
// }
//# sourceMappingURL=quote.js.map