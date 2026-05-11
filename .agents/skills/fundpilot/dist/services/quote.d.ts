import type { Quote } from '../types';
/**
 * 获取单只基金的行情数据（基金须已在库中；拉取失败返回 null）
 */
export declare function getQuote(code: string): Promise<Quote | null>;
/**
 * 获取所有自选基金的行情；任一只拉取失败则抛出错误
 */
export declare function getAllQuotes(): Promise<Quote[]>;
//# sourceMappingURL=quote.d.ts.map