const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  closeApp: () => ipcRenderer.send('close-app'),
  minimizeApp: () => ipcRenderer.send('minimize-app'),
  toggleFullScreen: () => ipcRenderer.send('toggle-fullscreen'),
  isFullscreen: () => ipcRenderer.invoke("is-fullscreen"),
  onFullscreenChanged: (callback: (state: boolean) => void) => ipcRenderer.on("fullscreen-changed", (_event: any, state: boolean) => callback(state)),
});
