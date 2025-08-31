import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { isDev } from "./utils.js";
import windowStateKeeper from "electron-window-state";

let mainWindow: BrowserWindow | null = null;

app.whenReady().then(() => {
  let state = windowStateKeeper({
    defaultWidth: 800,   // используется только если нет сохранённого состояния
    defaultHeight: 600
  });

  mainWindow = new BrowserWindow({
    transparent: process.platform === "win32" ? false : true,
    frame: false,
    x: state.x,
    y: state.y,
    width: state.width,
    height: state.height,
    webPreferences: {
      preload: __dirname + '/preload.js', // подключаем preload
      webSecurity: false,
      contextIsolation: true, // обязательно для безопасности
      nodeIntegration: false
    },
  });

  if (isDev()) {
    mainWindow.loadURL("http://localhost:5123");
    
    // Установка React DevTools
    const { default: installExtension, REACT_DEVELOPER_TOOLS } = require('electron-devtools-installer');

    installExtension(REACT_DEVELOPER_TOOLS)
      .then((name: any) => console.log(`Установлено: ${name}`))
      .catch((err: any) => console.log('Ошибка установки DevTools:', err));
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), "/dist-react/index.html"));
  }

  // следим за состоянием окна
  state.manage(mainWindow);

  // если в прошлый раз окно было maximized → снова разворачиваем
  if (state.isMaximized) {
    mainWindow.maximize();
  } else if (!state.x && !state.y) {
    // если координат нет (т.е. первый запуск) → открываем сразу maximized
    mainWindow.maximize();
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

