const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    closeApp: () => ipcRenderer.send('close-app'),
    minimizeApp: () => ipcRenderer.send('minimize-app'),
    toggleFullScreen: () => ipcRenderer.send('toggle-fullscreen')
});
