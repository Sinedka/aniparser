import { app, BrowserWindow } from "electron";
import path from "path";
import { isDev } from "./utils.js";

app.whenReady().then(() => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      webSecurity: false,
    },
  });

  // Удаляем меню

  // Открываем окно на весь экран
  mainWindow.maximize();

  if (isDev()) {
    mainWindow.loadURL("http://localhost:5123");
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), "/dist-react/index.html"));
    mainWindow.setMenu(null);
  }
});
