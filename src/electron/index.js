let window;

const {app, BrowserWindow, dialog, ipcMain} = require('electron');
const path = require('path');

console.log(require('electron'));

let isMac = (process.platform === 'darwin');

async function createWindow (window) {
  window = new BrowserWindow({
    width: 1100,
    height: 900,
    webPreferences: {
			nodeIntegration: true,
      contextIsolation: false, 
      enableRemoteModule: true,
			preload: path.join(__dirname, 'js/preload.js'),
		},
		show: false,
	//	resizable: false,
		minHeight: 700,
		minWidth: 900,
	});
	
  window.once('ready-to-show', window.show);
	window.loadFile('index.html');
	window.webContents.openDevTools();

	ipcMain.on('ondragstart', (event, filePath) => {
		console.log(event);
		event.sender.startDrag({
			file: filePath,
			icon: '/path/to/icon.png'
		})
	})
};

app.whenReady().then(() => {
  createWindow(window);
  
  app.on('activate', () => {
		// Osx dependent non-sense
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (isMac) app.quit();
});
