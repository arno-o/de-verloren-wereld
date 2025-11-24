const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
})

contextBridge.exposeInMainWorld('electronAPI', {
  quitApp: () => ipcRenderer.send('quit-app'),
  restartApp: () => ipcRenderer.send('restart-app'),
})