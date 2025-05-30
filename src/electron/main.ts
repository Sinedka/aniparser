import { app, BrowserWindow } from "electron";
import path from "path";
import { isDev } from "./utils.js";

app.whenReady().then(() => {
  const mainWindow = new BrowserWindow({
    transparent: process.platform === "win32" ? false : true,
    frame: process.platform === "win32" ? true : false,
    width: 800,
    height: 600,
    // icon: path.join(app.getAppPath(), "assets/icon.png"),
    webPreferences: {
      webSecurity: false,
    },
  });

  if (isDev()) {
    mainWindow.loadURL("http://localhost:5123");
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), "/dist-react/index.html"));
  }
});
