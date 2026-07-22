const { app, BrowserWindow, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const db = require('./db.cjs');
const config = require('./config.cjs');
const logger = require('./logger.cjs');
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let dbReady = null;

// 确保数据库已初始化
function ensureDb() {
  if (!dbReady) {
    dbReady = db.getDb();
  }
  return dbReady;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    title: 'WealthCare - 个人财产管理',
    icon: path.join(__dirname, '../build/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    backgroundColor: '#fafafa',
    show: false,
  });

  win.once('ready-to-show', () => {
    win.show();
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (isDev) {
    win.loadURL('http://localhost:5173/');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

// 注册数据库 IPC 处理器
function registerDbHandlers() {
  const wrap = (fn) => async (_e, ...args) => {
    await ensureDb();
    return fn(...args);
  };

  ipcMain.handle('db:getAllAssets', wrap(() => db.getAllAssets()));
  ipcMain.handle('db:addAsset', wrap((asset) => db.addAsset(asset)));
  ipcMain.handle('db:updateAsset', wrap((id, updates) => db.updateAsset(id, updates)));
  ipcMain.handle('db:deleteAsset', wrap((id) => db.deleteAsset(id)));

  ipcMain.handle('db:getAllLiabilities', wrap(() => db.getAllLiabilities()));
  ipcMain.handle('db:addLiability', wrap((liability) => db.addLiability(liability)));
  ipcMain.handle('db:updateLiability', wrap((id, updates) => db.updateLiability(id, updates)));
  ipcMain.handle('db:deleteLiability', wrap((id) => db.deleteLiability(id)));

  ipcMain.handle('db:getAllChanges', wrap((options) => db.getAllChanges(options || {})));
  ipcMain.handle('db:getChangesCount', wrap((options) => db.getChangesCount(options || {})));
  ipcMain.handle('db:addChange', wrap((change) => db.addChange(change)));

  ipcMain.handle('db:migrate', wrap((data) => db.migrateFromLocalStorage(data.assets, data.liabilities, data.changes)));
  ipcMain.handle('db:importDbFile', wrap((filePath) => db.importDbFile(filePath)));
  ipcMain.handle('db:backupDb', wrap(() => db.backupDb()));
}

// 注册配置 IPC 处理器
function registerConfigHandlers() {
  ipcMain.handle('config:getDbPath', () => config.getDbPath());
  ipcMain.handle('config:getDefaultDbPath', () => config.getDefaultDbPath());
  ipcMain.handle('config:selectFolder', () => config.selectFolder());
  ipcMain.handle('config:selectDbFile', () => config.selectDbFile());
  ipcMain.handle('config:setDbPath', async (_e, dbPath) => {
    const result = config.setDbPath(dbPath);
    // 切换路径后重置数据库初始化状态，重新加载
    dbReady = null;
    await db.reloadDb();
    return result;
  });

  // 日志目录配置
  ipcMain.handle('config:getLogDir', () => config.getLogDir());
  ipcMain.handle('config:getDefaultLogDir', () => config.getDefaultLogDir());
  ipcMain.handle('config:selectLogFolder', () => config.selectLogFolder());
  ipcMain.handle('config:setLogDir', async (_e, logDir) => {
    const result = config.setLogDir(logDir);
    // 清空路径缓存，下次 getLogDir() 使用新路径
    logger.reloadLogDir();
    return result;
  });
}

// 注册日志 IPC 处理器
function registerLoggerHandlers() {
  ipcMain.handle('logger:listLogs', () => logger.listLogs());
  ipcMain.handle('logger:getRecentLogs', (_e, count) => logger.getRecentLogs(count || 200));
  ipcMain.handle('logger:readLog', (_e, filePath, options) => logger.readLog(filePath, options || {}));
  ipcMain.handle('logger:truncateLog', (_e, filePath, keepLines) =>
    logger.truncateLog(filePath, keepLines != null ? keepLines : 200)
  );
  ipcMain.handle('logger:archiveLog', (_e, filePath) => logger.archiveLog(filePath));
  ipcMain.handle('logger:archiveAllLogs', () => logger.archiveAllLogs());
  ipcMain.handle('logger:extractLog', (_e, filePath, targetPath) =>
    logger.extractLog(filePath, targetPath)
  );
  ipcMain.handle('logger:extractLogsAsBundle', (_e, filePaths, targetPath) =>
    logger.extractLogsAsBundle(filePaths || [], targetPath)
  );
  // 选择日志保存位置（保存对话框）
  ipcMain.handle('logger:selectSavePath', async (_e, defaultName) => {
    const result = await dialog.showSaveDialog({
      title: '选择日志导出位置',
      defaultPath: defaultName || 'wealthcare.log',
      filters: [
        { name: '日志文件', extensions: ['log', 'txt'] },
        { name: '所有文件', extensions: ['*'] },
      ],
    });
    return result.canceled ? null : result.filePath;
  });
  // 获取日志目录路径（用于展示）
  ipcMain.handle('logger:getLogDir', () => logger.getLogDir());
  // 写入一条日志（前端可主动记录）
  ipcMain.handle('logger:write', (_e, level, source, ...args) => {
    logger.log(level || 'info', source || 'renderer', ...args);
    return true;
  });
}

app.whenReady().then(() => {
  // 初始化日志系统并接管 console（最早执行，捕获后续所有输出）
  logger.init();
  logger.captureConsole();
  logger.info('main', `WealthCare 启动，版本=${app.getVersion()}，开发模式=${isDev}`);

  // 预初始化数据库
  ensureDb();
  registerDbHandlers();
  registerConfigHandlers();
  registerLoggerHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    logger.info('main', '应用即将退出，刷新数据库');
    db.flushSave();
    app.quit();
  }
});
