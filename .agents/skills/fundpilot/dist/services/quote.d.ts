import type { Quote } from '../types';
/**
 * 获取单只基金的行情数据
 * 优先从天天基金获取真实数据，失败则降级到 Mock
 */
export declare function getQuote(code: string): Promise<Quote | null>;
/**
 * 获取所有基金的行情数据
 */
export declare function getAllQuotes(): Promise<Quote[]>;
/**
 * 批量获取行情数据
 */
export declare function getQuotes(codes: string[]): Promise<Quote[]>;
/**
 * 获取历史行情数据（仍使用 Mock，因为免费 API 不提供历史数据）
 * @param code 基金代码
 * @param days 天数
 */
export declare function getHistoryQuotes(code: string, days?: number): Promise<Quote[]>;
//# sourceMappingURL=quote.d.ts.map