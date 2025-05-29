import { app, BrowserWindow } from "electron";
import path from "path";
import * as isDev from "electron-is-dev";

app.whenReady().then(() => {
  const mainWindow = new BrowserWindow({
    transparent: true,
    frame: process.platform === "win32" ? true : false,
    width: 800,
    height: 600,
    webPreferences: {
      webSecurity: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5123");
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), "/dist-react/index.html"));
  }
});
