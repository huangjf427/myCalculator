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
    getAllChanges: () => ipcRenderer.invoke('db:getAllChanges'),
    addChange: (change) => ipcRenderer.invoke('db:addChange', change),
    migrate: (data) => ipcRenderer.invoke('db:migrate', data),
  },
  // 配置操作
  config: {
    getDbPath: () => ipcRenderer.invoke('config:getDbPath'),
    getDefaultDbPath: () => ipcRenderer.invoke('config:getDefaultDbPath'),
    selectFolder: () => ipcRenderer.invoke('config:selectFolder'),
    setDbPath: (dbPath) => ipcRenderer.invoke('config:setDbPath', dbPath),
  },
});
