const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const config = require('./config.cjs');

let db = null;
let dbPath = null;
let SQL = null;
let saveTimer = null;

// 旧版本可能出现的数据库路径（按历史 app name / 文件名）
function getLegacyDbPaths() {
  const userData = app.getPath('userData');
  const roaming = path.dirname(userData);
  return [
    path.join(roaming, 'wealth-tracker', 'wealth-tracker.db'),
    path.join(roaming, 'wealth-tracker', 'WealthCare.db'),
    path.join(roaming, 'wealthcare', 'wealthcare.db'),
    path.join(roaming, 'wealthcare', 'WealthCare.db'),
  ];
}

// 若当前路径没有数据库，尝试从旧版本路径复制一份
function migrateLegacyDbFile(targetPath) {
  if (fs.existsSync(targetPath)) return false;
  const legacyPaths = getLegacyDbPaths();
  for (const legacyPath of legacyPaths) {
    if (fs.existsSync(legacyPath)) {
      try {
        fs.mkdirSync(path.dirname(targetPath), { recursive: true });
        fs.copyFileSync(legacyPath, targetPath);
        console.log(`已从旧数据库路径迁移: ${legacyPath} -> ${targetPath}`);
        return true;
      } catch (e) {
        console.error('迁移旧数据库失败:', e);
      }
    }
  }
  return false;
}

// 获取表名集合
function getTableNames(database) {
  const rows = database.exec("SELECT name FROM sqlite_master WHERE type='table'");
  if (!rows.length) return new Set();
  return new Set(rows[0].values.map((row) => row[0]));
}

// 获取表的列名集合
function getColumnNames(database, tableName) {
  const rows = database.exec(`PRAGMA table_info(${tableName})`);
  if (!rows.length) return new Set();
  return new Set(rows[0].values.map((row) => row[1]));
}

// 确保资产/负债表结构正确，支持从旧版本 schema 迁移
function ensureAssetTableSchema(database, tableName) {
  const tables = getTableNames(database);
  const columns = ['id', 'category', 'data', 'created_at', 'updated_at'];

  if (!tables.has(tableName)) {
    database.run(`
      CREATE TABLE ${tableName} (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
    return;
  }

  const existingColumns = getColumnNames(database, tableName);
  const missing = columns.filter((c) => !existingColumns.has(c));
  if (missing.length === 0) return;

  // 列缺失时重建表，并从 JSON data 中恢复核心字段
  const backupName = `${tableName}_backup`;
  database.run(`DROP TABLE IF EXISTS ${backupName}`);
  database.run(`ALTER TABLE ${tableName} RENAME TO ${backupName}`);
  database.run(`
    CREATE TABLE ${tableName} (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  try {
    const dataRows = database.exec(`SELECT data FROM ${backupName}`);
    if (dataRows.length) {
      const now = new Date().toISOString();
      for (const [json] of dataRows[0].values) {
        const record = JSON.parse(json);
        const id = record.id || generateId();
        const category = record.category || '';
        const createdAt = record.createdAt || record.created_at || now;
        const updatedAt = record.updatedAt || record.updated_at || now;
        database.run(
          `INSERT OR REPLACE INTO ${tableName} (id, category, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
          [id, category, JSON.stringify(record), createdAt, updatedAt]
        );
      }
    }
  } catch (e) {
    console.error(`修复表 ${tableName} 失败:`, e);
  }

  database.run(`DROP TABLE ${backupName}`);
}

// 修复/初始化数据库 schema
function repairSchema(database) {
  ensureAssetTableSchema(database, 'assets');
  ensureAssetTableSchema(database, 'liabilities');

  const tables = getTableNames(database);
  if (!tables.has('changes')) {
    database.run(`
      CREATE TABLE changes (
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
}

// 获取数据库实例（单例）
async function getDb() {
  if (db) return db;

  // 加载 sql.js WASM
  SQL = await initSqlJs();

  // 从配置中读取数据库路径，未配置则使用默认路径
  dbPath = config.getDbPath();

  // 若当前路径没有数据库，尝试从旧版本路径迁移
  migrateLegacyDbFile(dbPath);

  // 确保目录存在
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
    repairSchema(db);
    save();
  } else {
    db = new SQL.Database();
    repairSchema(db);
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

// 导入外部数据库文件（覆盖当前数据库，导入前自动备份）
async function importDbFile(sourcePath) {
  await getDb();
  if (!fs.existsSync(sourcePath)) {
    throw new Error('数据库文件不存在');
  }
  if (dbPath && fs.existsSync(dbPath)) {
    const backupPath = `${dbPath}.backup-${Date.now()}`;
    fs.copyFileSync(dbPath, backupPath);
  }
  fs.copyFileSync(sourcePath, dbPath);
  return reloadDb();
}

// 手动备份当前数据库
function backupDb() {
  if (!dbPath || !fs.existsSync(dbPath)) return null;
  const backupPath = `${dbPath}.backup-${Date.now()}`;
  fs.copyFileSync(dbPath, backupPath);
  return backupPath;
}

// 防抖保存：避免频繁写文件
function save() {
  if (!db || !dbPath) return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    flushSave();
  }, 300);
}

// 立即执行 pending 的保存（应用退出前调用）
function flushSave() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  if (!db || !dbPath) return;
  try {
    const data = db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  } catch (e) {
    console.error('保存数据库失败:', e);
  }
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
  const id = input.id || generateId();
  const record = { ...input, id, createdAt: input.createdAt || now, updatedAt: now };
  db.run(
    'INSERT INTO assets (id, category, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    [id, input.category, JSON.stringify(record), record.createdAt, record.updatedAt]
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
  const id = input.id || generateId();
  const record = { ...input, id, createdAt: input.createdAt || now, updatedAt: now };
  db.run(
    'INSERT INTO liabilities (id, category, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    [id, input.category, JSON.stringify(record), record.createdAt, record.updatedAt]
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
  flushSave,
  importDbFile,
  backupDb,
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
