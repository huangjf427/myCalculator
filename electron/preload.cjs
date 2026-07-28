const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  // 数据库操作
  db: {
    getAllAssets: () => ipcRenderer.invoke('db:getAllAssets'),
    addAsset: (asset) => ipcRenderer.invoke('db:addAsset', asset),
    updateAsset: (id, updates) => ipcRenderer.invoke('db:updateAsset', id, updates),
    deleteAsset: (id) => ipcRenderer.invoke('db:deleteAsset', id),
    getAllLiabilities: () => ipcRenderer.invoke('db:getAllLiabilities'),
    addLiability: (liability) => ipcRenderer.invoke('db:addLiability', liability),
    updateLiability: (id, updates) => ipcRenderer.invoke('db:updateLiability', id, updates),
    deleteLiability: (id) => ipcRenderer.invoke('db:deleteLiability', id),
    getAllChanges: (options) => ipcRenderer.invoke('db:getAllChanges', options),
    getChangesCount: (options) => ipcRenderer.invoke('db:getChangesCount', options),
    addChange: (change) => ipcRenderer.invoke('db:addChange', change),
    migrate: (data) => ipcRenderer.invoke('db:migrate', data),
    importDbFile: (filePath) => ipcRenderer.invoke('db:importDbFile', filePath),
    backupDb: () => ipcRenderer.invoke('db:backupDb'),
  },
  // 配置操作
  config: {
    getDbPath: () => ipcRenderer.invoke('config:getDbPath'),
    getDefaultDbPath: () => ipcRenderer.invoke('config:getDefaultDbPath'),
    selectFolder: () => ipcRenderer.invoke('config:selectFolder'),
    selectDbFile: () => ipcRenderer.invoke('config:selectDbFile'),
    setDbPath: (dbPath) => ipcRenderer.invoke('config:setDbPath', dbPath),
    getLogDir: () => ipcRenderer.invoke('config:getLogDir'),
    getDefaultLogDir: () => ipcRenderer.invoke('config:getDefaultLogDir'),
    selectLogFolder: () => ipcRenderer.invoke('config:selectLogFolder'),
    setLogDir: (logDir) => ipcRenderer.invoke('config:setLogDir', logDir),
    getExchangeRates: () => ipcRenderer.invoke('config:getExchangeRates'),
    setExchangeRates: (rates) => ipcRenderer.invoke('config:setExchangeRates', rates),
  },
  // 日志操作
  logger: {
    listLogs: () => ipcRenderer.invoke('logger:listLogs'),
    getRecentLogs: (count) => ipcRenderer.invoke('logger:getRecentLogs', count),
    readLog: (filePath, options) => ipcRenderer.invoke('logger:readLog', filePath, options),
    truncateLog: (filePath, keepLines) =>
      ipcRenderer.invoke('logger:truncateLog', filePath, keepLines),
    archiveLog: (filePath) => ipcRenderer.invoke('logger:archiveLog', filePath),
    archiveAllLogs: () => ipcRenderer.invoke('logger:archiveAllLogs'),
    extractLog: (filePath, targetPath) =>
      ipcRenderer.invoke('logger:extractLog', filePath, targetPath),
    extractLogsAsBundle: (filePaths, targetPath) =>
      ipcRenderer.invoke('logger:extractLogsAsBundle', filePaths, targetPath),
    selectSavePath: (defaultName) =>
      ipcRenderer.invoke('logger:selectSavePath', defaultName),
    getLogDir: () => ipcRenderer.invoke('logger:getLogDir'),
    write: (level, source, ...args) =>
      ipcRenderer.invoke('logger:write', level, source, ...args),
  },
});
