const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const config = require('./config.cjs');

let db = null;
let dbPath = null;
let SQL = null;
let saveTimer = null;

// 获取数据库实例（单例）
async function getDb() {
  if (db) return db;

  // 加载 sql.js WASM
  SQL = await initSqlJs();

  // 从配置中读取数据库路径，未配置则使用默认路径
  dbPath = config.getDbPath();

  // 确保目录存在
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
    initSchema(db);
    save();
  }

  return db;
}

// 重新加载数据库（切换路径后调用）
async function reloadDb() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  db = null;
  dbPath = null;
  return getDb();
}

// 防抖保存：避免频繁写文件
function save() {
  if (!db || !dbPath) return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      const data = db.export();
      fs.writeFileSync(dbPath, Buffer.from(data));
    } catch (e) {
      console.error('保存数据库失败:', e);
    }
  }, 300);
}

// 初始化数据库表结构
function initSchema(database) {
  database.run(`
    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS liabilities (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS changes (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      target TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      timestamp TEXT NOT NULL
    );
  `);
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ========== 资产操作 ==========

function getAllAssets() {
  const rows = db.exec('SELECT data FROM assets ORDER BY created_at');
  if (!rows.length) return [];
  return rows[0].values.map((row) => JSON.parse(row[0]));
}

function addAsset(input) {
  const now = new Date().toISOString();
  const id = generateId();
  const record = { ...input, id, createdAt: now, updatedAt: now };
  db.run(
    'INSERT INTO assets (id, category, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    [id, input.category, JSON.stringify(record), now, now]
  );
  save();
  return record;
}

function updateAsset(id, updates) {
  const now = new Date().toISOString();
  const result = db.exec('SELECT data FROM assets WHERE id = ?', [id]);
  if (!result.length) return null;
  const existing = JSON.parse(result[0].values[0][0]);
  const merged = { ...existing, ...updates, id, updatedAt: now };
  db.run('UPDATE assets SET data = ?, updated_at = ? WHERE id = ?', [
    JSON.stringify(merged),
    now,
    id,
  ]);
  save();
  return merged;
}

function deleteAsset(id) {
  const result = db.exec('SELECT data FROM assets WHERE id = ?', [id]);
  db.run('DELETE FROM assets WHERE id = ?', [id]);
  save();
  return result.length ? JSON.parse(result[0].values[0][0]) : null;
}

// ========== 负债操作 ==========

function getAllLiabilities() {
  const rows = db.exec('SELECT data FROM liabilities ORDER BY created_at');
  if (!rows.length) return [];
  return rows[0].values.map((row) => JSON.parse(row[0]));
}

function addLiability(input) {
  const now = new Date().toISOString();
  const id = generateId();
  const record = { ...input, id, createdAt: now, updatedAt: now };
  db.run(
    'INSERT INTO liabilities (id, category, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    [id, input.category, JSON.stringify(record), now, now]
  );
  save();
  return record;
}

function updateLiability(id, updates) {
  const now = new Date().toISOString();
  const result = db.exec('SELECT data FROM liabilities WHERE id = ?', [id]);
  if (!result.length) return null;
  const existing = JSON.parse(result[0].values[0][0]);
  const merged = { ...existing, ...updates, id, updatedAt: now };
  db.run('UPDATE liabilities SET data = ?, updated_at = ? WHERE id = ?', [
    JSON.stringify(merged),
    now,
    id,
  ]);
  save();
  return merged;
}

function deleteLiability(id) {
  const result = db.exec('SELECT data FROM liabilities WHERE id = ?', [id]);
  db.run('DELETE FROM liabilities WHERE id = ?', [id]);
  save();
  return result.length ? JSON.parse(result[0].values[0][0]) : null;
}

// ========== 变动记录 ==========

function getAllChanges() {
  const rows = db.exec('SELECT id, type, target, name, category, amount, timestamp FROM changes ORDER BY timestamp DESC LIMIT 50');
  if (!rows.length) return [];
  return rows[0].values.map((row) => ({
    id: row[0],
    type: row[1],
    target: row[2],
    name: row[3],
    category: row[4],
    amount: row[5],
    timestamp: row[6],
  }));
}

function addChange(change) {
  const id = change.id || generateId();
  db.run(
    'INSERT INTO changes (id, type, target, name, category, amount, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      id,
      change.type || '',
      change.target || '',
      change.name || '',
      change.category || '',
      change.amount != null ? Number(change.amount) : 0,
      change.timestamp || new Date().toISOString(),
    ]
  );
  save();
  return { ...change, id };
}

// ========== 数据迁移：从 localStorage 导入 ==========

function migrateFromLocalStorage(assets, liabilities, changes) {
  const countResult = db.exec('SELECT COUNT(*) as c FROM assets');
  if (countResult.length && countResult[0].values[0][0] > 0) return false;

  for (const a of assets) {
    db.run(
      'INSERT INTO assets (id, category, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [a.id, a.category, JSON.stringify(a), a.createdAt, a.updatedAt]
    );
  }
  for (const l of liabilities) {
    db.run(
      'INSERT INTO liabilities (id, category, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [l.id, l.category, JSON.stringify(l), l.createdAt, l.updatedAt]
    );
  }
  for (const c of changes) {
    db.run(
      'INSERT INTO changes (id, type, target, name, category, amount, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        c.id,
        c.type || '',
        c.target || '',
        c.name || '',
        c.category || '',
        c.amount != null ? Number(c.amount) : 0,
        c.timestamp || new Date().toISOString(),
      ]
    );
  }
  save();
  return true;
}

module.exports = {
  getDb,
  reloadDb,
  getAllAssets,
  addAsset,
  updateAsset,
  deleteAsset,
  getAllLiabilities,
  addLiability,
  updateLiability,
  deleteLiability,
  getAllChanges,
  addChange,
  migrateFromLocalStorage,
};
