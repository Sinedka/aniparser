/// <reference types="vite/client" />
export {};

declare global {
  interface Window {
    electronAPI: {
      closeApp: () => void;
      minimizeApp: () => void;
      toggleFullScreen: () => void;
      // добавь сюда другие функции, которые ты экспортируешь через contextBridge
    };
  }
}

