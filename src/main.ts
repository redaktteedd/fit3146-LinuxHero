import { app, BrowserWindow } from 'electron';
import * as path from 'path';

// Keep a global reference of the window object
let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  // Create the browser window with Orange Pi optimizations
  mainWindow = new BrowserWindow({
    width: 1280,  // 720p width
    height: 720,  // 720p height
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      // Orange Pi performance optimizations
      offscreen: false,
      backgroundThrottling: false,
      webSecurity: false // Only for local development
    },
    titleBarStyle: 'default',
    show: false, // Don't show until ready
    fullscreen: false,
    backgroundColor: '#000000', // Match terminal background
    // Orange Pi specific optimizations
    frame: true,
    resizable: true,
    minimizable: true,
    maximizable: false, // Disable maximize for stability
    alwaysOnTop: false,
    skipTaskbar: false,
    autoHideMenuBar: true // Hide menu bar for more screen space
  });

  // Load the index.html file
  mainWindow.loadFile(path.join(__dirname, '../renderer/main/index.html'));

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Orange Pi performance optimizations
app.commandLine.appendSwitch('--disable-gpu-sandbox');
app.commandLine.appendSwitch('--disable-software-rasterizer');
app.commandLine.appendSwitch('--disable-background-timer-throttling');
app.commandLine.appendSwitch('--disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('--disable-renderer-backgrounding');
app.commandLine.appendSwitch('--disable-features', 'TranslateUI');
app.commandLine.appendSwitch('--disable-ipc-flooding-protection');

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
