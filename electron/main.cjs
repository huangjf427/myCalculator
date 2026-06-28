const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const db = require('./db.cjs');
const config = require('./config.cjs');
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
    title: '财富管家 - 个人财产管理',
    icon: path.join(__dirname, '../public/vite.svg'),
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

  ipcMain.handle('db:getAllChanges', wrap(() => db.getAllChanges()));
  ipcMain.handle('db:addChange', wrap((change) => db.addChange(change)));

  ipcMain.handle('db:migrate', wrap((data) => db.migrateFromLocalStorage(data.assets, data.liabilities, data.changes)));
}

// 注册配置 IPC 处理器
function registerConfigHandlers() {
  ipcMain.handle('config:getDbPath', () => config.getDbPath());
  ipcMain.handle('config:getDefaultDbPath', () => config.getDefaultDbPath());
  ipcMain.handle('config:selectFolder', () => config.selectFolder());
  ipcMain.handle('config:setDbPath', async (_e, dbPath) => {
    const result = config.setDbPath(dbPath);
    // 切换路径后重置数据库初始化状态，重新加载
    dbReady = null;
    await db.reloadDb();
    return result;
  });
}

app.whenReady().then(() => {
  // 预初始化数据库
  ensureDb();
  registerDbHandlers();
  registerConfigHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
