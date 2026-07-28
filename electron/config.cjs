const fs = require('fs');
const path = require('path');
const { app, dialog } = require('electron');

const CONFIG_FILE = 'config.json';

// 获取配置文件路径
function getConfigPath() {
  return path.join(app.getPath('userData'), CONFIG_FILE);
}

// 默认数据库路径
function getDefaultDbPath() {
  return path.join(app.getPath('userData'), 'WealthCare.db');
}

// 读取配置
function loadConfig() {
  const configPath = getConfigPath();
  try {
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('读取配置失败:', e);
  }
  return { dbPath: getDefaultDbPath() };
}

// 保存配置
function saveConfig(config) {
  const configPath = getConfigPath();
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  } catch (e) {
    console.error('保存配置失败:', e);
  }
}

// 获取当前数据库路径
function getDbPath() {
  const config = loadConfig();
  return config.dbPath || getDefaultDbPath();
}

// 设置数据库路径
function setDbPath(dbPath) {
  const config = loadConfig();
  config.dbPath = dbPath;
  saveConfig(config);
  return config;
}

// 选择文件夹对话框
function selectFolder() {
  const result = dialog.showOpenDialogSync({
    title: '选择数据库存放位置',
    properties: ['openDirectory', 'createDirectory'],
  });
  return result && result.length > 0 ? result[0] : null;
}

// 选择数据库文件对话框
function selectDbFile() {
  const result = dialog.showOpenDialogSync({
    title: '选择要导入的数据库文件',
    properties: ['openFile'],
    filters: [
      { name: 'SQLite 数据库', extensions: ['db', 'sqlite', 'sqlite3'] },
      { name: '所有文件', extensions: ['*'] },
    ],
  });
  return result && result.length > 0 ? result[0] : null;
}

// ========== 日志目录配置 ==========

// 默认日志目录
function getDefaultLogDir() {
  return path.join(app.getPath('userData'), 'logs');
}

// 获取当前日志目录
function getLogDir() {
  const config = loadConfig();
  return config.logDir || getDefaultLogDir();
}

// 设置日志目录
function setLogDir(logDir) {
  const config = loadConfig();
  config.logDir = logDir;
  saveConfig(config);
  return config;
}

// 选择日志存放文件夹对话框
function selectLogFolder() {
  const result = dialog.showOpenDialogSync({
    title: '选择日志存放位置',
    properties: ['openDirectory', 'createDirectory'],
  });
  return result && result.length > 0 ? result[0] : null;
}

// ========== 汇率配置 ==========
// 读取汇率设置，返回 null 表示未设置（由渲染层使用默认值兜底）
function getExchangeRates() {
  const config = loadConfig();
  return config.exchangeRates || null;
}

// 保存汇率设置（与数据库同处 userData，重装/换机迁移一致）
function setExchangeRates(rates) {
  const config = loadConfig();
  config.exchangeRates = rates;
  saveConfig(config);
  return config;
}

module.exports = {
  loadConfig,
  saveConfig,
  getDbPath,
  setDbPath,
  getDefaultDbPath,
  selectFolder,
  selectDbFile,
  getLogDir,
  setLogDir,
  getDefaultLogDir,
  selectLogFolder,
  getExchangeRates,
  setExchangeRates,
};
