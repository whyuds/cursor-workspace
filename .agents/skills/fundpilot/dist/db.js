"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addFund = addFund;
exports.getFund = getFund;
exports.listFunds = listFunds;
exports.removeFund = removeFund;
exports.upsertPosition = upsertPosition;
exports.getPosition = getPosition;
exports.listPositions = listPositions;
exports.setPlan = setPlan;
exports.getPlan = getPlan;
exports.listPlans = listPlans;
exports.setStrategy = setStrategy;
exports.getStrategy = getStrategy;
exports.listStrategies = listStrategies;
exports.addOperation = addOperation;
exports.listOperations = listOperations;
exports.initDatabase = initDatabase;
const sql_js_1 = __importDefault(require("sql.js"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// 数据库保存在本 skill 目录下（与 package.json 同级），便于与工作区一并迁移
const SKILL_ROOT = path_1.default.resolve(__dirname, '..');
const DB_DIR = path_1.default.join(SKILL_ROOT, '.fundpilot');
const DB_PATH = path_1.default.join(DB_DIR, 'fundpilot.db');
// 确保目录存在
if (!fs_1.default.existsSync(DB_DIR)) {
    fs_1.default.mkdirSync(DB_DIR, { recursive: true });
}
// 数据库实例（延迟初始化）
let db = null;
// 初始化数据库
async function initDatabase() {
    if (db)
        return db;
    const SQL = await (0, sql_js_1.default)();
    // 尝试加载现有数据库
    if (fs_1.default.existsSync(DB_PATH)) {
        const buffer = fs_1.default.readFileSync(DB_PATH);
        db = new SQL.Database(buffer);
    }
    else {
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
    }
    catch {
        // 忽略索引已存在的错误
    }
    // 默认策略
    const hasDefault = db.exec("SELECT 1 FROM strategies WHERE name = 'default'");
    if (hasDefault.length === 0 || hasDefault[0].values.length === 0) {
        db.run("INSERT INTO strategies (name, rules) VALUES (?, ?)", ['default', JSON.stringify({
                smallDrop: 0.02,
                bigDrop: 0.05,
                smallBuyRatio: 1,
                bigBuyRatio: 2,
                pauseThreshold: 0.03,
            })]);
    }
    saveDatabase();
    return db;
}
// 保存数据库到文件
function saveDatabase() {
    if (db) {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs_1.default.writeFileSync(DB_PATH, buffer);
    }
}
// 获取当前时间
function getNow() {
    return new Date().toISOString().replace('T', ' ').substring(0, 19);
}
// ============ 基金操作 ============
async function addFund(fund) {
    const database = await initDatabase();
    database.run('INSERT INTO funds (code, name, type) VALUES (?, ?, ?)', [fund.code, fund.name, fund.type]);
    saveDatabase();
    const result = await getFund(fund.code);
    if (!result)
        throw new Error('Failed to add fund');
    return result;
}
async function getFund(code) {
    const database = await initDatabase();
    const result = database.exec('SELECT * FROM funds WHERE code = ?', [code]);
    if (result.length === 0 || result[0].values.length === 0)
        return undefined;
    const row = result[0].values[0];
    return {
        code: row[0],
        name: row[1],
        type: row[2],
        created_at: row[3],
    };
}
async function listFunds() {
    const database = await initDatabase();
    const result = database.exec('SELECT * FROM funds ORDER BY code');
    if (result.length === 0)
        return [];
    return result[0].values.map(row => ({
        code: row[0],
        name: row[1],
        type: row[2],
        created_at: row[3],
    }));
}
async function removeFund(code) {
    const database = await initDatabase();
    // 先检查是否存在
    const existing = await getFund(code);
    if (!existing)
        return false;
    database.run('DELETE FROM positions WHERE code = ?', [code]);
    database.run('DELETE FROM plans WHERE code = ?', [code]);
    database.run('DELETE FROM operations WHERE code = ?', [code]);
    database.run('DELETE FROM funds WHERE code = ?', [code]);
    saveDatabase();
    // 验证删除成功
    const after = await getFund(code);
    return !after;
}
// ============ 持仓操作 ============
async function upsertPosition(position) {
    const database = await initDatabase();
    const existing = await getPosition(position.code);
    if (existing) {
        database.run('UPDATE positions SET shares = ?, cost = ?, updated_at = ? WHERE code = ?', [position.shares, position.cost, getNow(), position.code]);
    }
    else {
        database.run('INSERT INTO positions (code, shares, cost, updated_at) VALUES (?, ?, ?, ?)', [position.code, position.shares, position.cost, getNow()]);
    }
    saveDatabase();
    const result = await getPosition(position.code);
    if (!result)
        throw new Error('Failed to upsert position');
    return result;
}
async function getPosition(code) {
    const database = await initDatabase();
    const result = database.exec('SELECT * FROM positions WHERE code = ?', [code]);
    if (result.length === 0 || result[0].values.length === 0)
        return undefined;
    const row = result[0].values[0];
    return {
        code: row[0],
        shares: row[1],
        cost: row[2],
        updated_at: row[3],
    };
}
async function listPositions() {
    const database = await initDatabase();
    const result = database.exec('SELECT * FROM positions ORDER BY code');
    if (result.length === 0)
        return [];
    return result[0].values.map(row => ({
        code: row[0],
        shares: row[1],
        cost: row[2],
        updated_at: row[3],
    }));
}
// ============ 定投计划操作 ============
async function setPlan(plan) {
    const database = await initDatabase();
    database.run(`INSERT OR REPLACE INTO plans (code, amount, frequency, enabled) VALUES (?, ?, ?, ?)`, [plan.code, plan.amount, plan.frequency, plan.enabled !== false ? 1 : 0]);
    saveDatabase();
    const result = await getPlan(plan.code);
    if (!result)
        throw new Error('Failed to set plan');
    return result;
}
async function getPlan(code) {
    const database = await initDatabase();
    const result = database.exec('SELECT * FROM plans WHERE code = ?', [code]);
    if (result.length === 0 || result[0].values.length === 0)
        return undefined;
    const row = result[0].values[0];
    return {
        code: row[0],
        amount: row[1],
        frequency: row[2],
        enabled: row[3] === 1,
        created_at: row[4],
    };
}
async function listPlans() {
    const database = await initDatabase();
    const result = database.exec('SELECT * FROM plans ORDER BY code');
    if (result.length === 0)
        return [];
    return result[0].values.map(row => ({
        code: row[0],
        amount: row[1],
        frequency: row[2],
        enabled: row[3] === 1,
        created_at: row[4],
    }));
}
// ============ 策略操作 ============
async function setStrategy(name, rules) {
    const database = await initDatabase();
    database.run(`INSERT OR REPLACE INTO strategies (name, rules) VALUES (?, ?)`, [name, JSON.stringify(rules)]);
    saveDatabase();
    const result = await getStrategy(name);
    if (!result)
        throw new Error('Failed to set strategy');
    return result;
}
async function getStrategy(name) {
    const database = await initDatabase();
    const result = database.exec('SELECT * FROM strategies WHERE name = ?', [name]);
    if (result.length === 0 || result[0].values.length === 0)
        return undefined;
    const row = result[0].values[0];
    return {
        name: row[0],
        rules: JSON.parse(row[1]),
        created_at: row[2],
    };
}
async function listStrategies() {
    const database = await initDatabase();
    const result = database.exec('SELECT * FROM strategies ORDER BY name');
    if (result.length === 0)
        return [];
    return result[0].values.map(row => ({
        name: row[0],
        rules: JSON.parse(row[1]),
        created_at: row[2],
    }));
}
// ============ 操作记录 ============
async function addOperation(op) {
    const database = await initDatabase();
    const created_at = getNow();
    database.run('INSERT INTO operations (code, type, amount, price, date, created_at) VALUES (?, ?, ?, ?, ?, ?)', [op.code, op.type, op.amount, op.price, op.date, created_at]);
    const idResult = database.exec('SELECT last_insert_rowid()');
    const id = idResult[0]?.values[0]?.[0];
    saveDatabase();
    return { ...op, id, created_at };
}
async function listOperations(options) {
    const database = await initDatabase();
    let sql = 'SELECT * FROM operations WHERE 1=1';
    const params = [];
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
    if (result.length === 0)
        return [];
    return result[0].values.map(row => ({
        id: row[0],
        code: row[1],
        type: row[2],
        amount: row[3],
        price: row[4],
        date: row[5],
        created_at: row[6],
    }));
}
//# sourceMappingURL=db.js.map