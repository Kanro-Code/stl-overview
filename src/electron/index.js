let window

const { app, BrowserWindow } = require('electron')
const path = require('path')
// const isMac = (process.platform === 'darwin')

async function createWindow (window) {
  window = new BrowserWindow({
    width: 1100,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    show: false,
    resizable: true,
    minHeight: 700,
    minWidth: 950
  })

  window.once('ready-to-show', window.show)
  window.loadFile(path.join(__dirname, 'index.html'))
  // window.webContents.openDevTools()
}

app.whenReady().then(() => {
  createWindow(window)

  app.on('activate', () => {
    // Osx dependent non-sense
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  app.quit()
})
