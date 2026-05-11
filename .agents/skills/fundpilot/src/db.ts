import initSqlJs, { Database as SqlJsDatabase, SqlValue } from 'sql.js';
import path from 'path';
import os from 'os';
import fs from 'fs';
import type { Fund, Position, Plan, Strategy, Operation } from './types';

// 数据库文件路径
const DB_DIR = path.join(os.homedir(), '.fundpilot');
const DB_PATH = path.join(DB_DIR, 'fundpilot.db');

// 确保目录存在
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// 数据库实例（延迟初始化）
let db: SqlJsDatabase | null = null;

// 初始化数据库
async function initDatabase(): Promise<SqlJsDatabase> {
  if (db) return db;
  
  const SQL = await initSqlJs();
  
  // 尝试加载现有数据库
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  
  // 初始化表结构
  db.run(`
    CREATE TABLE IF NOT EXISTS funds (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'other',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS positions (
      code TEXT PRIMARY KEY,
      shares REAL NOT NULL DEFAULT 0,
      cost REAL NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (code) REFERENCES funds(code)
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS plans (
      code TEXT PRIMARY KEY,
      amount REAL NOT NULL,
      frequency TEXT NOT NULL DEFAULT 'weekly',
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (code) REFERENCES funds(code)
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS strategies (
      name TEXT PRIMARY KEY,
      rules TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS operations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      price REAL NOT NULL,
      date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (code) REFERENCES funds(code)
    )
  `);
  
  // 创建索引
  try {
    db.run(`CREATE INDEX IF NOT EXISTS idx_operations_code ON operations(code)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_operations_date ON operations(date)`);
  } catch {
    // 忽略索引已存在的错误
  }
  
  // 默认策略
  const hasDefault = db.exec("SELECT 1 FROM strategies WHERE name = 'default'");
  if (hasDefault.length === 0 || hasDefault[0].values.length === 0) {
    db.run(
      "INSERT INTO strategies (name, rules) VALUES (?, ?)",
      ['default', JSON.stringify({
        smallDrop: 0.02,
        bigDrop: 0.05,
        smallBuyRatio: 1,
        bigBuyRatio: 2,
        pauseThreshold: 0.03,
      })]
    );
  }
  
  saveDatabase();
  
  return db;
}

// 保存数据库到文件
function saveDatabase(): void {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

// 获取当前时间
function getNow(): string {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

// ============ 基金操作 ============

export async function addFund(fund: Omit<Fund, 'created_at'>): Promise<Fund> {
  const database = await initDatabase();
  database.run(
    'INSERT INTO funds (code, name, type) VALUES (?, ?, ?)',
    [fund.code, fund.name, fund.type] as SqlValue[]
  );
  saveDatabase();
  const result = await getFund(fund.code);
  if (!result) throw new Error('Failed to add fund');
  return result;
}

export async function getFund(code: string): Promise<Fund | undefined> {
  const database = await initDatabase();
  const result = database.exec('SELECT * FROM funds WHERE code = ?', [code] as SqlValue[]);
  if (result.length === 0 || result[0].values.length === 0) return undefined;
  
  const row = result[0].values[0];
  return {
    code: row[0] as string,
    name: row[1] as string,
    type: row[2] as Fund['type'],
    created_at: row[3] as string,
  };
}

export async function listFunds(): Promise<Fund[]> {
  const database = await initDatabase();
  const result = database.exec('SELECT * FROM funds ORDER BY code');
  if (result.length === 0) return [];
  
  return result[0].values.map(row => ({
    code: row[0] as string,
    name: row[1] as string,
    type: row[2] as Fund['type'],
    created_at: row[3] as string,
  }));
}

export async function removeFund(code: string): Promise<boolean> {
  const database = await initDatabase();
  
  // 先检查是否存在
  const existing = await getFund(code);
  if (!existing) return false;
  
  database.run('DELETE FROM positions WHERE code = ?', [code] as SqlValue[]);
  database.run('DELETE FROM plans WHERE code = ?', [code] as SqlValue[]);
  database.run('DELETE FROM operations WHERE code = ?', [code] as SqlValue[]);
  database.run('DELETE FROM funds WHERE code = ?', [code] as SqlValue[]);
  saveDatabase();
  
  // 验证删除成功
  const after = await getFund(code);
  return !after;
}

// ============ 持仓操作 ============

export async function upsertPosition(position: Omit<Position, 'updated_at'>): Promise<Position> {
  const database = await initDatabase();
  const existing = await getPosition(position.code);
  
  if (existing) {
    database.run(
      'UPDATE positions SET shares = ?, cost = ?, updated_at = ? WHERE code = ?',
      [position.shares, position.cost, getNow(), position.code] as SqlValue[]
    );
  } else {
    database.run(
      'INSERT INTO positions (code, shares, cost, updated_at) VALUES (?, ?, ?, ?)',
      [position.code, position.shares, position.cost, getNow()] as SqlValue[]
    );
  }
  saveDatabase();
  const result = await getPosition(position.code);
  if (!result) throw new Error('Failed to upsert position');
  return result;
}

export async function getPosition(code: string): Promise<Position | undefined> {
  const database = await initDatabase();
  const result = database.exec('SELECT * FROM positions WHERE code = ?', [code] as SqlValue[]);
  if (result.length === 0 || result[0].values.length === 0) return undefined;
  
  const row = result[0].values[0];
  return {
    code: row[0] as string,
    shares: row[1] as number,
    cost: row[2] as number,
    updated_at: row[3] as string,
  };
}

export async function listPositions(): Promise<Position[]> {
  const database = await initDatabase();
  const result = database.exec('SELECT * FROM positions ORDER BY code');
  if (result.length === 0) return [];
  
  return result[0].values.map(row => ({
    code: row[0] as string,
    shares: row[1] as number,
    cost: row[2] as number,
    updated_at: row[3] as string,
  }));
}

// ============ 定投计划操作 ============

export async function setPlan(plan: Omit<Plan, 'created_at' | 'enabled'> & { enabled?: boolean }): Promise<Plan> {
  const database = await initDatabase();
  
  database.run(
    `INSERT OR REPLACE INTO plans (code, amount, frequency, enabled) VALUES (?, ?, ?, ?)`,
    [plan.code, plan.amount, plan.frequency, plan.enabled !== false ? 1 : 0] as SqlValue[]
  );
  saveDatabase();
  const result = await getPlan(plan.code);
  if (!result) throw new Error('Failed to set plan');
  return result;
}

export async function getPlan(code: string): Promise<Plan | undefined> {
  const database = await initDatabase();
  const result = database.exec('SELECT * FROM plans WHERE code = ?', [code] as SqlValue[]);
  if (result.length === 0 || result[0].values.length === 0) return undefined;
  
  const row = result[0].values[0];
  return {
    code: row[0] as string,
    amount: row[1] as number,
    frequency: row[2] as Plan['frequency'],
    enabled: row[3] === 1,
    created_at: row[4] as string,
  };
}

export async function listPlans(): Promise<Plan[]> {
  const database = await initDatabase();
  const result = database.exec('SELECT * FROM plans ORDER BY code');
  if (result.length === 0) return [];
  
  return result[0].values.map(row => ({
    code: row[0] as string,
    amount: row[1] as number,
    frequency: row[2] as Plan['frequency'],
    enabled: row[3] === 1,
    created_at: row[4] as string,
  }));
}

// ============ 策略操作 ============

export async function setStrategy(name: string, rules: Strategy['rules']): Promise<Strategy> {
  const database = await initDatabase();
  database.run(
    `INSERT OR REPLACE INTO strategies (name, rules) VALUES (?, ?)`,
    [name, JSON.stringify(rules)] as SqlValue[]
  );
  saveDatabase();
  const result = await getStrategy(name);
  if (!result) throw new Error('Failed to set strategy');
  return result;
}

export async function getStrategy(name: string): Promise<Strategy | undefined> {
  const database = await initDatabase();
  const result = database.exec('SELECT * FROM strategies WHERE name = ?', [name] as SqlValue[]);
  if (result.length === 0 || result[0].values.length === 0) return undefined;
  
  const row = result[0].values[0];
  return {
    name: row[0] as string,
    rules: JSON.parse(row[1] as string),
    created_at: row[2] as string,
  };
}

export async function listStrategies(): Promise<Strategy[]> {
  const database = await initDatabase();
  const result = database.exec('SELECT * FROM strategies ORDER BY name');
  if (result.length === 0) return [];
  
  return result[0].values.map(row => ({
    name: row[0] as string,
    rules: JSON.parse(row[1] as string),
    created_at: row[2] as string,
  }));
}

// ============ 操作记录 ============

export async function addOperation(op: Omit<Operation, 'id' | 'created_at'>): Promise<Operation> {
  const database = await initDatabase();
  const created_at = getNow();
  
  database.run(
    'INSERT INTO operations (code, type, amount, price, date, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [op.code, op.type, op.amount, op.price, op.date, created_at] as SqlValue[]
  );
  
  const idResult = database.exec('SELECT last_insert_rowid()');
  const id = idResult[0]?.values[0]?.[0] as number;
  
  saveDatabase();
  return { ...op, id, created_at };
}

export async function listOperations(options?: { code?: string; startDate?: string; endDate?: string }): Promise<Operation[]> {
  const database = await initDatabase();
  
  let sql = 'SELECT * FROM operations WHERE 1=1';
  const params: SqlValue[] = [];
  
  if (options?.code) {
    sql += ' AND code = ?';
    params.push(options.code);
  }
  if (options?.startDate) {
    sql += ' AND date >= ?';
    params.push(options.startDate);
  }
  if (options?.endDate) {
    sql += ' AND date <= ?';
    params.push(options.endDate);
  }
  
  sql += ' ORDER BY date DESC, id DESC';
  
  const result = database.exec(sql, params);
  if (result.length === 0) return [];
  
  return result[0].values.map(row => ({
    id: row[0] as number,
    code: row[1] as string,
    type: row[2] as Operation['type'],
    amount: row[3] as number,
    price: row[4] as number,
    date: row[5] as string,
    created_at: row[6] as string,
  }));
}

// 导出初始化函数供外部使用
export { initDatabase };