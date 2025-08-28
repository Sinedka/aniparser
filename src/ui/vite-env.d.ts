/// <reference types="vite/client" />
export {};

declare global {
  interface Window {
    electronAPI: {
      closeApp: () => void;
      minimizeApp: () => void;
      toggleFullScreen: () => void;
      isFullscreen: () => boolean,
      onFullscreenChanged: (callback: (state: boolean) => void) => void,
    };
  }
}

