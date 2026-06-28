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
  return path.join(app.getPath('userData'), 'wealth-tracker.db');
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

module.exports = {
  loadConfig,
  saveConfig,
  getDbPath,
  setDbPath,
  getDefaultDbPath,
  selectFolder,
};
