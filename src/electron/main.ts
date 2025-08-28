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

  mainWindow?.on("enter-full-screen", () => {
    mainWindow?.webContents.send("fullscreen-changed", true);
  });

  mainWindow?.on("leave-full-screen", () => {
    mainWindow?.webContents.send("fullscreen-changed", false);
  });

});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle("is-fullscreen", () => {
  return mainWindow?.isFullScreen();
});

ipcMain.on('minimize-window', () => {
    mainWindow?.minimize(); // сворачиваем окно
});

ipcMain.on('toggle-fullscreen', () => {
    mainWindow?.setFullScreen(!mainWindow?.isFullScreen()); // переключаем fullscreen
});

ipcMain.on('close-app', () => {
  app.quit(); // Закрывает всё приложение
});

