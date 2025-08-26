import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { isDev } from "./utils.js";

app.setName("aniparser")
app.whenReady().then(() => {
  const mainWindow = new BrowserWindow({
    transparent: process.platform === "win32" ? false : true,
    frame: process.platform === "win32" ? true : false,
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

  ipcMain.on('close-app', () => {
    app.quit(); // Закрывает всё приложение
  });
});
