import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { isDev } from "./utils.js";

let mainWindow: BrowserWindow | null = null;

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    transparent: process.platform === "win32" ? false : true,
    frame: false,
    width: 800,
    height: 600,
    webPreferences: {
      preload: __dirname + '/preload.js', // подключаем preload
      webSecurity: false,
      contextIsolation: true, // обязательно для безопасности
      nodeIntegration: false
    },
  });

  if (isDev()) {
    mainWindow.loadURL("http://localhost:5123");
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), "/dist-react/index.html"));
  }

  mainWindow?.on("maximize", () => {
    mainWindow?.webContents.send("fullscreen-changed", true);
  });

  mainWindow?.on("unmaximize", () => {
    mainWindow?.webContents.send("fullscreen-changed", false);
  });

  ipcMain.handle("is-fullscreen", () => {
    return mainWindow?.isMaximized();
  });

  ipcMain.on('minimize-window', () => {
    mainWindow?.minimize(); // сворачиваем окно
  });

  ipcMain.on('toggle-fullscreen', () => {
    mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow?.maximize();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});


ipcMain.on('close-app', () => {
  app.quit(); // Закрывает всё приложение
});

