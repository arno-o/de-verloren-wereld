const path = require('node:path')
const { app, BrowserWindow, ipcMain } = require('electron/main')

if (require('electron-squirrel-startup') === true) app.quit();

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1400,
    height: 800,
    autoHideMenuBar: true,
    icon: path.join(__dirname, '../assets/images/icons/app-icon.png'),
    webPreferences: {
      preload: path.join(__dirname, '../preload.js')
    },
    // kiosk: true, // - this sets it to fullscreen without the option to minimize it
    // frame: false,
  })
  
  win.setTitle('De Verloren Wereld');
  win.loadFile('index.html');
  win.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow()

  ipcMain.on('quit-app', () => {
    console.log('[Main] Quit requested via IPC');
    app.quit();
  });

  ipcMain.on('restart-app', () => {
    console.log('[Main] Restart requested via IPC');
    app.relaunch();
    app.quit();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})