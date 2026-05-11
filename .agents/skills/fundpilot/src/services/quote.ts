// 行情数据服务（仅天天基金真实接口，失败即失败）

import type { Quote } from '../types';
import { listFunds } from '../db';

// 天天基金 API (JSONP 格式)
const EASTMONEY_API = 'http://fundgz.1234567.com.cn/js';

// API 超时时间（毫秒）
const API_TIMEOUT = 5000;

// 天天基金 API 响应格式
interface EastMoneyQuote {
  fundcode: string;
  name: string;
  jzrq: string; // 净值日期
  dwjz: string; // 单位净值
  gsz: string; // 估值
  gszzl: string; // 估值增长率（涨跌幅百分比）
  gztime: string; // 估值时间
}

/**
 * 解析 JSONP 响应
 * 格式: jsonpgz({"fundcode":"110022",...});
 */
function parseJSONP(jsonp: string): EastMoneyQuote | null {
  try {
    const match = jsonp.match(/jsonpgz\((\{.*?\})\);?/);
    if (!match || !match[1]) {
      return null;
    }
    return JSON.parse(match[1]) as EastMoneyQuote;
  } catch {
    return null;
  }
}

function eastMoneyToQuote(data: EastMoneyQuote): Quote | null {
  const rawPrice = data.gsz ? parseFloat(data.gsz) : parseFloat(data.dwjz);
  if (!Number.isFinite(rawPrice) || rawPrice <= 0) {
    return null;
  }
  const changeRate = data.gszzl ? parseFloat(data.gszzl) / 100 : 0;
  if (!Number.isFinite(changeRate)) {
    return null;
  }
  const date = data.gztime ? data.gztime.split(' ')[0] : data.jzrq;
  return {
    code: data.fundcode,
    name: data.name,
    price: rawPrice,
    change_rate: changeRate,
    date,
  };
}

/**
 * 从天天基金获取单只基金实时行情
 */
async function fetchRealQuote(code: string): Promise<Quote | null> {
  const url = `${EASTMONEY_API}/${code}.js`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Referer: 'http://fund.eastmoney.com/',
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

    return eastMoneyToQuote(data);
  } catch {
    return null;
  }
}

/**
 * 获取单只基金的行情数据（基金须已在库中；拉取失败返回 null）
 */
export async function getQuote(code: string): Promise<Quote | null> {
  const funds = await listFunds();
  const fund = funds.find((f) => f.code === code);
  if (!fund) return null;

  return fetchRealQuote(code);
}

/**
 * 获取所有自选基金的行情；任一只拉取失败则抛出错误
 */
export async function getAllQuotes(): Promise<Quote[]> {
  const funds = await listFunds();
  const results = await Promise.all(
    funds.map(async (f) => {
      const quote = await fetchRealQuote(f.code);
      return { code: f.code, quote };
    })
  );

  const failed = results
    .filter((r) => !r.quote)
    .map((r) => r.code);

  if (failed.length > 0) {
    throw new Error(`行情拉取失败，基金代码: ${failed.join(', ')}`);
  }

  return results.map((r) => r.quote!);
}
